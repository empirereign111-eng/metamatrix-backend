const https = require('https');

const req = https.request('https://api.x.ai/v1/models', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer dummy'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', data));
});
req.end();
