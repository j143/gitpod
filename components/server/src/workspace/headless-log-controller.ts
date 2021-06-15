/**
 * Copyright (c) 2021 Gitpod GmbH. All rights reserved.
 * Licensed under the GNU Affero General Public License (AGPL).
 * See License-AGPL.txt in the project root for license information.
 */

import { inject, injectable } from "inversify";
import * as express from 'express';
import { HeadlessLogMessage, Queue, User } from "@gitpod/gitpod-protocol";
import { log } from '@gitpod/gitpod-protocol/lib/util/logging';
import { CompositeResourceAccessGuard, OwnerResourceGuard, WorkspaceLogAccessGuard } from "../auth/resource-access";
import { HostContextProvider } from "../auth/host-context-provider";
import { DBWithTracing, TracedWorkspaceDB } from "@gitpod/gitpod-db/lib/traced-db";
import { WorkspaceDB } from "@gitpod/gitpod-db/lib/workspace-db";
import { WorkspaceLogService } from "./workspace-log-service";
import * as opentracing from 'opentracing';
import { asyncHandler } from "../express-util";
import { isWithFunctionAccessGuard } from "../auth/function-access";
import { accesHeadlessLogs } from "../auth/rate-limiter";
import { BearerAuth } from "../auth/bearer-authenticator";
import { Deferred } from "@gitpod/gitpod-protocol/lib/util/deferred";


@injectable()
export class HeadlessLogController {

    @inject(HostContextProvider) protected readonly hostContextProvider: HostContextProvider;
    @inject(TracedWorkspaceDB) protected readonly workspaceDb: DBWithTracing<WorkspaceDB>;
    @inject(WorkspaceLogService) protected readonly workspaceLogService: WorkspaceLogService;
    @inject(BearerAuth) protected readonly auth: BearerAuth;

    get apiRouter(): express.Router {
        const router = express.Router();

        router.use(this.auth.restHandlerOptionally);
        router.get("/:instanceId/:terminalId", asyncHandler(async (req: express.Request, res: express.Response) => {
            const span = opentracing.globalTracer().startSpan("/headless-logs/");
            const params = { instanceId: req.params.instanceId, terminalId: req.params.terminalId };
            if (!(isWithFunctionAccessGuard(req) && req.functionGuard?.canAccess(accesHeadlessLogs)) && !(req.isAuthenticated() && User.is(req.user))) {
                res.sendStatus(403);
                log.warn("unauthenticated headless log request", params);
                return;
            }

            const user = req.user as User;
            if (user.blocked) {
                res.sendStatus(403);
                log.warn("blocked user attempted to fetch workspace cookie", { ...params, userId: user.id });
                return;
            }

            const instanceId = params.instanceId;
            const [workspace, instance] = await Promise.all([
                this.workspaceDb.trace({span}).findByInstanceId(instanceId),
                this.workspaceDb.trace({span}).findInstanceById(instanceId),
            ]);
            if (!workspace) {
                res.sendStatus(404);
                log.warn(`workspace for instanceId ${instanceId} not found`);
                return;
            }
            if (!instance) {
                res.sendStatus(404);
                log.warn(`instance ${instanceId} not found`);
                return;
            }
            const logCtx = { userId: user.id, instanceId, workspaceId: workspace.id };
            log.debug(logCtx, "/headless-log/");

            try {
                // [gpl] It's a bit sad that we have to duplicate this access check... but that's due to the way our API code is written
                const resourceGuard = new CompositeResourceAccessGuard([
                    new OwnerResourceGuard(user.id),
                    new WorkspaceLogAccessGuard(user, this.hostContextProvider),
                ]);
                if (!await resourceGuard.canAccess({ kind: 'workspaceLog', subject: workspace }, 'get')) {
                    res.sendStatus(403);
                    log.warn(logCtx, "unauthenticated headless log access");
                    return;
                }

                res.setHeader('Content-Type', 'text/json; charset=utf-8');
                res.setHeader('Transfer-Encoding', 'chunked');

                const aborted = new Deferred<boolean>();
                const abort = (err: any) => {
                    aborted.resolve(true);
                    log.debug(logCtx, "headless-log: aborted");
                };
                req.on('abort', abort);
                const queue = new Queue();  // Catches backpressure from the client connection
                const writeToResponse = async (chunk: string) => {
                    await queue.enqueue(() => new Promise<void>((resolve, reject) => {
                        const msg: HeadlessLogMessage = {
                            chunk,
                        };
                        res.write(JSON.stringify(msg), "utf-8", (err?: Error | null) => {
                            if (err) {
                                reject(err);    // propagate write error to upstream
                            } else {
                                resolve();  // using a promise here to make backpressure work
                            }
                        });
                    }));
                };
                await this.workspaceLogService.streamWorkspaceLog(instance, params.terminalId, writeToResponse, aborted);
                res.end();
            } catch (err) {
                log.error(logCtx, "error streaming headless logs", err);
                const msg: HeadlessLogMessage = {
                    msg: "error streaming headless logs",
                    statusCode: 500,
                };
                res.end(JSON.stringify(msg));
                req.destroy(err);
            }
        }));
        return router;
    }
}