# KR TRADERS Billing — Phase 1
Setup: 1) Create Supabase project, run supabase/migrations/001_schema.sql in SQL editor.
2) Copy .env.example to .env.local and fill in (service role key stays server-side only).
3) `npm install && npm run dev`. 4) Open `/authorize?token=<DEVICE_SETUP_TOKEN>` once on each trusted device.
5) Deploy to Vercel with the same 4 env vars. Enable Supabase daily backups (Pro) or schedule `pg_dump`.
Status: Phase 1 only (schema, RLS, device auth, billing RPC, dashboard). NOT yet built/tested: UI for billing, products, inventory, udhaar, reports, receipts, settings.
