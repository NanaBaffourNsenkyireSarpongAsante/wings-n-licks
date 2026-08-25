// ============================================
// VERIFY PAYSTACK PAYMENT - NETLIFY FUNCTION
// ============================================

// Load .env for local development
require('dotenv').config();

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { reference } = JSON.parse(event.body);
        
        if (!reference) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Reference is required' })
            };
        }

        const secretKey = process.env.PAYSTACK_SECRET_KEY;
        
        if (!secretKey) {
            console.error('❌ PAYSTACK_SECRET_KEY not set');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Server configuration error' })
            };
        }

        const https = require('https');

        const options = {
            hostname: 'api.paystack.co',
            path: `/transaction/verify/${reference}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${secretKey}`,
                'Content-Type': 'application/json'
            }
        };

        const response = await new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';
                console.log('📡 Response status:', res.statusCode);
                console.log('📡 Response headers:', res.headers);
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    console.log('📡 Response body:', data);
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(e);
                    }
                });
            });
            req.on('error', (e) => {
                console.error('❌ Request error:', e);
                reject(e);
            });
            req.end();
        });

        console.log('✅ Paystack response:', response);

        if (response.status && response.data.status === 'success') {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    data: response.data
                })
            };
        } else {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    success: false,
                    error: 'Payment verification failed',
                    details: response
                })
            };
        }

    } catch (error) {
        console.error('❌ Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error', details: error.message })
        };
    }
};