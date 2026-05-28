// Admin Dashboard - Complete Functions

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

// Logout
function adminLogout() {
    localStorage.removeItem('glammora_admin');
    window.location.href = 'index.html';
}

// Switch sections
function showSection(section) {
    document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
    document.querySelectorAll('.section').forEach(function(s) { s.classList.remove('active'); });
    
    document.getElementById(section + 'Section').classList.add('active');
    
    var tabs = document.querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].textContent.toLowerCase().includes(section.toLowerCase())) {
            tabs[i].classList.add('active');
        }
    }
    
    if (section === 'dashboard') loadDashboard();
    if (section === 'orders') loadOrders();
    if (section === 'users') loadUsers();
    if (section === 'products') loadProducts();
    if (section === 'referrals') loadReferrals();
}

// ============ DASHBOARD ============
async function loadDashboard() {
    try {
        var ordersResult = await supabase.from('orders').select('*');
        var orders = ordersResult.data || [];
        var totalRevenue = 0;
        var pendingCount = 0;
        
        orders.forEach(function(o) {
            if (o.status !== 'Cancelled') totalRevenue += (o.total_amount || 0);
            if (o.status === 'Pending') pendingCount++;
        });
        
        var usersResult = await supabase.from('users').select('*', { count: 'exact' });
        
        document.getElementById('totalRevenue').textContent = 'Rs. ' + totalRevenue.toLocaleString();
        document.getElementById('totalOrders').textContent = orders.length;
        document.getElementById('pendingOrders').textContent = pendingCount;
        document.getElementById('totalUsers').textContent = usersResult.count || 0;
        
        var recentOrders = orders.slice(-10).reverse();
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
        document.getElementById('recentOrdersTable').innerHTML = html || '<tr><td colspan="6">No orders</td></tr>';
    } catch(e) { console.error(e); }
}

// ============ ORDERS ============
async function loadOrders() {
    try {
        var result = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        var orders = result.data || [];
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
            html += '<td><select onchange="updateOrderStatus(' + o.id + ', this.value)" style="background:#1a1a22;color:white;border:1px solid #333;padding:4px;border-radius:4px;">';
            html += '<option ' + (o.status === 'Pending' ? 'selected' : '') + '>Pending</option>';
            html += '<option ' + (o.status === 'Confirmed' ? 'selected' : '') + '>Confirmed</option>';
            html += '<option ' + (o.status === 'Packed' ? 'selected' : '') + '>Packed</option>';
            html += '<option ' + (o.status === 'Shipped' ? 'selected' : '') + '>Shipped</option>';
            html += '<option ' + (o.status === 'Delivered' ? 'selected' : '') + '>Delivered</option>';
            html += '<option ' + (o.status === 'Cancelled' ? 'selected' : '') + '>Cancelled</option>';
            html += '</select></td>';
            html += '</tr>';
        });
        
        document.getElementById('ordersTable').innerHTML = html || '<tr><td colspan="7">No orders</td></tr>';
    } catch(e) { console.error(e); }
}

async function updateOrderStatus(orderId, newStatus) {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    alert('Status updated to ' + newStatus);
    loadOrders();
    loadDashboard();
}

// ============ USERS ============
async function loadUsers() {
    try {
        var result = await supabase.from('users').select('*').order('created_at', { ascending: false });
        var users = result.data || [];
        var html = '';
        
        for (var i = 0; i < users.length; i++) {
            var user = users[i];
            var orderResult = await supabase.from('orders').select('id', { count: 'exact' }).eq('user_id', user.id);
            
            html += '<tr>';
            html += '<td><strong>' + (user.full_name || 'User') + '</strong><br><small>ID: ' + user.id + '</small></td>';
            html += '<td>' + user.phone + '</td>';
            html += '<td style="color:#ff4d8d;font-weight:600;">' + (user.referral_code || 'N/A') + '</td>';
            html += '<td>' + (orderResult.count || 0) + '</td>';
            html += '<td style="color:#4caf50;">Rs. ' + (user.total_earnings || 0).toLocaleString() + '</td>';
            html += '<td>' + new Date(user.created_at).toLocaleDateString() + '</td>';
            html += '</tr>';
        }
        
        document.getElementById('usersTable').innerHTML = html || '<tr><td colspan="6">No users</td></tr>';
    } catch(e) { console.error(e); }
}

// ============ PRODUCTS ============
async function loadProducts() {
    try {
        var result = await supabase.from('products').select('*').order('created_at', { ascending: false });
        var products = result.data || [];
        var html = '';
        
        products.forEach(function(p) {
            var img = (p.images && p.images.length > 0) ? p.images[0] : 'https://via.placeholder.com/50';
            html += '<tr>';
            html += '<td><img src="' + img + '" style="width:50px;height:65px;object-fit:cover;border-radius:6px;"></td>';
            html += '<td>' + p.name + '</td>';
            html += '<td>' + (p.category || 'N/A') + '</td>';
            html += '<td>Rs. ' + (p.discounted_price || 0).toLocaleString() + '</td>';
            html += '<td>' + (p.stock || 0) + '</td>';
            html += '<td><button onclick="deleteProduct(' + p.id + ')" style="background:#f44336;color:white;border:none;padding:6px 12px;border-radius:4px;">Delete</button></td>';
            html += '</tr>';
        });
        
        document.getElementById('productsTable').innerHTML = html || '<tr><td colspan="6">No products</td></tr>';
    } catch(e) { console.error(e); }
}

async function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
    alert('Product deleted!');
    loadProducts();
}

// ============ REFERRALS ============
async function loadReferrals() {
    try {
        var usersResult = await supabase.from('users').select('*').order('created_at', { ascending: false });
        var users = usersResult.data || [];
        
        // Populate dropdown
        var dropdown = document.getElementById('referralUser');
        var options = '<option value="">Choose user...</option>';
        users.forEach(function(u) {
            options += '<option value="' + u.id + '">' + (u.full_name || 'User') + ' - ' + u.phone + '</option>';
        });
        dropdown.innerHTML = options;
        
        // Populate table
        var html = '';
        for (var i = 0; i < users.length; i++) {
            var user = users[i];
            var refResult = await supabase.from('orders').select('id', { count: 'exact' }).eq('referral_code', user.referral_code);
            
            html += '<tr>';
            html += '<td><strong>' + (user.full_name || 'User') + '</strong></td>';
            html += '<td>' + user.phone + '</td>';
            html += '<td style="color:#ff4d8d;font-weight:600;">' + user.referral_code + '</td>';
            html += '<td style="color:#4caf50;">Rs. ' + (user.total_earnings || 0).toLocaleString() + '</td>';
            html += '<td>' + (refResult.count || 0) + '</td>';
            html += '<td>';
            html += '<button onclick="editReferralCode(' + user.id + ')" class="btn-blue" style="padding:6px 10px;font-size:0.75rem;margin-right:4px;">Edit</button>';
            html += '<button onclick="resetReferralCode(' + user.id + ')" class="btn-red" style="padding:6px 10px;font-size:0.75rem;">Reset</button>';
            html += '</td>';
            html += '</tr>';
        }
        
        document.getElementById('referralTable').innerHTML = html || '<tr><td colspan="6">No users</td></tr>';
    } catch(e) { console.error(e); }
}

async function createCustomReferral() {
    var userId = document.getElementById('referralUser').value;
    var customCode = document.getElementById('customReferralCode').value.trim().toUpperCase();
    var msgDiv = document.getElementById('referralMsg');
    
    if (!userId) {
        msgDiv.innerHTML = '<div class="msg msg-error">Please select a user</div>';
        return;
    }
    if (!customCode || customCode.length < 6) {
        msgDiv.innerHTML = '<div class="msg msg-error">Code must be at least 6 characters</div>';
        return;
    }
    
    var checkResult = await supabase.from('users').select('id').eq('referral_code', customCode).maybeSingle();
    if (checkResult.data) {
        msgDiv.innerHTML = '<div class="msg msg-error">Code already taken! Try another.</div>';
        return;
    }
    
    var result = await supabase.from('users').update({ referral_code: customCode }).eq('id', userId);
    
    if (result.error) {
        msgDiv.innerHTML = '<div class="msg msg-error">Failed: ' + result.error.message + '</div>';
    } else {
        msgDiv.innerHTML = '<div class="msg msg-success">Referral code updated successfully!</div>';
        document.getElementById('customReferralCode').value = '';
        loadReferrals();
    }
}

async function editReferralCode(userId) {
    var result = await supabase.from('users').select('referral_code').eq('id', userId).single();
    var currentCode = result.data ? result.data.referral_code : '';
    var newCode = prompt('Enter new referral code:', currentCode);
    
    if (!newCode || newCode === currentCode || newCode.length < 6) return;
    
    var checkResult = await supabase.from('users').select('id').eq('referral_code', newCode.toUpperCase()).maybeSingle();
    if (checkResult.data) {
        alert('Code already taken!');
        return;
    }
    
    await supabase.from('users').update({ referral_code: newCode.toUpperCase() }).eq('id', userId);
    alert('Referral code updated!');
    loadReferrals();
}

async function resetReferralCode(userId) {
    if (!confirm('Reset to auto-generated code?')) return;
    var newCode = 'GLAM' + Math.random().toString(36).substring(2, 6).toUpperCase();
    await supabase.from('users').update({ referral_code: newCode }).eq('id', userId);
    alert('Referral code reset!');
    loadReferrals();
}

// ============ INIT ============
document.addEventListener('DOMContentLoaded', function() {
    if (checkAdmin()) {
        loadDashboard();
    }
});
