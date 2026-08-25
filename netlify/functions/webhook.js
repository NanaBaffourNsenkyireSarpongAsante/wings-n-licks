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
        const payload = JSON.parse(event.body);
        console.log('🔵 Webhook received:', payload);

        if (payload.event === 'charge.success') {
            console.log('✅ Payment successful:', payload.data.reference);
            // Update order status here
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
        };

    } catch (error) {
        console.error('❌ Webhook error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};