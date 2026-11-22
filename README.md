# KR TRADERS Billing — Phases 1–2
Setup: 1) Create Supabase project, run supabase/migrations/001_schema.sql in SQL editor.
2) Copy .env.example to .env.local and fill in (service role key stays server-side only).
3) `npm install && npm run dev`. 4) Open `/authorize?token=<DEVICE_SETUP_TOKEN>` once on each trusted device.
5) Deploy to Vercel with the same 4 env vars. Enable Supabase daily backups (Pro) or schedule `pg_dump`.
Status: built but UNTESTED (no network in build sandbox): schema, device auth, dashboard, products (add/edit/soft-delete), billing (search, barcode camera, units, cash/UPI/credit), receipts (58/80mm browser print). NOT built: Excel import, restock/stock history UI, udhaar payments, reports, bill edit/cancel, settings/export.
