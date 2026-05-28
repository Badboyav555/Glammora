class CustomAuth {
    static async signUp(phone, password) {
        const { data: existing } = await supabase.from('users').select('id').eq('phone', phone).single();
        if (existing) return { success: false, error: 'Number already registered' };
        
        const refCode = 'GLAM' + phone.slice(-4) + Math.random().toString(36).substring(2, 5).toUpperCase();
        const hash = btoa(password);
        
        const { data, error } = await supabase.from('users').insert({
            phone, password: hash, referral_code: refCode, created_at: new Date().toISOString()
        }).select().single();
        
        if (error) return { success: false, error: 'Signup failed' };
        
        localStorage.setItem('glammora_user', JSON.stringify(data));
        return { success: true, user: data };
    }
    
    static async signIn(phone, password) {
        const hash = btoa(password);
        const { data, error } = await supabase.from('users').select('*').eq('phone', phone).eq('password', hash).single();
        
        if (error || !data) return { success: false, error: 'Invalid phone or password' };
        
        localStorage.setItem('glammora_user', JSON.stringify(data));
        return { success: true, user: data };
    }
    
    static getCurrentUser() {
        return JSON.parse(localStorage.getItem('glammora_user') || 'null');
    }
    
    static signOut() {
        localStorage.removeItem('glammora_user');
        localStorage.removeItem('glammora_cart');
    }
}

function getCurrentUser() { return CustomAuth.getCurrentUser(); }
