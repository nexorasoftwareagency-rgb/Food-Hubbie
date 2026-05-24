const fs = require('fs');
const path = require('path');

const patterns = [
  { name: "BtnPrimary (Primary buttons)", regex: /<BtnPrimary/g },
  { name: "<button> elements",           regex: /<button/g },
  { name: "onClick handlers",            regex: /onClick=\{/g },
  { name: "onChange handlers",           regex: /onChange=\{/g },
  { name: "onSubmit handlers",           regex: /onSubmit=\{/g },
];

const srcDir = path.join(__dirname, '..', 'admin-dashboard', 'src');
const sectionDir = path.join(srcDir, 'sections');
const componentDir = path.join(srcDir, 'components');

const results = {};

function scanFiles(dir, label) {
  if (!fs.existsSync(dir)) { console.log(`Skipping ${dir} (not found)`); return; }
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx') || f.endsWith('.js') || f.endsWith('.tsx'));
  files.forEach(file => {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    patterns.forEach(p => {
      const matches = content.match(p.regex);
      if (matches) {
        const key = `${label}/${file}`;
        if (!results[key]) results[key] = {};
        results[key][p.name] = matches.length;
      }
    });
  });
}

scanFiles(sectionDir, 'sections');
scanFiles(componentDir, 'components');

console.log("ADMIN-DASHBOARD INTERACTIVITY AUDIT\n");
console.log(`${"File".padEnd(40)} ${patterns.map(p => p.name.split(' ')[0].padEnd(10)).join(' ')}`);
console.log("-".repeat(40 + patterns.length * 11));
Object.entries(results).sort().forEach(([file, data]) => {
  const counts = patterns.map(p => (String(data[p.name] || '')).padEnd(10));
  console.log(`${file.padEnd(40)} ${counts.join(' ')}`);
});

const totalBtn = Object.values(results).reduce((a, r) => a + (r['<button> elements'] || 0), 0);
const totalClick = Object.values(results).reduce((a, r) => a + (r['onClick handlers'] || 0), 0);
console.log(`\nSummary: ${Object.keys(results).length} files, ${totalBtn} <button> elements, ${totalClick} onClick handlers`);
