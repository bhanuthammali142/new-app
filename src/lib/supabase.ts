import { createClient } from '@supabase/supabase-js'

// =============================================
// Supabase Client Initialization
// =============================================
// This client is used for:
// - Supabase Auth (sign in, sign up, session management)
// - Real-time subscriptions (Realtime)
// - File Storage (profile photos, documents)

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not configured. Some features will be unavailable.')
  console.warn('   Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
)

// Export auth client for convenience
export const supabaseAuth = supabase.auth
