//const SUPABASE_URL = 'https://gbhglongaehgspeifovp.supabase.co';
//const SUPABASE_ANON_KEY = 'sb_publishable_yMZYjsVqJ9RchfeI3uO1bQ_0g_s2mUi';
//const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// Supabase Configuration
const SUPABASE_URL = 'https://gbhglongaehgspeifovp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_yMZYjsVqJ9RchfeI3uO1bQ_0g_s2mUi';

// Create client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Make it global
window.supabase = supabaseClient;
