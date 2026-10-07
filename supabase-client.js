/* ERecPass Supabase browser client
 * Use only the Supabase publishable key (or legacy anon key) here.
 * NEVER put a service_role/secret key in browser code.
 */
(function () {
  const SUPABASE_URL = "https://bfboehvgrivanmrfqquw.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_BKQ_gEGu54VUztykzIIfEQ_2IMIoMb_";

  function create() {
    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      console.error("ERecPass: Supabase JS library is unavailable.");
      return false;
    }
    if (!SUPABASE_PUBLISHABLE_KEY || SUPABASE_PUBLISHABLE_KEY.includes("PASTE_YOUR_")) {
      console.warn("ERecPass: Supabase publishable key is missing.");
      return false;
    }
    try {
      window.erecpassSupabase = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      );
      window.dispatchEvent(new Event("erecpass-supabase-ready"));
      return true;
    } catch (e) {
      console.error("ERecPass: Could not initialize Supabase client.", e);
      return false;
    }
  }

  if (create()) return;

  // Fallback CDN so a temporary jsDelivr failure does not disable every account button.
  const fallback = document.createElement("script");
  fallback.src = "https://unpkg.com/@supabase/supabase-js@2";
  fallback.onload = create;
  fallback.onerror = function () {
    console.error("ERecPass: Supabase fallback CDN also failed to load.");
  };
  document.head.appendChild(fallback);
})();
