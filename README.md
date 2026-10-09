# Ansari & Sons Architects: Web App Hardening (OWASP Top 10)

Week 4 project: harden a small MERN web app (MongoDB, Express, React, Node) for a family-owned architecture studio. The app was first scanned with OWASP ZAP, then fixed using `helmet`, `express-rate-limit`, `zod` and secure coding changes, then scanned again.

## 1. Scope statement

**In scope:** the web app running on my own computer at `http://localhost:5001`: Home, Projects gallery, Contact form, Admin login and Admin messages pages; the API routes `/api/projects`, `/api/contact`, `/api/auth`; the Express code, the React build and the npm packages of both.

**Out of scope:** hosting servers, domain names, HTTPS certificates, MongoDB server settings, and any third-party websites or services.

**Rules:** only my own local application was scanned. No other website was scanned.

**Assumptions:** the app will be served over HTTPS when deployed; there is one admin user.

## 2. Folder layout

```
studio-app/
  server/
    app.js            Express app: security headers, CORS, CSRF, rate limits, routes, error handler
    server.js         Connects to MongoDB, then starts the server
    config.js         Reads and checks the .env settings
    seed.js           Adds sample projects and the admin user
    middleware/       csrf.js, rateLimiters.js, validate.js (zod), requireAdmin.js
    routes/           projects.js, contact.js, auth.js
    models/           Project.js, Message.js, User.js
    tests/            security-check.mjs (manual test script)
  client/             React (Vite) front end
  docs/rescan-results.md   Before / after comparison sheet
  CHANGELOG.md
```

All JavaScript uses ES modules (`import` / `export`), not `require`.

## 3. How to run it

Requirements: Node.js 20.19 or newer (needed by Vite 8), and a MongoDB database (local or MongoDB Atlas).

**Step 1: create the `.env` file** inside `server/`:

```bash
cd server
cp .env.example .env       # Windows: copy .env.example .env
```

Then edit `.env`:

| Setting | What to put |
|---|---|
| `MONGO_URI` | Local: `mongodb://127.0.0.1:27017/architecture_studio`. Atlas: the `mongodb+srv://...` string from Atlas (Database, Connect, Drivers). In Atlas, also add your IP under Network Access. |
| `JWT_SECRET` | At least 32 random characters. Make one with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Your admin login. The password must be at least 12 characters. |
| `PORT`, `CLIENT_ORIGIN` | Keep `5001` and `http://localhost:5001`. |

The server refuses to start if `JWT_SECRET` or `MONGO_URI` is missing. Never upload `.env` to GitHub (it is in `.gitignore`).

**Step 2: install, seed, build, start**

```bash
cd server
npm install
npm run seed               # adds 6 projects + the admin user (replaces the "projects" collection)

cd ../client
npm install
npm run build

cd ../server
npm start                  # open http://localhost:5001
```

Scan and test the app on `http://localhost:5001`, because the security headers come from Express. (The Vite dev server on port 5173 does not run them.)

## 4. Baseline scan (before fixes)

Tool: OWASP ZAP 2.17.0, automated scan, target `http://localhost:5001`, 9 October 2026.

| # | Alert | Risk |
|---|---|---|
| 1 | Content Security Policy (CSP) Header Not Set | Medium |
| 2 | Cross-Domain Misconfiguration | Medium |
| 3 | Missing Anti-clickjacking Header | Medium |
| 4 | Server Leaks Information via "X-Powered-By" Header | Low |
| 5 | Strict-Transport-Security Header Not Set | Low |
| 6 | X-Content-Type-Options Header Missing | Low |
| 7 | Modern Web Application | Informational |
| 8 | Re-examine Cache-control Directives | Informational |

Total: 8 alert types (0 High, 3 Medium, 3 Low, 2 Informational). Part of this traffic came from the browser talking to Google services through the ZAP proxy, which is out of scope.

## 5. What was fixed

| # | Weakness | OWASP Top 10 area | Fix | Where |
|---|---|---|---|---|
| 1 | No security headers | A05 Security Misconfiguration | `helmet` adds nosniff, X-Frame-Options, HSTS and more | `app.js` |
| 2 | No Content-Security-Policy | A05 / A03 Injection (XSS) | Strict CSP: only same-origin scripts and styles, no `unsafe-inline`, `frame-ancestors 'none'` | `app.js` |
| 3 | `X-Powered-By: Express` visible | A05 | `app.disable("x-powered-by")` and helmet | `app.js` |
| 4 | CORS open to every website | A05 | CORS allows only `CLIENT_ORIGIN` | `app.js` |
| 5 | No CSRF protection | A01 Broken Access Control | Double-submit token: cookie plus `X-CSRF-Token` header must match | `middleware/csrf.js`, `client/src/api.js` |
| 6 | Unlimited login tries | A07 Authentication Failures | `express-rate-limit`: 5 failed logins per 15 minutes; contact form 5 per hour; API 200 per 15 minutes | `middleware/rateLimiters.js` |
| 7 | No input validation | A03 Injection | `zod` schemas: types, lengths, email format, no extra fields (also blocks NoSQL injection objects) | `middleware/validate.js` |
| 8 | Login cookie without flags | A02 / A07 | `HttpOnly`, `SameSite=Strict`, `Secure` in production, 1 hour life | `routes/auth.js` |
| 9 | Stack traces sent to visitors | A05 / A09 | Generic error message to the visitor; details only in the server log | `app.js` |
| 10 | Weak, hard-coded secrets and passwords | A02 Cryptographic Failures | Server refuses to start without a 32+ character `JWT_SECRET`; seed requires a 12+ character admin password; bcrypt cost 12 | `config.js`, `seed.js` |
| 11 | API responses could be cached | A04 Insecure Design | `Cache-Control: no-store` on `/api`; static files cached by name, HTML never cached | `app.js` |
| 12 | Oversized request bodies | A04 | JSON body limit of 10 kb | `app.js` |
| 13 | Token and role checks too loose | A01 | JWT algorithm fixed to HS256; admin role checked | `middleware/requireAdmin.js` |
| 14 | Vulnerable npm packages | A06 Vulnerable Components | See section 7 | `client/package.json` |

## 6. Threat model

| # | Threat | What could happen | Mitigation | Implemented and tested here |
|---|---|---|---|---|
| 1 | Brute-force login | Attacker tries thousands of passwords | Rate limit on login, same error for wrong email or password | **Yes (see 6.1)** |
| 2 | CSRF | Another website makes a logged-in admin's browser send a request | CSRF token plus `SameSite=Strict` cookie | **Yes (see 6.2)** |
| 3 | XSS | Attacker injects a script into a page | Strict CSP, React escapes output, zod validation | **Yes (see 6.3)** |
| 4 | Cookie theft | Session cookie stolen by a script or read on the network | `HttpOnly`, `SameSite`, `Secure` (production) | Yes (checked by the test script) |
| 5 | NoSQL injection | Login with `{"$gt": ""}` to skip the password check | `zod` accepts only strings | Yes (checked by the test script) |
| 6 | Vulnerable packages | Known bugs in old libraries | `npm audit` and upgrades | Yes (section 7) |
| 7 | Information leak | Stack traces or server names help the attacker | Safe error handler, hidden `X-Powered-By` | Yes (checked by the test script) |

### 6.1 Brute-force login (rate limit)

```js
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
});
```

Test: `npm run test:security` sends repeated failed logins. The first ones return 400, then the server answers **429** and keeps blocking.

### 6.2 CSRF (token check)

```js
const tokensMatch = crypto.timingSafeEqual(cookieBuffer, headerBuffer);
if (!tokensMatch) {
  return res.status(403).json({ error: "Invalid security token. Please refresh the page." });
}
```

Test: a POST without the token and a POST with a wrong token both return **403**. The real contact and login forms work because `client/src/api.js` sends the token.

### 6.3 XSS (Content-Security-Policy)

```js
scriptSrc: ["'self'"],
styleSrc: ["'self'"],
objectSrc: ["'none'"],
frameAncestors: ["'none'"],
```

Test: the test script checks the CSP header has no `unsafe-inline`. Loading Home, Projects, Contact and Login in the browser shows no CSP errors in the console.

## 7. Dependency audit (`npm audit`)

| Package folder | Before | Action | After |
|---|---|---|---|
| `server/` | not vulnerable at install time | Installed current versions of all packages | 0 vulnerabilities |
| `client/` | 4 vulnerabilities (3 moderate, 1 high) in `vite`/`esbuild` and `react-router-dom` | Upgraded `vite` to 8.x, `@vitejs/plugin-react` to 6.x, `react-router-dom` to 7.x; rebuilt and checked the pages | 0 vulnerabilities |

Trade-off: Vite 8 needs Node.js 20.19 or newer.

## 8. How to test

1. Start the server: `npm start` (inside `server/`).
2. In a second terminal inside `server/`: `npm run test:security`.
   To also check the real login cookie flags: set `TEST_ADMIN_EMAIL` and `TEST_ADMIN_PASSWORD` first.
3. Restart the server after the test, because the rate-limit test uses up the login tries.
4. Run the ZAP scan again on `http://localhost:5001`, save the report, and fill in `docs/rescan-results.md`.

## 9. Limitations and future improvements

- HSTS only works over HTTPS, so on plain `http://localhost` ZAP may still report it. It will be effective after deployment with a certificate.
- The rate limiter keeps counts in server memory and is per IP address. Behind a reverse proxy it needs `trust proxy`, and with several servers it needs a shared store such as Redis.
- Only one admin account exists. With more time: password reset, account lockout alerts, two-factor login, and audit logging.
- The CSRF token is a simple custom implementation. A maintained library would be a good replacement in a larger app.
- ZAP's automated scan does not log in, so the admin pages were checked with the test script instead of ZAP.
