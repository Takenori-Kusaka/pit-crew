// placeholder lint: every source file must end with a newline
import fs from 'node:fs';
const bad = fs.readdirSync('src').filter((f) => !fs.readFileSync('src/' + f, 'utf8').endsWith('\n'));
for (const f of bad) console.log('no newline: ' + f);
process.exit(bad.length ? 1 : 0);
