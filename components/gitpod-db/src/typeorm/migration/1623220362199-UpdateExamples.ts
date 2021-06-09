/**
 * Copyright (c) 2021 Gitpod GmbH. All rights reserved.
 * Licensed under the GNU Affero General Public License (AGPL).
 * See License-AGPL.txt in the project root for license information.
 */

import {MigrationInterface, QueryRunner} from "typeorm";

export class UpdateExamples1623220362199 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        const newEntries = [
            { url: 'https://github.com/gitpod-io/template-typescript-node', description: 'A Node.js app written in TypeScript.', priority: 99 },
            { url: 'https://github.com/gitpod-io/template-typescript-node-expressjs', description: 'A Express.js for Node.js app written in TypeScript.', priority: 99 },
            { url: 'https://github.com/gitpod-io/template-typescript-react', description: '', priority: 99 },

            { url: 'https://github.com/gitpod-io/template-php-laravel', description: '', priority: 99 },
            { url: 'https://github.com/gitpod-io/template-php-drupal', description: '', priority: 99 },
            { url: 'https://github.com/gitpod-io/template-python-flask', description: '', priority: 99 },

            { url: 'https://github.com/gitpod-io/template-golang-cli', description: 'A CLI starter written in Go.', priority: 99 },
            { url: 'https://github.com/gitpod-io/template-rust-cli', description: 'A CLI starter written in Rust.', priority: 99 },
            { url: 'https://github.com/gitpod-io/template-python-django', description: 'A Django app written in Python. ', priority: 99 },
            { url: 'https://github.com/gitpod-io/template-ruby-on-rails', description: 'A Ruby on Rails app written in Ruby. ', priority: 99 },

            { url: 'https://github.com/gitpod-io/template-dotnet-core-cli-csharp', description: 'A CLI starter for .NET written in C#', priority: 99 },
            { url: 'https://github.com/gitpod-io/template-sveltejs', description: 'A Svelte.js app writtten in JavaScript', priority: 99 },
            { url: 'https://github.com/gitpod-io/spring-petclinic', description: 'A Spring app written in Java.', priority: 99 },

        ]
        // delete old entries
        await queryRunner.query("DELETE FROM d_b_repository_white_list");
        const insert = `INSERT IGNORE INTO d_b_repository_white_list (url, description, priority) VALUES ${newEntries.map(e=>'(?, ?, ?)').join(', ')}`;
        const values: any[] = [];
        for (const e of newEntries) {
            values.push(e.url, e.description, e.priority);
        }
        await queryRunner.query(insert, values);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
    }

}
