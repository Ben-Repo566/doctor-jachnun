/* =====================================================
   Doctor Jachnun - Admin Customers Management
   Uses Node.js/MySQL Backend API
   ===================================================== */

let allCustomers = [];

// Initialize customers page
async function initCustomers() {
    await loadCustomers();
    initSearch();
    initCustomerModal();
}

// Load all customers
async function loadCustomers() {
    const customersList = document.getElementById('customers-list');
    const emptyState = document.getElementById('empty-state');

    try {
        const customers = await CustomersAPI.getAll();

        if (customers.length === 0) {
            customersList.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        allCustomers = customers;
        renderCustomers(customers);

    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

// Render customers table
function renderCustomers(customers) {
    const customersList = document.getElementById('customers-list');

    customersList.innerHTML = customers.map(customer => {
        const lastOrder = customer.last_order_at ? new Date(customer.last_order_at).toLocaleDateString('he-IL') : '-';

        return `
            <tr>
                <td>${customer.name || '-'}</td>
                <td>
                    <a href="tel:${customer.phone}">${customer.phone || '-'}</a>
                </td>
                <td>${customer.email || '-'}</td>
                <td>${customer.order_count || 0}</td>
                <td>₪${customer.total_spent || 0}</td>
                <td>${lastOrder}</td>
                <td>
                    <button class="action-btn view" onclick="openCustomerModal(${customer.id})" title="צפה">👁️</button>
                    <a href="https://wa.me/972${customer.phone?.replace(/^0/, '')}" target="_blank" class="action-btn" title="וואטסאפ">📱</a>
                </td>
            </tr>
        `;
    }).join('');
}

// Initialize search
function initSearch() {
    const searchInput = document.getElementById('search-input');
    const refreshBtn = document.getElementById('refresh-btn');

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();

        if (!query) {
            renderCustomers(allCustomers);
            return;
        }

        const filtered = allCustomers.filter(customer =>
            customer.name?.toLowerCase().includes(query) ||
            customer.phone?.includes(query) ||
            customer.email?.toLowerCase().includes(query)
        );

        renderCustomers(filtered);
    });

    refreshBtn.addEventListener('click', () => {
        searchInput.value = '';
        loadCustomers();
    });
}

// Initialize customer modal
function initCustomerModal() {
    const modal = document.getElementById('customer-modal');
    const modalClose = document.getElementById('modal-close');

    modalClose.addEventListener('click', closeCustomerModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeCustomerModal();
    });
}

// Open customer modal
async function openCustomerModal(customerId) {
    const modal = document.getElementById('customer-modal');
    const modalBody = document.getElementById('modal-body');

    try {
        const customer = await CustomersAPI.getById(customerId);

        modalBody.innerHTML = `
            <div class="order-detail-section">
                <h4>פרטי לקוח</h4>
                <div class="detail-row">
                    <span class="detail-label">שם:</span>
                    <span class="detail-value">${customer.name || '-'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">טלפון:</span>
                    <span class="detail-value">
                        <a href="tel:${customer.phone}">${customer.phone || '-'}</a>
                    </span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">אימייל:</span>
                    <span class="detail-value">${customer.email || '-'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">כתובת:</span>
                    <span class="detail-value">${customer.address || '-'}</span>
                </div>
            </div>

            <div class="order-detail-section">
                <h4>סטטיסטיקות</h4>
                <div class="detail-row">
                    <span class="detail-label">סה"כ הזמנות:</span>
                    <span class="detail-value">${customer.order_count || 0}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">סה"כ קניות:</span>
                    <span class="detail-value">₪${customer.total_spent || 0}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">תאריך הצטרפות:</span>
                    <span class="detail-value">${customer.created_at ? new Date(customer.created_at).toLocaleDateString('he-IL') : '-'}</span>
                </div>
            </div>

            <div class="order-detail-section">
                <h4>היסטוריית הזמנות</h4>
                <div class="order-history-list">
                    ${customer.orders?.length > 0 ? customer.orders.map(order => `
                        <div class="order-history-item">
                            <div>
                                <strong>${order.order_number || '#' + order.id}</strong>
                                <span class="order-history-date">${new Date(order.created_at).toLocaleDateString('he-IL')}</span>
                            </div>
                            <div>
                                <span>₪${order.total || 0}</span>
                                <span class="status-badge ${order.status}">${getStatusText(order.status)}</span>
                            </div>
                        </div>
                    `).join('') : '<p>אין הזמנות</p>'}
                </div>
            </div>

            <div style="margin-top: 20px;">
                <a href="https://wa.me/972${customer.phone?.replace(/^0/, '')}" target="_blank" class="btn btn-whatsapp btn-block">
                    שלח הודעה בוואטסאפ
                </a>
            </div>
        `;

        modal.classList.add('active');

    } catch (error) {
        console.error('Error loading customer:', error);
        modalBody.innerHTML = '<p>שגיאה בטעינת פרטי הלקוח</p>';
        modal.classList.add('active');
    }
}

// Close customer modal
function closeCustomerModal() {
    const modal = document.getElementById('customer-modal');
    modal.classList.remove('active');
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
document.addEventListener('DOMContentLoaded', initCustomers);
