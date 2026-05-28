// Admin Dashboard Functions

// Check admin login
function checkAdmin() {
    var admin = localStorage.getItem('glammora_admin');
    if (!admin) {
        var pass = prompt('Enter admin password:');
        if (pass === 'admin123') {
            localStorage.setItem('glammora_admin', 'true');
        } else {
            alert('Wrong password!');
            window.location.href = 'index.html';
            return false;
        }
    }
    return true;
}

// Switch sections
function showSection(section) {
    document.querySelectorAll('.tab').forEach(function(t) {
        t.classList.remove('active');
    });
    document.querySelectorAll('.section').forEach(function(s) {
        s.classList.remove('active');
    });
    
    document.getElementById(section + 'Section').classList.add('active');
    
    var tabs = document.querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].textContent.toLowerCase().includes(section)) {
            tabs[i].classList.add('active');
        }
    }
    
    // Load data
    if (section === 'dashboard') loadDashboard();
    if (section === 'orders') loadOrders();
    if (section === 'users') loadUsers();
    if (section === 'products') loadProducts();
}

// ============ DASHBOARD ============
async function loadDashboard() {
    try {
        // Total revenue
        var ordersResult = await supabase.from('orders').select('*');
        var orders = ordersResult.data || [];
        var totalRevenue = 0;
        var pendingCount = 0;
        
        orders.forEach(function(o) {
            if (o.status !== 'Cancelled') {
                totalRevenue += (o.total_amount || 0);
            }
            if (o.status === 'Pending') pendingCount++;
        });
        
        // Total users
        var usersResult = await supabase.from('users').select('*', { count: 'exact' });
        var totalUsers = usersResult.count || 0;
        
        // Update UI
        document.getElementById('totalRevenue').textContent = 'Rs. ' + totalRevenue.toLocaleString();
        document.getElementById('totalOrders').textContent = orders.length;
        document.getElementById('pendingOrders').textContent = pendingCount;
        document.getElementById('totalUsers').textContent = totalUsers;
        
        // Recent orders table
        var recentOrders = orders.slice(-10).reverse();
        var tbody = document.getElementById('recentOrdersTable');
        if (tbody) {
            var html = '';
            recentOrders.forEach(function(o) {
                var addr = o.full_address || {};
                html += '<tr>';
                html += '<td>#' + String(o.id).slice(-6) + '</td>';
                html += '<td>' + (addr.fullName || 'N/A') + '</td>';
                html += '<td>' + (o.items || []).length + ' items</td>';
                html += '<td>Rs. ' + (o.total_amount || 0).toLocaleString() + '</td>';
                html += '<td><span style="color:#ff9800;">' + (o.status || 'Pending') + '</span></td>';
                html += '<td>' + new Date(o.created_at).toLocaleDateString() + '</td>';
                html += '</tr>';
            });
            tbody.innerHTML = html || '<tr><td colspan="6">No orders</td></tr>';
        }
    } catch(e) {
        console.error('Dashboard error:', e);
    }
}

// ============ ORDERS ============
async function loadOrders() {
    try {
        var result = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        var orders = result.data || [];
        var tbody = document.getElementById('ordersTable');
        
        if (tbody) {
            var html = '';
            orders.forEach(function(o) {
                var addr = o.full_address || {};
                html += '<tr>';
                html += '<td>#' + String(o.id).slice(-6) + '</td>';
                html += '<td>' + (addr.fullName || 'N/A') + '<br><small>' + (o.user_phone || '') + '</small></td>';
                html += '<td><small>' + (addr.address || '') + ', ' + (addr.city || '') + '</small></td>';
                html += '<td>' + (o.items || []).length + ' items</td>';
                html += '<td>Rs. ' + (o.total_amount || 0).toLocaleString() + '</td>';
                html += '<td>' + (o.referral_code || '-') + '</td>';
                html += '<td><select onchange="updateStatus(' + o.id + ', this.value)" style="background:#1a1a22;color:white;border:1px solid #333;padding:4px;border-radius:4px;">';
                html += '<option value="Pending" ' + (o.status === 'Pending' ? 'selected' : '') + '>Pending</option>';
                html += '<option value="Confirmed" ' + (o.status === 'Confirmed' ? 'selected' : '') + '>Confirmed</option>';
                html += '<option value="Packed" ' + (o.status === 'Packed' ? 'selected' : '') + '>Packed</option>';
                html += '<option value="Shipped" ' + (o.status === 'Shipped' ? 'selected' : '') + '>Shipped</option>';
                html += '<option value="Delivered" ' + (o.status === 'Delivered' ? 'selected' : '') + '>Delivered</option>';
                html += '<option value="Cancelled" ' + (o.status === 'Cancelled' ? 'selected' : '') + '>Cancelled</option>';
                html += '</select></td>';
                html += '</tr>';
            });
            tbody.innerHTML = html || '<tr><td colspan="8">No orders found</td></tr>';
        }
    } catch(e) {
        console.error('Orders error:', e);
    }
}

async function updateStatus(orderId, newStatus) {
    if (!newStatus) return;
    
    var result = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    
    if (result.error) {
        alert('Failed to update: ' + result.error.message);
    } else {
        alert('Status updated to ' + newStatus);
        loadOrders();
    }
}

// ============ USERS ============
async function loadUsers() {
    try {
        var result = await supabase.from('users').select('*').order('created_at', { ascending: false });
        var users = result.data || [];
        var tbody = document.getElementById('usersTable');
        
        if (tbody) {
            var html = '';
            
            for (var i = 0; i < users.length; i++) {
                var user = users[i];
                
                // Get user's order count
                var orderResult = await supabase.from('orders').select('id', { count: 'exact' }).eq('user_id', user.id);
                var orderCount = orderResult.count || 0;
                
                html += '<tr>';
                html += '<td><strong>' + (user.full_name || 'User') + '</strong><br><small style="color:#aaaaaa;">ID: ' + user.id + '</small></td>';
                html += '<td>' + (user.phone || 'N/A') + '</td>';
                html += '<td><span style="color:#ff4d8d;font-weight:600;">' + (user.referral_code || 'N/A') + '</span></td>';
                html += '<td>' + orderCount + '</td>';
                html += '<td style="color:#4caf50;font-weight:600;">Rs. ' + (user.total_earnings || 0).toLocaleString() + '</td>';
                html += '<td>' + new Date(user.created_at).toLocaleDateString() + '</td>';
                html += '</tr>';
            }
            
            tbody.innerHTML = html || '<tr><td colspan="6" style="text-align:center;padding:40px;">No users found</td></tr>';
        }
    } catch(e) {
        console.error('Users error:', e);
    }
}

// ============ PRODUCTS ============
async function loadProducts() {
    try {
        var result = await supabase.from('products').select('*').order('created_at', { ascending: false });
        var products = result.data || [];
        var tbody = document.getElementById('productsTable');
        
        if (tbody) {
            var html = '';
            products.forEach(function(p) {
                var img = (p.images && p.images.length > 0) ? p.images[0] : 'https://via.placeholder.com/50';
                html += '<tr>';
                html += '<td><img src="' + img + '" style="width:50px;height:65px;object-fit:cover;border-radius:6px;"></td>';
                html += '<td><strong>' + p.name + '</strong></td>';
                html += '<td>' + (p.category || 'N/A') + '</td>';
                html += '<td>Rs. ' + (p.discounted_price || 0).toLocaleString() + '</td>';
                html += '<td>' + (p.stock || 0) + '</td>';
                html += '<td><button onclick="deleteProduct(' + p.id + ')" style="background:#f44336;color:white;border:none;padding:6px 12px;border-radius:4px;">Delete</button></td>';
                html += '</tr>';
            });
            tbody.innerHTML = html || '<tr><td colspan="6">No products</td></tr>';
        }
    } catch(e) {
        console.error('Products error:', e);
    }
}

async function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    
    var result = await supabase.from('products').delete().eq('id', id);
    
    if (result.error) {
        alert('Failed: ' + result.error.message);
    } else {
        alert('Product deleted!');
        loadProducts();
    }
}

// ============ INIT ============
document.addEventListener('DOMContentLoaded', function() {
    if (checkAdmin()) {
        loadDashboard();
    }
});

// Logout
function adminLogout() {
    localStorage.removeItem('glammora_admin');
    window.location.href = 'index.html';
}
