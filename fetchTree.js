const https = require('https');
https.get('https://api.github.com/repos/successbyfailure/esp32-pov/git/trees/main?recursive=1', {headers: {'User-Agent': 'node.js'}}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(data));
});
