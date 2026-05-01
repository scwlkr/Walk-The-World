const action = process.argv.includes('--action') ? process.argv[process.argv.indexOf('--action') + 1] : 'start';
console.log(JSON.stringify({ ok: true, action: 'dev:onboarding', accountId: 'dev_new_user', stepAction: action }, null, 2));
