import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Never throw on missing env: prerender and CI must still mount the SPA so
// SEOManager can emit page meta. Live data degrades; SEO shell must not.
if (!supabaseUrl || !supabaseKey) {
    console.warn(
        'Missing Supabase environment variables. VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set. Using placeholder client — live data unavailable.'
    );
}

export const supabase = createClient<Database>(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder'
);
