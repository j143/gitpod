/**
 * Copyright (c) 2021 Gitpod GmbH. All rights reserved.
 * Licensed under the GNU Affero General Public License (AGPL).
 * See License-AGPL.txt in the project root for license information.
 */

import { Link } from "react-router-dom";
import Header from "../components/Header";
import projectsEmpty from '../images/projects-empty.svg';
import { useLocation } from "react-router";
import { useContext, useEffect, useState } from "react";
import { getGitpodService } from "../service/service";
import { getCurrentTeam, TeamsContext } from "../teams/teams-context";
import { ProjectInfo } from "@gitpod/gitpod-protocol";

export default function () {
    const { teams } = useContext(TeamsContext);
    const location = useLocation();
    const team = getCurrentTeam(location, teams);
    const [projects, setProjects] = useState<ProjectInfo[]>([]);

    useEffect(() => {
        if (!team) {
            return;
        }
        (async () => {
            const infos = await getGitpodService().server.getProjects(team.id);
            setProjects(infos);
        })();
    }, [team]);

    const onSearchProjects = (searchString: string) => { }

    return <>
        <Header title="Projects" subtitle="Manage recently added projects." />
        {projects.length < 1 && (
            <div>
                <img alt="Projects (empty)" className="h-44 mt-24 mx-auto" role="presentation" src={projectsEmpty} />
                <h3 className="text-center text-gray-500 mt-8">No Recent Projects</h3>
                <p className="text-center text-base text-gray-500 mt-4">Add projects to enable and manage Prebuilds.<br /><a className="learn-more" href="https://www.gitpod.io/docs/prebuilds/">Learn more about Prebuilds</a></p>
                <div className="flex space-x-2 justify-center mt-7">
                    <Link to={`/new?team=${team?.slug}`}><button>New Project</button></Link>
                    <Link to="./members"><button className="secondary">Invite Members</button></Link>
                </div>
            </div>

        )}
        {projects.length > 0 && (
            <div className="lg:px-28 px-10">
                <div className="mt-8 flex py-2 font-semibold border-b border-gray-200 dark:border-gray-800">
                    <div className="flex">
                        <div className="py-4">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" width="16" height="16"><path fill="#A8A29E" d="M6 2a4 4 0 100 8 4 4 0 000-8zM0 6a6 6 0 1110.89 3.477l4.817 4.816a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 010 6z" /></svg>
                        </div>
                        <input type="search" placeholder="Search Projects" onChange={(e) => onSearchProjects(e.target.value)} />
                    </div>
                    <div className="flex-1" />
                    <Link to={`/new?team=${team?.slug}`}><button>New Project</button></Link>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4">
                    {projects.map(p => (<div key={`project-${p.name}`}
                        className="border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl focus:bg-gitpod-kumquat-light transition ease-in-out group">
                        <div className="p-6">{p.name}</div>
                        <div className="p-6"></div>
                        <div className="p-2 px-6 bg-gray-100">No Recent Prebuilds</div>
                    </div>))}
                    <div key="new-project"
                        className="border-dashed border-2 border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl focus:bg-gitpod-kumquat-light transition ease-in-out group">
                        <Link to={`/new?team=${team?.slug}`}>
                            <div className="flex h-full">
                                <div className="m-auto">New Project</div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        )}
    </>;
}