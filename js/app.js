// App Configuration & Utilities
const APP_CONFIG = {
    name: 'Glammora',
    version: '1.0.0',
    referralBase: 'https://glammora.com/?ref='
};

// Toast Notification System
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Initialize Hero Slider
function initSlider() {
    const slides = document.querySelectorAll('.slide');
    const dotsContainer = document.querySelector('.slider-dots');
    let currentSlide = 0;
    
    // Create dots
    slides.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = `dot ${index === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });
    
    function goToSlide(index) {
        slides.forEach(slide => slide.style.transform = `translateX(-${index * 100}%)`);
        document.querySelectorAll('.dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
        currentSlide = index;
    }
    
    // Auto slide
    setInterval(() => {
        currentSlide = (currentSlide + 1) % slides.length;
        goToSlide(currentSlide);
    }, 4000);
}

// Search Functionality
function initSearch() {
    const searchBtn = document.getElementById('searchBtn');
    const bottomSearchBtn = document.getElementById('bottomSearchBtn');
    const searchOverlay = document.getElementById('searchOverlay');
    const closeSearch = document.getElementById('closeSearch');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    
    function openSearch() {
        searchOverlay.classList.add('active');
        searchInput.focus();
    }
    
    function closeSearchOverlay() {
        searchOverlay.classList.remove('active');
        searchResults.innerHTML = '';
        searchInput.value = '';
    }
    
    searchBtn?.addEventListener('click', openSearch);
    bottomSearchBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        openSearch();
    });
    closeSearch?.addEventListener('click', closeSearchOverlay);
    
    // Live search
    let searchTimeout;
    searchInput?.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = e.target.value.toLowerCase();
            if (query.length < 2) {
                searchResults.innerHTML = '';
                return;
            }
            performSearch(query);
        }, 300);
    });
}

async function performSearch(query) {
    const searchResults = document.getElementById('searchResults');
    
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .ilike('name', `%${query}%`)
            .limit(10);
            
        if (data) {
            searchResults.innerHTML = data.map(product => `
                <div class="product-card" onclick="window.location.href='product.html?id=${product.id}'">
                    <img src="${product.images[0]}" alt="${product.name}" class="product-image">
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <div class="product-price">
                            <span class="price-current">₹${product.discounted_price}</span>
                            <span class="price-original">₹${product.original_price}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Search error:', error);
    }
}

// Load Categories
async function loadCategories() {
    const categories = [
        { name: 'Ethnic', icon: '👘', id: 'ethnic' },
        { name: 'Western', icon: '👗', id: 'western' },
        { name: 'Dresses', icon: '👚', id: 'dresses' },
        { name: 'Activewear', icon: '🏃‍♀️', id: 'activewear' },
        { name: 'Footwear', icon: '👠', id: 'footwear' },
        { name: 'Accessories', icon: '👜', id: 'accessories' },
        { name: 'Jewelry', icon: '💎', id: 'jewelry' },
        { name: 'Premium', icon: '✨', id: 'premium' }
    ];
    
    const grid = document.getElementById('categoriesGrid');
    if (grid) {
        grid.innerHTML = categories.map(cat => `
            <div class="category-card" onclick="window.location.href='product.html?category=${cat.id}'">
                <div class="category-icon">${cat.icon}</div>
                <div class="category-name">${cat.name}</div>
            </div>
        `).join('');
    }
}

// Utility: Get current user
function getCurrentUser() {
    const userStr = localStorage.getItem('glammora_user');
    return userStr ? JSON.parse(userStr) : null;
}

// Utility: Check authentication
function requireAuth() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Update cart count display
async function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('glammora_cart') || '[]');
    const badges = document.querySelectorAll('.cart-count');
    badges.forEach(badge => {
        badge.textContent = cart.length;
    });
}

// Update wishlist count display
async function updateWishlistCount() {
    const user = getCurrentUser();
    if (!user) return;
    
    try {
        const { count, error } = await supabase
            .from('wishlist')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id);
            
        if (!error) {
            const badges = document.querySelectorAll('.wishlist-count');
            badges.forEach(badge => {
                badge.textContent = count || 0;
            });
        }
    } catch (error) {
        console.error('Error updating wishlist count:', error);
    }
}
