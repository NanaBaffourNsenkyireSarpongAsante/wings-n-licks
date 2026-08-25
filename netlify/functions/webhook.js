// ============================================
// PAYSTACK WEBHOOK - NETLIFY FUNCTION
// ============================================

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Verify webhook signature (optional but recommended)
        const signature = event.headers['x-paystack-signature'];
        
        // You can verify the signature using your secret key here
        // const crypto = require('crypto');
        // const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(event.body).digest('hex');
        // if (hash !== signature) return { statusCode: 401, body: 'Unauthorized' };

        const payload = JSON.parse(event.body);
        console.log('🔵 Webhook received:', payload);

        if (payload.event === 'charge.success') {
            console.log('✅ Payment successful:', payload.data.reference);
            console.log('💰 Amount:', payload.data.amount / 100, 'GHS');
            console.log('📱 Customer:', payload.data.customer);
            
            // Update order status here
            // You would update your Supabase order status using the reference
            
            return {
                statusCode: 200,
                body: JSON.stringify({ 
                    success: true,
                    message: 'Webhook processed successfully'
                })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true,
                message: 'Webhook received but no action taken'
            })
        };

    } catch (error) {
        console.error('❌ Webhook error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Internal server error',
                details: error.message 
            })
        };
    }
};