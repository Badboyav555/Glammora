// Supabase Configuration
const SUPABASE_URL = 'https://gbhglongaehgspeifovp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_yMZYjsVqJ9RchfeI3uO1bQ_0g_s2mUi';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other files
window.supabaseClient = supabase;

console.log('Supabase initialized');
