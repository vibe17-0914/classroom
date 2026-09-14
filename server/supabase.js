const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

let supabase = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false
      }
    });
    console.log('✅ Supabase Client initialized successfully with:', supabaseUrl);
  } catch (err) {
    console.error('❌ Failed to initialize Supabase client:', err.message);
    supabase = null;
  }
} else {
  console.log('ℹ️ Supabase environment variables not detected. Running in Local JSON Mode.');
}

module.exports = supabase;
