const { Jimp } = require('jimp');

async function main() {
  try {
    const image = await Jimp.read('https://lh3.googleusercontent.com/d/1zldPukvYCnUvn5i2V9gqpDuR8WKhZ1_4');
    const colors = {};
    
    // Resize to speed up
    image.resize({ w: 100 });
    
    for (let x = 0; x < image.bitmap.width; x++) {
      for (let y = 0; y < image.bitmap.height; y++) {
        const hex = image.getPixelColor(x, y).toString(16).padStart(8, '0');
        // Ignore white/black/transparent
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        
        if (r > 200 && g > 150 && b < 100) { // Looking for yellow
          const color = hex.slice(0, 6);
          colors[color] = (colors[color] || 0) + 1;
        }
      }
    }
    
    const sorted = Object.entries(colors).sort((a, b) => b[1] - a[1]);
    console.log("Top yellow colors:", sorted.slice(0, 5));
  } catch (e) {
    console.error(e);
  }
}

main();
