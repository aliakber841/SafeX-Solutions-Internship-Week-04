# Changelog

## 2.0.0 - Hardened version
- Converted the server from `require` to ES modules (`import` / `export`).
- Split the server into `app.js` (the Express app) and `server.js` (database and listening).
- Added `helmet` with a strict Content-Security-Policy; hid `X-Powered-By`.
- Restricted CORS to the studio's own website.
- Added CSRF protection (double-submit token) and updated the React forms to send the token.
- Added rate limiting: login (5 failed tries per 15 minutes), contact form, and the whole API.
- Added `zod` validation for the contact and login forms; extra fields are rejected.
- Login cookie is now `HttpOnly`, `SameSite=Strict`, and `Secure` in production, with a 1 hour life.
- Replaced the error handler so visitors never see stack traces.
- Server now refuses to start without a strong `JWT_SECRET` and a `MONGO_URI`; seed needs a strong admin password.
- Added `Cache-Control: no-store` for the API; JSON body limit of 10 kb.
- Fixed: the Gallery page crashed if the server returned an error; it now shows a message.
- Upgraded client packages (`vite`, `@vitejs/plugin-react`, `react-router-dom`) to clear 4 `npm audit` findings.
- Added `npm run test:security` (27 checks including headers, CSRF, validation, cookies and rate limiting).

## 1.0.0 - Baseline version
- First MERN version: Home, Projects, Contact, Admin login and Messages pages.
- Intentionally without security controls, to create a baseline for the OWASP ZAP scan.
