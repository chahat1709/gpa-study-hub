const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../../components');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

let totalButtons = 0;
let buttonsWithMin44 = 0;

files.forEach(f => {
  const content = fs.readFileSync(path.join(dir, f), 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('<button') || line.includes('<input') || line.includes('<select') || line.includes('<textarea')) {
      totalButtons++;
      if (line.includes('min-h-[44px]') || line.includes('h-11') || line.includes('h-12') || line.includes('p-3.5') || line.includes('p-4') || line.includes('py-3') || line.includes('py-3.5') || line.includes('py-4') || line.includes('min-h-11') || line.includes('min-w-[44px]')) {
        buttonsWithMin44++;
      } else {
        console.log(`Interactive element without explicit 44px helper in ${f}:${idx+1} -> ${line.trim()}`);
      }
    }
  });
});

console.log(`\nInteractive Target Check: ${buttonsWithMin44} / ${totalButtons} have explicit touch target >= 44px sizing or padding.`);
