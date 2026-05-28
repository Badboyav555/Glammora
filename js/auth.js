// Mobile Friendly Auth System
var Auth = {
    signup: async function(phone, password) {
        try {
            phone = phone.replace(/\s/g, '');
            if (phone.length !== 10) return { error: 'Enter 10 digit number' };
            if (password.length < 6) return { error: 'Password too short' };
            
            // Check if exists
            var check = await supabase.from('users').select('id').eq('phone', phone).maybeSingle();
            if (check.data) return { error: 'Number already registered' };
            
            // Create
            var ref = 'G' + phone.slice(-4) + Math.random().toString(36).slice(2, 5).toUpperCase();
            var hash = btoa(password);
            
            var result = await supabase.from('users').insert({
                phone: phone,
                password: hash,
                full_name: '',
                referral_code: ref,
                total_earnings: 0,
                referral_count: 0,
                created_at: new Date().toISOString()
            }).select('*').single();
            
            if (result.error) return { error: result.error.message };
            
            // Save to storage
            localStorage.setItem('glammora_user', JSON.stringify(result.data));
            return { success: true, user: result.data };
            
        } catch(e) {
            return { error: 'Something went wrong' };
        }
    },
    
    login: async function(phone, password) {
        try {
            phone = phone.replace(/\s/g, '');
            var hash = btoa(password);
            
            var result = await supabase.from('users').select('*')
                .eq('phone', phone)
                .eq('password', hash)
                .maybeSingle();
            
            if (result.error || !result.data) return { error: 'Wrong number or password' };
            
            // Save to storage
            localStorage.setItem('glammora_user', JSON.stringify(result.data));
            return { success: true, user: result.data };
            
        } catch(e) {
            return { error: 'Something went wrong' };
        }
    },
    
    getUser: function() {
        var u = localStorage.getItem('glammora_user');
        if (!u || u === 'null' || u === 'undefined') return null;
        try { return JSON.parse(u); } catch(e) { return null; }
    },
    
    logout: function() {
        localStorage.removeItem('glammora_user');
        localStorage.removeItem('glammora_cart');
        window.location.href = 'login.html';
    }
};

// Short helper
function getUser() {
    return Auth.getUser();
}
