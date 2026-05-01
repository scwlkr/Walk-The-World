const item = process.argv.includes('--item') ? process.argv[process.argv.indexOf('--item') + 1] : 'starter-shoes';
console.log(JSON.stringify({ ok: true, action: 'dev:buy', accountId: 'dev_wtw_player', itemId: item, reasonCode: 'wtw.shop.purchase', idempotencyKey: `dev:buy:dev_wtw_player:${item}:${crypto.randomUUID()}` }, null, 2));
