const fs = require('fs');
const content = 'PORT = 7700\nNODE_ENV = development\nRAZORPAY_KEY_ID = rzp_test_RokXble16ygfaW\nRAZORPAY_KEY_SECRET = fwtiixvVbKhvdnBL095dWBX8\nRAZORPAY_WEBHOOK_SECRET = 12345678\nDATABASE_URL = "mongodb://localhost:27017/comfort_inn_db"\;';

fs.writeFileSync('.env', content.trim(), { encoding: 'utf8' });
console.log('? .env file has been fixed and converted to UTF-8!');

fs.writeFileSync('.env', content.trim(), { encoding: 'utf8' });
console.log('? .env file has been fixed and converted to UTF-8!');
