const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../../');

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (['node_modules', 'dist', '.git', '.agents'].includes(file)) continue;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (/\.(tsx|ts|html|css)$/.test(file)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const files = getAllFiles(projectRoot);

const lightLeakRegex = /bg-white(?![/])|bg-slate-(?:50|100|200)|bg-gray-(?:50|100|200)|text-slate-(?:800|900)|text-gray-(?:800|900)|border-slate-(?:100|200)|border-gray-(?:100|200)/g;

let totalLeaks = 0;
const fileSummaries = {};
const details = {};

for (const filePath of files) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const relPath = path.relative(projectRoot, filePath);
  
  lines.forEach((line, index) => {
    let match;
    while ((match = lightLeakRegex.exec(line)) !== null) {
      if (!details[relPath]) details[relPath] = [];
      details[relPath].push({ line: index + 1, match: match[0], text: line.trim() });
      totalLeaks++;
    }
  });
  if (details[relPath]) {
    fileSummaries[relPath] = details[relPath].length;
  }
}

const report = {
  totalLeaks,
  fileSummaries,
  details
};

fs.writeFileSync(path.join(__dirname, 'scan_results.json'), JSON.stringify(report, null, 2));
console.log(`Scan completed. Total leaks: ${totalLeaks}. Wrote results to scan_results.json`);
