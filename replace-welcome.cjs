const fs = require('fs');
const path = require('path');

const file = 'src/pages/Welcome.tsx';
const filePath = path.join(__dirname, file);
if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/yellow-600/gi, 'planet-yellow');
  content = content.replace(/rgba\(234,179,8/gi, 'rgba(254,199,8');
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
}
