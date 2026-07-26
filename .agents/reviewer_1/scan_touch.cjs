const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../../');

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (['node_modules', 'dist', '.git', '.agents'].includes(file)) continue;
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) getAllFiles(filePath, fileList);
    else if (/\.(tsx|ts|html|css)$/.test(file)) fileList.push(filePath);
  }
  return fileList;
}

const files = getAllFiles(projectRoot);

// Look for <button, <a, onClick without min-h-[44px] or p-3 or py-3 or h-11 or similar
const interactiveRegex = /<(button|a)\s+[^>]*>/g;

const failures = [];

for (const filePath of files) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const relPath = path.relative(projectRoot, filePath);
  
  lines.forEach((line, index) => {
    let match;
    while ((match = interactiveRegex.exec(line)) !== null) {
      const tag = match[0];
      const hasMinH = /min-h-\[44px\]|h-11|h-12|h-14|h-16|h-10|p-3|p-4|py-3|py-4/.test(tag);
      const isSub44 = /p-1(?!\d)|p-1\.5|p-2(?!\d)|p-2\.5|py-1(?!\d)|py-1\.5|py-2(?!\d)|py-2\.5|h-6|h-7|h-8|h-9/.test(tag);
      if (isSub44 && !hasMinH) {
        failures.push({
          file: relPath,
          line: index + 1,
          tag: tag.trim()
        });
      }
    }
  });
}

fs.writeFileSync(path.join(__dirname, 'touch_results.json'), JSON.stringify({ count: failures.length, failures }, null, 2));
console.log(`Touch target scan complete. Found ${failures.length} potentially small interactive elements.`);
