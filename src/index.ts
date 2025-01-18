#!/usr/bin/env node

// console.log("Hello from github user activity CLI");

let args = process.argv.slice(2,);

let givenCommands = ['username', 'show-repos', 'show-activity'];

let activityType: { [key: string]: string } = {
    'PublicEvent': 'Has made a public event',
    'CreateEvent': 'Has created a repository',
    'PushEvent': 'Has pushed to a',
    'WatchEvent': 'Has watched a repository',
}

let command: string;
let username: string;

try {
    if (args.length === 0) throw new Error('No command given');
    if (!args[0].startsWith('--')) throw new Error('Invalid command. Try --help');
    if (givenCommands[0] !== (args[0].slice(2,))) throw new Error('--username flag must be first');

    if (!args[1]) throw new Error('No username given');
    username = args[1].toString();
    command = args[2] ?? 'show-activity';

    if(!command.startsWith('--')) throw new Error('Invalid command. Try --help');
    command = command.slice(2,);

    switch (command) {
        case 'show-activity':
            fetch(`https://api.github.com/users/${username}/events`)
                .then(res => {
                    // console.log(res.status);
                    if (res.status !== 200) throw new Error(`User not found for user ${username}`);
                    return res.json();
                })
                .then(data => {
                    if (data.length === 0) throw new Error('No activity found');
                    let info: any
                    console.log(' --------------------------------------------------------------------------------');
                    data.forEach((element: {
                        type: keyof typeof activityType;
                        created_at: any;
                        repo: { id: string, name: string, url: string };
                        actor: { login: string };
                        payload: {
                            description: any;
                            commits: [
                                {
                                    message: string,
                                    sha: string
                                }
                            ]
                        };
                    }) => {
                        switch (element.type) {
                            case 'CreateEvent':
                                console.log(`| Event ${element.type} at ${new Date(element.created_at).getDate()}/${new Date(element.created_at).getMonth() + 1} -> ${element.payload.description ?? 'No description'} made in repo ${element.repo.name.slice(element.actor.login.length + 1,)}`);
                                console.log(' --------------------------------------------------------------------------------');
                                break;
                            case 'PushEvent':
                                console.log(`| Event ${element.type} at ${new Date(element.created_at).getDate()}/${new Date(element.created_at).getMonth() + 1}`)
                                console.log('| With commits:');
                                element.payload.commits.forEach(commit => {
                                    console.log(`| -> ${commit.message.replace(/\n/g,' ')} #${commit.sha}`);
                                });
                                console.log(' --------------------------------------------------------------------------------');
                                break;
                            case 'WatchEvent':
                                console.log(`| Event ${element.type} at ${new Date(element.created_at).getDate()}/${new Date(element.created_at).getMonth() + 1} -> \u001b]8;;${element.repo.url.replace('https://api.github.com/repos/','https://github.com/')}\u0007 -- ${element.repo.name} -- \u001b]8;;\u0007 has been starred `);
                                console.log(' --------------------------------------------------------------------------------');
                                break;
                        }
                    });
                })
                .catch(err => console.log(err.message));
            break;
    }
} catch (error) {
    if (error instanceof Error) {
        console.error(error.message);
    } else {
        console.error('Unknown error');
    }
}
