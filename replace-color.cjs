const fs = require('fs');
const path = require('path');

const files = [
  'src/pages/Dashboard.tsx',
  'src/pages/Roadmap.tsx',
  'src/pages/ProactivePlans.tsx',
  'src/components/Layout.tsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/#e8bc4b/gi, '#fec708');
    content = content.replace(/rgba\(232,188,75/gi, 'rgba(254,199,8');
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
});
