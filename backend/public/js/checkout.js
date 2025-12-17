/* =====================================================
   Doctor Jachnun - Checkout & Order Submission
   Uses Node.js/MySQL Backend API
   ===================================================== */

let selectedDeliveryFee = 0;

// Initialize checkout page
function initCheckout() {
    renderOrderSummary();
    initZoneSelector();
    initCheckoutForm();
    initPhoneAutofill();
}

// Render order summary
function renderOrderSummary() {
    const cart = getCart();
    const summaryItems = document.getElementById('summary-items');

    if (!summaryItems) return;

    if (cart.length === 0) {
        window.location.href = 'cart.html';
        return;
    }

    summaryItems.innerHTML = cart.map(cartItem => {
        const menuItem = getItemById(cartItem.id);
        if (!menuItem) return '';

        return `
            <div class="summary-item">
                <span>${menuItem.name} x${cartItem.quantity}</span>
                <span>₪${menuItem.price * cartItem.quantity}</span>
            </div>
        `;
    }).join('');

    updateCheckoutTotals();
}

// Update checkout totals
function updateCheckoutTotals() {
    const subtotal = getCartTotal();
    const total = subtotal + selectedDeliveryFee;

    const subtotalEl = document.getElementById('checkout-subtotal');
    const deliveryEl = document.getElementById('checkout-delivery');
    const totalEl = document.getElementById('checkout-total');

    if (subtotalEl) subtotalEl.textContent = `₪${subtotal}`;
    if (deliveryEl) deliveryEl.textContent = selectedDeliveryFee === 0 ? 'חינם' : `₪${selectedDeliveryFee}`;
    if (totalEl) totalEl.textContent = `₪${total}`;
}

// Initialize zone selector
function initZoneSelector() {
    const zoneSelect = document.getElementById('zone');
    const addressGroup = document.getElementById('address-group');

    if (!zoneSelect) return;

    zoneSelect.addEventListener('change', (e) => {
        const zone = e.target.value;

        // Update delivery fee
        if (DELIVERY_ZONES[zone]) {
            selectedDeliveryFee = DELIVERY_ZONES[zone].price;
        } else {
            selectedDeliveryFee = 0;
        }

        // Show/hide address field
        if (addressGroup) {
            if (zone === 'pickup') {
                addressGroup.style.display = 'none';
                document.getElementById('address').removeAttribute('required');
            } else {
                addressGroup.style.display = 'block';
                document.getElementById('address').setAttribute('required', '');
            }
        }

        updateCheckoutTotals();
    });
}

// Autofill for returning customers
function initPhoneAutofill() {
    const phoneInput = document.getElementById('phone');
    if (!phoneInput) return;

    let debounceTimer;

    phoneInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const phone = e.target.value.replace(/\D/g, '');

        // Only check if phone is at least 9 digits
        if (phone.length >= 9) {
            debounceTimer = setTimeout(async () => {
                try {
                    const result = await CustomersAPI.checkByPhone(phone);
                    if (result.found) {
                        // Autofill form with customer data
                        const customer = result.customer;
                        if (customer.name) document.getElementById('name').value = customer.name;
                        if (customer.email) document.getElementById('email').value = customer.email;
                        if (customer.address) document.getElementById('address').value = customer.address;
                    }
                } catch (error) {
                    // Ignore errors - just don't autofill
                }
            }, 500);
        }
    });
}

// Initialize checkout form
function initCheckoutForm() {
    const form = document.getElementById('checkout-form');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = document.getElementById('submit-order');
        submitBtn.disabled = true;
        submitBtn.textContent = 'שולח הזמנה...';

        try {
            const orderData = collectOrderData();

            // Send to API
            const result = await OrdersAPI.create(orderData);

            // Send WhatsApp notification
            sendWhatsAppNotification(orderData, result.orderNumber);

            // Clear cart and redirect
            clearCart();
            window.location.href = `success.html?order=${result.orderNumber}`;

        } catch (error) {
            console.error('Error submitting order:', error);
            alert('שגיאה בשליחת ההזמנה. נא לנסות שוב.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'שלח הזמנה';
        }
    });
}

// Collect order data from form
function collectOrderData() {
    const cart = getCart();
    const subtotal = getCartTotal();
    const total = subtotal + selectedDeliveryFee;

    const items = cart.map(cartItem => {
        const menuItem = getItemById(cartItem.id);
        return {
            id: cartItem.id,
            name: menuItem.name,
            price: menuItem.price,
            quantity: cartItem.quantity,
            total: menuItem.price * cartItem.quantity
        };
    });

    return {
        customer: {
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value || null,
            address: document.getElementById('address').value || null
        },
        delivery: {
            zone: document.getElementById('zone').value,
            zoneName: DELIVERY_ZONES[document.getElementById('zone').value]?.name || '',
            fee: selectedDeliveryFee
        },
        payment: {
            method: document.querySelector('input[name="payment"]:checked').value
        },
        items: items,
        totals: {
            subtotal: subtotal,
            delivery: selectedDeliveryFee,
            total: total
        },
        notes: document.getElementById('notes').value || null
    };
}

// Send WhatsApp notification
function sendWhatsAppNotification(orderData, orderNumber) {
    const message = generateOrderMessage(orderData, orderNumber);
    const whatsappUrl = `https://wa.me/${BUSINESS_INFO.whatsapp}?text=${encodeURIComponent(message)}`;

    // Store URL for success page
    sessionStorage.setItem('whatsappUrl', whatsappUrl);
}

// Generate order message for WhatsApp
function generateOrderMessage(orderData, orderNumber) {
    let message = `🧆 הזמנה חדשה - דוקטור ג'חנון\n`;
    message += `━━━━━━━━━━━━━━━\n`;
    message += `מספר הזמנה: ${orderNumber}\n\n`;

    message += `📋 פרטי הזמנה:\n`;
    orderData.items.forEach(item => {
        message += `• ${item.name} x${item.quantity} - ₪${item.total}\n`;
    });

    message += `\n💰 סיכום:\n`;
    message += `סה"כ מוצרים: ₪${orderData.totals.subtotal}\n`;
    message += `משלוח (${orderData.delivery.zoneName}): ${orderData.delivery.fee === 0 ? 'חינם' : '₪' + orderData.delivery.fee}\n`;
    message += `סה"כ לתשלום: ₪${orderData.totals.total}\n\n`;

    message += `👤 פרטי לקוח:\n`;
    message += `שם: ${orderData.customer.name}\n`;
    message += `טלפון: ${orderData.customer.phone}\n`;
    if (orderData.customer.address) {
        message += `כתובת: ${orderData.customer.address}\n`;
    }

    message += `\n💳 תשלום: ${orderData.payment.method === 'bit' ? 'Bit' : 'PayBox'}\n`;

    if (orderData.notes) {
        message += `\n📝 הערות: ${orderData.notes}\n`;
    }

    return message;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initCheckout);
