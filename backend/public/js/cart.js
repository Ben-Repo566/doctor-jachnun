/* =====================================================
   Doctor Jachnun - Cart Functionality
   ===================================================== */

// Cart stored in localStorage
const CART_KEY = 'doctorJachnunCart';

// Initialize cart
function getCart() {
    const cart = localStorage.getItem(CART_KEY);
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartUI();
}

// Add item to cart
function addToCart(itemId, quantity = 1) {
    const cart = getCart();
    const existingItem = cart.find(item => item.id === itemId);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ id: itemId, quantity: quantity });
    }

    saveCart(cart);
    showAddedToCartFeedback(itemId);
}

// Remove item from cart
function removeFromCart(itemId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== itemId);
    saveCart(cart);
}

// Update item quantity
function updateQuantity(itemId, quantity) {
    const cart = getCart();
    const item = cart.find(item => item.id === itemId);

    if (item) {
        if (quantity <= 0) {
            removeFromCart(itemId);
        } else {
            item.quantity = quantity;
            saveCart(cart);
        }
    }
}

// Get cart total
function getCartTotal() {
    const cart = getCart();
    let total = 0;

    cart.forEach(cartItem => {
        const menuItem = getItemById(cartItem.id);
        if (menuItem) {
            total += menuItem.price * cartItem.quantity;
        }
    });

    return total;
}

// Get cart item count
function getCartItemCount() {
    const cart = getCart();
    return cart.reduce((total, item) => total + item.quantity, 0);
}

// Clear cart
function clearCart() {
    localStorage.removeItem(CART_KEY);
    updateCartUI();
}

// Update cart UI elements
function updateCartUI() {
    const count = getCartItemCount();
    const total = getCartTotal();

    // Update all cart count badges
    const cartCounts = document.querySelectorAll('#cart-count, #floating-cart-count');
    cartCounts.forEach(el => {
        if (el) el.textContent = count;
    });

    // Update floating cart total
    const floatingTotal = document.getElementById('floating-cart-total');
    if (floatingTotal) {
        floatingTotal.textContent = `₪${total}`;
    }

    // Show/hide floating cart
    const floatingCart = document.getElementById('floating-cart');
    if (floatingCart) {
        floatingCart.classList.toggle('visible', count > 0);
    }

    // Update cart page if we're on it
    if (document.getElementById('cart-items')) {
        renderCartPage();
    }
}

// Render cart page
function renderCartPage() {
    const cart = getCart();
    const cartItemsContainer = document.getElementById('cart-items');
    const emptyCart = document.getElementById('empty-cart');
    const cartContent = document.getElementById('cart-content');

    if (cart.length === 0) {
        if (emptyCart) emptyCart.style.display = 'block';
        if (cartContent) cartContent.style.display = 'none';
        return;
    }

    if (emptyCart) emptyCart.style.display = 'none';
    if (cartContent) cartContent.style.display = 'grid';

    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = cart.map(cartItem => {
        const menuItem = getItemById(cartItem.id);
        if (!menuItem) return '';

        return `
            <div class="cart-item" data-id="${cartItem.id}">
                <img src="${menuItem.image}" alt="${menuItem.name}" class="cart-item-image"
                     onerror="this.src='images/placeholder.jpg'">
                <div class="cart-item-info">
                    <div class="cart-item-name">${menuItem.name}</div>
                    <div class="cart-item-price">₪${menuItem.price}</div>
                    <div class="cart-item-controls">
                        <button class="quantity-btn" onclick="updateQuantity(${cartItem.id}, ${cartItem.quantity - 1})">-</button>
                        <span class="quantity-display">${cartItem.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${cartItem.id}, ${cartItem.quantity + 1})">+</button>
                        <button class="remove-item-btn" onclick="removeFromCart(${cartItem.id})">🗑️</button>
                    </div>
                </div>
                <div class="cart-item-total">₪${menuItem.price * cartItem.quantity}</div>
            </div>
        `;
    }).join('');

    // Update totals
    const subtotal = getCartTotal();
    const subtotalEl = document.getElementById('subtotal');
    const totalEl = document.getElementById('total');

    if (subtotalEl) subtotalEl.textContent = `₪${subtotal}`;
    if (totalEl) totalEl.textContent = `₪${subtotal}`;
}

// Show feedback when item added
function showAddedToCartFeedback(itemId) {
    const btn = document.querySelector(`[data-item-id="${itemId}"]`);
    if (btn) {
        const originalText = btn.textContent;
        btn.textContent = 'נוסף! ✓';
        btn.style.background = '#10B981';

        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 1500);
    }
}

// Mobile menu toggle
function initMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
    initMobileMenu();
});
