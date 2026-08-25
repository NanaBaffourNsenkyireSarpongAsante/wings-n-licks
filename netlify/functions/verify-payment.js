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
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(e);
                    }
                });
            });
            req.on('error', reject);
            req.end();
        });

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
                    error: 'Payment verification failed'
                })
            };
        }

    } catch (error) {
        console.error('❌ Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};