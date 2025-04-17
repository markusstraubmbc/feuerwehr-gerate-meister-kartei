
import { createClient } from "npm:@supabase/supabase-js@2.43.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://pkhkswzixavvildtoxxt.supabase.co";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

export const supabase = createClient(supabaseUrl, supabaseKey);
