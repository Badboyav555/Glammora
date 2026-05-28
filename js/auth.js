// Authentication System
class Auth {
    static async signUp(phone, password) {
        try {
            const email = `${phone}@app.com`;
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        phone: phone
                    }
                }
            });
            
            if (error) throw error;
            
            // Create user profile in database
            if (data.user) {
                await this.createUserProfile(data.user, phone);
                localStorage.setItem('glammora_user', JSON.stringify(data.user));
            }
            
            return { success: true, user: data.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    static async signIn(phone, password) {
        try {
            const email = `${phone}@app.com`;
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            localStorage.setItem('glammora_user', JSON.stringify(data.user));
            return { success: true, user: data.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    static async signOut() {
        await supabase.auth.signOut();
        localStorage.removeItem('glammora_user');
        window.location.href = 'index.html';
    }
    
    static async createUserProfile(user, phone) {
        const referralCode = this.generateReferralCode(phone);
        
        const { error } = await supabase
            .from('profiles')
            .insert({
                id: user.id,
                phone: phone,
                referral_code: referralCode,
                created_at: new Date().toISOString()
            });
            
        if (error) console.error('Error creating profile:', error);
    }
    
    static generateReferralCode(phone) {
        const prefix = 'GLAM';
        const suffix = phone.slice(-4);
        const random = Math.random().toString(36).substring(2, 5).toUpperCase();
        return `${prefix}${suffix}${random}`;
    }
    
    static async getProfile(userId) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
        return data;
    }
}

// Login Page Initialization
if (window.location.pathname.includes('login.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const phone = document.getElementById('loginPhone').value;
                const password = document.getElementById('loginPassword').value;
                
                if (phone.length < 10) {
                    showToast('Please enter a valid mobile number', 'error');
                    return;
                }
                
                const result = await Auth.signIn(phone, password);
                if (result.success) {
                    showToast('Login successful!');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                } else {
                    showToast(result.error, 'error');
                }
            });
        }
        
        if (signupForm) {
            signupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const phone = document.getElementById('signupPhone').value;
                const password = document.getElementById('signupPassword').value;
                const confirmPassword = document.getElementById('signupConfirmPassword').value;
                
                if (phone.length < 10) {
                    showToast('Please enter a valid mobile number', 'error');
                    return;
                }
                
                if (password !== confirmPassword) {
                    showToast('Passwords do not match', 'error');
                    return;
                }
                
                if (password.length < 6) {
                    showToast('Password must be at least 6 characters', 'error');
                    return;
                }
                
                const result = await Auth.signUp(phone, password);
                if (result.success) {
                    showToast('Account created successfully!');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                } else {
                    showToast(result.error, 'error');
                }
            });
        }
    });
}
