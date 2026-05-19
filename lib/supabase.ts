import { createClient } from '@supabase/supabase-js'

// Fallback to placeholder so createClient doesn't throw at module load
// when env vars are absent (e.g. Vercel build with USE_MOCK_DATA=true)
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon_key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// SERVICE_ROLE_KEY がない場合�