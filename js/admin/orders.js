/* =====================================================
   Doctor Jachnun - Admin Orders Management
   Uses Node.js/MySQL Backend API
   ===================================================== */

let allOrders = [];
let currentFilter = 'all';

// Initialize orders page
async function initOrders() {
    // Check for specific order to view
    const urlParams = new URLSearchParams(window.location.search);
    const viewOrderId = urlParams.get('view');

    await loadOrders();
    initFilters();

    if (viewOrderId) {
        openOrderModal(viewOrderId);
    }

    // Refresh every 30 seconds
    setInterval(loadOrders, 30000);
}

// Load all orders
async function loadOrders() {
    const ordersList = document.getElementById('orders-list');
    const emptyState = document.getElementById('empty-state');

    try {
        const filters = {};
        if (currentFilter !== 'all') {
            filters.status = currentFilter;
        }

        const dateFilter = document.getElementById('date-filter').value;
        if (dateFilter) {
            filters.date = dateFilter;
        }

        const orders = await OrdersAPI.getAll(filters);

        if (orders.length === 0) {
            ordersList.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        allOrders = orders;
        renderOrders(orders);

        // Update pending badge
        const pendingCount = orders.filter(o => o.status === 'pending').length;
        updatePendingBadge(pendingCount);

    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// Render orders table
function renderOrders(orders) {
    const ordersList = document.getElementById('orders-list');

    ordersList.innerHTML = orders.map(order => {
        const date = new Date(order.created_at);
        const formattedDate = date.toLocaleDateString('he-IL');
        const formattedTime = date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

        return `
            <tr>
                <td>${order.order_number || '#' + order.id}</td>
                <td>${formattedDate} ${formattedTime}</td>
                <td>${order.customer_name || '-'}</td>
                <td>${order.customer_phone || '-'}</td>
                <td>${order.delivery_zone_name || '-'}</td>
                <td>₪${order.total || 0}</td>
                <td><span class="status-badge ${order.status}">${getStatusText(order.status)}</span></td>
                <td>
                    <button class="action-btn view" onclick="openOrderModal(${order.id})" title="צפה">👁️</button>
                    ${order.status === 'pending' ? `
                        <button class="action-btn confirm" onclick="confirmOrder(${order.id})" title="אשר">✓</button>
                        <button class="action-btn cancel" onclick="cancelOrder(${order.id})" title="בטל">✕</button>
                    ` : ''}
                    ${order.status === 'confirmed' ? `
                        <button class="action-btn confirm" onclick="completeOrder(${order.id})" title="סיים">✓</button>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

// Initialize filters
function initFilters() {
    const statusFilter = document.getElementById('status-filter');
    const dateFilter = document.getElementById('date-filter');
    const refreshBtn = document.getElementById('refresh-btn');

    statusFilter.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        loadOrders();
    });

    dateFilter.addEventListener('change', () => {
        loadOrders();
    });

    refreshBtn.addEventListener('click', () => {
        loadOrders();
    });

    // Modal close handlers
    const modal = document.getElementById('order-modal');
    const modalClose = document.getElementById('modal-close');

    modalClose.addEventListener('click', closeOrderModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeOrderModal();
    });
}

// Open order modal
async function openOrderModal(orderId) {
    const modal = document.getElementById('order-modal');
    const modalOrderId = document.getElementById('modal-order-id');
    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementById('modal-footer');

    // Find order in loaded orders or fetch it
    let order = allOrders.find(o => o.id === orderId);

    if (!order) {
        try {
            order = await OrdersAPI.getById(orderId);
        } catch (error) {
            modalBody.innerHTML = '<p>ההזמנה לא נמצאה</p>';
            modal.classList.add('active');
            return;
        }
    }

    modalOrderId.textContent = order.order_number || `#${order.id}`;

    const date = new Date(order.created_at);

    modalBody.innerHTML = `
        <div class="order-detail-section">
            <h4>פרטי לקוח</h4>
            <div class="detail-row">
                <span class="detail-label">שם:</span>
                <span class="detail-value">${order.customer_name || '-'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">טלפון:</span>
                <span class="detail-value">
                    <a href="tel:${order.customer_phone}">${order.customer_phone || '-'}</a>
                </span>
            </div>
            <div class="detail-row">
                <span class="detail-label">אימייל:</span>
                <span class="detail-value">${order.customer_email || '-'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">כתובת:</span>
                <span class="detail-value">${order.customer_address || '-'}</span>
            </div>
        </div>

        <div class="order-detail-section">
            <h4>פרטי משלוח</h4>
            <div class="detail-row">
                <span class="detail-label">אזור:</span>
                <span class="detail-value">${order.delivery_zone_name || '-'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">עלות משלוח:</span>
                <span class="detail-value">${order.delivery_fee == 0 ? 'חינם' : '₪' + order.delivery_fee}</span>
            </div>
        </div>

        <div class="order-detail-section">
            <h4>פריטים</h4>
            ${order.items?.map(item => `
                <div class="detail-row">
                    <span class="detail-label">${item.name} x${item.quantity}</span>
                    <span class="detail-value">₪${item.total}</span>
                </div>
            `).join('') || '-'}
        </div>

        <div class="order-detail-section">
            <h4>סיכום</h4>
            <div class="detail-row">
                <span class="detail-label">סה"כ מוצרים:</span>
                <span class="detail-value">₪${order.subtotal || 0}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">משלוח:</span>
                <span class="detail-value">${order.delivery_fee == 0 ? 'חינם' : '₪' + order.delivery_fee}</span>
            </div>
            <div class="detail-row" style="font-weight: bold;">
                <span class="detail-label">סה"כ לתשלום:</span>
                <span class="detail-value">₪${order.total || 0}</span>
            </div>
        </div>

        <div class="order-detail-section">
            <h4>מידע נוסף</h4>
            <div class="detail-row">
                <span class="detail-label">תשלום:</span>
                <span class="detail-value">${order.payment_method === 'bit' ? 'Bit' : 'PayBox'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">תאריך הזמנה:</span>
                <span class="detail-value">${date.toLocaleDateString('he-IL')} ${date.toLocaleTimeString('he-IL')}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">סטטוס:</span>
                <span class="detail-value"><span class="status-badge ${order.status}">${getStatusText(order.status)}</span></span>
            </div>
            ${order.notes ? `
                <div class="detail-row">
                    <span class="detail-label">הערות:</span>
                    <span class="detail-value">${order.notes}</span>
                </div>
            ` : ''}
        </div>
    `;

    // Add action buttons based on status
    let actions = `
        <a href="https://wa.me/972${order.customer_phone?.replace(/^0/, '')}" target="_blank" class="btn btn-whatsapp">
            וואטסאפ ללקוח
        </a>
    `;

    if (order.status === 'pending') {
        actions += `
            <button class="btn btn-primary" onclick="confirmOrder(${order.id}); closeOrderModal();">אשר הזמנה</button>
            <button class="btn btn-secondary" onclick="cancelOrder(${order.id}); closeOrderModal();">בטל הזמנה</button>
        `;
    } else if (order.status === 'confirmed') {
        actions += `
            <button class="btn btn-primary" onclick="completeOrder(${order.id}); closeOrderModal();">סמן כהושלם</button>
        `;
    }

    modalFooter.innerHTML = actions;
    modal.classList.add('active');
}

// Close order modal
function closeOrderModal() {
    const modal = document.getElementById('order-modal');
    modal.classList.remove('active');
    window.history.replaceState({}, '', 'orders.html');
}

// Confirm order
async function confirmOrder(orderId) {
    if (!confirm('לאשר את ההזמנה?')) return;

    try {
        await OrdersAPI.updateStatus(orderId, 'confirmed');
        loadOrders();
        alert('ההזמנה אושרה! הלקוח יקבל עדכון.');
    } catch (error) {
        console.error('Error confirming order:', error);
        alert('שגיאה באישור ההזמנה');
    }
}

// Complete order
async function completeOrder(orderId) {
    if (!confirm('לסמן את ההזמנה כהושלמה?')) return;

    try {
        await OrdersAPI.updateStatus(orderId, 'completed');
        loadOrders();
        alert('ההזמנה הושלמה!');
    } catch (error) {
        console.error('Error completing order:', error);
        alert('שגיאה בעדכון ההזמנה');
    }
}

// Cancel order
async function cancelOrder(orderId) {
    if (!confirm('לבטל את ההזמנה?')) return;

    try {
        await OrdersAPI.updateStatus(orderId, 'cancelled');
        loadOrders();
        alert('ההזמנה בוטלה.');
    } catch (error) {
        console.error('Error cancelling order:', error);
        alert('שגיאה בביטול ההזמנה');
    }
}

// Update pending badge
function updatePendingBadge(count) {
    const badge = document.getElementById('pending-count');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline' : 'none';
    }
}

// Get status text
function getStatusText(status) {
    const statusTexts = {
        'pending': 'ממתין',
        'confirmed': 'אושר',
        'completed': 'הושלם',
        'cancelled': 'בוטל'
    };
    return statusTexts[status] || status;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initOrders);
