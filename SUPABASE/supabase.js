import { createClient } from
'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://nhjlxaoshrlgfancmvzr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_g6aQRWjb8KsM1WnvffP5CA_dN7OOOdX';

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);