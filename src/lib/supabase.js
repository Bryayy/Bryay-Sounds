import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xgbscdcwcwfiszhvbakg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnYnNjZGN3Y3dmaXN6aHZiYWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3OTYwMzcsImV4cCI6MjA5MjM3MjAzN30.9Fj1hV22E1fKMrzgh1T531lHYST9Spvz2fp18vHisAQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
