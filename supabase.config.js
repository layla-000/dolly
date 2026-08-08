const DOLLY_SUPABASE_URL = "https://yhliabpgjnraozzfpxgy.supabase.co";
const DOLLY_SUPABASE_KEY = "sb_publishable_kNDndAby5yjCpplSbzAGZA_hAF9K3Fl";

window.DollySupabase = supabase.createClient(
  DOLLY_SUPABASE_URL,
  DOLLY_SUPABASE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
