// ============================================
// SUPABASE CONNECTION
// ============================================

const SUPABASE_URL = 'https://zbkbfjvodxtiohhuqxko.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpia2JmanZvZHh0aW9oaHVxeGtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzODg4NjcsImV4cCI6MjA5OTk2NDg2N30.Y-7lMgl3HBDSVA1u2zXDdm_WWCDHNsY-Jsd9uhQIFwE';

console.log('✅ Supabase URL loaded');

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log('✅ Supabase client initialized');

// ============================================
// SAVE ORDER TO SUPABASE
// ============================================
async function saveOrderToSupabase(orderData) {
    console.log('🔵 saveOrderToSupabase called');
    
    try {
        const formattedItems = orderData.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity
        }));

        const orderToInsert = {
            reference: orderData.reference,
            customer_name: orderData.customer.name,
            customer_phone: orderData.customer.phone,
            delivery_location: orderData.customer.location,
            items: formattedItems,
            total: orderData.total,
            payment_method: orderData.payment.method,
            momo_number: orderData.payment.momoNumber,
            status: 'pending',
            tracking_status: 'order_placed',
            estimated_delivery_time: 45
        };

        console.log('🔵 Inserting:', orderToInsert);

        const { data, error } = await supabaseClient
            .from('orders')
            .insert([orderToInsert])
            .select();

        if (error) {
            console.error('❌ Supabase insert error:', error);
            return { success: false, error: error };
        }

        console.log('✅ Order saved to Supabase:', data);
        return { success: true, data: data };
    } catch (error) {
        console.error('❌ Exception in saveOrderToSupabase:', error);
        return { success: false, error: error };
    }
}

// ============================================
// GET ALL ORDERS
// ============================================
async function getAllOrders() {
    console.log('🔵 getAllOrders called');
    
    try {
        const { data, error } = await supabaseClient
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Supabase select error:', error);
            return { success: false, error: error };
        }

        console.log('✅ Orders fetched:', data ? data.length : 0);
        return { success: true, data: data || [] };
    } catch (error) {
        console.error('❌ Exception in getAllOrders:', error);
        return { success: false, error: error };
    }
}

// ============================================
// UPDATE ORDER STATUS - FIXED
// ============================================
async function updateOrderStatus(orderId, newStatus) {
    console.log('🔵 updateOrderStatus called');
    console.log('🔵 Order ID:', orderId);
    console.log('🔵 New Status:', newStatus);
    
    if (!orderId) {
        console.error('❌ No order ID provided');
        return { success: false, error: 'No order ID provided' };
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('orders')
            .update({ 
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId)
            .select();

        if (error) {
            console.error('❌ Supabase update error:', error);
            return { success: false, error: error };
        }

        console.log('✅ Order status updated to:', newStatus);
        console.log('✅ Updated data:', data);
        return { success: true, data: data };
    } catch (error) {
        console.error('❌ Exception in updateOrderStatus:', error);
        return { success: false, error: error };
    }
}

console.log('✅ Supabase functions loaded!');