// Referral System
class Referral {
    static saveReferralCode(code) {
        localStorage.setItem('glammora_ref', code);
    }
    
    static getReferralCode() {
        return localStorage.getItem('glammora_ref');
    }
    
    static async getUserReferralCode(userId) {
        const { data, error } = await supabase
            .from('profiles')
            .select('referral_code')
            .eq('id', userId)
            .single();
            
        return data?.referral_code;
    }
    
    static async getReferralEarnings(userId) {
        const { data, error } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('referred_by', userId)
            .eq('status', 'Delivered');
            
        if (error) return 0;
        
        // 10% commission
        return data.reduce((total, order) => total + (order.total_amount * 0.1), 0);
    }
    
    static async getReferralCount(userId) {
        const { count, error } = await supabase
            .from('orders')
            .select('*', { count: 'exact' })
            .eq('referred_by', userId)
            .eq('status', 'Delivered');
            
        return count || 0;
    }
    
    static async processReferral(userId, orderId) {
        const referralCode = this.getReferralCode();
        if (!referralCode) return;
        
        // Find the referrer
        const { data: referrer } = await supabase
            .from('profiles')
            .select('id')
            .eq('referral_code', referralCode)
            .single();
            
        if (referrer && referrer.id !== userId) {
            // Update order with referrer info
            await supabase
                .from('orders')
                .update({ referred_by: referrer.id })
                .eq('id', orderId);
                
            // Clear referral code from storage
            localStorage.removeItem('glammora_ref');
        }
    }
}

// Initialize referral on profile page
if (window.location.pathname.includes('profile.html')) {
    document.addEventListener('DOMContentLoaded', async () => {
        const user = getCurrentUser();
        if (!user) return;
        
        const referralSection = document.getElementById('referralSection');
        if (referralSection) {
            const referralCode = await Referral.getUserReferralCode(user.id);
            const earnings = await Referral.getReferralEarnings(user.id);
            const referralCount = await Referral.getReferralCount(user.id);
            const referralLink = `${APP_CONFIG.referralBase}${referralCode}`;
            
            referralSection.innerHTML = `
                <div class="glass-card referral-card">
                    <h3>Refer & Earn 💸</h3>
                    <div class="referral-stats">
                        <div class="stat">
                            <span class="stat-value">₹${earnings.toFixed(2)}</span>
                            <span class="stat-label">Total Earnings</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">${referralCount}</span>
                            <span class="stat-label">Referred Orders</span>
                        </div>
                    </div>
                    <div class="referral-link-box">
                        <input type="text" value="${referralLink}" readonly id="referralLink">
                        <button onclick="copyReferralLink()" class="btn-primary">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                    </div>
                    <button onclick="shareWhatsApp('${referralLink}')" class="btn-outline" style="width:100%; margin-top:12px;">
                        <i class="fab fa-whatsapp"></i> Share on WhatsApp
                    </button>
                </div>
            `;
        }
    });
}

function copyReferralLink() {
    const linkInput = document.getElementById('referralLink');
    linkInput.select();
    document.execCommand('copy');
    showToast('Referral link copied! 📋');
}

function shareWhatsApp(link) {
    const message = `Hey! Check out Glammora for amazing fashion deals! 🛍️\n\nUse my referral link: ${link}\n\nGet exclusive discounts on your first order! ✨`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}
