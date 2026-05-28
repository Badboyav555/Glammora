// Cart Management System
class Cart {
    static getCart() {
        return JSON.parse(localStorage.getItem('glammora_cart') || '[]');
    }
    
    static saveCart(cart) {
        localStorage.setItem('glammora_cart', JSON.stringify(cart));
        updateCartCount();
    }
    
    static addItem(product, quantity = 1, size = 'M') {
        const cart = this.getCart();
        const existingIndex = cart.findIndex(item => 
            item.id === product.id && item.size === size
        );
        
        if (existingIndex > -1) {
            cart[existingIndex].quantity += quantity;
        } else {
            cart.push({
                ...product,
                quantity,
                size,
                addedAt: new Date().toISOString()
            });
        }
        
        this.saveCart(cart);
        showToast('Added to cart! 🛒');
    }
    
    static removeItem(productId, size) {
        let cart = this.getCart();
        cart = cart.filter(item => !(item.id === productId && item.size === size));
        this.saveCart(cart);
        showToast('Removed from cart');
    }
    
    static updateQuantity(productId, size, quantity) {
        const cart = this.getCart();
        const item = cart.find(item => item.id === productId && item.size === size);
        
        if (item) {
            item.quantity = Math.max(1, quantity);
            this.saveCart(cart);
        }
    }
    
    static getTotal() {
        const cart = this.getCart();
        return cart.reduce((total, item) => {
            return total + (item.discounted_price * item.quantity);
        }, 0);
    }
    
    static getSavings() {
        const cart = this.getCart();
        return cart.reduce((savings, item) => {
            return savings + ((item.original_price - item.discounted_price) * item.quantity);
        }, 0);
    }
    
    static getItemCount() {
        const cart = this.getCart();
        return cart.reduce((count, item) => count + item.quantity, 0);
    }
    
    static clearCart() {
        localStorage.removeItem('glammora_cart');
        updateCartCount();
    }
}

// Initialize cart on checkout page
if (window.location.pathname.includes('checkout.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        renderCartItems();
        updateCartSummary();
        initCheckout();
    });
}

function renderCartItems() {
    const cartItems = document.getElementById('cartItems');
    const cart = Cart.getCart();
    
    if (!cartItems) return;
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-bag" style="font-size: 4rem; opacity: 0.3;"></i>
                <p>Your cart is empty</p>
                <a href="index.html" class="btn-primary">Start Shopping</a>
            </div>
        `;
        return;
    }
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item glass-card">
            <img src="${item.images[0]}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <h3>${item.name}</h3>
                <p>Size: ${item.size}</p>
                <div class="cart-item-price">
                    <span class="price-current">₹${item.discounted_price}</span>
                    <span class="price-original">₹${item.original_price}</span>
                </div>
                <div class="quantity-controls">
                    <button onclick="updateCartQuantity(${item.id}, '${item.size}', ${item.quantity - 1})">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateCartQuantity(${item.id}, '${item.size}', ${item.quantity + 1})">+</button>
                </div>
            </div>
            <button class="remove-btn" onclick="removeFromCart(${item.id}, '${item.size}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function updateCartSummary() {
    const subtotal = Cart.getTotal();
    const savings = Cart.getSavings();
    const delivery = subtotal > 999 ? 0 : 99;
    const total = subtotal + delivery;
    
    const summaryEl = document.getElementById('cartSummary');
    if (summaryEl) {
        summaryEl.innerHTML = `
            <div class="summary-row">
                <span>Subtotal</span>
                <span>₹${subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-row savings">
                <span>You Save</span>
                <span>-₹${savings.toFixed(2)}</span>
            </div>
            <div class="summary-row">
                <span>Delivery</span>
                <span>${delivery === 0 ? 'FREE' : '₹' + delivery}</span>
            </div>
            <div class="summary-row total">
                <span>Total</span>
                <span>₹${total.toFixed(2)}</span>
            </div>
        `;
    }
}

function updateCartQuantity(productId, size, quantity) {
    if (quantity < 1) {
        Cart.removeItem(productId, size);
    } else {
        Cart.updateQuantity(productId, size, quantity);
    }
    renderCartItems();
    updateCartSummary();
}

function removeFromCart(productId, size) {
    Cart.removeItem(productId, size);
    renderCartItems();
    updateCartSummary();
}

async function initCheckout() {
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    if (!placeOrderBtn) return;
    
    placeOrderBtn.addEventListener('click', async () => {
        if (!requireAuth()) return;
        
        const cart = Cart.getCart();
        if (cart.length === 0) {
            showToast('Your cart is empty', 'error');
            return;
        }
        
        const addressForm = document.getElementById('addressForm');
        const formData = new FormData(addressForm);
        const address = Object.fromEntries(formData.entries());
        
        // Validate address
        if (!address.fullName || !address.phone || !address.address || !address.city || !address.pincode) {
            showToast('Please fill all required fields', 'error');
            return;
        }
        
        try {
            const user = getCurrentUser();
            const orderData = {
                user_id: user.id,
                user_phone: user.user_metadata.phone,
                address: address,
                items: cart,
                total_amount: Cart.getTotal(),
                referral_code: localStorage.getItem('glammora_ref') || null,
                status: 'Pending',
                created_at: new Date().toISOString()
            };
            
            const { data, error } = await supabase
                .from('orders')
                .insert(orderData)
                .select()
                .single();
                
            if (error) throw error;
            
            Cart.clearCart();
            showToast('Order placed successfully! 🎉');
            
            setTimeout(() => {
                window.location.href = `profile.html?order=${data.id}`;
            }, 1500);
            
        } catch (error) {
            showToast('Failed to place order. Please try again.', 'error');
            console.error('Order error:', error);
        }
    });
}
