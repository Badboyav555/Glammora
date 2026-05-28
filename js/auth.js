// Auth System - Final Working Version
var Auth = {
    signup: async function(phone, password) {
        phone = phone.toString().trim();
        
        if (phone.length !== 10) return { error: 'Enter valid 10-digit mobile number' };
        if (password.length < 6) return { error: 'Password must be at least 6 characters' };
        
        var check = await supabase.from('users').select('id').eq('phone', phone).maybeSingle();
        if (check.data) return { error: 'Number already registered. Try login.' };
        
        var ref = 'GLAM' + phone.slice(-4) + Math.random().toString(36).slice(2, 5).toUpperCase();
        var hash = btoa(password);
        
        var result = await supabase.from('users').insert({
            phone: phone,
            password: hash,
            referral_code: ref,
            full_name: '',
            total_earnings: 0,
            referral_count: 0,
            created_at: new Date().toISOString()
        }).select().single();
        
        if (result.error) return { error: result.error.message };
        
        var userData = {
            id: result.data.id,
            phone: result.data.phone,
            referral_code: result.data.referral_code
        };
        
        localStorage.setItem('glammora_user', JSON.stringify(userData));
        return { success: true, user: userData };
    },
    
    login: async function(phone, password) {
        phone = phone.toString().trim();
        var hash = btoa(password);
        
        var result = await supabase.from('users').select('*').eq('phone', phone).eq('password', hash).maybeSingle();
        
        if (result.error) return { error: result.error.message };
        if (!result.data) return { error: 'Invalid mobile number or password' };
        
        var userData = {
            id: result.data.id,
            phone: result.data.phone,
            referral_code: result.data.referral_code
        };
        
        localStorage.setItem('glammora_user', JSON.stringify(userData));
        return { success: true, user: userData };
    },
    
    getUser: function() {
        var u = localStorage.getItem('glammora_user');
        if (!u || u === 'null') return null;
        try { return JSON.parse(u); } catch(e) { return null; }
    },
    
    logout: function() {
        localStorage.removeItem('glammora_user');
        localStorage.removeItem('glammora_cart');
        localStorage.removeItem('glammora_ref');
        window.location.href = 'index.html';
    }
};

function getUser() { return Auth.getUser(); }
