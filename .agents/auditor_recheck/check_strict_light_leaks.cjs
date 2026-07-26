const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../../components');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

let leakCount = 0;

files.forEach(f => {
  const content = fs.readFileSync(path.join(dir, f), 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    // Regex for bare bg-white (not bg-white/), bg-slate-50, bg-slate-100, bg-gray-50, bg-gray-100, text-slate-900, text-gray-900
    const matches = line.match(/\b(bg-white(?![\/\w])|bg-slate-50(?![\/\w])|bg-slate-100(?![\/\w])|bg-gray-50(?![\/\w])|bg-gray-100(?![\/\w])|text-slate-900|text-gray-900)\b/g);
    if (matches) {
      matches.forEach(m => {
        console.log(`STRICT LEAK IN ${f}:${idx+1} [${m}] -> ${line.trim()}`);
        leakCount++;
      });
    }
  });
});

console.log(`\nSTRICT LEAK CHECK COMPLETE. Total bare light-mode color leaks: ${leakCount}`);
