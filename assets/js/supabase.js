import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://bcftqqgkixtluztnteyp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_67h9fX7eDUGOZS6ZhrGq1Q_QthipA6b';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
