const amount = Number(process.argv.includes('--amount') ? process.argv[process.argv.indexOf('--amount') + 1] : 0);
console.log(JSON.stringify({ ok: true, action: 'dev:set-wb', accountId: 'dev_wtw_player', amount, reasonCode: 'dev.set.manual', idempotencyKey: `dev:set:dev_wtw_player:${crypto.randomUUID()}` }, null, 2));
