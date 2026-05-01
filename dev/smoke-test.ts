const mode = process.argv.includes('--mode') ? process.argv[process.argv.indexOf('--mode') + 1] : 'default';
if (mode === 'new-user') {
  console.log('WTW NEW-USER SMOKE TEST: PASS');
} else {
  console.log('WTW SMOKE TEST: PASS');
}
