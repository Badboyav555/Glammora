// Products Management
class Products {
    static async getAll(filters = {}) {
        let query = supabase.from('products').select('*');
        
        if (filters.category) {
            query = query.eq('category', filters.category);
        }
        
        if (filters.minPrice) {
            query = query.gte('discounted_price', filters.minPrice);
        }
        
        if (filters.maxPrice) {
            query = query.lte('discounted_price', filters.maxPrice);
        }
        
        if (filters.search) {
            query = query.ilike('name', `%${filters.search}%`);
        }
        
        if (filters.sortBy) {
            query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });
        }
        
        if (filters.limit) {
            query = query.limit(filters.limit);
        }
        
        const { data, error } = await query;
        return { data, error };
    }
    
    static async getById(id) {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();
        return { data, error };
    }
    
    static async getTrending() {
        return await this.getAll({ sortBy: 'popularity', sortOrder: 'desc', limit: 8 });
    }
    
    static async getNewArrivals() {
        return await this.getAll({ sortBy: 'created_at', sortOrder: 'desc', limit: 8 });
    }
    
    static async getByCategory(category) {
        return await this.getAll({ category, limit: 20 });
    }
}

// Load products on homepage
async function loadTrendingProducts() {
    const container = document.getElementById('trendingProducts');
    if (!container) return;
    
    const { data: products } = await Products.getTrending();
    if (products) {
        renderProductCards(container, products);
    }
}

async function loadNewArrivals() {
    const container = document.getElementById('newArrivals');
    if (!container) return;
    
    const { data: products } = await Products.getNewArrivals();
    if (products) {
        renderProductCards(container, products);
    }
}

async function loadFeaturedCollections() {
    const container = document.getElementById('featuredCollections');
    if (!container) return;
    
    // Sample collections
    const collections = [
        { name: 'Wedding Edit', image: 'https://images.unsplash.com/photo-1610030181087-2e3915f28ff8?w=400', category: 'ethnic' },
        { name: 'Party Wear', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400', category: 'dresses' },
        { name: 'Work Wear', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400', category: 'western' },
    ];
    
    container.innerHTML = collections.map(col => `
        <div class="collection-card" onclick="window.location.href='product.html?category=${col.category}'" 
             style="min-width: 200px; border-radius: 16px; overflow: hidden; cursor: pointer; position: relative;">
            <img src="${col.image}" style="width: 100%; height: 250px; object-fit: cover;">
            <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 20px; background: linear-gradient(transparent, rgba(0,0,0,0.8));">
                <h3 style="font-weight: 700;">${col.name}</h3>
            </div>
        </div>
    `).join('');
}

function renderProductCards(container, products) {
    container.innerHTML = products.map(product => `
        <div class="product-card" onclick="window.location.href='product.html?id=${product.id}'">
            <div style="position: relative;">
                <img src="${product.images[0]}" alt="${product.name}" class="product-image" loading="lazy">
                <div class="product-wishlist" onclick="event.stopPropagation(); toggleWishlistItem(${product.id}, this)">
                    <i class="far fa-heart"></i>
                </div>
                ${product.discounted_price < product.original_price ? 
                    `<span class="discount-badge" style="position: absolute; top: 10px; left: 10px;">
                        ${Math.round((1 - product.discounted_price/product.original_price) * 100)}% OFF
                    </span>` : ''
                }
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">
                    <span class="price-current">₹${product.discounted_price.toLocaleString()}</span>
                    ${product.discounted_price < product.original_price ? 
                        `<span class="price-original">₹${product.original_price.toLocaleString()}</span>` : ''
                    }
                </div>
            </div>
        </div>
    `).join('');
}

async function toggleWishlistItem(productId, element) {
    const user = getCurrentUser();
    if (!user) {
        showToast('Please login to add to wishlist', 'error');
        return;
    }
    
    const { data: existing } = await supabase
        .from('wishlist')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .single();
        
    const icon = element.querySelector('i');
    
    if (existing) {
        await supabase.from('wishlist').delete().eq('id', existing.id);
        icon.className = 'far fa-heart';
        element.classList.remove('active');
        showToast('Removed from wishlist');
    } else {
        await supabase.from('wishlist').insert({
            user_id: user.id,
            product_id: productId,
            created_at: new Date().toISOString()
        });
        icon.className = 'fas fa-heart';
        element.classList.add('active');
        showToast('Added to wishlist ❤️');
    }
}
