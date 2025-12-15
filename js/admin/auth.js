/* =====================================================
   Doctor Jachnun - Admin Authentication
   Uses Node.js/MySQL Backend API
   ===================================================== */

// Check authentication state
async function checkAuth() {
    const isLoginPage = window.location.pathname.includes('login.html');

    if (!AuthAPI.isLoggedIn()) {
        // Not logged in
        if (!isLoginPage) {
            window.location.href = 'login.html';
        }
        return;
    }

    // Token exists - verify it's still valid
    try {
        const admin = await AuthAPI.getCurrentAdmin();

        if (isLoginPage) {
            window.location.href = 'dashboard.html';
        } else {
            // Update admin email display
            const adminEmail = document.getElementById('admin-email');
            if (adminEmail) adminEmail.textContent = admin.email;
        }
    } catch (error) {
        // Token invalid
        AuthAPI.logout();
        if (!isLoginPage) {
            window.location.href = 'login.html';
        }
    }
}

// Handle login
function initLogin() {
    const form = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('login-btn');

        // Clear previous errors
        errorMessage.style.display = 'none';
        loginBtn.disabled = true;
        loginBtn.textContent = 'מתחבר...';

        try {
            await AuthAPI.login(email, password);
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error('Login error:', error);
            errorMessage.textContent = error.message || 'שגיאה בהתחברות';
            errorMessage.style.display = 'block';
            loginBtn.disabled = false;
            loginBtn.textContent = 'התחבר';
        }
    });
}

// Handle logout
function initLogout() {
    const logoutBtn = document.getElementById('logout-btn');

    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', () => {
        AuthAPI.logout();
        window.location.href = 'login.html';
    });
}

// Toggle mobile sidebar
function initSidebar() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const main = document.querySelector('.admin-main');

    if (!menuToggle || !sidebar) return;

    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        sidebar.classList.toggle('collapsed');
        if (main) main.classList.toggle('expanded');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
                sidebar.classList.add('collapsed');
                if (main) main.classList.add('expanded');
            }
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initLogin();
    initLogout();
    initSidebar();
});
