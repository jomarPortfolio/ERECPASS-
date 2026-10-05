# ERecPass — Hospital Portal

ERecPass is a hospital portal with a Supabase-backed data layer. The app UI is in `index.html`; `supabase-runtime.js` handles Supabase Auth, cloud data loading/saving, and Realtime refreshes.

## Backend
- Supabase URL: `https://bfboehvgrivanmrfqquw.supabase.co`
- Tables: `profiles`, `patients`, `staff`, `appointments`, `announcements`, `help_center_messages`, `activity_logs`, `app_settings`
- RLS is enabled. Browser code uses the publishable key only.
- GitHub Pages deployment workflow: `.github/workflows/pages.yml`

## First-time admin setup
The database currently has **0 Supabase Auth users**, so there is no existing First Admin account to delete yet. The signup trigger now grants the `admin` role only to the exact email `admin2@hospital.com`; all other new signups receive `patient`. Register that email in the app and confirm it if required. A database constraint prevents more than one profile from having the `admin` role:

For setup details, staff provisioning, and known limitations, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).

## Safety status
The app's browser storage has been replaced with an in-memory cache and Supabase-backed operations. This is not yet a production-ready clinical system: existing demo data has not been migrated, admin account provisioning/deletion needs a server-side endpoint, and end-to-end tests with separate patient/staff/admin accounts are still required. Use fake patient data only until authorization, appointments, file uploads, and account workflows are fully tested.

**Never commit or expose a Supabase secret/service-role key. Rotate the key previously shared in chat.**
