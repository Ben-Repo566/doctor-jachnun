/* =====================================================
   Doctor Jachnun - API Client
   Connects frontend to Node.js backend
   ===================================================== */

// API URL - update this after deploying backend to Railway
const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : 'https://your-backend.railway.app/api'; // TODO: Update with actual Railway backend URL

// Store auth token
let authToken = localStorage.getItem('authToken');

// API helper function
async function apiRequest(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    // Add auth token if available
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// =====================================================
// Auth API
// =====================================================

const AuthAPI = {
    async login(email, password) {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        // Save token
        authToken = data.token;
        localStorage.setItem('authToken', authToken);

        return data;
    },

    logout() {
        authToken = null;
        localStorage.removeItem('authToken');
    },

    async getCurrentAdmin() {
        return await apiRequest('/auth/me');
    },

    async changePassword(currentPassword, newPassword) {
        return await apiRequest('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword })
        });
    },

    isLoggedIn() {
        return !!authToken;
    }
};

// =====================================================
// Orders API
// =====================================================

const OrdersAPI = {
    // Create new order (customer)
    async create(orderData) {
        return await apiRequest('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    },

    // Get order status by order number (customer)
    async getStatus(orderNumber) {
        return await apiRequest(`/orders/status/${orderNumber}`);
    },

    // Get all orders (admin)
    async getAll(filters = {}) {
        const params = new URLSearchParams(filters);
        return await apiRequest(`/orders?${params}`);
    },

    // Get single order (admin)
    async getById(id) {
        return await apiRequest(`/orders/${id}`);
    },

    // Update order status (admin)
    async updateStatus(id, status) {
        return await apiRequest(`/orders/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    },

    // Get dashboard stats (admin)
    async getStats() {
        return await apiRequest('/orders/stats/summary');
    }
};

// =====================================================
// Customers API
// =====================================================

const CustomersAPI = {
    // Get all customers (admin)
    async getAll(filters = {}) {
        const params = new URLSearchParams(filters);
        return await apiRequest(`/customers?${params}`);
    },

    // Get customer by ID with orders (admin)
    async getById(id) {
        return await apiRequest(`/customers/${id}`);
    },

    // Check if customer exists by phone (for checkout autofill)
    async checkByPhone(phone) {
        return await apiRequest(`/customers/phone/${phone}`);
    }
};

// =====================================================
// Health Check
// =====================================================

async function checkAPIHealth() {
    try {
        const data = await apiRequest('/health');
        return data.status === 'ok';
    } catch (error) {
        return false;
    }
}
