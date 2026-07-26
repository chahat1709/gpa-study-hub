const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../../components');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

// Match bare light-mode colors (solid white background, slate-50, slate-100, gray-50, gray-100, text-slate-900, text-gray-900)
// Exclude bg-white/10, bg-white/5, bg-white/20, etc.
const lightRegex = /\b(bg-white(?![\/\w])|bg-slate-50|bg-slate-100|bg-gray-50|bg-gray-100|text-slate-900|text-gray-900)\b/g;

let totalMatches = 0;

files.forEach(f => {
  const filePath = path.join(dir, f);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    let match;
    while ((match = lightRegex.exec(line)) !== null) {
      console.log(`${f}:${idx+1} [Matched: ${match[1]}] -> ${line.trim()}`);
      totalMatches++;
    }
  });
});

console.log(`\n--- RESULT: ${totalMatches} light mode leaks found across 11 components ---`);
