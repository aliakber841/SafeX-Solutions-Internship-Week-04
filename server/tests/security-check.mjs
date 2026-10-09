// Security check script for the hardened studio app.
//
// How to use:
//   1. Start the server (npm start).
//   2. In another terminal, inside the server folder: npm run test:security
//
// It only talks to YOUR local app. Default address: http://localhost:5001
// Optional: BASE_URL=http://localhost:5001 TEST_ADMIN_EMAIL=... TEST_ADMIN_PASSWORD=... npm run test:security
//
// Important: the last test makes the login rate limit trigger.
// Restart the server afterwards (the counter resets) before you log in again.

const BASE_URL = process.env.BASE_URL || "http://localhost:5001";

let passed = 0;
let failed = 0;

function check(name, condition, extra) {
  if (condition) {
    passed = passed + 1;
    console.log("PASS  " + name);
  } else {
    failed = failed + 1;
    console.log("FAIL  " + name + (extra ? "  -> " + extra : ""));
  }
}

// Turns the Set-Cookie headers into a single "Cookie" header text.
function makeCookieHeader(response) {
  const setCookies = response.headers.getSetCookie();
  const pairs = [];

  for (const item of setCookies) {
    pairs.push(item.split(";")[0]);
  }

  return pairs.join("; ");
}

async function getCsrf() {
  const response = await fetch(BASE_URL + "/api/csrf-token");
  const data = await response.json();
  const cookie = makeCookieHeader(response);
  return { token: data.csrfToken, cookie: cookie, response: response };
}

async function postJson(url, body, csrf) {
  const headers = { "Content-Type": "application/json" };

  if (csrf) {
    headers["X-CSRF-Token"] = csrf.token;
    headers["Cookie"] = csrf.cookie;
  }

  return fetch(BASE_URL + url, {
    method: "POST",
    headers: headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function run() {
  console.log("Checking " + BASE_URL + "\n");

  // ---------- 1. Security headers ----------
  const home = await fetch(BASE_URL + "/");
  const csp = home.headers.get("content-security-policy") || "";

  check("CSP header is set", csp.length > 0);
  check("CSP has default-src 'self'", csp.includes("default-src 'self'"));
  check("CSP blocks framing (frame-ancestors 'none')", csp.includes("frame-ancestors 'none'"));
  check("CSP has no 'unsafe-inline'", !csp.includes("unsafe-inline"));
  check("X-Content-Type-Options is nosniff", home.headers.get("x-content-type-options") === "nosniff");
  check("Anti-clickjacking header (X-Frame-Options) is set", home.headers.get("x-frame-options") !== null);
  check("Strict-Transport-Security header is set", home.headers.get("strict-transport-security") !== null);
  check("X-Powered-By header is hidden", home.headers.get("x-powered-by") === null);

  // ---------- 2. CORS ----------
  const corsResponse = await fetch(BASE_URL + "/api/csrf-token", {
    headers: { Origin: "http://evil.example" },
  });
  const allowedOrigin = corsResponse.headers.get("access-control-allow-origin");
  const corsIsOpen = allowedOrigin === "*" || allowedOrigin === "http://evil.example";
  check("CORS does not allow other websites", !corsIsOpen, "got: " + allowedOrigin);

  // ---------- 3. Cache control on API ----------
  const csrf = await getCsrf();
  check("API responses use Cache-Control: no-store", (csrf.response.headers.get("cache-control") || "").includes("no-store"));

  // ---------- 4. Cookie flags (CSRF cookie) ----------
  const csrfCookieText = csrf.response.headers.getSetCookie().join(" ").toLowerCase();
  check("CSRF cookie is HttpOnly", csrfCookieText.includes("httponly"));
  check("CSRF cookie is SameSite=Strict", csrfCookieText.includes("samesite=strict"));

  // ---------- 5. CSRF protection ----------
  const noToken = await postJson("/api/contact", { name: "Test User", email: "test@example.com", message: "Hello from the test script" }, null);
  check("POST without CSRF token is rejected (403)", noToken.status === 403, "status " + noToken.status);

  const wrongToken = await postJson("/api/contact", { name: "Test User" }, { token: "wrong-token-value", cookie: csrf.cookie });
  check("POST with wrong CSRF token is rejected (403)", wrongToken.status === 403, "status " + wrongToken.status);

  // ---------- 6. Input validation ----------
  const emptyContact = await postJson("/api/contact", {}, csrf);
  check("Contact form: empty input is rejected (400)", emptyContact.status === 400, "status " + emptyContact.status);

  const badEmail = await postJson("/api/contact", { name: "Test User", email: "not-an-email", message: "This message is long enough" }, csrf);
  check("Contact form: bad email is rejected (400)", badEmail.status === 400, "status " + badEmail.status);

  const longMessage = await postJson("/api/contact", { name: "Test User", email: "test@example.com", message: "a".repeat(2000) }, csrf);
  check("Contact form: 2000-character message is rejected (400)", longMessage.status === 400, "status " + longMessage.status);

  const extraField = await postJson("/api/contact", { name: "Test User", email: "test@example.com", message: "This message is long enough", role: "admin" }, csrf);
  check("Contact form: unexpected extra field is rejected (400)", extraField.status === 400, "status " + extraField.status);

  const injection = await postJson("/api/auth/login", { email: { $gt: "" }, password: { $gt: "" } }, csrf);
  check("Login: NoSQL injection object is rejected (400)", injection.status === 400, "status " + injection.status);

  // ---------- 7. Safe errors ----------
  const brokenJson = await postJson("/api/contact", "{ this is not json", csrf);
  const brokenText = await brokenJson.text();
  check("Broken JSON gives a clean 400", brokenJson.status === 400, "status " + brokenJson.status);
  check("Error response has no stack trace", !brokenText.includes("at ") && !brokenText.includes("node_modules"));

  const notFound = await fetch(BASE_URL + "/api/does-not-exist");
  check("Unknown API address gives JSON 404", notFound.status === 404);

  // ---------- 8. Admin route is protected ----------
  const adminNoLogin = await fetch(BASE_URL + "/api/contact");
  check("Reading messages without login is rejected (401)", adminNoLogin.status === 401, "status " + adminNoLogin.status);

  // ---------- 9. Optional: real login cookie flags ----------
  const testEmail = process.env.TEST_ADMIN_EMAIL;
  const testPassword = process.env.TEST_ADMIN_PASSWORD;

  if (testEmail && testPassword) {
    const loginResponse = await postJson("/api/auth/login", { email: testEmail, password: testPassword }, csrf);
    check("Admin login works", loginResponse.status === 200, "status " + loginResponse.status);

    const loginCookies = loginResponse.headers.getSetCookie().join(" ").toLowerCase();
    check("Login cookie is HttpOnly", loginCookies.includes("httponly"));
    check("Login cookie is SameSite=Strict", loginCookies.includes("samesite=strict"));
  } else {
    console.log("SKIP  Login cookie flags (set TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD to run this)");
  }

  // ---------- 10. Rate limit on login (keep this last) ----------
  // Invalid bodies count as failed tries, so no database is needed for this test.
  const statuses = [];

  for (let i = 1; i <= 7; i = i + 1) {
    const response = await postJson("/api/auth/login", {}, csrf);
    statuses.push(response.status);
  }

  console.log("      login attempt statuses: " + statuses.join(", "));
  check("Login is blocked (429) after too many failed tries", statuses.includes(429), "statuses " + statuses.join(","));

  console.log("\nResult: " + passed + " passed, " + failed + " failed");

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(function (err) {
  console.error("Could not run the checks. Is the server running at " + BASE_URL + " ?");
  console.error(err.message);
  process.exit(1);
});
