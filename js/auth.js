// Auth System - Working Version
var Auth = {
    signup: async function(phone, password) {
        try {
            phone = phone.toString().trim();
            
            if (phone.length !== 10) {
                return { error: 'Enter valid 10-digit mobile number' };
            }
            if (password.length < 6) {
                return { error: 'Password must be at least 6 characters' };
            }
            
            // Check if number exists
            var checkResult = await supabase.from('users').select('id').eq('phone', phone).maybeSingle();
            
            if (checkResult.data) {
                return { error: 'This number is already registered' };
            }
            
            // Generate referral code
            var refCode = 'GLAM' + phone.slice(-4) + Math.random().toString(36).substring(2, 5).toUpperCase();
            
            // Hash password
            var hash = btoa(password);
            
            // Insert user
            var insertResult = await supabase.from('users').insert({
                phone: phone,
                password: hash,
                full_name: '',
                referral_code: refCode,
                total_earnings: 0,
                referral_count: 0,
                created_at: new Date().toISOString()
            }).select('*').single();
            
            if (insertResult.error) {
                console.error('Insert error:', insertResult.error);
                return { error: 'Registration failed. Try again.' };
            }
            
            if (!insertResult.data) {
                return { error: 'No data returned. Try again.' };
            }
            
            // Save user
            var userData = {
                id: insertResult.data.id,
                phone: insertResult.data.phone,
                full_name: insertResult.data.full_name || '',
                referral_code: insertResult.data.referral_code
            };
            
            localStorage.setItem('glammora_user', JSON.stringify(userData));
            
            return { success: true, user: userData };
            
        } catch(e) {
            console.error('Signup error:', e);
            return { error: 'Something went wrong. Please try again.' };
        }
    },
    
    login: async function(phone, password) {
        try {
            phone = phone.toString().trim();
            
            if (phone.length !== 10) {
                return { error: 'Enter valid 10-digit mobile number' };
            }
            if (!password) {
                return { error: 'Please enter password' };
            }
            
            // Hash password
            var hash = btoa(password);
            
            // Find user
            var result = await supabase.from('users').select('*').eq('phone', phone).eq('password', hash).maybeSingle();
            
            if (result.error) {
                console.error('Login error:', result.error);
                return { error: 'Login failed. Try again.' };
            }
            
            if (!result.data) {
                return { error: 'Invalid mobile number or password' };
            }
            
            // Save user
            var userData = {
                id: result.data.id,
                phone: result.data.phone,
                full_name: result.data.full_name || '',
                referral_code: result.data.referral_code
            };
            
            localStorage.setItem('glammora_user', JSON.stringify(userData));
            
            return { success: true, user: userData };
            
        } catch(e) {
            console.error('Login error:', e);
            return { error: 'Something went wrong. Please try again.' };
        }
    },
    
    getUser: function() {
        try {
            var u = localStorage.getItem('glammora_user');
            if (!u || u === 'null' || u === 'undefined') return null;
            return JSON.parse(u);
        } catch(e) {
            return null;
        }
    },
    
    isLoggedIn: function() {
        return this.getUser() !== null;
    },
    
    logout: function() {
        localStorage.removeItem('glammora_user');
        localStorage.removeItem('glammora_cart');
        localStorage.removeItem('glammora_ref');
        window.location.href = 'index.html';
    }
};

// Helper
function getUser() {
    return Auth.getUser();
}

console.log('Auth system loaded successfully');
