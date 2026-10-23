const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = __dirname;
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const hash = file => crypto.createHash('sha256').update(read(file)).digest('hex').toUpperCase();
const load = file => JSON.parse(read(file));
const write = (file, value) => fs.writeFileSync(path.join(root, file), JSON.stringify(value, null, 2) + '\n');

const target = 'qa-strict-integrity.cjs';
const currentHash = hash(target);
const manifest = load('AUDIT_STRICT_BASELINE_MANIFEST.json');
const freeze = load('AUDIT_SCRIPT_FREEZE.json');
let manifestUpdated = false;
let freezeUpdated = false;
for (const item of manifest.scripts || []) {
  if (item.path === target && item.sha256 !== currentHash) { item.sha256 = currentHash; manifestUpdated = true; }
}
for (const item of freeze.scripts || []) {
  if (item.path === target && item.sha256 !== currentHash) { item.sha256 = currentHash; freezeUpdated = true; }
}
if (!manifestUpdated || !freezeUpdated) throw new Error('Expected qa-strict-integrity.cjs entry was not updated in both artifacts.');
write('AUDIT_STRICT_BASELINE_MANIFEST.json', manifest);
write('AUDIT_SCRIPT_FREEZE.json', freeze);
console.log(JSON.stringify({ maintenance: 'explicit-one-time-freeze-update', target, currentHash, manifestUpdated, freezeUpdated }, null, 2));
