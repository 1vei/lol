import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cgfaqmljlihhctqqpewh.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnZmFxbWxqbGloaGN0cXFwZXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MjQ5MzMsImV4cCI6MjA4NTQwMDkzM30.BxM-U82W29ksXPv3DMoR81fxsYSEJstcFl--OZpsxbc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnZmFxbWxqbGloaGN0cXFwZXdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTgyNDkzMywiZXhwIjoyMDg1NDAwOTMzfQ.AzsTK3xW8t0ynDDkkjVseUZVDLikE1LbSwp-M0-B8aw',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
