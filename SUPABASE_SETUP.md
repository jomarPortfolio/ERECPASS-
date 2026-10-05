# ERecPass Backend Setup Status

## Completed
- Supabase project exists at `https://bfboehvgrivanmrfqquw.supabase.co`.
- Eight tables were created: profiles, patients, staff, appointments, announcements, help_center_messages, activity_logs, app_settings.
- RLS is enabled on all eight tables.
- A role helper and new-user profile trigger were created.

## Not yet completed
- The original ERecPass HTML source is not present in this GitHub repository yet.
- The app's current localStorage CRUD functions have not been fully switched to Supabase.
- Existing patient/staff records have not been migrated.
- No production accounts have been provisioned or tested.
- GitHub Pages cannot serve the app until an `index.html` entry point is committed.

## Required script order in index.html
Place these before the app's JavaScript that calls Supabase:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="./supabase-client.js"></script>
```

Then update the app's data/auth functions to use `window.erecpassSupabase`. Merely adding this client file does not automatically migrate existing localStorage data or CRUD functions.

## Security notes
- Keep RLS enabled and test with patient, staff, and admin users separately.
- Do not store passwords in localStorage or migrate plaintext demo passwords.
- Do not place service_role or secret keys in this repository.
- Avoid using real patient information until authorization, file storage access, and account recovery have been tested.
