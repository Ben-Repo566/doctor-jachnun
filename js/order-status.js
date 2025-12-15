/* =====================================================
   Doctor Jachnun - Order Status Page
   Polls API for status updates
   ===================================================== */

let currentOrderNumber = null;
let pollInterval = null;

// Initialize status page
function initStatusPage() {
    // Get order number from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentOrderNumber = urlParams.get('order');

    if (!currentOrderNumber) {
        showError('לא נמצא מספר הזמנה');
        return;
    }

    // Display order number
    document.getElementById('order-id').textContent = currentOrderNumber;
    document.getElementById('confirmed-order-id').textContent = currentOrderNumber;

    // Load order details
    loadOrderDetails();

    // Start polling for status updates
    startPolling();
}

// Load order details from API
async function loadOrderDetails() {
    try {
        const order = await OrdersAPI.getStatus(currentOrderNumber);
        displayOrderDetails(order);

        // Check if already confirmed
        if (order.status === 'confirmed' || order.status === 'completed') {
            showConfirmedStatus(order);
            stopPolling();
        } else if (order.status === 'cancelled') {
            showCancelledStatus();
            stopPolling();
        }
    } catch (error) {
        console.error('Error loading order:', error);
        showError('שגיאה בטעינת ההזמנה');
    }
}

// Display order details
function displayOrderDetails(orderData) {
    const orderItems = document.getElementById('order-items');
    const orderSubtotal = document.getElementById('order-subtotal');
    const orderDelivery = document.getElementById('order-delivery');
    const orderTotal = document.getElementById('order-total');

    if (orderItems && orderData.items) {
        orderItems.innerHTML = orderData.items.map(item => `
            <div class="order-item">
                <span>${item.name} x${item.quantity}</span>
                <span>₪${item.total}</span>
            </div>
        `).join('');
    }

    if (orderSubtotal) orderSubtotal.textContent = `₪${orderData.totals?.subtotal || 0}`;
    if (orderDelivery) orderDelivery.textContent = orderData.totals?.delivery === 0 ? 'חינם' : `₪${orderData.totals?.delivery || 0}`;
    if (orderTotal) orderTotal.textContent = `₪${orderData.totals?.total || 0}`;

    // Update payment info
    const paymentMethod = document.getElementById('payment-method');
    const paymentAmount = document.getElementById('payment-amount');

    if (paymentMethod) paymentMethod.textContent = orderData.payment?.method === 'bit' ? 'Bit' : 'PayBox';
    if (paymentAmount) paymentAmount.textContent = `₪${orderData.totals?.total || 0}`;
}

// Poll for status updates every 5 seconds
function startPolling() {
    pollInterval = setInterval(async () => {
        try {
            const order = await OrdersAPI.getStatus(currentOrderNumber);

            if (order.status === 'confirmed' || order.status === 'completed') {
                showConfirmedStatus(order);
                stopPolling();
            } else if (order.status === 'cancelled') {
                showCancelledStatus();
                stopPolling();
            }
        } catch (error) {
            console.error('Polling error:', error);
        }
    }, 5000);
}

function stopPolling() {
    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
    }
}

// Show confirmed status
function showConfirmedStatus(orderData) {
    const pendingCard = document.getElementById('status-pending');
    const confirmedCard = document.getElementById('status-confirmed');

    if (pendingCard) pendingCard.style.display = 'none';
    if (confirmedCard) confirmedCard.style.display = 'block';

    // Update payment details
    displayOrderDetails(orderData);

    // Play notification sound
    playNotificationSound();
}

// Show cancelled status
function showCancelledStatus() {
    const statusCard = document.getElementById('status-pending');
    if (statusCard) {
        statusCard.innerHTML = `
            <div class="status-icon" style="background: var(--error);">
                <span>✕</span>
            </div>
            <h1>ההזמנה בוטלה</h1>
            <p class="status-message">ההזמנה שלך בוטלה. נא ליצור קשר לפרטים נוספים.</p>
            <div class="contact-whatsapp">
                <a href="https://wa.me/${BUSINESS_INFO.whatsapp}" target="_blank" class="btn btn-whatsapp">
                    <span>📱</span> צור קשר בוואטסאפ
                </a>
            </div>
        `;
    }
}

// Show error
function showError(message) {
    const statusCard = document.getElementById('status-pending');
    if (statusCard) {
        statusCard.innerHTML = `
            <div class="status-icon" style="background: var(--error);">
                <span>!</span>
            </div>
            <h1>שגיאה</h1>
            <p class="status-message">${message}</p>
            <a href="index.html" class="btn btn-primary">חזרה לדף הבית</a>
        `;
    }
}

// Play notification sound
function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;

        oscillator.start();
        setTimeout(() => oscillator.stop(), 200);
    } catch (e) {
        // Ignore audio errors
    }
}

// Cleanup on page leave
window.addEventListener('beforeunload', stopPolling);

// Initialize on page load
document.addEventListener('DOMContentLoaded', initStatusPage);
