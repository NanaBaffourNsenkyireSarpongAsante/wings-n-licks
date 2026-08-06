// ============================================
// MENU DATA - WINGS "N" LICKS
// ============================================
const menuItems = [
    // Combo Meals
    {
        id: 1,
        name: "Combo 4",
        description: "Fried Rice + 4 Spicy Chicken Wings",
        price: 80.00,
        category: "combo",
        image: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80",
        tag: "popular"
    },
    {
        id: 2,
        name: "Combo 6",
        description: "Fried Rice + 6 Spicy Chicken Wings",
        price: 100.00,
        category: "combo",
        image: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80",
        tag: "popular"
    },
    {
        id: 3,
        name: "Combo 8",
        description: "Fried Rice + 8 Spicy Chicken Wings",
        price: 120.00,
        category: "combo",
        image: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80",
        tag: null
    },
    // Regular Meals
    {
        id: 4,
        name: "Fried Rice Only",
        description: "Classic fried rice, perfectly seasoned",
        price: 40.00,
        category: "regular",
        image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80",
        tag: null
    },
    {
        id: 5,
        name: "4 Spicy Wings",
        description: "4 signature spicy chicken wings",
        price: 40.00,
        category: "regular",
        image: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80",
        tag: "popular"
    },
    {
        id: 6,
        name: "6 Spicy Wings",
        description: "6 signature spicy chicken wings",
        price: 60.00,
        category: "regular",
        image: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80",
        tag: "popular"
    },
    {
        id: 7,
        name: "10 Spicy Wings",
        description: "10 signature spicy chicken wings",
        price: 100.00,
        category: "regular",
        image: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80",
        tag: null
    },
    // Spicy Fries + Wings
    {
        id: 8,
        name: "Fries + 5 Wings + Zinger Dip",
        description: "Crispy fries with 5 wings and zinger dip",
        price: 75.00,
        category: "fries",
        image: "https://images.unsplash.com/photo-1630384900428-0c8bc9b0d5b4?auto=format&fit=crop&w=600&q=80",
        tag: null
    },
    {
        id: 9,
        name: "Fries + 5 Wings + Zinger Dip + Coke",
        description: "Crispy fries, 5 wings, zinger dip, and Coca-Cola",
        price: 85.00,
        category: "fries",
        image: "https://images.unsplash.com/photo-1630384900428-0c8bc9b0d5b4?auto=format&fit=crop&w=600&q=80",
        tag: "popular"
    },
    // Baddie Box
    {
        id: 10,
        name: "Baddie Box",
        description: "Fries + Fried Rice + 6 Wings + Coke + Zinger Dip + Hot Sauce",
        price: 120.00,
        category: "baddie",
        image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=600&q=80",
        tag: "new"
    },
    // Big Brown Bucket
    {
        id: 11,
        name: "Big Brown Bucket",
        description: "Fried Rice + Fries + 8 Wings + Coke + Zinger Dip + Hot Sauce",
        price: 180.00,
        category: "bucket",
        image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=600&q=80",
        tag: "popular"
    }
];

let cart = [];

// ============================================
// PAYSTACK CONFIGURATION
// ============================================
const PAYSTACK_PUBLIC_KEY = 'pk_test_baa82c3cfd66cfdb794bb00f7f7ae57c1227bcfc';
const PAYSTACK_SUBACCOUNT = 'ACCT_kvhbszzru33dnf2';

// ============================================
// RENDER MENU
// ============================================
function renderMenu(category = 'all') {
    const grid = document.getElementById('menuGrid');
    const filtered = category === 'all' ? menuItems : menuItems.filter(item => item.category === category);

    if (filtered.length === 0) {
        grid.innerHTML = `<p class="empty-cart" style="color:var(--gray);text-align:center;padding:3rem;">No items in this category.</p>`;
        return;
    }

    grid.innerHTML = filtered.map(item => {
        const cartItem = cart.find(i => i.id === item.id);
        const qty = cartItem ? cartItem.quantity : 0;
        const isAdded = cartItem ? true : false;
        
        return `
        <div class="menu-item">
            <img src="${item.image}" class="menu-item-image" onerror="this.src='https://via.placeholder.com/600x400/1A1A2E/FF6B35?text=Wings'">
            <div class="menu-item-info">
                ${item.tag ? `<span class="menu-item-tag tag-${item.tag}">${item.tag === 'popular' ? '🔥 Popular' : '✨ New'}</span>` : ''}
                <h4 class="menu-item-name">${item.name}</h4>
                <p class="menu-item-description">${item.description}</p>
                <p class="menu-item-price">GH₵ ${item.price.toFixed(2)}</p>
                <div class="menu-item-actions">
                    <div class="quantity-control">
                        <button class="quantity-btn" onclick="changeQty(${item.id}, -1)">−</button>
                        <span class="quantity-value" id="qty-${item.id}">${qty}</span>
                        <button class="quantity-btn" onclick="changeQty(${item.id}, 1)">+</button>
                    </div>
                    <button class="add-to-cart" onclick="addToCart(${item.id})" id="addBtn-${item.id}">
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
    
    if (!inCart) {
        if (val > 0) {
            btn.innerHTML = '<i class="fas fa-plus"></i> Add';
            btn.style.background = 'var(--gradient-primary)';
        } else {
            btn.innerHTML = '<i class="fas fa-plus"></i> Add';
            btn.style.background = '';
        }
    }
}

// ============================================
// ADD TO CART
// ============================================
function addToCart(id) {
    const qtyEl = document.getElementById(`qty-${id}`);
    if (!qtyEl) return;
    const qty = parseInt(qtyEl.textContent);
    
    if (qty === 0) {
        cart = cart.filter(item => item.id !== id);
        const btn = document.getElementById(`addBtn-${id}`);
        if (btn) {
            btn.innerHTML = '<i class="fas fa-plus"></i> Add';
            btn.style.background = '';
        }
        updateCartUI();
        return;
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

    const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);

    if (cart.length === 0) {
        if (itemsEl) itemsEl.innerHTML = '<p class="empty-cart">Your cart is empty. Add some delicious food!</p>';
        if (totalEl) totalEl.textContent = 'GH₵ 0.00';
        if (checkoutBtn) checkoutBtn.disabled = true;
        if (floatingCart) floatingCart.style.display = 'none';
        return;
    }

    if (floatingCart) {
        floatingCart.style.display = 'block';
        if (badge) badge.textContent = totalItems;
    }

    if (itemsEl) {
        itemsEl.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div>
                    <strong style="color:var(--white);">${item.name}</strong>
                    <span style="color:var(--primary);margin-left:1rem;">GH₵ ${item.price} × ${item.quantity}</span>
                </div>
                <div>
                    <span style="font-weight:700;color:var(--secondary);margin-right:1rem;">
                        GH₵ ${(item.price * item.quantity).toFixed(2)}
                    </span>
                    <button class="cart-item-remove" onclick="removeFromCart(${item.id})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    if (totalEl) totalEl.textContent = `GH₵ ${total.toFixed(2)}`;
    if (checkoutBtn) checkoutBtn.disabled = false;
}

// ============================================
// REMOVE FROM CART
// ============================================
function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    const qtyEl = document.getElementById(`qty-${id}`);
    if (qtyEl) qtyEl.textContent = '0';
    const btn = document.getElementById(`addBtn-${id}`);
    if (btn) {
        btn.innerHTML = '<i class="fas fa-plus"></i> Add';
        btn.style.background = '';
    }
    updateCartUI();
}

// ============================================
// GO TO CART
// ============================================
function goToCart() {
    if (cart.length === 0) {
        showNotification('Your cart is empty! Add some items first.');
        return;
    }
    
    const cartSection = document.getElementById('cartSection');
    const steps = document.querySelectorAll('.step');
    
    if (cartSection) cartSection.style.display = 'block';
    
    steps.forEach((el, index) => {
        if (index === 1) {
            el.classList.add('active');
        }
    });
    
    if (cartSection) {
        cartSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
    setTimeout(() => n.classList.remove('show'), 2000);
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
    document.getElementById('otherLocationGroup').style.display = this.value === 'Other' ? 'block' : 'none';
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
// SEND WHATSAPP CONFIRMATIONS
// ============================================
function sendWhatsAppConfirmations(orderData, paymentStatus = 'pending') {
    const customerMsg = paymentStatus === 'paid' ? `
✅ PAYMENT CONFIRMED - WINGS "N" LICKS
━━━━━━━━━━━━━━━━━━━━━
Reference: ${orderData.reference}
Customer: ${orderData.customer.name}
Location: ${orderData.customer.location}

📋 ORDER SUMMARY:
${orderData.items.map(item => `  • ${item.name} × ${item.quantity} = GH₵ ${(item.price * item.quantity).toFixed(2)}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━
Total: GH₵ ${orderData.total.toFixed(2)}

💰 Payment confirmed!

👨‍🍳 We're preparing your food.
🕐 Estimated delivery: 20-25 minutes

Thank you for choosing Wings "N" Licks! 🍗
    ` : `
📋 ORDER RECEIVED - WINGS "N" LICKS
━━━━━━━━━━━━━━━━━━━━━
Reference: ${orderData.reference}
Customer: ${orderData.customer.name}
Location: ${orderData.customer.location}

📋 ORDER SUMMARY:
${orderData.items.map(item => `  • ${item.name} × ${item.quantity} = GH₵ ${(item.price * item.quantity).toFixed(2)}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━
Total: GH₵ ${orderData.total.toFixed(2)}

💳 Payment: ${orderData.payment.method.toUpperCase()}
${orderData.payment.method !== 'cash' ? `📱 Pay with: ${orderData.payment.momoNumber}` : '💵 Cash on Delivery'}

${orderData.payment.method !== 'cash' ? '⚠️ Complete payment via MoMo. You\'ll receive a USSD push on your phone.' : '💵 Please have cash ready upon delivery.'}

Thank you for choosing Wings "N" Licks! 🍗
    `;

    const adminMsg = paymentStatus === 'paid' ? `
✅ PAYMENT CONFIRMED - WINGS "N" LICKS
━━━━━━━━━━━━━━━━━━━━━
Order Ref: ${orderData.reference}
Customer: ${orderData.customer.name}
Phone: ${orderData.customer.phone}
Location: ${orderData.customer.location}

💰 Payment confirmed!
Total: GH₵ ${orderData.total.toFixed(2)}

📋 ITEMS:
${orderData.items.map(item => `  • ${item.name} × ${item.quantity} = GH₵ ${(item.price * item.quantity).toFixed(2)}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━

✅ Start preparing the food!
    ` : `
📦 NEW ORDER - ${orderData.payment.method === 'cash' ? 'CASH ON DELIVERY' : 'AWAITING PAYMENT!'}
━━━━━━━━━━━━━━━━━━━━━
Order Ref: ${orderData.reference}
Customer: ${orderData.customer.name}
Phone: ${orderData.customer.phone}
Location: ${orderData.customer.location}

💳 Payment: ${orderData.payment.method.toUpperCase()}
${orderData.payment.method !== 'cash' ? `📱 MoMo Number: ${orderData.payment.momoNumber}` : '💵 Cash on Delivery'}
Total: GH₵ ${orderData.total.toFixed(2)}

📋 ITEMS:
${orderData.items.map(item => `  • ${item.name} × ${item.quantity} = GH₵ ${(item.price * item.quantity).toFixed(2)}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━

${orderData.payment.method !== 'cash' ? '⚠️ Confirm payment has been received.' : '⚠️ Prepare food for delivery.'}
    `;

    const customerPhone = orderData.customer.phone.replace(/^0/, '');
    const adminPhone = '593952002';

    setTimeout(() => {
        window.open(`https://wa.me/233${customerPhone}?text=${encodeURIComponent(customerMsg)}`, '_blank');
    }, 500);

    setTimeout(() => {
        window.open(`https://wa.me/233${adminPhone}?text=${encodeURIComponent(adminMsg)}`, '_blank');
    }, 1000);
}

// ============================================
// SHOW ORDER CONFIRMATION
// ============================================
function showOrderConfirmation(orderData, paymentStatus = 'pending') {
    const details = document.getElementById('orderDetails');
    const isPaid = paymentStatus === 'paid';
    
    details.innerHTML = `
        <p><strong>Reference:</strong> ${orderData.reference}</p>
        <p><strong>Customer:</strong> ${orderData.customer.name}</p>
        <p><strong>Phone:</strong> ${orderData.customer.phone}</p>
        <p><strong>Location:</strong> ${orderData.customer.location}</p>
        <p><strong>Payment:</strong> ${orderData.payment.method.toUpperCase()}</p>
        <p><strong>Total:</strong> <span style="color:var(--secondary);font-size:1.2rem;">GH₵ ${orderData.total.toFixed(2)}</span></p>
        <hr>
        <p><strong>Items Ordered:</strong></p>
        ${orderData.items.map(i => `<p style="font-size:0.9rem;">• ${i.name} × ${i.quantity} = GH₵ ${(i.price * i.quantity).toFixed(2)}</p>`).join('')}
        <hr>
        <div style="background:${isPaid ? '#1A3A2E' : '#1A1A2E'};padding:1rem;border-radius:8px;border-left:4px solid ${isPaid ? '#2ED573' : '#FFD700'};">
            <p style="margin:0;color:${isPaid ? '#2ED573' : '#FFD700'};">
                ${isPaid ? '✅ Payment Confirmed!' : '⏳ Order Received!'}
                <br>
                ${isPaid ? 'Your payment has been confirmed. We\'re preparing your food.' : (orderData.payment.method === 'cash' ? '💵 Cash on Delivery - Please have cash ready.' : 'Please complete payment on your phone via MoMo.')}
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
}

// ============================================
// PAYMENT FORM SUBMISSION
// ============================================
document.getElementById('paymentForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const location = document.getElementById('deliveryLocation').value;
    const other = document.getElementById('otherLocation').value.trim();
    const method = document.querySelector('input[name="paymentMethod"]:checked');
    const momo = document.getElementById('momoNumber').value.trim();

    // Validate
    if (!name || !phone || !location) {
        alert('Please fill in all required fields.');
        return;
    }

    if (phone.length < 10) {
        alert('Please enter a valid phone number (10 digits).');
        return;
    }

    // Calculate total
    const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
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
        payment: { 
            method: method ? method.value : 'mtn', 
            momoNumber: method && method.value === 'cash' ? 'Cash on Delivery' : momo
        },
        time: new Date().toLocaleString()
    };

    // Validate MoMo number for non-cash payments
    if (method && method.value !== 'cash' && (!momo || momo.length < 10)) {
        alert('Please enter a valid Mobile Money number (10 digits).');
        return;
    }

    // If Cash on Delivery, process directly
    if (method && method.value === 'cash') {
        const submitBtn = document.querySelector('.payment-submit');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        submitBtn.disabled = true;

        try {
            const result = await saveOrderToSupabase(orderData);
            if (!result.success) throw new Error('Failed to save order');
            
            sendWhatsAppConfirmations(orderData, 'pending');
            showOrderConfirmation(orderData, 'pending');
            
            cart = [];
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
    // PAYSTACK PAYMENT (MoMo)
    // ============================================
    const submitBtn = document.querySelector('.payment-submit');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;

    try {
        // Save order to Supabase first
        const result = await saveOrderToSupabase(orderData);
        
        if (!result.success) {
            throw new Error('Failed to save order');
        }

        // Send "Order Received" WhatsApp
        sendWhatsAppConfirmations(orderData, 'pending');

        // Check if Paystack is available
        if (typeof PaystackPop === 'undefined') {
            throw new Error('Payment service not available. Please try Cash on Delivery.');
        }

        // Open Paystack popup
        const handler = PaystackPop.setup({
            key: PAYSTACK_PUBLIC_KEY,
            email: `${orderData.customer.name.replace(/\s/g, '').toLowerCase()}@customer.com`,
            amount: Math.round(orderData.total * 100),
            currency: 'GHS',
            ref: orderData.reference,
            metadata: {
                custom_fields: [
                    {
                        display_name: "Customer Name",
                        variable_name: "customer_name",
                        value: orderData.customer.name
                    },
                    {
                        display_name: "Customer Phone",
                        variable_name: "customer_phone",
                        value: orderData.customer.phone
                    },
                    {
                        display_name: "Location",
                        variable_name: "location",
                        value: orderData.customer.location
                    }
                ]
            },
            subaccount: PAYSTACK_SUBACCOUNT,
            channels: ['mobile_money'],
            callback: function(response) {
                console.log('✅ Paystack callback:', response);
                
                // Update order status
                updateOrderStatus(result.data[0].id, 'payment_received')
                    .then(() => {
                        sendWhatsAppConfirmations(orderData, 'paid');
                        showOrderConfirmation(orderData, 'paid');
                        cart = [];
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
                    });
            },
            onClose: function() {
                console.log('⚠️ Paystack popup closed');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
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
document.addEventListener('DOMContentLoaded', function() {
    renderCategories();
    renderMenu();
    updateCartUI();
    
    const momoGroup = document.getElementById('momoGroup');
    if (momoGroup) momoGroup.style.display = 'block';
});

console.log('✅ Wings "N" Licks - Order system loaded!');
console.log('🔥 Spicy. Crispy. Addictive.');
console.log('💳 Paystack MoMo is active!');