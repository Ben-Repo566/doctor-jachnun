/* =====================================================
   Doctor Jachnun - Menu Display
   ===================================================== */

// Render category filter buttons
function renderCategoryFilter() {
    const filterContainer = document.getElementById('category-filter');
    if (!filterContainer) return;

    filterContainer.innerHTML = CATEGORIES.map(cat => `
        <button class="category-btn ${cat.id === 'all' ? 'active' : ''}" data-category="${cat.id}">
            <span class="category-icon">${cat.icon}</span>
            <span class="category-name">${cat.name}</span>
        </button>
    `).join('');
}

// Render menu items
function renderMenuItems(category = 'all') {
    const menuGrid = document.getElementById('menu-grid');
    if (!menuGrid) return;

    const items = getItemsByCategory(category);

    if (items.length === 0) {
        menuGrid.innerHTML = `
            <div class="empty-category">
                <p>אין פריטים בקטגוריה זו</p>
            </div>
        `;
        return;
    }

    menuGrid.innerHTML = items.map(item => `
        <div class="menu-item ${item.popular ? 'popular' : ''}" data-category="${item.category}">
            <div class="menu-item-image-container ${item.image2 ? 'dual-image' : ''}">
                ${item.image2 ? `
                    <div class="dual-image-wrapper">
                        <img src="${item.image}" alt="${item.name}" class="menu-item-image"
                             onerror="this.src='images/placeholder.jpg'">
                        <img src="${item.image2}" alt="${item.name}" class="menu-item-image"
                             onerror="this.src='images/placeholder.jpg'">
                    </div>
                ` : `
                    <img src="${item.image}" alt="${item.name}" class="menu-item-image"
                         onerror="this.src='images/placeholder.jpg'">
                `}
                ${item.badge ? `<span class="item-badge ${getBadgeClass(item.badge)}">${item.badge}</span>` : ''}
                ${item.popular ? '<span class="popular-badge">פופולרי</span>' : ''}
            </div>
            <div class="menu-item-content">
                <h3>${item.name}</h3>
                <p class="menu-item-description">${item.description}</p>
                <div class="menu-item-footer">
                    <div class="price-container">
                        <span class="menu-item-price">₪${item.price}</span>
                        ${item.id === 12 ? '<span class="old-price">₪230</span>' : ''}
                    </div>
                    <button class="add-to-cart-btn" onclick="addToCart(${item.id})">
                        <span class="btn-icon">+</span>
                        <span class="btn-text">הוסף לסל</span>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Get badge class based on badge text
function getBadgeClass(badge) {
    if (badge.includes('מבצע')) return 'badge-deal';
    if (badge.includes('המלך') || badge.includes('המלכה')) return 'badge-royal';
    if (badge.includes('משתלם')) return 'badge-value';
    if (badge.includes('10+')) return 'badge-promo';
    return 'badge-default';
}

// Render popular items on homepage
function renderPopularItems() {
    const popularContainer = document.getElementById('popular-items');
    if (!popularContainer) return;

    const items = getPopularItems().slice(0, 6); // Show max 6 popular items

    popularContainer.innerHTML = items.map(item => `
        <div class="menu-item">
            <div class="menu-item-image-container">
                <img src="${item.image}" alt="${item.name}" class="menu-item-image"
                     onerror="this.src='images/placeholder.jpg'">
                ${item.badge ? `<span class="item-badge ${getBadgeClass(item.badge)}">${item.badge}</span>` : ''}
            </div>
            <div class="menu-item-content">
                <h3>${item.name}</h3>
                <p class="menu-item-description">${item.description}</p>
                <div class="menu-item-footer">
                    <span class="menu-item-price">₪${item.price}</span>
                    <button class="add-to-cart-btn" onclick="addToCart(${item.id})">
                        <span class="btn-icon">+</span>
                        <span class="btn-text">הוסף</span>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Initialize category filter click events
function initCategoryFilter() {
    const filterContainer = document.getElementById('category-filter');
    if (!filterContainer) return;

    filterContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.category-btn');
        if (!btn) return;

        // Update active state
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Filter menu
        const category = btn.dataset.category;
        renderMenuItems(category);

        // Smooth scroll to menu grid
        document.getElementById('menu-grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// Add animation when item is added to cart
function animateAddToCart(button) {
    button.classList.add('added');
    button.innerHTML = '<span class="btn-icon">✓</span><span class="btn-text">נוסף!</span>';

    setTimeout(() => {
        button.classList.remove('added');
        button.innerHTML = '<span class="btn-icon">+</span><span class="btn-text">הוסף לסל</span>';
    }, 1500);
}

// Override addToCart to add animation
const originalAddToCart = typeof addToCart !== 'undefined' ? addToCart : null;

if (originalAddToCart) {
    window.addToCart = function(itemId) {
        originalAddToCart(itemId);

        // Find the button that was clicked
        const buttons = document.querySelectorAll('.add-to-cart-btn');
        buttons.forEach(btn => {
            if (btn.onclick && btn.onclick.toString().includes(itemId)) {
                animateAddToCart(btn);
            }
        });
    };
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check which page we're on
    if (document.getElementById('menu-grid')) {
        renderCategoryFilter();
        renderMenuItems();
        initCategoryFilter();
    }

    if (document.getElementById('popular-items')) {
        renderPopularItems();
    }

    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
});
