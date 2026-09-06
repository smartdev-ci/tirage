import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.DRAW_SUPABASE_URL;
const supabaseKey = import.meta.env.DRAW_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);