// ============================================
// ADMIN DASHBOARD - SUPABASE AUTH (WORKING)
// ============================================

console.log('🔵 admin.js loaded!');

let isLoggedIn = false;
let allOrders = [];
let menuItems = [];
let editingItemId = null;
let currentUser = null;

// ============================================
// CHECK SESSION ON LOAD
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔵 DOM loaded');
    
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) {
        console.error('❌ Login form not found!');
        return;
    }
    
    console.log('✅ Login form found');
    
    // Check if already logged in
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (session) {
        currentUser = session.user;
        console.log('✅ Session found for:', currentUser.email);
        
        // Check if user is admin
        const { data: adminData, error: adminError } = await supabaseClient
            .from('admins')
            .select('email')
            .eq('email', currentUser.email);
        
        if (!adminError && adminData && adminData.length > 0) {
            console.log('✅ Already logged in as admin:', currentUser.email);
            isLoggedIn = true;
            document.getElementById('adminLogin').style.display = 'none';
            document.getElementById('adminDashboard').classList.add('active');
            loadOrders();
            loadMenuItems();
            setInterval(loadOrders, 30000);
            showAdminNotification('✅ Welcome back, Admin!', 'success');
            return;
        } else {
            console.log('❌ Not an admin, signing out');
            await supabaseClient.auth.signOut();
        }
    }
    
    // Show login
    document.getElementById('adminLogin').style.display = 'block';
    document.getElementById('adminDashboard').classList.remove('active');
    
    // ============================================
    // LOGIN WITH SUPABASE AUTH
    // ============================================
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('🔵 Login form submitted');
        
        const email = document.getElementById('adminEmail').value.trim();
        const password = document.getElementById('adminPassword').value.trim();
        const errorEl = document.getElementById('loginError');
        
        if (!email || !password) {
            errorEl.textContent = 'Please enter email and password.';
            errorEl.style.display = 'block';
            return;
        }
        
        // Show loading state
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        submitBtn.disabled = true;
        errorEl.style.display = 'none';
        
        try {
            // Sign in with Supabase Auth
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) {
                console.error('❌ Auth error:', error);
                errorEl.textContent = 'Invalid email or password. Please try again.';
                errorEl.style.display = 'block';
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                return;
            }
            
            console.log('✅ Auth successful:', data.user.email);
            currentUser = data.user;
            
            // Check if user is admin
            const { data: adminData, error: adminError } = await supabaseClient
                .from('admins')
                .select('email')
                .eq('email', data.user.email);
            
            console.log('🔵 Admin check result:', adminData);
            
            if (adminError || !adminData || adminData.length === 0) {
                console.error('❌ User is not an admin:', data.user.email);
                errorEl.textContent = 'You do not have admin privileges.';
                errorEl.style.display = 'block';
                await supabaseClient.auth.signOut();
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                return;
            }
            
            console.log('✅ Admin check passed!');
            
            // Success - show dashboard
            isLoggedIn = true;
            document.getElementById('adminLogin').style.display = 'none';
            document.getElementById('adminDashboard').classList.add('active');
            loadOrders();
            loadMenuItems();
            setInterval(loadOrders, 30000);
            showAdminNotification('✅ Welcome back, Admin!', 'success');
            
        } catch (error) {
            console.error('❌ Login error:', error);
            errorEl.textContent = 'Login failed. Please try again.';
            errorEl.style.display = 'block';
        }
        
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
});

// ============================================
// FORGOT PASSWORD
// ============================================
async function resetPassword() {
    const email = document.getElementById('adminEmail').value.trim();
    
    if (!email) {
        showAdminNotification('❌ Please enter your email address first.', 'error');
        return;
    }
    
    try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/admin.html'
        });
        
        if (error) {
            console.error('❌ Reset error:', error);
            showAdminNotification('❌ Error: ' + error.message, 'error');
        } else {
            showAdminNotification('✅ Password reset email sent! Check your inbox.', 'success');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        showAdminNotification('❌ Error sending reset email.', 'error');
    }
}

// ============================================
// LOGOUT
// ============================================
async function logout() {
    await supabaseClient.auth.signOut();
    isLoggedIn = false;
    currentUser = null;
    document.getElementById('adminLogin').style.display = 'block';
    document.getElementById('adminDashboard').classList.remove('active');
    document.getElementById('adminPassword').value = '';
    showAdminNotification('👋 Logged out successfully.', 'info');
}

// ============================================
// LOAD ORDERS
// ============================================
async function loadOrders() {
    if (!isLoggedIn) return;
    
    console.log('🔵 Loading orders...');
    
    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = '<div class="no-orders">Loading orders...</div>';
    
    try {
        const { data, error } = await supabaseClient
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ Load error:', error);
            ordersList.innerHTML = '<div class="no-orders">Error loading orders.</div>';
            return;
        }
        
        allOrders = data || [];
        console.log('✅ Orders loaded:', allOrders.length);
        
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
        
    } catch (error) {
        console.error('❌ Error:', error);
        ordersList.innerHTML = '<div class="no-orders">Error loading orders.</div>';
    }
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
// UPDATE ORDER STATUS
// ============================================
async function updateOrderStatus(orderId, newStatus) {
    if (!orderId) {
        showAdminNotification('Error: No order ID', 'error');
        return;
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
            console.error('❌ Error:', error);
            showAdminNotification('❌ Error: ' + error.message, 'error');
            return;
        }
        
        const order = data[0];
        console.log('✅ Status updated:', order);
        
        switch(newStatus) {
            case 'payment_received':
                sendCustomerNotification(order, 'payment_confirmed');
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
        sendCustomerNotification(order, 'payment_confirmed');
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
// DELETE INDIVIDUAL ORDER
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
// EXPORT ORDERS TO EXCEL
// ============================================
function exportOrdersToExcel() {
    if (!allOrders || allOrders.length === 0) {
        showAdminNotification('No orders to export.', 'error');
        return;
    }
    
    const ordersToExport = allOrders.filter(o => o.status === 'delivered');
    
    if (ordersToExport.length === 0) {
        showAdminNotification('No delivered orders to export.', 'error');
        return;
    }
    
    let csv = 'Reference,Customer,Phone,Location,Items,Total,Payment,Status,Date\n';
    
    ordersToExport.forEach(order => {
        const items = order.items.map(i => i.name).join('; ');
        csv += `${order.reference},${order.customer_name},${order.customer_phone},${order.delivery_location},"${items}",${order.total},${order.payment_method},${order.status},${order.created_at}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showAdminNotification('✅ Orders exported successfully!', 'success');
}

// ============================================
// AUTO-DELETE OLD ORDERS
// ============================================
async function autoDeleteOldOrders() {
    if (!confirm('⚠️ This will delete all delivered orders older than 30 days. Continue?')) return;
    
    const daysToKeep = 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    if (confirm('Do you want to export orders to Excel before deleting?')) {
        exportOrdersToExcel();
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('orders')
            .delete()
            .lt('created_at', cutoffDate.toISOString())
            .eq('status', 'delivered');
        
        if (error) {
            console.error('❌ Delete failed:', error);
            showAdminNotification('❌ Failed to delete old orders.', 'error');
        } else {
            const count = data?.length || 0;
            showAdminNotification(`✅ ${count} old orders deleted.`, 'success');
            loadOrders();
        }
    } catch (error) {
        console.error('❌ Error:', error);
        showAdminNotification('❌ Error deleting orders.', 'error');
    }
}

// ============================================
// TAB SWITCHING
// ============================================
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    if (tab === 'orders') {
        document.querySelector('.tab-btn:first-child').classList.add('active');
        document.getElementById('ordersTab').style.display = 'block';
        document.getElementById('menuTab').style.display = 'none';
    } else {
        document.querySelector('.tab-btn:last-child').classList.add('active');
        document.getElementById('ordersTab').style.display = 'none';
        document.getElementById('menuTab').style.display = 'block';
        loadMenuItems();
    }
}

// ============================================
// LOAD MENU ITEMS
// ============================================
async function loadMenuItems() {
    if (!isLoggedIn) return;
    
    const container = document.getElementById('menuItemsList');
    container.innerHTML = '<div class="no-orders">Loading menu items...</div>';
    
    try {
        const category = document.getElementById('menuCategoryFilter').value;
        let query = supabaseClient.from('menu_items').select('*');
        
        if (category !== 'all') {
            query = query.eq('category', category);
        }
        
        const { data, error } = await query.order('sort_order', { ascending: true });
        
        if (error) {
            console.error('❌ Error loading menu:', error);
            container.innerHTML = '<div class="no-orders">Error loading menu items.</div>';
            return;
        }
        
        menuItems = data || [];
        
        if (menuItems.length === 0) {
            container.innerHTML = '<div class="no-orders">No menu items yet. Add one!</div>';
            return;
        }
        
        container.innerHTML = menuItems.map(item => `
            <div class="menu-item-card">
                <div class="menu-item-preview">
                    <img src="${item.image || 'https://via.placeholder.com/100x100/1A1A2E/FF6B35?text=Food'}" alt="${item.name}">
                    <div class="menu-item-info">
                        <h4>${item.name}</h4>
                        <p>${item.description || ''}</p>
                        <span class="price">GH₵ ${item.price.toFixed(2)}</span>
                        <span class="category-badge">${item.category}</span>
                        ${item.tag ? `<span class="tag-badge tag-${item.tag}">${item.tag}</span>` : ''}
                        <span class="availability-badge ${item.available ? 'available' : 'unavailable'}">
                            ${item.available ? '✅ Available' : '❌ Unavailable'}
                        </span>
                    </div>
                </div>
                <div class="menu-item-actions">
                    <button class="btn-sm btn-edit" onclick="editMenuItem('${item.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-sm btn-toggle" onclick="toggleAvailability('${item.id}')">
                        <i class="fas ${item.available ? 'fa-eye-slash' : 'fa-eye'}"></i>
                    </button>
                    <button class="btn-sm btn-delete" onclick="deleteMenuItem('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('❌ Error:', error);
        container.innerHTML = '<div class="no-orders">Error loading menu items.</div>';
    }
}

// ============================================
// MENU CRUD OPERATIONS
// ============================================
function openAddMenuModal() {
    editingItemId = null;
    document.getElementById('menuModalTitle').textContent = 'Add Menu Item';
    document.getElementById('menuForm').reset();
    document.getElementById('menuItemId').value = '';
    document.getElementById('menuAvailable').checked = true;
    document.getElementById('menuModal').classList.add('show');
}

function editMenuItem(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;
    
    editingItemId = itemId;
    document.getElementById('menuModalTitle').textContent = 'Edit Menu Item';
    document.getElementById('menuItemId').value = item.id;
    document.getElementById('menuName').value = item.name;
    document.getElementById('menuDescription').value = item.description || '';
    document.getElementById('menuPrice').value = item.price;
    document.getElementById('menuCategory').value = item.category;
    document.getElementById('menuImage').value = item.image || '';
    document.getElementById('menuTag').value = item.tag || '';
    document.getElementById('menuAvailable').checked = item.available;
    document.getElementById('menuModal').classList.add('show');
}

function closeMenuModal() {
    document.getElementById('menuModal').classList.remove('show');
}

document.getElementById('menuForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const id = document.getElementById('menuItemId').value;
    const name = document.getElementById('menuName').value.trim();
    const description = document.getElementById('menuDescription').value.trim();
    const price = parseFloat(document.getElementById('menuPrice').value);
    const category = document.getElementById('menuCategory').value;
    const image = document.getElementById('menuImage').value.trim();
    const tag = document.getElementById('menuTag').value;
    const available = document.getElementById('menuAvailable').checked;
    
    if (!name || !price) {
        alert('Please fill in all required fields.');
        return;
    }
    
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;
    
    try {
        const itemData = {
            name,
            description,
            price,
            category,
            image,
            tag,
            available,
            updated_at: new Date().toISOString()
        };
        
        let result;
        
        if (id) {
            result = await supabaseClient
                .from('menu_items')
                .update(itemData)
                .eq('id', id)
                .select();
        } else {
            result = await supabaseClient
                .from('menu_items')
                .insert([{ ...itemData, sort_order: menuItems.length + 1 }])
                .select();
        }
        
        if (result.error) {
            console.error('❌ Error saving:', result.error);
            alert('Error saving menu item.');
        } else {
            showAdminNotification('✅ Menu item saved successfully!', 'success');
            closeMenuModal();
            loadMenuItems();
        }
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error saving menu item.');
    }
    
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
});

async function deleteMenuItem(itemId) {
    if (!confirm('⚠️ Are you sure you want to delete this menu item? This cannot be undone.')) return;
    
    try {
        const { error } = await supabaseClient
            .from('menu_items')
            .delete()
            .eq('id', itemId);
        
        if (error) {
            console.error('❌ Error deleting:', error);
            showAdminNotification('❌ Error deleting item.', 'error');
        } else {
            showAdminNotification('🗑️ Menu item deleted!', 'success');
            loadMenuItems();
        }
    } catch (error) {
        console.error('❌ Error:', error);
        showAdminNotification('❌ Error deleting item.', 'error');
    }
}

async function toggleAvailability(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;
    
    try {
        const { error } = await supabaseClient
            .from('menu_items')
            .update({ 
                available: !item.available,
                updated_at: new Date().toISOString()
            })
            .eq('id', itemId);
        
        if (error) {
            console.error('❌ Error toggling:', error);
            showAdminNotification('❌ Error updating availability.', 'error');
        } else {
            showAdminNotification(`✅ Item ${item.available ? 'hidden' : 'shown'}!`, 'success');
            loadMenuItems();
        }
    } catch (error) {
        console.error('❌ Error:', error);
        showAdminNotification('❌ Error updating availability.', 'error');
    }
}

// ============================================
// KEEP SUPABASE ACTIVE
// ============================================
function keepSupabaseAlive() {
    if (typeof supabaseClient === 'undefined') return;
    
    supabaseClient
        .from('orders')
        .select('count', { count: 'exact', head: true })
        .then(() => console.log('✅ Supabase is active'))
        .catch(() => console.log('⚠️ Supabase ping failed'));
}

setInterval(keepSupabaseAlive, 6 * 60 * 60 * 1000);
keepSupabaseAlive();

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
    
    setTimeout(() => n.classList.remove('show'), 4000);
}

console.log('✅ admin.js loaded successfully!');
console.log('🔒 Supabase Auth enabled!');