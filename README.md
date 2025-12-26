# staking-5f42-0427

Minimal Express backend plus static frontend (served from `public/`). The API writes lightweight JSON state to a writable `data` directory; on Vercel this uses `/tmp` by default.

## Local development
1) Install deps: `npm install`
2) Run: `npm start`
3) API: `http://localhost:4001/api/*` and UI: `http://localhost:4001/`

## Environment variables
Set these in Vercel or a local `.env`:
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, `EMAIL_TO` (email notifications)
- `COUNTDOWN_END_DATE` and `COUNTDOWN_FALLBACK_DAYS` (optional)
- `DATA_DIR` (optional; defaults to `/tmp/data` on Vercel or `./data` locally)

## Deploy to Vercel
The repo includes `vercel.json` so you can import directly:
- Framework: “Other”/“Express”; Root: `./`; Build Command: leave empty.
- Routes: `/api/*` go to `server.js`; all other paths serve `public`.
- Add env vars above, then click **Deploy**.
