// ============================================
// CART PERSISTENCE
// ============================================
const CART_STORAGE_KEY = 'wings_nlicks_cart';
const DELIVERY_FEES = {
    Bomso: 5,
    KNUST: 15,
    Other: 20
};

let cart = [];
let menuItems = [];

function readCartFromStorage() {
    try {
        const saved = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        console.error('Cart read error:', error);
        return [];
    }
}

function saveCartToStorage() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function getCartSubtotal() {
    return cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity || 0)), 0);
}

function getDeliveryFee(location = '') {
    return DELIVERY_FEES[location] ?? 0;
}

function getCartTotal(location = '') {
    return getCartSubtotal() + getDeliveryFee(location);
}

cart = readCartFromStorage();

// ============================================
// PAYSTACK CONFIGURATION - LIVE MODE
// ============================================
const PAYSTACK_PUBLIC_KEY = 'pk_live_800c0844901ba454e4336b59ed87c09378c76f04';

// ============================================
// FETCH MENU FROM SUPABASE
// ============================================
async function loadMenuFromDatabase() {
    try {
        const { data, error } = await supabaseClient
            .from('menu_items')
            .select('*')
            .eq('available', true)
            .order('sort_order', { ascending: true });

        if (error) {
            console.error('❌ Error loading menu:', error);
            return [];
        }

        console.log('✅ Menu loaded from database:', data?.length || 0, 'items');
        return data || [];
    } catch (error) {
        console.error('❌ Error:', error);
        return [];
    }
}

// ============================================
// RENDER MENU
// ============================================
function renderMenu(category = 'all') {
    const grid = document.getElementById('menuGrid');
    
    if (!grid) {
        console.warn('⚠️ menuGrid not found');
        return;
    }
    
    if (!menuItems || menuItems.length === 0) {
        grid.innerHTML = `<p class="empty-cart" style="color:var(--gray);text-align:center;padding:3rem;">Loading menu...</p>`;
        return;
    }

    const filtered = category === 'all' ? menuItems : menuItems.filter(item => item.category === category);

    if (filtered.length === 0) {
        grid.innerHTML = `<p class="empty-cart" style="color:var(--gray);text-align:center;padding:3rem;">No items in this category.</p>`;
        return;
    }

    grid.innerHTML = filtered.map(item => {
        const itemId = JSON.stringify(item.id).replace(/"/g, '&quot;');
        const cartItem = cart.find(i => i.id === item.id);
        const qty = cartItem ? cartItem.quantity : 0;
        const isAdded = cartItem ? true : false;
        
        return `
        <div class="menu-item">
            <img src="${item.image || 'https://via.placeholder.com/600x400/1A1A2E/FF6B35?text=Food'}" class="menu-item-image" onerror="this.src='https://via.placeholder.com/600x400/1A1A2E/FF6B35?text=Food'">
            <div class="menu-item-info">
                ${item.tag ? `<span class="menu-item-tag tag-${item.tag}">${item.tag === 'popular' ? '🔥 Popular' : '✨ New'}</span>` : ''}
                <h4 class="menu-item-name">${item.name}</h4>
                <p class="menu-item-description">${item.description || ''}</p>
                <p class="menu-item-price">GH₵ ${item.price.toFixed(2)}</p>
                <div class="menu-item-actions">
                    <div class="quantity-control">
                        <button class="quantity-btn" onclick="changeQty(${itemId}, -1)">−</button>
                        <span class="quantity-value" id="qty-${item.id}">${qty}</span>
                        <button class="quantity-btn" onclick="changeQty(${itemId}, 1)">+</button>
                    </div>
                    <button class="add-to-cart" onclick="addToCart(${itemId})" id="addBtn-${item.id}" style="${isAdded ? 'background: var(--fresh);' : ''}">
                        ${isAdded ? '<i class="fas fa-check"></i> Added' : '<i class="fas fa-plus"></i> Add'}
                    </button>
                </div>
            </div>
        </div>
    `}).join('');
}

// ============================================
// CATEGORIES
// ============================================
const categories = [
    { id: 'all', label: 'All', icon: 'fa-utensils' },
    { id: 'combo', label: 'Combo Meals', icon: 'fa-utensils' },
    { id: 'regular', label: 'Regular', icon: 'fa-drumstick-bite' },
    { id: 'fries', label: 'Fries + Wings', icon: 'fa-french-fries' },
    { id: 'baddie', label: 'Baddie Box', icon: 'fa-box' },
    { id: 'bucket', label: 'Big Bucket', icon: 'fa-bucket' }
];

function renderCategories() {
    const container = document.querySelector('.menu-categories');
    if (!container) return;
    
    container.innerHTML = categories.map(cat => `
        <button class="category-btn ${cat.id === 'all' ? 'active' : ''}" data-category="${cat.id}">
            <i class="fas ${cat.icon}"></i> ${cat.label}
        </button>
    `).join('');

    container.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            container.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            renderMenu(this.dataset.category);
        });
    });
}

// ============================================
// CHANGE QUANTITY
// ============================================
function changeQty(id, change) {
    const el = document.getElementById(`qty-${id}`);
    if (!el) return;
    let val = parseInt(el.textContent) + change;
    if (val < 0) val = 0;
    el.textContent = val;
    
    const inCart = cart.find(i => i.id === id);
    const btn = document.getElementById(`addBtn-${id}`);
    if (!btn) return;
    
    if (val === 0) {
        cart = cart.filter(item => item.id !== id);
        saveCartToStorage();
        btn.innerHTML = '<i class="fas fa-plus"></i> Add';
        btn.style.background = '';
        updateCartUI();
    } else if (inCart) {
        inCart.quantity = val;
        saveCartToStorage();
        btn.innerHTML = '<i class="fas fa-check"></i> Added';
        btn.style.background = 'var(--fresh)';
        updateCartUI();
    }
}

// ============================================
// ADD TO CART
// ============================================
function addToCart(id) {
    const qtyEl = document.getElementById(`qty-${id}`);
    if (!qtyEl) return;
    let qty = parseInt(qtyEl.textContent);
    
    if (qty === 0) {
        qty = 1;
        qtyEl.textContent = '1';
    }

    const item = menuItems.find(i => i.id === id);
    if (!item) return;
    const existing = cart.find(i => i.id === id);
    
    if (existing) {
        existing.quantity = qty;
    } else {
        cart.push({ ...item, quantity: qty });
    }

    const btn = document.getElementById(`addBtn-${id}`);
    if (btn) {
        btn.innerHTML = '<i class="fas fa-check"></i> Added';
        btn.style.background = 'var(--fresh)';
    }

    saveCartToStorage();
    updateCartUI();
    showNotification(`${item.name} added to cart!`);
}

// ============================================
// UPDATE CART UI
// ============================================
function updateCartUI() {
    const itemsEl = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const floatingCart = document.getElementById('floatingCart');
    const badge = document.getElementById('cartBadge');
    const locationSelect = document.getElementById('deliveryLocation');

    const totalItems = cart.reduce((sum, i) => sum + Number(i.quantity || 0), 0);

    if (cart.length === 0) {
        if (itemsEl) itemsEl.innerHTML = '<p class="empty-cart">Your cart is empty. Add some delicious food!</p>';
        if (totalEl) totalEl.textContent = 'GH₵ 0.00';
        if (checkoutBtn) checkoutBtn.disabled = true;
        if (floatingCart) floatingCart.style.display = 'none';
        return;
    }

    saveCartToStorage();

    if (floatingCart) {
        floatingCart.style.display = 'block';
        if (badge) badge.textContent = totalItems;
    }

    if (itemsEl) {
        itemsEl.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div style="flex:1;min-width:100px;">
                    <strong style="color:var(--white);font-size:0.9rem;">${item.name}</strong>
                    <span style="color:var(--primary);margin-left:0.8rem;font-size:0.85rem;">GH₵ ${item.price} × ${item.quantity}</span>
                </div>
                <div style="display:flex;align-items:center;gap:0.5rem;">
                    <span style="font-weight:700;color:var(--secondary);font-size:0.95rem;">
                        GH₵ ${(item.price * item.quantity).toFixed(2)}
                    </span>
                    <button class="cart-item-remove" onclick="removeFromCart(${item.id})" title="Remove item">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    const subtotal = getCartSubtotal();
    const selectedLocation = locationSelect ? locationSelect.value : '';
    const total = getCartTotal(selectedLocation);
    if (totalEl) totalEl.textContent = `GH₵ ${total.toFixed(2)}`;
    if (checkoutBtn) checkoutBtn.disabled = false;
}

// ============================================
// REMOVE FROM CART
// ============================================
function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCartToStorage();
    
    const qtyEl = document.getElementById(`qty-${id}`);
    if (qtyEl) qtyEl.textContent = '0';
    
    const btn = document.getElementById(`addBtn-${id}`);
    if (btn) {
        btn.innerHTML = '<i class="fas fa-plus"></i> Add';
        btn.style.background = '';
    }
    
    updateCartUI();
    showNotification('Item removed from cart');
}

// ============================================
// GO TO CART
// ============================================
function goToCart() {
    if (cart.length === 0) {
        showNotification('Your cart is empty! Add some items first.');
        return;
    }

    window.location.href = 'cart.html';
}

// ============================================
// CLOSE CART
// ============================================
function closeCart() {
    const cartSection = document.getElementById('cartSection');
    if (cartSection) cartSection.style.display = 'none';
    if (cart.length === 0) {
        document.querySelectorAll('.step')[1]?.classList.remove('active');
    }
}

// ============================================
// NOTIFICATION
// ============================================
function showNotification(msg) {
    let n = document.querySelector('.cart-notification');
    if (!n) {
        n = document.createElement('div');
        n.className = 'cart-notification';
        document.body.appendChild(n);
    }
    n.textContent = msg;
    n.classList.add('show');
    setTimeout(() => n.classList.remove('show'), 2500);
}

// ============================================
// CHECKOUT
// ============================================
document.getElementById('checkoutBtn')?.addEventListener('click', function() {
    if (cart.length === 0) return;
    
    const steps = document.querySelectorAll('.step');
    steps.forEach((el, index) => {
        if (index === 2) el.classList.add('active');
    });
    
    document.getElementById('paymentSection')?.classList.add('active');
    document.getElementById('cartSection').style.display = 'none';
    document.getElementById('paymentSection')?.scrollIntoView({ behavior: 'smooth' });
});

// ============================================
// PAYMENT
// ============================================
document.querySelectorAll('.payment-method')?.forEach(el => {
    el.addEventListener('click', function() {
        document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
        this.classList.add('selected');
        this.querySelector('input').checked = true;
        
        const momoGroup = document.getElementById('momoGroup');
        if (this.dataset.method === 'cash') {
            if (momoGroup) momoGroup.style.display = 'none';
        } else {
            if (momoGroup) momoGroup.style.display = 'block';
        }
    });
});

document.getElementById('deliveryLocation')?.addEventListener('change', function() {
    const otherLocationGroup = document.getElementById('otherLocationGroup');
    if (otherLocationGroup) otherLocationGroup.style.display = this.value === 'Other' ? 'block' : 'none';
    updateCartUI();
});

// ============================================
// GENERATE ORDER REFERENCE
// ============================================
function generateOrderReference() {
    const prefix = 'WL';
    const date = new Date();
    const dateStr = date.getFullYear() + 
                   String(date.getMonth() + 1).padStart(2, '0') + 
                   String(date.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `${prefix}-${dateStr}-${random}`;
}

// ============================================
// SEND WHATSAPP CONFIRMATIONS (ONLY AFTER PAYMENT)
// ============================================
function sendWhatsAppConfirmations(orderData) {
    // Customer receipt - ONLY sent after successful payment
    const customerMsg = `
✅ PAYMENT CONFIRMED - WINGS "N" LICKS
━━━━━━━━━━━━━━━━━━━━━
Reference: ${orderData.reference}
Customer: ${orderData.customer.name}
Location: ${orderData.customer.location}

📋 ORDER SUMMARY:
${orderData.items.map(item => `  • ${item.name} × ${item.quantity} = GH₵ ${(item.price * item.quantity).toFixed(2)}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━
Subtotal: GH₵ ${getCartSubtotal().toFixed(2)}
Delivery: GH₵ ${getDeliveryFee(orderData.customer.location).toFixed(2)}
Total: GH₵ ${orderData.total.toFixed(2)}

💰 Payment confirmed via Paystack!

👨‍🍳 We're preparing your food.
🕐 Estimated delivery: 20-25 minutes

Thank you for choosing Wings "N" Licks! 🍗
    `;

    // Admin notification
    const adminMsg = `
✅ PAYMENT CONFIRMED - WINGS "N" LICKS
━━━━━━━━━━━━━━━━━━━━━
Order Ref: ${orderData.reference}
Customer: ${orderData.customer.name}
Phone: ${orderData.customer.phone}
Location: ${orderData.customer.location}

💰 Payment confirmed via Paystack!
Subtotal: GH₵ ${getCartSubtotal().toFixed(2)}
Delivery: GH₵ ${getDeliveryFee(orderData.customer.location).toFixed(2)}
Total: GH₵ ${orderData.total.toFixed(2)}

📋 ITEMS:
${orderData.items.map(item => `  • ${item.name} × ${item.quantity} = GH₵ ${(item.price * item.quantity).toFixed(2)}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━

✅ Start preparing the food!
    `;

    const customerPhone = orderData.customer.phone.replace(/^0/, '');
    const adminPhone = '593952002';

    // Send to customer
    setTimeout(() => {
        window.open(`https://wa.me/233${customerPhone}?text=${encodeURIComponent(customerMsg)}`, '_blank');
    }, 500);

    // Send to admin
    setTimeout(() => {
        window.open(`https://wa.me/233${adminPhone}?text=${encodeURIComponent(adminMsg)}`, '_blank');
    }, 1000);
}

// ============================================
// SHOW ORDER CONFIRMATION
// ============================================
function showOrderConfirmation(orderData) {
    const details = document.getElementById('orderDetails');
    
    details.innerHTML = `
        <p><strong>Reference:</strong> ${orderData.reference}</p>
        <p><strong>Customer:</strong> ${orderData.customer.name}</p>
        <p><strong>Phone:</strong> ${orderData.customer.phone}</p>
        <p><strong>Location:</strong> ${orderData.customer.location}</p>
        <p><strong>Payment:</strong> ${orderData.payment.method.toUpperCase()}</p>
        <p><strong>Subtotal:</strong> GH₵ ${getCartSubtotal().toFixed(2)}</p>
        <p><strong>Delivery:</strong> GH₵ ${getDeliveryFee(orderData.customer.location).toFixed(2)}</p>
        <p><strong>Total:</strong> <span style="color:var(--secondary);font-size:1.2rem;">GH₵ ${orderData.total.toFixed(2)}</span></p>
        <hr>
        <p><strong>Items Ordered:</strong></p>
        ${orderData.items.map(i => `<p style="font-size:0.9rem;">• ${i.name} × ${i.quantity} = GH₵ ${(i.price * i.quantity).toFixed(2)}</p>`).join('')}
        <hr>
        <div style="background:#1A3A2E;padding:1rem;border-radius:8px;border-left:4px solid #2ED573;">
            <p style="margin:0;color:#2ED573;">
                ✅ Payment Confirmed!
                <br>
                Your payment has been confirmed. We're preparing your food.
                <br><br>
                🕐 Estimated delivery: 20-25 minutes
                <br>
                📱 A WhatsApp receipt has been sent to your phone.
            </p>
        </div>
    `;

    const steps = document.querySelectorAll('.step');
    steps.forEach((el, index) => {
        if (index === 3) el.classList.add('active');
    });
    
    document.getElementById('paymentSection').classList.remove('active');
    document.getElementById('confirmationSection').classList.add('active');
    document.getElementById('confirmationSection').scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// PAYMENT FORM SUBMISSION - FIXED Paystack callback
// ============================================
document.getElementById('paymentForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const location = document.getElementById('deliveryLocation').value;
    const other = document.getElementById('otherLocation').value.trim();
    const method = document.querySelector('input[name="paymentMethod"]:checked');
    const momo = document.getElementById('momoNumber').value.trim();

    if (!name || !phone || !location) {
        alert('Please fill in all required fields.');
        return;
    }

    if (phone.length < 10) {
        alert('Please enter a valid phone number (10 digits).');
        return;
    }

    const deliveryFee = getDeliveryFee(location === 'Other' ? 'Other' : location);
    const total = getCartTotal(location === 'Other' ? 'Other' : location);
    const ref = generateOrderReference();

    const orderData = {
        reference: ref,
        customer: { 
            name: name, 
            phone: phone, 
            location: location === 'Other' ? other : location 
        },
        items: cart.map(i => ({ 
            name: i.name, 
            quantity: i.quantity, 
            price: i.price 
        })),
        total: total,
        deliveryFee: deliveryFee,
        payment: { 
            method: method ? method.value : 'mtn', 
            momoNumber: method && method.value === 'cash' ? 'Cash on Delivery' : momo
        },
        time: new Date().toLocaleString()
    };

    if (method && method.value !== 'cash' && (!momo || momo.length < 10)) {
        alert('Please enter a valid Mobile Money number (10 digits).');
        return;
    }

    // ============================================
    // CASH ON DELIVERY - Different flow
    // ============================================
    if (method && method.value === 'cash') {
        const submitBtn = document.querySelector('.payment-submit');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        submitBtn.disabled = true;

        try {
            const result = await saveOrderToSupabase(orderData);
            if (!result.success) throw new Error('Failed to save order');
            
            const customerMsg = `
📋 ORDER CONFIRMED - WINGS "N" LICKS
━━━━━━━━━━━━━━━━━━━━━
Reference: ${orderData.reference}
Customer: ${orderData.customer.name}
Location: ${orderData.customer.location}

📋 ORDER SUMMARY:
${orderData.items.map(item => `  • ${item.name} × ${item.quantity} = GH₵ ${(item.price * item.quantity).toFixed(2)}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━
Subtotal: GH₵ ${getCartSubtotal().toFixed(2)}
Delivery: GH₵ ${getDeliveryFee(orderData.customer.location).toFixed(2)}
Total: GH₵ ${orderData.total.toFixed(2)}

💳 Payment: CASH ON DELIVERY
💵 Please have cash ready upon delivery.

👨‍🍳 We're preparing your food.
🕐 Estimated delivery: 20-25 minutes

Thank you for choosing Wings "N" Licks! 🍗
            `;

            const adminMsg = `
📦 NEW ORDER - CASH ON DELIVERY
━━━━━━━━━━━━━━━━━━━━━
Order Ref: ${orderData.reference}
Customer: ${orderData.customer.name}
Phone: ${orderData.customer.phone}
Location: ${orderData.customer.location}

💳 Payment: CASH ON DELIVERY
Subtotal: GH₵ ${getCartSubtotal().toFixed(2)}
Delivery: GH₵ ${getDeliveryFee(orderData.customer.location).toFixed(2)}
Total: GH₵ ${orderData.total.toFixed(2)}

📋 ITEMS:
${orderData.items.map(item => `  • ${item.name} × ${item.quantity} = GH₵ ${(item.price * item.quantity).toFixed(2)}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━

⚠️ Prepare food for delivery.
            `;

            const customerPhone = orderData.customer.phone.replace(/^0/, '');
            const adminPhone = '593952002';

            setTimeout(() => {
                window.open(`https://wa.me/233${customerPhone}?text=${encodeURIComponent(customerMsg)}`, '_blank');
            }, 500);

            setTimeout(() => {
                window.open(`https://wa.me/233${adminPhone}?text=${encodeURIComponent(adminMsg)}`, '_blank');
            }, 1000);

            // Show confirmation (modified for cash)
            const details = document.getElementById('orderDetails');
            details.innerHTML = `
                <p><strong>Reference:</strong> ${orderData.reference}</p>
                <p><strong>Customer:</strong> ${orderData.customer.name}</p>
                <p><strong>Phone:</strong> ${orderData.customer.phone}</p>
                <p><strong>Location:</strong> ${orderData.customer.location}</p>
                <p><strong>Payment:</strong> CASH ON DELIVERY</p>
                <p><strong>Total:</strong> <span style="color:var(--secondary);font-size:1.2rem;">GH₵ ${orderData.total.toFixed(2)}</span></p>
                <hr>
                <p><strong>Items Ordered:</strong></p>
                ${orderData.items.map(i => `<p style="font-size:0.9rem;">• ${i.name} × ${i.quantity} = GH₵ ${(i.price * i.quantity).toFixed(2)}</p>`).join('')}
                <hr>
                <div style="background:#1A1A2E;padding:1rem;border-radius:8px;border-left:4px solid #FFD700;">
                    <p style="margin:0;color:#FFD700;">
                        ⏳ Order Received!
                        <br>
                        💵 Cash on Delivery - Please have cash ready.
                        <br><br>
                        🕐 Estimated delivery: 20-25 minutes
                    </p>
                </div>
            `;

            const steps = document.querySelectorAll('.step');
            steps.forEach((el, index) => {
                if (index === 3) el.classList.add('active');
            });
            
            document.getElementById('paymentSection').classList.remove('active');
            document.getElementById('confirmationSection').classList.add('active');
            document.getElementById('confirmationSection').scrollIntoView({ behavior: 'smooth' });
            
            cart = [];
            saveCartToStorage();
            updateCartUI();

            submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Order Placed!';
            submitBtn.style.background = 'var(--fresh)';
            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                submitBtn.style.background = '';
            }, 3000);
        } catch (error) {
            console.error('❌ Error:', error);
            alert('There was an error processing your order. Please try again.');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
        return;
    }

    // ============================================
    // MOMO PAYMENT - FIXED CALLBACK
    // ============================================
    const submitBtn = document.querySelector('.payment-submit');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;

    try {
        const result = await saveOrderToSupabase(orderData);
        if (!result.success) throw new Error('Failed to save order');
        
        const orderId = result.data[0].id;

        if (typeof PaystackPop === 'undefined') {
            throw new Error('Payment service not available. Please try Cash on Delivery.');
        }

        // Define callback functions BEFORE setting up Paystack
        const paymentCallback = function(response) {
            console.log('✅ Paystack callback:', response);
            
            // Update order status
            updateOrderStatus(orderId, 'payment_received')
                .then(() => {
                    sendWhatsAppConfirmations(orderData);
                    showOrderConfirmation(orderData);
                    cart = [];
                    saveCartToStorage();
                    updateCartUI();
                    
                    submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Payment Successful!';
                    submitBtn.style.background = 'var(--fresh)';
                    setTimeout(() => {
                        submitBtn.innerHTML = originalText;
                        submitBtn.disabled = false;
                        submitBtn.style.background = '';
                    }, 3000);
                })
                .catch((err) => {
                    console.error('❌ Error updating order:', err);
                    alert('Payment was successful but we had trouble confirming your order. Please contact us.');
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                });
        };

        const paymentOnClose = function() {
            console.log('⚠️ Paystack popup closed');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            // Don't clear cart - user can try again
        };

        // Setup Paystack with proper callback functions
        const handler = PaystackPop.setup({
            key: PAYSTACK_PUBLIC_KEY,
            email: `${orderData.customer.name.replace(/\s/g, '').toLowerCase()}@customer.com`,
            amount: Math.round(orderData.total * 100),
            currency: 'GHS',
            ref: orderData.reference,
            metadata: {
                custom_fields: [
                    { display_name: "Customer Name", variable_name: "customer_name", value: orderData.customer.name },
                    { display_name: "Customer Phone", variable_name: "customer_phone", value: orderData.customer.phone },
                    { display_name: "Location", variable_name: "location", value: orderData.customer.location }
                ]
            },
            channels: ['mobile_money'],
            callback: paymentCallback,
            onClose: paymentOnClose
        });
        
        handler.openIframe();

    } catch (error) {
        console.error('❌ Error:', error);
        alert('Payment processing failed: ' + error.message + '\nPlease try again or use Cash on Delivery.');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔵 Initializing orders page...');
    
    renderCategories();
    
    const items = await loadMenuFromDatabase();
    if (items.length > 0) {
        menuItems = items;
    } else {
        console.warn('⚠️ No menu items found, using fallback data');
    }
    
    renderMenu();
    updateCartUI();
    
    const momoGroup = document.getElementById('momoGroup');
    if (momoGroup) momoGroup.style.display = 'block';
});

console.log('✅ Wings "N" Licks - Order system loaded!');
console.log('🔥 Spicy. Crispy. Addictive.');
console.log('💳 Paystack MoMo is active!');
console.log('📱 WhatsApp receipt sent ONLY after successful payment!');