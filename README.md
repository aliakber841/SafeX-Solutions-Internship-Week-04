# Ansari & Sons Architects - Baseline Web App (MERN)

A small MERN app (MongoDB, Express, React, Node) for a family-owned architecture studio.
This is the **baseline version** for the Week 4 security hardening task. It works, but security
is intentionally basic. You will scan it with OWASP ZAP, fix the weaknesses, and scan again.

## Pages

| Page | Address | What it does |
|---|---|---|
| Home | `/` | Short studio introduction |
| Projects | `/projects` | Gallery of 6 projects loaded from MongoDB |
| Contact | `/contact` | Form that saves a visitor message |
| Admin login | `/login` | Email and password login for the studio owner |
| Messages | `/admin` | Admin-only list of visitor messages |

## Folder layout

```
studio-app/
  server/    Express + MongoDB backend
    models/        Project, Message, User
    routes/        projects, contact, auth
    middleware/    requireAdmin (checks the login cookie)
    server.js      main file
    seed.js        adds sample projects and the admin user
  client/    React (Vite) frontend
    src/pages/     Home, Gallery, Contact, Login, Admin
```

## What you need installed

- Node.js 18 or newer
- MongoDB running locally (Community Server), or a free MongoDB Atlas link

## How to run it

### 1. Server

```bash
cd server
npm install
cp .env.example .env        # on Windows: copy .env.example .env
npm run seed                # adds projects and the admin user
```

### 2. Client (build it once so Express can serve it)

```bash
cd ../client
npm install
npm run build
```

### 3. Start the app

```bash
cd ../server
npm start
```

Open http://localhost:5000

Admin login (from `.env`): `admin@studio.local` / `Admin@12345`

### Development mode (optional)

Run `npm run dev` in `server/` and `npm run dev` in `client/`, then open http://localhost:5173.
For ZAP scanning, always scan the built app on port 5000, because that is where your Express
security headers will apply.

## Known weaknesses in this baseline (to fix in Week 4)

These are on purpose. Confirm each one with ZAP or a manual check, then fix it.

| # | Weakness | Where | Planned fix |
|---|---|---|---|
| 1 | No security headers, `X-Powered-By: Express` is visible | `server.js` | `helmet` |
| 2 | No Content-Security-Policy | `server.js` | `helmet` CSP, test pages still work |
| 3 | Cookie has no `HttpOnly`, `Secure`, `SameSite` | `routes/auth.js` | Set cookie options |
| 4 | No CSRF protection on POST routes | contact + login | CSRF token or `SameSite` plus token |
| 5 | No rate limit on login (password guessing possible) | `routes/auth.js` | `express-rate-limit` |
| 6 | No input validation on contact and login | `routes/*.js` | `zod` or `joi` schema |
| 7 | CORS allows every website | `server.js` | Allow only your own origin |
| 8 | Error handler returns the stack trace | `server.js` | Generic message to the user, log the detail |
| 9 | JWT secret in `.env` is a weak example value | `.env` | Long random secret |
| 10 | Packages may have known vulnerabilities | both `package.json` | `npm audit`, update |

## Safety rule

Only scan this app on your own computer (localhost). Never scan other people's websites.
