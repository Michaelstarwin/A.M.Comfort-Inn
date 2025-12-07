const http = require('http');

function get(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
        }).on('error', reject);
    });
}

async function run() {
    try {
        console.log('--- Checking /_routes ---');
        const routes = await get('http://127.0.0.1:7700/_routes');
        console.log('Status:', routes.statusCode);
        // console.log('Body:', routes.body.substring(0, 500)); // Truncate

        console.log('\n--- Checking /api/bookings/order/order_test123 ---');
        const booking = await get('http://127.0.0.1:7700/api/bookings/order/order_test123');
        console.log('Status:', booking.statusCode);
        console.log('Body:', booking.body);

    } catch (err) {
        console.error('Error:', err.message);
    }
}

run();
