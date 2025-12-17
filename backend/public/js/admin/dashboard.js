/* =====================================================
   Doctor Jachnun - Admin Dashboard
   Uses Node.js/MySQL Backend API
   ===================================================== */

// Initialize dashboard
async function initDashboard() {
    await loadStats();
    await loadRecentOrders();

    // Refresh stats every 30 seconds
    setInterval(loadStats, 30000);
}

// Load dashboard stats
async function loadStats() {
    try {
        const stats = await OrdersAPI.getStats();

        document.getElementById('stat-pending').textContent = stats.pendingCount || 0;
        document.getElementById('stat-today').textContent = stats.todayCount || 0;
        document.getElementById('stat-revenue').textContent = `₪${stats.todayRevenue || 0}`;
        document.getElementById('stat-customers').textContent = stats.customerCount || 0;

        // Update pending badge
        updatePendingBadge(stats.pendingCount || 0);

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load recent orders
async function loadRecentOrders() {
    const recentOrdersTable = document.getElementById('recent-orders');
    if (!recentOrdersTable) return;

    try {
        const orders = await OrdersAPI.getAll({ limit: 5 });

        if (orders.length === 0) {
            recentOrdersTable.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px; color: var(--gray-500);">
                        אין הזמנות עדיין
                    </td>
                </tr>
            `;
            return;
        }

        recentOrdersTable.innerHTML = orders.map(order => {
            const orderId = order.order_number || `#${order.id}`;

            return `
                <tr>
                    <td>${orderId}</td>
                    <td>${order.customer_name || '-'}</td>
                    <td>₪${order.total || 0}</td>
                    <td><span class="status-badge ${order.status}">${getStatusText(order.status)}</span></td>
                    <td>
                        <button class="action-btn view" onclick="viewOrder(${order.id})" title="צפה">👁️</button>
                        ${order.status === 'pending' ? `
                            <button class="action-btn confirm" onclick="confirmOrder(${order.id})" title="אשר">✓</button>
                        ` : ''}
                    </td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading recent orders:', error);
    }
}

// Update pending badge in sidebar
function updatePendingBadge(count) {
    const badge = document.getElementById('pending-count');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline' : 'none';
    }
}

// Get status text in Hebrew
function getStatusText(status) {
    const statusTexts = {
        'pending': 'ממתין',
        'confirmed': 'אושר',
        'completed': 'הושלם',
        'cancelled': 'בוטל'
    };
    return statusTexts[status] || status;
}

// View order details
function viewOrder(orderId) {
    window.location.href = `orders.html?view=${orderId}`;
}

// Confirm order
async function confirmOrder(orderId) {
    if (!confirm('לאשר את ההזמנה?')) return;

    try {
        await OrdersAPI.updateStatus(orderId, 'confirmed');

        // Reload data
        loadStats();
        loadRecentOrders();

        alert('ההזמנה אושרה!');
    } catch (error) {
        console.error('Error confirming order:', error);
        alert('שגיאה באישור ההזמנה');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initDashboard);
