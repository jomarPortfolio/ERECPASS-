# ERecPass Supabase Setup

## Current repository wiring
- `index.html` is the app entry point.
- `supabase-runtime.js` replaces browser-persistent storage with an in-memory cache backed by Supabase queries/writes.
- `supabase-client.js` contains only the public browser client configuration. The HTML currently initializes the same client inline.
- Supabase project: `https://bfboehvgrivanmrfqquw.supabase.co`.
- Tables: `profiles`, `patients`, `staff`, `appointments`, `announcements`, `help_center_messages`, `activity_logs`, `app_settings`.
- RLS is enabled; a patient-profile update RPC is restricted to the authenticated user's own profile.
- Realtime publication includes patients, staff, appointments, announcements, Help Center messages, and activity logs.

## Main Admin and account setup
- A database constraint now permits **at most one** profile with the `admin` role. This prevents a second admin role from being assigned while another admin exists.
- At the last check, Supabase Auth had **0 users** and `profiles` had **0 admin profiles**. There is currently no First Admin Auth account to permanently delete; deleting a non-existent account is not possible.
- Register/create the account intended to be the Second/Main Admin, then promote that exact trusted email using the SQL below. Do not give the admin role to any other account.

## First-time setup required
1. In Supabase **Authentication → Providers → Email**, choose whether email confirmation is enabled. If enabled, users must confirm their email before logging in.
2. Create the first admin account through Supabase Auth (or register a patient account in the app first).
3. In **SQL Editor**, promote that exact email to admin. Replace the example email before running:
   ```sql
   update public.profiles p
   set role = 'admin', active = true
   from auth.users u
   where p.id = u.id
     and lower(u.email) = lower('YOUR_ADMIN_EMAIL@example.com');
   ```
   Run this only for the trusted administrator account you control. The app intentionally does not let users choose their own role.
4. Create staff Auth users through **Authentication → Users → Add user**, then assign their role and link their staff row in SQL. Replace the email and UUID with the actual user:
   ```sql
   update public.profiles p
   set role = 'staff', active = true
   from auth.users u
   where p.id = u.id
     and lower(u.email) = lower('STAFF_EMAIL@example.com');

   update public.staff
   set user_id = (select id from auth.users where lower(email)=lower('STAFF_EMAIL@example.com')),
       email = 'STAFF_EMAIL@example.com'
   where id = 'STAFF_ROW_ID';
   ```
   Ensure a staff row with that ID exists first.
5. Open **Settings → Pages** in GitHub and confirm Pages is enabled for the repository. The workflow file deploys from GitHub Actions.

## Current limitations — do not use real patient data yet
- Existing demo/local browser data has not been imported into Supabase. No plaintext demo passwords were migrated.
- Account creation/deletion and password changes for other users need a server-side admin endpoint; editing a patient/staff row alone does not create or delete its Supabase Auth user.
- Verify appointment cancellation/deletion, Help Center threads, photo uploads/storage permissions, and account management end-to-end before production.
- No production end-to-end test has been run with separate patient, staff, and admin accounts.
- Use only fake/test patient data until the above checks are complete.

## Security
- Only use the Supabase publishable key in browser files.
- Never put the Supabase secret/service-role key in HTML, JavaScript, GitHub, or screenshots.
- A secret key was exposed in chat; rotate it in Supabase Dashboard.
- Keep RLS enabled and test every role separately.
