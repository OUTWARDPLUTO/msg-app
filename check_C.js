const fs = require('fs');
const path = require('path');
function walk(d) {
  let r = [];
  fs.readdirSync(d).forEach(f => {
    let p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) {
      r = r.concat(walk(p));
    } else if (p.endsWith('.js') || p.endsWith('.jsx')) {
      r.push(p);
    }
  });
  return r;
}
const files = walk('src');
let found = false;
files.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  if (/\bC\.[a-zA-Z]/.test(c)) {
    const lines = c.split('\n');
    const imports = lines.filter(l => l.startsWith('import'));
    if (!imports.some(l => /\bC\b/.test(l) && l.includes('theme'))) {
      console.log('Missing import in:', f);
      found = true;
    }
  }
});
if (!found) console.log('All clear!');
