import fs from 'fs';
let lines = fs.readFileSync('src/components/AiModelInstaller.tsx', 'utf8').split('\n');
const fixed = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('weights (~1.5GB).')) {
    const parts = lines[i].split('<li>');
    if (parts.length > 1) {
       fixed.push(parts[0] + '</li>');
       fixed.push('              <li>' + parts[1]);
    } else {
       fixed.push(lines[i]);
    }
  } else {
    fixed.push(lines[i]);
  }
}
fs.writeFileSync('src/components/AiModelInstaller.tsx', fixed.join('\n'));
