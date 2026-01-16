import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ncrkvwgpdxhkgcykvsdw.supabase.co'
const supabaseAnonKey = 'sb_publishable_r0FoD6hqthai9q-WGWL8JA_RgeLe3PD' // Replace with actual anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey)