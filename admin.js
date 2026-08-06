// ============================================
// ADMIN DASHBOARD - WINGS "N" LICKS
// Complete working version with proper status flow
// ============================================

let isLoggedIn = false;
let allOrders = [];

// ============================================
// ADMIN EMAIL CONFIG
// ============================================
const ADMIN_EMAIL = 'wingsnlicks@gmail.com';
const ADMIN_PHONE = '233593952002';

// ============================================
// LOGIN
// ============================================
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value.trim();

    const validEmails = ['brown@brownskitchen.com', 'admin@wingsnlicks.com', 'admin'];
    
    if (validEmails.includes(email) && password === 'admin123') {
        isLoggedIn = true;
        document.getElementById('adminLogin').style.display = 'none';
        document.getElementById('adminDashboard').classList.add('active');
        loadOrders();
        setInterval(loadOrders, 15000);
        showAdminNotification('✅ Welcome back, Admin!', 'success');
    } else {
        alert('Invalid credentials. Try: admin@wingsnlicks.com / admin123 OR admin / admin123');
    }
});

// ============================================
// LOAD ORDERS
// ============================================
async function loadOrders() {
    if (!isLoggedIn) return;

    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = '<div class="no-orders">Loading orders...</div>';

    try {
        const { data, error } = await supabaseClient
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            ordersList.innerHTML = '<div class="no-orders">Error loading orders.</div>';
            return;
        }

        allOrders = data || [];

        if (allOrders.length === 0) {
            ordersList.innerHTML = '<div class="no-orders">No orders yet. 🍗</div>';
            updateStats();
            return;
        }

        let html = `
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Reference</th>
                        <th>Customer</th>
                        <th>Phone</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        allOrders.forEach((order, index) => {
            const statusClass = `status-${order.status}`;
            const itemsSummary = order.items.map(i => i.name).join(', ');
            const isPending = order.status === 'pending';
            const isDelivered = order.status === 'delivered';
            
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td><strong>${order.reference}</strong></td>
                    <td>${order.customer_name}</td>
                    <td>${order.customer_phone}</td>
                    <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${itemsSummary}">
                        ${itemsSummary}
                    </td>
                    <td><strong>GH₵ ${order.total.toFixed(2)}</strong></td>
                    <td>
                        <span class="status-badge ${statusClass}">
                            ${order.status.replace(/_/g, ' ')}
                        </span>
                    </td>
                    <td>
                        <div class="action-cell">
                            <select class="status-select" onchange="updateOrderStatus('${order.id}', this.value)">
                                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>⏳ Pending</option>
                                <option value="payment_received" ${order.status === 'payment_received' ? 'selected' : ''}>💰 Payment Rec</option>
                                <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>👨‍🍳 Preparing</option>
                                <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>🕐 Ready</option>
                                <option value="out_for_delivery" ${order.status === 'out_for_delivery' ? 'selected' : ''}>🚚 Out for Delivery</option>
                                <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>✅ Delivered</option>
                                <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>❌ Cancelled</option>
                            </select>
                            ${isPending ? `<button class="confirm-payment-btn" onclick="confirmPayment('${order.id}')">💰 Confirm Payment</button>` : ''}
                            ${isDelivered ? `<button class="delete-order-btn" onclick="deleteOrder('${order.id}')">🗑️ Delete</button>` : ''}
                        </div>
                    </td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        ordersList.innerHTML = html;
        updateStats();
        checkNewOrders();

    } catch (error) {
        console.error('Error:', error);
        ordersList.innerHTML = '<div class="no-orders">Error loading orders.</div>';
    }
}

// ============================================
// CHECK FOR NEW ORDERS
// ============================================
let previousOrderCount = 0;

function checkNewOrders() {
    const pendingOrders = allOrders.filter(o => o.status === 'pending');
    const currentCount = pendingOrders.length;
    
    if (currentCount > previousOrderCount) {
        const newOrders = pendingOrders.slice(0, currentCount - previousOrderCount);
        newOrders.forEach(order => {
            showAdminNotification(`📦 New order #${order.reference}!`, 'new');
            sendAdminNotification(order);
        });
    }
    previousOrderCount = currentCount;
}

// ============================================
// SEND ADMIN NOTIFICATION (WhatsApp)
// ============================================
function sendAdminNotification(order) {
    const msg = `
📦 NEW ORDER RECEIVED - WINGS "N" LICKS
━━━━━━━━━━━━━━━━━━━━━
Order Ref: ${order.reference}
Customer: ${order.customer_name}
Phone: ${order.customer_phone}
Location: ${order.delivery_location}

💳 Total: GH₵ ${order.total.toFixed(2)}

📋 ITEMS:
${order.items.map(item => `  • ${item.name} × ${item.quantity} = GH₵ ${(item.price * item.quantity).toFixed(2)}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━

⚠️ Confirm payment to start preparing!
    `;
    
    const url = `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
}

// ============================================
// UPDATE STATS
// ============================================
function updateStats() {
    if (!allOrders) return;

    const total = allOrders.length;
    const pending = allOrders.filter(o => o.status === 'pending').length;
    const delivered = allOrders.filter(o => o.status === 'delivered');
    const revenue = delivered.reduce((sum, o) => sum + o.total, 0);

    document.getElementById('totalOrders').textContent = total;
    document.getElementById('pendingOrders').textContent = pending;
    document.getElementById('revenueOrders').textContent = `GH₵ ${revenue.toFixed(2)}`;
}

// ============================================
// UPDATE ORDER STATUS - FIXED (no order_history)
// ============================================
async function updateOrderStatus(orderId, newStatus) {
    if (!orderId) {
        showAdminNotification('Error: No order ID', 'error');
        return;
    }
    
    try {
        // Update only the orders table (skip order_history)
        const { data, error } = await supabaseClient
            .from('orders')
            .update({ 
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId)
            .select();

        if (error) {
            console.error('❌ Error:', error);
            showAdminNotification('❌ Error: ' + error.message, 'error');
            return;
        }

        const order = data[0];
        console.log('✅ Status updated:', order);

        // Send notifications based on status change
        switch(newStatus) {
            case 'payment_received':
                sendCustomerNotification(order, 'payment_confirmed');
                sendEmailNotification(order, 'payment_confirmed');
                showAdminNotification('💰 Payment confirmed! Customer notified.', 'success');
                break;
            case 'preparing':
                sendCustomerNotification(order, 'preparing');
                showAdminNotification('👨‍🍳 Preparing status updated.', 'success');
                break;
            case 'ready':
                sendCustomerNotification(order, 'ready');
                showAdminNotification('🕐 Order is ready!', 'success');
                break;
            case 'out_for_delivery':
                sendCustomerNotification(order, 'out_for_delivery');
                showAdminNotification('🚚 Order is out for delivery!', 'success');
                break;
            case 'delivered':
                sendCustomerNotification(order, 'delivered');
                sendEmailNotification(order, 'delivered');
                showAdminNotification('✅ Order delivered! Customer notified.', 'success');
                break;
            case 'cancelled':
                sendCustomerNotification(order, 'cancelled');
                showAdminNotification('❌ Order cancelled.', 'error');
                break;
        }

        loadOrders();

    } catch (error) {
        console.error('❌ Error:', error);
        showAdminNotification('❌ Error updating status.', 'error');
    }
}

// ============================================
// CONFIRM PAYMENT
// ============================================
async function confirmPayment(orderId) {
    if (!orderId) {
        showAdminNotification('Error: No order ID', 'error');
        return;
    }
    
    if (!confirm('Confirm that payment has been received for this order?')) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('orders')
            .update({ 
                status: 'payment_received',
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId)
            .select();

        if (error) {
            console.error('❌ Error:', error);
            showAdminNotification('❌ Error: ' + error.message, 'error');
            return;
        }

        const order = data[0];
        console.log('✅ Payment confirmed:', order);

        sendCustomerNotification(order, 'payment_confirmed');
        sendEmailNotification(order, 'payment_confirmed');
        
        showAdminNotification('💰 Payment confirmed! Customer notified.', 'success');
        loadOrders();

    } catch (error) {
        console.error('❌ Error:', error);
        showAdminNotification('❌ Error confirming payment.', 'error');
    }
}

// ============================================
// SEND CUSTOMER NOTIFICATION (WhatsApp)
// ============================================
function sendCustomerNotification(order, type) {
    const phone = order.customer_phone.replace(/^0/, '');
    
    let message = '';
    
    switch(type) {
        case 'payment_confirmed':
            message = `
✅ PAYMENT CONFIRMED - WINGS "N" LICKS
━━━━━━━━━━━━━━━━━━━━━
Order Ref: ${order.reference}
Customer: ${order.customer_name}

💰 Your payment of GH₵ ${order.total.toFixed(2)} has been confirmed!

👨‍🍳 We're now preparing your food.
🕐 Estimated delivery: 20-25 minutes

Thank you for choosing Wings "N" Licks! 🍗
            `;
            break;
        case 'preparing':
            message = `
👨‍🍳 ORDER UPDATE - WINGS "N" LICKS
━━━━━━━━━━━━━━━━━━━━━
Order Ref: ${order.reference}

Your order is now being prepared!
🕐 Estimated delivery: 20-25 minutes

Stay tuned for updates! 🍗
            `;
            break;
        case 'ready':
            message = `
🕐 ORDER UPDATE - WINGS "N" LICKS
━━━━━━━━━━━━━━━━━━━━━
Order Ref: ${order.reference}

✅ Your order is ready!
🚚 It will be delivered shortly.

Thank you for choosing Wings "N" Licks! 🍗
            `;
            break;
        case 'out_for_delivery':
            message = `
🚚 ORDER UPDATE - WINGS "N" LICKS
━━━━━━━━━━━━━━━━━━━━━
Order Ref: ${order.reference}

🚚 Your order is out for delivery!
🕐 Estimated arrival: 10-15 minutes

Get ready to enjoy your meal! 🍗
            `;
            break;
        case 'delivered':
            message = `
✅ ORDER DELIVERED - WINGS "N" LICKS
━━━━━━━━━━━━━━━━━━━━━
Order Ref: ${order.reference}

📦 Your order has been delivered!

We hope you enjoyed your meal! 🍗
Follow us: @wings_nlicks

Thank you for choosing Wings "N" Licks!
            `;
            break;
        case 'cancelled':
            message = `
❌ ORDER CANCELLED - WINGS "N" LICKS
━━━━━━━━━━━━━━━━━━━━━
Order Ref: ${order.reference}

We're sorry, but your order has been cancelled.

Contact us on WhatsApp: 059 395 2002
            `;
            break;
        default:
            return;
    }
    
    const url = `https://wa.me/233${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

// ============================================
// SEND EMAIL NOTIFICATION (Admin)
// ============================================
function sendEmailNotification(order, type) {
    let subject = '';
    let body = '';
    
    switch(type) {
        case 'payment_confirmed':
            subject = `💰 Payment Confirmed - Order ${order.reference}`;
            body = `
Payment confirmed for order ${order.reference}!

Customer: ${order.customer_name}
Phone: ${order.customer_phone}
Location: ${order.delivery_location}
Total: GH₵ ${order.total.toFixed(2)}

Items:
${order.items.map(item => `  • ${item.name} × ${item.quantity} = GH₵ ${(item.price * item.quantity).toFixed(2)}`).join('\n')}

Start preparing the food now!
            `;
            break;
        case 'delivered':
            subject = `✅ Order Delivered - ${order.reference}`;
            body = `
Order ${order.reference} has been delivered!

Customer: ${order.customer_name}
Phone: ${order.customer_phone}
Total: GH₵ ${order.total.toFixed(2)}

This order can now be deleted from the dashboard.
            `;
            break;
        default:
            return;
    }
    
    const emailUrl = `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(emailUrl, '_blank');
}

// ============================================
// DELETE ORDER
// ============================================
async function deleteOrder(orderId) {
    if (!confirm('⚠️ Are you sure you want to delete this order? This action cannot be undone.')) return;
    
    try {
        const { error } = await supabaseClient
            .from('orders')
            .delete()
            .eq('id', orderId);

        if (error) {
            console.error('❌ Error:', error);
            showAdminNotification('❌ Error deleting order.', 'error');
            return;
        }

        showAdminNotification('🗑️ Order deleted successfully!', 'success');
        loadOrders();

    } catch (error) {
        console.error('❌ Error:', error);
        showAdminNotification('❌ Error deleting order.', 'error');
    }
}

// ============================================
// ADMIN NOTIFICATION
// ============================================
function showAdminNotification(msg, type) {
    let n = document.querySelector('.admin-notification');
    if (!n) {
        n = document.createElement('div');
        n.className = 'admin-notification';
        document.body.appendChild(n);
    }

    const colors = {
        success: '#2ED573',
        error: '#FF4757',
        new: '#FFD700',
        info: '#1E90FF'
    };

    n.textContent = msg;
    n.style.borderLeftColor = colors[type] || colors.info;
    n.classList.add('show');
    
    setTimeout(() => {
        n.classList.remove('show');
    }, 4000);
}

// ============================================
// LOGOUT
// ============================================
function logout() {
    isLoggedIn = false;
    document.getElementById('adminLogin').style.display = 'block';
    document.getElementById('adminDashboard').classList.remove('active');
    document.getElementById('adminPassword').value = '';
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('adminLogin').style.display = 'block';
    document.getElementById('adminDashboard').classList.remove('active');
});

console.log('✅ Wings "N" Licks Admin loaded!');
console.log('🔥 Spicy. Crispy. Addictive.');