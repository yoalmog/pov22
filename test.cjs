const http = require('http');

const check = (path) => new Promise((resolve) => {
  http.get('http://localhost:3000' + path, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => resolve({ path, status: res.statusCode, data }));
  }).on('error', (err) => resolve({ path, error: err.message }));
});

(async () => {
  console.log(await check('/api/health'));
  console.log(await check('/status'));
  console.log(await check('/scan'));
  console.log(await check('/diagnostic'));
  console.log(await check('/logs'));
})();
