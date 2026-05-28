// Custom Authentication System
class CustomAuth {
    // Sign Up
    static async signUp(phone, password) {
        try {
            console.log('Attempting signup for:', phone);
            
            // Validate
            if (!phone || phone.length !== 10) {
                return { success: false, error: 'Enter valid 10-digit mobile number' };
            }
            if (!password || password.length < 6) {
                return { success: false, error: 'Password must be at least 6 characters' };
            }
            
            // Check if phone already registered
            const { data: existing, error: checkError } = await supabase
                .from('users')
                .select('id, phone')
                .eq('phone', phone)
                .maybeSingle();
            
            if (checkError) {
                console.error('Check error:', checkError);
                return { success: false, error: 'Connection error. Try again.' };
            }
            
            if (existing) {
                return { success: false, error: 'This number is already registered' };
            }
            
            // Generate referral code
            const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
            const referralCode = 'GLAM' + phone.slice(-4) + randomStr;
            
            // Hash password
            const passwordHash = btoa(password);
            
            console.log('Creating user...');
            
            // Insert into database
            const { data, error } = await supabase
                .from('users')
                .insert({
                    phone: phone,
                    password: passwordHash,
                    full_name: '',
                    referral_code: referralCode,
                    total_earnings: 0,
                    referral_count: 0,
                    created_at: new Date().toISOString()
                })
                .select('*')
                .single();
            
            if (error) {
                console.error('Insert error:', error);
                return { success: false, error: 'Registration failed. Try again.' };
            }
            
            if (!data) {
                return { success: false, error: 'No data returned. Try again.' };
            }
            
            console.log('User created:', data);
            
            // Save to localStorage
            const userData = {
                id: data.id,
                phone: data.phone,
                full_name: data.full_name || '',
                referral_code: data.referral_code,
                total_earnings: data.total_earnings || 0,
                referral_count: data.referral_count || 0
            };
            
            localStorage.setItem('glammora_user', JSON.stringify(userData));
            
            return { success: true, user: userData };
            
        } catch (err) {
            console.error('Signup error:', err);
            return { success: false, error: 'Something went wrong. Try again.' };
        }
    }
    
    // Sign In
    static async signIn(phone, password) {
        try {
            console.log('Attempting login for:', phone);
            
            // Validate
            if (!phone || phone.length !== 10) {
                return { success: false, error: 'Enter valid mobile number' };
            }
            if (!password) {
                return { success: false, error: 'Enter password' };
            }
            
            // Hash password
            const passwordHash = btoa(password);
            
            console.log('Searching user...');
            
            // Find user
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('phone', phone)
                .eq('password', passwordHash)
                .maybeSingle();
            
            if (error) {
                console.error('Login error:', error);
                return { success: false, error: 'Connection error. Try again.' };
            }
            
            if (!data) {
                return { success: false, error: 'Invalid phone number or password' };
            }
            
            console.log('User found:', data);
            
            // Save to localStorage
            const userData = {
                id: data.id,
                phone: data.phone,
                full_name: data.full_name || '',
                referral_code: data.referral_code,
                total_earnings: data.total_earnings || 0,
                referral_count: data.referral_count || 0
            };
            
            localStorage.setItem('glammora_user', JSON.stringify(userData));
            
            return { success: true, user: userData };
            
        } catch (err) {
            console.error('Login error:', err);
            return { success: false, error: 'Something went wrong. Try again.' };
        }
    }
    
    // Get Current User
    static getCurrentUser() {
        try {
            const userStr = localStorage.getItem('glammora_user');
            if (!userStr || userStr === 'null') return null;
            return JSON.parse(userStr);
        } catch (e) {
            return null;
        }
    }
    
    // Check if logged in
    static isLoggedIn() {
        return this.getCurrentUser() !== null;
    }
    
    // Sign Out
    static signOut() {
        localStorage.removeItem('glammora_user');
        localStorage.removeItem('glammora_cart');
        localStorage.removeItem('glammora_ref');
    }
    
    // Get user profile
    static async getProfile(userId) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        return data;
    }
}

// Helper functions
function getCurrentUser() {
    return CustomAuth.getCurrentUser();
}

function isLoggedIn() {
    return CustomAuth.isLoggedIn();
}

// Make available globally
window.CustomAuth = CustomAuth;
