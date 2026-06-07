// Admin Dashboard Functions
async function loadPayments() {
    var res = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    var orders = res.data || [];
    var html = '';
    
    orders.forEach(function(o) {
        var addr = o.full_address || {};
        html += '<tr>';
        html += '<td>#' + String(o.id).slice(-6) + '</td>';
        html += '<td>' + (addr.fullName || 'N/A') + '<br><small>' + (addr.phone || '') + '</small></td>';
        html += '<td>Rs. ' + (o.total_amount || 0).toLocaleString() + '</td>';
        html += '<td style="color:#ff4d8d;">' + (o.transaction_id || 'N/A') + '</td>';
        html += '<td>' + (o.screenshot_url ? '<a href="' + o.screenshot_url + '" target="_blank"><img src="' + o.screenshot_url + '" style="width:50px;height:50px;object-fit:cover;border-radius:4px;"></a>' : 'No screenshot') + '</td>';
        html += '<td><span style="color:' + (o.payment_status === 'Verified' ? '#4caf50' : o.payment_status === 'Rejected' ? '#f44336' : '#ff9800') + ';">' + (o.payment_status || 'Pending') + '</span></td>';
        html += '<td>';
        if (o.payment_status === 'Pending Verification') {
            html += '<button onclick="verifyPayment(' + o.id + ')" class="btn-green btn-sm">Verify</button> ';
            html += '<button onclick="rejectPayment(' + o.id + ')" class="btn-red btn-sm">Reject</button>';
        }
        html += '</td>';
        html += '</tr>';
    });
    
    document.getElementById('paymentsTable').innerHTML = html || '<tr><td colspan="7">No payments</td></tr>';
}

async function verifyPayment(orderId) {
    if (!confirm('Verify this payment?')) return;
    await supabase.from('orders').update({ payment_status: 'Verified', status: 'Confirmed' }).eq('id', orderId);
    alert('Payment verified!');
    loadPayments();
    loadDashboard();
}

async function rejectPayment(orderId) {
    if (!confirm('Reject this payment?')) return;
    await supabase.from('orders').update({ payment_status: 'Rejected' }).eq('id', orderId);
    alert('Payment rejected!');
    loadPayments();
}

// showSection mein add karo
if (section === 'payments') loadPayments();
function checkAdmin() {
    if (!localStorage.getItem('glammora_admin')) {
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

function adminLogout() {
    localStorage.removeItem('glammora_admin');
    window.location.href = 'index.html';
}

function showSection(section) {
    document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
    document.querySelectorAll('.section').forEach(function(s) { s.classList.remove('active'); });
    document.getElementById(section + 'Section').classList.add('active');
    
    document.querySelectorAll('.tab').forEach(function(t) {
        if (t.textContent.toLowerCase().includes(section.toLowerCase().replace('generate',''))) {
            t.classList.add('active');
        }
    });
    
    if (section === 'dashboard') loadDashboard();
    if (section === 'orders') loadOrders();
    if (section === 'users') loadUsers();
    if (section === 'products') loadProducts();
    if (section === 'generatelinks') loadGeneratedLinks();
}

// ============ DASHBOARD ============
async function loadDashboard() {
    var oRes = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    var orders = oRes.data || [];
    var revenue = 0, pending = 0;
    orders.forEach(function(o) {
        if (o.status !== 'Cancelled') revenue += (o.total_amount || 0);
        if (o.status === 'Pending') pending++;
    });
    var uRes = await supabase.from('users').select('*', { count: 'exact' });
    
    document.getElementById('totalRevenue').textContent = 'Rs. ' + revenue.toLocaleString();
    document.getElementById('totalOrders').textContent = orders.length;
    document.getElementById('pendingOrders').textContent = pending;
    document.getElementById('totalUsers').textContent = uRes.count || 0;
    
    var html = '';
    orders.slice(0, 10).forEach(function(o) {
        var a = o.full_address || {};
        var items = o.items || [];
        var itemsHtml = '';
        items.forEach(function(item) {
            itemsHtml += '<span style="color:#ff4d8d;">#' + (item.id || 'N/A') + '</span> ' + (item.name || 'Unknown') + ' x' + (item.quantity || 1) + '<br>';
        });
        html += '<tr><td>#' + String(o.id).slice(-6) + '</td><td>' + (a.fullName || 'N/A') + '<br><small>' + (a.city || '') + ', ' + (a.pincode || '') + '</small></td><td><small>' + itemsHtml + '</small></td><td>Rs. ' + (o.total_amount || 0).toLocaleString() + '</td><td>' + (o.status || 'Pending') + '</td><td>' + new Date(o.created_at).toLocaleDateString('en-IN') + '</td></tr>';
    });
    document.getElementById('recentOrdersTable').innerHTML = html || '<tr><td colspan="6">No orders</td></tr>';
}

// ============ ORDERS WITH FILTERS ============
var allOrders = [];
var filteredOrders = [];

/*async function loadOrders() {
    var res = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    allOrders = res.data || [];
    filteredOrders = allOrders;
    renderOrdersTable(filteredOrders);
}*/ async function loadOrders() {
    var res = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    allOrders = res.data || [];
    filteredOrders = allOrders;
    renderOrdersTable(filteredOrders);
    
    // Update count
    document.getElementById('totalOrders').textContent = allOrders.length;
}

function filterOrders() {
    var statusFilter = document.getElementById('orderStatusFilter').value;
    var dateFilter = document.getElementById('orderDateFilter').value;
    
    filteredOrders = allOrders;
    
    // Status filter
    if (statusFilter) {
        filteredOrders = filteredOrders.filter(function(o) {
            return o.status === statusFilter;
        });
    }
    
    // Date filter
    if (dateFilter) {
        filteredOrders = filteredOrders.filter(function(o) {
            var orderDate = new Date(o.created_at).toLocaleDateString('en-CA'); // YYYY-MM-DD format
            return orderDate === dateFilter;
        });
    }
    
    renderOrdersTable(filteredOrders);
}

function renderOrdersTable(orders) {
    var html = '';
    
    if (orders.length === 0) {
        html = '<tr><td colspan="7" style="text-align:center;padding:30px;">No orders found</td></tr>';
    } else {
        orders.forEach(function(o) {
            var addr = o.full_address || {};
            var items = o.items || [];
            
            // Products list with ID + Name
            var itemsHtml = '';
            items.forEach(function(item) {
                itemsHtml += '<div style="font-size:0.75rem;padding:2px 0;border-bottom:1px solid rgba(255,255,255,0.03);">';
                itemsHtml += '<span style="color:#ff4d8d;font-weight:600;">#' + (item.id || 'N/A') + '</span> ';
                itemsHtml += '<span>' + (item.name || 'Unknown') + '</span>';
                itemsHtml += '<br><small style="color:#aaaaaa;">Size: ' + (item.size || 'M') + ' | Qty: ' + (item.quantity || 1) + ' | Rs. ' + ((item.discounted_price || 0) * (item.quantity || 1)).toLocaleString() + '</small>';
                itemsHtml += '</div>';
            });
            
            // Full address
            var fullAddr = '<strong>' + (addr.fullName || 'N/A') + '</strong><br>';
            fullAddr += '<small>Phone: ' + (addr.phone || o.user_phone || 'N/A') + '</small><br>';
            if (addr.alternatePhone) fullAddr += '<small>Alt: ' + addr.alternatePhone + '</small><br>';
            fullAddr += '<small>' + (addr.address || '') + ', ' + (addr.area || '') + '</small><br>';
            if (addr.landmark) fullAddr += '<small>Landmark: ' + addr.landmark + '</small><br>';
            fullAddr += '<small>' + (addr.city || '') + ', ' + (addr.state || '') + ' - ' + (addr.pincode || '') + '</small><br>';
            fullAddr += '<small>' + (addr.country || 'India') + '</small>';
            
            var orderDate = new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            var orderTime = new Date(o.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            
            html += '<tr>';
            html += '<td><strong>#' + String(o.id).slice(-6) + '</strong><br><small>' + orderDate + '<br>' + orderTime + '</small></td>';
            html += '<td>' + fullAddr + '</td>';
            html += '<td>' + itemsHtml + '</td>';
            html += '<td><strong>Rs. ' + (o.total_amount || 0).toLocaleString() + '</strong><br><small>' + (o.payment_method || 'COD') + '</small></td>';
            html += '<td>' + (o.referral_code || '-') + '</td>';
            html += '<td>';
            html += '<select onchange="updateOrderStatus(' + o.id + ', this.value)" style="background:#1a1a22;color:white;border:1px solid #333;padding:4px;border-radius:4px;font-size:0.75rem;">';
            html += '<option ' + (o.status === 'Pending' ? 'selected' : '') + '>Pending</option>';
            html += '<option ' + (o.status === 'Confirmed' ? 'selected' : '') + '>Confirmed</option>';
            html += '<option ' + (o.status === 'Packed' ? 'selected' : '') + '>Packed</option>';
            html += '<option ' + (o.status === 'Shipped' ? 'selected' : '') + '>Shipped</option>';
            html += '<option ' + (o.status === 'Out for Delivery' ? 'selected' : '') + '>Out for Delivery</option>';
            html += '<option ' + (o.status === 'Delivered' ? 'selected' : '') + '>Delivered</option>';
            html += '<option ' + (o.status === 'Cancelled' ? 'selected' : '') + '>Cancelled</option>';
            html += '</select>';
            html += '</td>';
            html += '</tr>';
        });
    }
    
    document.getElementById('ordersTable').innerHTML = html;
}

async function updateOrderStatus(id, status) {
    await supabase.from('orders').update({ status: status }).eq('id', id);
    alert('Status updated to ' + status);
    loadOrders();
    loadDashboard();
}

// ============ USERS ============
async function loadUsers() {
    var res = await supabase.from('users').select('*').order('created_at', { ascending: false });
    var users = res.data || [];
    var html = '';
    for (var i = 0; i < users.length; i++) {
        var u = users[i];
        var oRes = await supabase.from('orders').select('id', { count: 'exact' }).eq('user_id', u.id);
        html += '<tr><td><strong>' + (u.full_name || 'User') + '</strong><br><small>ID: ' + u.id + '</small></td><td>' + u.phone + '</td><td style="color:#ff4d8d;">' + (u.referral_code || 'N/A') + '</td><td>' + (oRes.count || 0) + '</td><td style="color:#4caf50;">Rs. ' + (u.total_earnings || 0).toLocaleString() + '</td><td>' + new Date(u.created_at).toLocaleDateString('en-IN') + '</td></tr>';
    }
    document.getElementById('usersTable').innerHTML = html || '<tr><td colspan="6">No users</td></tr>';
}

// ============ PRODUCTS ============
async function loadProducts() {
    var res = await supabase.from('products').select('*').order('id', { ascending: true });
    var products = res.data || [];
    var html = '';
    products.forEach(function(p) {
        var img = (p.images && p.images.length > 0) ? p.images[0] : 'https://via.placeholder.com/50';
        html += '<tr><td><strong>#' + p.id + '</strong></td><td><img src="' + img + '" style="width:50px;height:65px;object-fit:cover;border-radius:6px;"></td><td>' + p.name + '</td><td>' + (p.category || 'N/A') + '</td><td>Rs. ' + (p.discounted_price || 0).toLocaleString() + '</td><td>' + (p.stock || 0) + '</td><td><button onclick="editProduct(' + p.id + ')" class="btn-blue btn-sm">Edit</button> <button onclick="deleteProduct(' + p.id + ')" class="btn-red btn-sm">Del</button></td></tr>';
    });
    document.getElementById('productsTable').innerHTML = html || '<tr><td colspan="7">No products</td></tr>';
}

function openAddProductModal() {
    document.getElementById('productModal').classList.add('active');
    document.getElementById('modalTitle').textContent = 'Add Product';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
}

async function editProduct(id) {
    var res = await supabase.from('products').select('*').eq('id', id).single();
    var p = res.data;
    if (!p) return;
    
    document.getElementById('productId').value = p.id;
    document.getElementById('productName').value = p.name;
    document.getElementById('productDesc').value = p.description || '';
    document.getElementById('productCategory').value = p.category;
    document.getElementById('productStock').value = p.stock;
    document.getElementById('productMrp').value = p.original_price;
    document.getElementById('productPrice').value = p.discounted_price;
    document.getElementById('productSizes').value = Array.isArray(p.sizes) ? p.sizes.join(',') : p.sizes;
    document.getElementById('productImages').value = Array.isArray(p.images) ? p.images.join('\n') : '';
    document.getElementById('productCod').checked = p.cod_available;
    document.getElementById('modalTitle').textContent = 'Edit Product';
    document.getElementById('productModal').classList.add('active');
}

async function saveProduct(e) {
    e.preventDefault();
    var id = document.getElementById('productId').value;
    var images = document.getElementById('productImages').value.split('\n').filter(function(u) { return u.trim(); });
    
    var data = {
        name: document.getElementById('productName').value,
        description: document.getElementById('productDesc').value,
        category: document.getElementById('productCategory').value,
        original_price: parseFloat(document.getElementById('productMrp').value),
        discounted_price: parseFloat(document.getElementById('productPrice').value),
        stock: parseInt(document.getElementById('productStock').value),
        sizes: document.getElementById('productSizes').value.split(',').map(function(s) { return s.trim(); }),
        images: images,
        cod_available: document.getElementById('productCod').checked
    };
    
    var result;
    if (id) {
        result = await supabase.from('products').update(data).eq('id', id);
    } else {
        data.created_at = new Date().toISOString();
        result = await supabase.from('products').insert(data);
    }
    
    if (result.error) {
        alert('Error: ' + result.error.message);
    } else {
        alert('Product saved!');
        closeProductModal();
        loadProducts();
    }
}

async function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
    loadProducts();
}

// ============ GENERATE LINKS ============
async function generateLink() {
    var name = document.getElementById('linkName').value.trim();
    var code = document.getElementById('linkCode').value.trim().toUpperCase();
    var commission = parseFloat(document.getElementById('linkCommission').value) || 10;
    var msgDiv = document.getElementById('linkMsg');
    
    if (!name || !code) {
        msgDiv.innerHTML = '<div class="msg msg-error">Fill all fields</div>';
        return;
    }
    
    var check1 = await supabase.from('users').select('id').eq('referral_code', code).maybeSingle();
    var check2 = await supabase.from('referral_links').select('id').eq('code', code).maybeSingle();
    
    if (check1.data || check2.data) {
        msgDiv.innerHTML = '<div class="msg msg-error">Code already taken!</div>';
        return;
    }
    
    var result = await supabase.from('referral_links').insert({
        name: name, code: code, commission: commission,
        orders: 0, earnings: 0, created_at: new Date().toISOString()
    }).select().single();
    
    if (result.error) {
        msgDiv.innerHTML = '<div class="msg msg-error">Failed</div>';
    } else {
        var link = window.location.origin + '/?ref=' + code;
        msgDiv.innerHTML = '<div class="msg msg-success">Link: ' + link + ' <button onclick="copyText(\'' + link + '\')" class="btn-sm" style="margin-left:8px;">Copy</button></div>';
        document.getElementById('linkName').value = '';
        document.getElementById('linkCode').value = '';
        loadGeneratedLinks();
    }
}

async function loadGeneratedLinks() {
    var result = await supabase.from('referral_links').select('*').order('created_at', { ascending: false });
    var links = result.data || [];
    var html = '';
    links.forEach(function(l) {
        var link = window.location.origin + '/?ref=' + l.code;
        html += '<tr><td>' + l.name + '</td><td style="color:#ff4d8d;">' + l.code + '</td><td>' + l.commission + '%</td><td>' + l.orders + '</td><td style="color:#4caf50;">Rs. ' + (l.earnings || 0).toLocaleString() + '</td><td><button onclick="copyText(\'' + link + '\')" class="btn-blue btn-sm">Copy</button></td><td><button onclick="deleteLink(' + l.id + ')" class="btn-red btn-sm">Delete</button></td></tr>';
    });
    document.getElementById('generatedLinksTable').innerHTML = html || '<tr><td colspan="7">No links</td></tr>';
}

function copyText(text) {
    navigator.clipboard.writeText(text).then(function() { alert('Copied!'); });
}

async function deleteLink(id) {
    if (!confirm('Delete?')) return;
    await supabase.from('referral_links').delete().eq('id', id);
    loadGeneratedLinks();
}

// ============ INIT ============
document.addEventListener('DOMContentLoaded', function() {
    if (checkAdmin()) loadDashboard();
});
