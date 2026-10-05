# ERecPass — Hospital Portal

ERecPass is a hospital portal with a Supabase-backed data layer. The app UI is in `index.html`; `supabase-runtime.js` handles Supabase Auth, cloud data loading/saving, and Realtime refreshes.

## Backend
- Supabase URL: `https://bfboehvgrivanmrfqquw.supabase.co`
- Tables: `profiles`, `patients`, `staff`, `appointments`, `announcements`, `help_center_messages`, `activity_logs`, `app_settings`
- RLS is enabled. Browser code uses the publishable key only.
- GitHub Pages deployment workflow: `.github/workflows/pages.yml`

## First-time admin setup
The database currently has **0 Supabase Auth users**, so there is no existing First Admin account to delete yet. Register the account intended to become the Second/Main Admin (confirm email if required), then promote that exact trusted email in Supabase SQL Editor. A database constraint now prevents more than one profile from having the `admin` role:

```sql
update public.profiles p
set role = 'admin', active = true
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('YOUR_ADMIN_EMAIL@example.com');
```

Replace the example email before running. Never allow an untrusted user to be assigned the admin role.

For setup details, staff provisioning, and known limitations, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).

## Safety status
The app's browser storage has been replaced with an in-memory cache and Supabase-backed operations. This is not yet a production-ready clinical system: existing demo data has not been migrated, admin account provisioning/deletion needs a server-side endpoint, and end-to-end tests with separate patient/staff/admin accounts are still required. Use fake patient data only until authorization, appointments, file uploads, and account workflows are fully tested.

**Never commit or expose a Supabase secret/service-role key. Rotate the key previously shared in chat.**
