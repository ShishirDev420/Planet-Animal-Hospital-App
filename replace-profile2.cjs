const fs = require('fs');
const path = require('path');

const file = 'src/pages/ProfileSettings.tsx';
const filePath = path.join(__dirname, file);
if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/yellow-500/gi, 'planet-yellow');
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
}
