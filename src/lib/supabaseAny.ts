/**
 * Helper to use supabase with tables not yet in the auto-generated types.
 * Use this only for tables created via migrations that haven't synced yet.
 */
import { supabase } from '@/integrations/supabase/client';
export const db = supabase as any;
