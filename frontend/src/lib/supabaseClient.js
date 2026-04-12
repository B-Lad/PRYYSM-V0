import { createClient } from '@supabase/supabase-js';

// 👇 REPLACE THESE WITH YOUR KEYS FROM SUPABASE SETTINGS
const supabaseUrl = 'https://xdsnetivozgonxuzdbhg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkc25ldGl2b3pnb254dXpkYmhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MTE3NTQsImV4cCI6MjA5MTQ4Nzc1NH0.vzrOUI8EsMYLIHsOxBVM4kRCuw4RWceIoqrHk0PiKuA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);