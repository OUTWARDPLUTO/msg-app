const fs = require('fs');
const path = require('path');

// Unicode regex matching emoji presentations and pictographs
const emojiRegex = /(\p{Extended_Pictographic}|\p{Emoji_Presentation})/gu;

function scanDir(dir) {
  let results = [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== 'android' && file !== 'ios') {
        results = results.concat(scanDir(fullPath));
      }
    } else if (/\.(jsx?|tsx?|html|css|json)$/.test(file)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        const matches = line.match(emojiRegex);
        if (matches) {
          results.push({
            file: path.relative(process.cwd(), fullPath).replace(/\\/g, '/'),
            line: idx + 1,
            emojis: Array.from(new Set(matches)),
            text: line.trim()
          });
        }
      });
    }
  }
  return results;
}

const found = scanDir('src');
const indexHtml = fs.readFileSync('index.html', 'utf8').split('\n');
indexHtml.forEach((line, idx) => {
  const matches = line.match(emojiRegex);
  if (matches) {
    found.push({
      file: 'index.html',
      line: idx + 1,
      emojis: Array.from(new Set(matches)),
      text: line.trim()
    });
  }
});

console.log('Total emoji lines found:', found.length);
const fileMap = {};
const emojiCounts = {};

found.forEach(item => {
  fileMap[item.file] = (fileMap[item.file] || 0) + 1;
  item.emojis.forEach(e => {
    emojiCounts[e] = (emojiCounts[e] || 0) + 1;
  });
});

console.log('\n--- Files with emojis ---');
for (const [file, count] of Object.entries(fileMap).sort((a,b) => b[1] - a[1])) {
  console.log(`${file}: ${count}`);
}

console.log('\n--- Distinct Emojis and Frequencies ---');
for (const [emoji, count] of Object.entries(emojiCounts).sort((a,b) => b[1] - a[1])) {
  console.log(`${emoji} (code: ${emoji.codePointAt(0).toString(16)}): ${count}`);
}

fs.writeFileSync('scripts/emoji_audit_results.json', JSON.stringify(found, null, 2));
console.log('\nWrote full audit to scripts/emoji_audit_results.json');
