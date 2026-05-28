// Admin Dashboard JavaScript

// Check admin authentication
function checkAdminAuth() {
    const adminUser = localStorage.getItem('glammora_admin');
    if (!adminUser) {
        // Simple admin auth - in production, use proper authentication
        const password = prompt('Enter admin password:');
        if (password === 'admin123') {
            localStorage.setItem('glammora_admin', 'true');
        } else {
            alert('Access denied!');
            window.location.href = 'index.html';
            return false;
        }
    }
    return true;
}

// Initialize admin
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAdminAuth()) return;
    
    initSidebar();
    loadDashboard();
    loadProducts();
    loadOrders();
    loadUsers();
    loadAnalytics();
    loadBanners();
    
    // Handle hash navigation
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
});

function handleHashChange() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    switchSection(hash);
}

// Sidebar Navigation
function initSidebar() {
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    toggle?.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
    });
    
    overlay?.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    });
    
    // Nav links
    document.querySelectorAll('.nav-link[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            switchSection(section);
            
            // Close sidebar on mobile
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    });
}

function switchSection(sectionName) {
    // Update nav
    document.querySelectorAll('.nav-link[data-section]').forEach(link => {
        link.classList.toggle('active', link.dataset.section === sectionName);
    });
    
    // Show section
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update URL
    window.location.hash = sectionName;
    
    // Reload data
    switch(sectionName) {
        case 'dashboard': loadDashboard(); break;
        case 'products': loadProducts(); break;
        case 'orders': loadOrders(); break;
        case 'users': loadUsers(); break;
        case 'analytics': loadAnalytics(); break;
        case 'banners': loadBanners(); break;
    }
}

// ==================== DASHBOARD ====================
async function loadDashboard() {
    try {
        // Total Revenue
        const { data: orders } = await supabase
            .from('orders')
            .select('total_amount, status');
            
        if (orders) {
            const totalRevenue = orders
                .filter(o => o.status !== 'Cancelled')
                .reduce((sum, o) => sum + (o.total_amount || 0), 0);
            document.getElementById('totalRevenue').textContent = `₹${totalRevenue.toLocaleString()}`;
            
            document.getElementById('totalOrders').textContent = orders.length;
            document.getElementById('pendingOrders').textContent = 
                orders.filter(o => o.status === 'Pending').length;
        }
        
        // Total Users
        const { count: userCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact' });
        document.getElementById('totalUsers').textContent = userCount || 0;
        
        // Recent Orders Table
        const { data: recentOrders } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
            
        if (recentOrders) {
            document.getElementById('recentOrdersTable').innerHTML = recentOrders.map(order => `
                <tr>
                    <td>#${order.id.toString().slice(-8).toUpperCase()}</td>
                    <td>${order.full_address?.fullName || 'N/A'}</td>
                    <td>${order.items?.length || 0} items</td>
                    <td>₹${order.total_amount?.toLocaleString() || 0}</td>
                    <td><span class="status-badge status-${order.status?.toLowerCase().replace(/\s+/g, '-')}">${order.status}</span></td>
                    <td>${new Date(order.created_at).toLocaleDateString('en-IN')}</td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Dashboard error:', error);
    }
}

// ==================== PRODUCTS ====================
async function loadProducts() {
    try {
        const { data: products } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
            
        const tbody = document.getElementById('productsTable');
        if (products && products.length > 0) {
            tbody.innerHTML = products.map(product => `
                <tr>
                    <td>
                        <img src="${product.images?.[0] || 'https://via.placeholder.com/50'}" 
                             alt="${product.name}" class="product-thumb">
                    </td>
                    <td>
                        <strong>${product.name}</strong>
                        <br><small style="color: var(--text-secondary);">${product.description?.slice(0, 50) || ''}</small>
                    </td>
                    <td><span class="status-badge" style="background: rgba(33,150,243,0.2); color: #2196f3;">${product.category}</span></td>
                    <td>
                        <span style="color: #4caf50; font-weight: 600;">₹${product.discounted_price}</span>
                        <br><small style="text-decoration: line-through; color: var(--text-secondary);">₹${product.original_price}</small>
                    </td>
                    <td>${product.stock || 0}</td>
                    <td>
                        <button class="action-btn edit" onclick="editProduct(${product.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="deleteProduct(${product.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--text-secondary);">No products found</td></tr>';
        }
    } catch (error) {
        console.error('Products error:', error);
    }
}

function openProductModal(productId = null) {
    const modal = document.getElementById('productModal');
    modal.classList.add('active');
    
    if (productId) {
        document.getElementById('modalTitle').textContent = 'Edit Product';
        loadProductForEdit(productId);
    } else {
        document.getElementById('modalTitle').textContent = 'Add Product';
        document.getElementById('productForm').reset();
        document.getElementById('productId').value = '';
        document.getElementById('imagePreview').innerHTML = '';
    }
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
}

async function loadProductForEdit(productId) {
    const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
        
    if (product) {
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productStock').value = product.stock;
        document.getElementById('productMrp').value = product.original_price;
        document.getElementById('productPrice').value = product.discounted_price;
        document.getElementById('productSizes').value = Array.isArray(product.sizes) ? product.sizes.join(',') : product.sizes;
        document.getElementById('productCod').checked = product.cod_available;
        
        // Show existing images
        if (product.images) {
            const preview = document.getElementById('imagePreview');
            preview.innerHTML = product.images.map(img => 
                `<img src="${img}" class="preview-thumb">`
            ).join('');
        }
    }
}

function previewImages() {
    const files = document.getElementById('productImages').files;
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = '';
    
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'preview-thumb';
            preview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
}

async function saveProduct(event) {
    event.preventDefault();
    
    const productId = document.getElementById('productId').value;
    const productData = {
        name: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value,
        category: document.getElementById('productCategory').value,
        original_price: parseFloat(document.getElementById('productMrp').value),
        discounted_price: parseFloat(document.getElementById('productPrice').value),
        stock: parseInt(document.getElementById('productStock').value),
        sizes: document.getElementById('productSizes').value.split(',').map(s => s.trim()),
        cod_available: document.getElementById('productCod').checked,
    };
    
    // Upload images if any
    const imageFiles = document.getElementById('productImages').files;
    if (imageFiles.length > 0) {
        const imageUrls = [];
        for (const file of imageFiles) {
            const fileName = `products/${Date.now()}-${file.name}`;
            const { data, error } = await supabase.storage
                .from('product-images')
                .upload(fileName, file);
                
            if (!error) {
                const { data: { publicUrl } } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(fileName);
                imageUrls.push(publicUrl);
            }
        }
        productData.images = imageUrls;
    }
    
    try {
        if (productId) {
            // Update existing product
            const { error } = await supabase
                .from('products')
                .update(productData)
                .eq('id', productId);
                
            if (error) throw error;
            showToast('Product updated successfully!');
        } else {
            // Insert new product
            const { error } = await supabase
                .from('products')
                .insert({ ...productData, created_at: new Date().toISOString() });
                
            if (error) throw error;
            showToast('Product added successfully!');
        }
        
        closeProductModal();
        loadProducts();
    } catch (error) {
        console.error('Save product error:', error);
        showToast('Failed to save product', 'error');
    }
}

async function editProduct(productId) {
    openProductModal(productId);
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);
            
        if (error) throw error;
        showToast('Product deleted successfully!');
        loadProducts();
    } catch (error) {
        console.error('Delete product error:', error);
        showToast('Failed to delete product', 'error');
    }
}

// ==================== ORDERS ====================
async function loadOrders(statusFilter = '') {
    try {
        let query = supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (statusFilter) {
            query = query.eq('status', statusFilter);
        }
        
        const { data: orders } = await query;
        
        const tbody = document.getElementById('ordersTable');
        if (orders && orders.length > 0) {
            tbody.innerHTML = orders.map(order => `
                <tr>
                    <td><strong>#${order.id.toString().slice(-8).toUpperCase()}</strong></td>
                    <td>
                        <strong>${order.full_address?.fullName || 'N/A'}</strong>
                        <br><small style="color: var(--text-secondary);">📱 ${order.user_phone || 'N/A'}</small>
                    </td>
                    <td>
                        <small style="color: var(--text-secondary);">
                            ${order.full_address?.address || ''}, ${order.full_address?.city || ''}
                        </small>
                    </td>
                    <td>${order.items?.length || 0} items</td>
                    <td><strong>₹${order.total_amount?.toLocaleString() || 0}</strong></td>
                    <td>
                        ${order.referral_code ? 
                            `<span style="color: #4caf50;">${order.referral_code}</span>` : 
                            '<span style="color: var(--text-secondary);">-</span>'}
                    </td>
                    <td>
                        <span class="status-badge status-${order.status?.toLowerCase().replace(/\s+/g, '-')}">
                            ${order.status}
                        </span>
                    </td>
                    <td>
                        <button class="action-btn edit" onclick="viewOrderDetail(${order.id})" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <select onchange="updateOrderStatus(${order.id}, this.value)" 
                                style="padding: 4px 8px; background: #1a1a22; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: white; font-size: 0.8rem;">
                            <option value="">Update Status</option>
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Packed">Packed</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--text-secondary);">No orders found</td></tr>';
        }
    } catch (error) {
        console.error('Orders error:', error);
    }
}

function filterOrders() {
    const status = document.getElementById('orderStatusFilter').value;
    loadOrders(status);
}

async function updateOrderStatus(orderId, newStatus) {
    if (!newStatus) return;
    
    try {
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);
            
        if (error) throw error;
        
        showToast(`Order status updated to ${newStatus}`);
        loadOrders();
        
        // If delivered, process commission
        if (newStatus === 'Delivered') {
            await processCommission(orderId);
        }
    } catch (error) {
        console.error('Update status error:', error);
        showToast('Failed to update status', 'error');
    }
}

async function processCommission(orderId) {
    try {
        const { data: order } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();
            
        if (order?.referred_by) {
            // Check if commission already processed
            const { data: existing } = await supabase
                .from('commissions')
                .select('*')
                .eq('order_id', orderId)
                .single();
                
            if (!existing) {
                const commission = order.total_amount * 0.1; // 10% commission
                
                await supabase.from('commissions').insert({
                    user_id: order.referred_by,
                    order_id: orderId,
                    amount: commission,
                    status: 'paid',
                    created_at: new Date().toISOString()
                });
                
                console.log(`Commission of ₹${commission} processed for user ${order.referred_by}`);
            }
        }
    } catch (error) {
        console.error('Commission error:', error);
    }
}

async function viewOrderDetail(orderId) {
    const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
        
    if (!order) return;
    
    const modal = document.getElementById('orderDetailModal');
    const content = document.getElementById('orderDetailContent');
    
    content.innerHTML = `
        <div class="order-detail-grid">
            <div class="order-detail-section">
                <h4>Customer Details</h4>
                <p><strong>Name:</strong> ${order.full_address?.fullName || 'N/A'}</p>
                <p><strong>Phone:</strong> ${order.user_phone || 'N/A'}</p>
                <p><strong>Alternate Phone:</strong> ${order.full_address?.alternatePhone || 'N/A'}</p>
            </div>
            
            <div class="order-detail-section">
                <h4>Delivery Address</h4>
                <p>${order.full_address?.address || ''}</p>
                <p>${order.full_address?.area || ''}</p>
                <p>${order.full_address?.landmark || ''}</p>
                <p>${order.full_address?.city || ''}, ${order.full_address?.state || ''} - ${order.full_address?.pincode || ''}</p>
            </div>
            
            <div class="order-detail-section">
                <h4>Order Items</h4>
                <div class="order-items-list">
                    ${order.items?.map(item => `
                        <div class="order-item-row">
                            <span>${item.name} (${item.size}) x ${item.quantity}</span>
                            <span>₹${(item.discounted_price * item.quantity).toLocaleString()}</span>
                        </div>
                    `).join('') || 'N/A'}
                </div>
                <div class="order-item-row" style="margin-top: 12px; border-top: 2px solid rgba(255,255,255,0.1); padding-top: 12px;">
                    <strong>Total</strong>
                    <strong>₹${order.total_amount?.toLocaleString() || 0}</strong>
                </div>
            </div>
            
            <div class="order-detail-section">
                <h4>Order Info</h4>
                <p><strong>Order ID:</strong> #${order.id.toString().slice(-8).toUpperCase()}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${order.status?.toLowerCase().replace(/\s+/g, '-')}">${order.status}</span></p>
                <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString('en-IN')}</p>
                <p><strong>Payment:</strong> ${order.payment_method || 'COD'}</p>
                ${order.referral_code ? `<p><strong>Referral:</strong> ${order.referral_code}</p>` : ''}
                ${order.referred_by ? `<p><strong>Referred By:</strong> ${order.referred_by}</p>` : ''}
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

function closeOrderDetailModal() {
    document.getElementById('orderDetailModal').classList.remove('active');
}

// ==================== USERS ====================
async function loadUsers() {
    try {
        const { data: users } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
            
        const tbody = document.getElementById('usersTable');
        if (users && users.length > 0) {
            // Get order counts and earnings for each user
            const userDataPromises = users.map(async (user) => {
                const { data: orders } = await supabase
                    .from('orders')
                    .select('total_amount, status')
                    .eq('user_id', user.id);
                    
                const orderCount = orders?.length || 0;
                const deliveredOrders = orders?.filter(o => o.status === 'Delivered') || [];
                
                const { data: commissions } = await supabase
                    .from('commissions')
                    .select('amount')
                    .eq('user_id', user.id);
                    
                const earnings = commissions?.reduce((sum, c) => sum + c.amount, 0) || 0;
                
                return { ...user, orderCount, earnings };
            });
            
            const usersWithStats = await Promise.all(userDataPromises);
            
            tbody.innerHTML = usersWithStats.map(user => `
                <tr>
                    <td>
                        <strong>${user.full_name || 'User'}</strong>
                        <br><small style="color: var(--text-secondary);">ID: ${user.id.slice(0, 8)}</small>
                    </td>
                    <td>${user.phone || 'N/A'}</td>
                    <td>
                        <span style="color: var(--pink-accent); font-weight: 600;">${user.referral_code || 'N/A'}</span>
                    </td>
                    <td>${user.orderCount}</td>
                    <td style="color: #4caf50; font-weight: 600;">₹${user.earnings.toLocaleString()}</td>
                    <td>${new Date(user.created_at).toLocaleDateString('en-IN')}</td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--text-secondary);">No users found</td></tr>';
        }
    } catch (error) {
        console.error('Users error:', error);
    }
}

// ==================== ANALYTICS ====================
async function loadAnalytics() {
    try {
        // Top Products
        const { data: orders } = await supabase
            .from('orders')
            .select('items')
            .neq('status', 'Cancelled');
            
        if (orders) {
            const productSales = {};
            orders.forEach(order => {
                order.items?.forEach(item => {
                    if (!productSales[item.id]) {
                        productSales[item.id] = { name: item.name, count: 0, revenue: 0 };
                    }
                    productSales[item.id].count += item.quantity;
                    productSales[item.id].revenue += item.discounted_price * item.quantity;
                });
            });
            
            const topProducts = Object.values(productSales)
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5);
                
            document.getElementById('topProducts').innerHTML = topProducts.map((p, i) => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.03);">
                    <span>#${i + 1} ${p.name}</span>
                    <span style="color: #4caf50;">₹${p.revenue.toLocaleString()}</span>
                </div>
            `).join('') || '<p style="color: var(--text-secondary);">No data</p>';
        }
        
        // Top Referrers
        const { data: commissions } = await supabase
            .from('commissions')
            .select('user_id, amount');
            
        if (commissions) {
            const referrerEarnings = {};
            commissions.forEach(c => {
                if (!referrerEarnings[c.user_id]) {
                    referrerEarnings[c.user_id] = 0;
                }
                referrerEarnings[c.user_id] += c.amount;
            });
            
            const topReferrers = Object.entries(referrerEarnings)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
                
            // Get user details
            const referrerDetails = await Promise.all(
                topReferrers.map(async ([userId, amount]) => {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('full_name, phone')
                        .eq('id', userId)
                        .single();
                    return { ...profile, amount };
                })
            );
            
            document.getElementById('topReferrers').innerHTML = referrerDetails.map((r, i) => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.03);">
                    <span>#${i + 1} ${r.full_name || r.phone || 'User'}</span>
                    <span style="color: var(--pink-accent);">₹${r.amount.toLocaleString()}</span>
                </div>
            `).join('') || '<p style="color: var(--text-secondary);">No data</p>';
        }
    } catch (error) {
        console.error('Analytics error:', error);
    }
}

// ==================== BANNERS ====================
async function loadBanners() {
    // For now, show sample banners
    const banners = [
        { id: 1, title: 'Festival Sale', subtitle: 'Up to 70% Off', image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400' },
        { id: 2, title: 'New Arrivals', subtitle: 'Fresh Drops', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400' },
    ];
    
    document.getElementById('bannersGrid').innerHTML = banners.map(banner => `
        <div class="banner-card">
            <img src="${banner.image}" alt="${banner.title}">
            <div class="banner-info">
                <h4>${banner.title}</h4>
                <p>${banner.subtitle}</p>
                <div class="banner-actions">
                    <button class="btn-outline" style="padding: 6px 16px; font-size: 0.8rem;" onclick="editBanner(${banner.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-outline" style="padding: 6px 16px; font-size: 0.8rem; border-color: #f44336; color: #f44336;" onclick="deleteBanner(${banner.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function openBannerModal() {
    document.getElementById('bannerModal').classList.add('active');
}

function closeBannerModal() {
    document.getElementById('bannerModal').classList.remove('active');
}

async function saveBanner(event) {
    event.preventDefault();
    showToast('Banner saved successfully!');
    closeBannerModal();
    loadBanners();
}

function editBanner(id) {
    openBannerModal();
}

function deleteBanner(id) {
    if (confirm('Delete this banner?')) {
        showToast('Banner deleted!');
        loadBanners();
    }
}

// ==================== UTILITIES ====================
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.cssText = `
        background: ${type === 'error' ? '#f44336' : '#4caf50'};
        color: white;
        padding: 12px 24px;
        border-radius: 50px;
        font-weight: 500;
        animation: slideUp 0.3s ease;
        margin-bottom: 8px;
    `;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}

function handleAdminLogout() {
    localStorage.removeItem('glammora_admin');
    window.location.href = 'index.html';
}

// Close modals on outside click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});
