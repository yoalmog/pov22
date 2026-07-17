const fs = require('fs');
const path = require('path');
const transparentPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

const dir = 'android/app/src/main/res/mipmap-mdpi';
if (fs.existsSync(dir)) {
  fs.writeFileSync(path.join(dir, 'ic_launcher.png'), transparentPng);
  fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), transparentPng);
  fs.writeFileSync(path.join(dir, 'ic_launcher_foreground.png'), transparentPng);
  console.log("Replaced mdpi pngs");
}
