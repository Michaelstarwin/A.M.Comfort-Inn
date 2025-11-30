const fs = require('fs');
const content = \PORT=7700
NODE_ENV=development
RAZORPAY_KEY_ID=rzp_live_RgjfGSw269T1W4
RAZORPAY_KEY_SECRET=fwtiixvVbKhvdnBL095dWBX8
RAZORPAY_WEBHOOK_SECRET=12345678
DATABASE_URL="mongodb://localhost:27017/comfort_inn_db"\;

fs.writeFileSync('.env', content.trim(), { encoding: 'utf8' });
console.log('? .env file has been fixed and converted to UTF-8!');
