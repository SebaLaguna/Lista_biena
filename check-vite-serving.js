const http = require('http');

http.get('http://localhost:5173/src/services/api.ts', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('--- START OF SERVED api.ts ---');
    console.log(data);
    console.log('--- END OF SERVED api.ts ---');
  });
}).on('error', (err) => {
  console.error('Error fetching api.ts:', err.message);
});
