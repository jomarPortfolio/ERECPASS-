# ERecPass — Hospital Mobile Application

ERecPass is the hospital portal project. The Supabase project and database schema have been created, but the original app HTML has **not yet been committed to this repository**, and its localStorage operations have not yet been migrated to Supabase. Do not treat the app as production-ready until those steps and security testing are complete.

## Backend
- Supabase project URL: `https://bfboehvgrivanmrfqquw.supabase.co`
- Region: Southeast Asia (Singapore)
- Tables created: `profiles`, `patients`, `staff`, `appointments`, `announcements`, `help_center_messages`, `activity_logs`, `app_settings`
- Row Level Security (RLS) is enabled on all eight tables.

## Configure the browser client
1. In Supabase, open **Project Settings → API** and copy the **publishable key** (or legacy anon key).
2. Put that key in `supabase-client.js` where indicated.
3. Include the Supabase v2 CDN script and `supabase-client.js` in the app HTML before any code that uses `window.erecpassSupabase`.
4. Never put a `service_role` or secret key in browser code or GitHub.

## Important next steps
- Commit the app's actual `index.html` and assets. The repository currently has no app entry point.
- Connect sign-up/login to Supabase Auth.
- Migrate patient, staff, appointment, lab, medication, announcement, and Help Center reads/writes from localStorage to Supabase.
- Test RLS using separate patient, staff, and admin accounts before real patient data is used.
- Enable GitHub Pages after `index.html` is present.

## GitHub Pages
After the app files are committed, open **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`, and save.
