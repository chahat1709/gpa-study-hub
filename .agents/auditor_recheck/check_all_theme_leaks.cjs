const fs = require('fs');
const path = require('path');

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const lightRegex = /\b(bg-white(?![\/\w])|bg-slate-50|bg-slate-100|bg-gray-50|bg-gray-100|bg-zinc-50|bg-zinc-100|bg-[#fff\w]*|text-black|text-slate-900|text-gray-900)\b/gi;
  
  let matches = [];
  lines.forEach((line, idx) => {
    // Ignore lines that have dark mode transparent glass overlay bg-white/5, bg-white/10, etc.
    let match;
    while ((match = lightRegex.exec(line)) !== null) {
      const matchStr = match[1];
      // filter out bg-white/ or bg-[#...] if dark
      if (matchStr.startsWith('bg-[#') && !matchStr.toLowerCase().includes('#fff') && !matchStr.toLowerCase().includes('#ffffff')) {
        continue;
      }
      matches.push({ line: idx + 1, match: matchStr, content: line.trim() });
    }
  });
  return matches;
}

const dirsToScan = ['components', 'services', 'api'];
let grandTotal = 0;

dirsToScan.forEach(dirName => {
  const fullDir = path.join(__dirname, '../../', dirName);
  if (!fs.existsSync(fullDir)) return;
  const files = fs.readdirSync(fullDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
  files.forEach(f => {
    const filePath = path.join(fullDir, f);
    const results = scanFile(filePath);
    if (results.length > 0) {
      console.log(`\nFile: ${dirName}/${f}`);
      results.forEach(r => console.log(`  Line ${r.line} [${r.match}]: ${r.content}`));
      grandTotal += results.length;
    }
  });
});

// Check index.html
const indexPath = path.join(__dirname, '../../index.html');
const indexResults = scanFile(indexPath);
if (indexResults.length > 0) {
  console.log(`\nFile: index.html`);
  indexResults.forEach(r => console.log(`  Line ${r.line} [${r.match}]: ${r.content}`));
  grandTotal += indexResults.length;
}

console.log(`\n========================================`);
console.log(`TOTAL LIGHT MODE COLOR LEAKS FOUND: ${grandTotal}`);
console.log(`========================================`);
