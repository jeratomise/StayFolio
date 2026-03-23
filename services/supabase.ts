import { createClient } from '@supabase/supabase-js';

// Configuration provided by user
const SUPABASE_URL = 'https://sjafvrqlunulksvfmsav.supabase.co';
const SUPABASE_KEY = 'sb_publishable_apv5M2SUV5IMj_Aj5MloXw_Y45p3MpI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);