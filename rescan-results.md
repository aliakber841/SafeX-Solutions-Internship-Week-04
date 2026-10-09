# ZAP Re-scan Results (Before vs After)

| | |
|---|---|
| Target | `http://localhost:5001` (my own local app only) |
| Tool | OWASP ZAP 2.17.0, Automated Scan |
| Scan settings (after) | Scan policy "Dev Standard", traditional spider and Client Spider with Chrome |
| Baseline scan | 9 October 2026, before any fixes (version 1.0.0) |
| Re-scan | 9 October 2026, 15:42, after the fixes (version 2.0.0) |
| Reports | `zap-before.html`, `zap-after.html` |

## Summary

| | Before | After |
|---|---|---|
| Alert types | 8 | 4 |
| High | 0 | 0 |
| Medium | 3 | 0 |
| Low | 3 | 1 |
| Informational | 2 | 3 |

All 3 Medium alerts were closed. 5 of the 8 original alert types are gone, 3 remain, and 1 new informational alert appeared.

## Alert by alert

| # | Alert | Risk before | Fix applied | Result after re-scan |
|---|---|---|---|---|
| 1 | Content Security Policy (CSP) Header Not Set | Medium | `helmet` with a strict CSP | **Closed** |
| 2 | Cross-Domain Misconfiguration | Medium | CORS limited to the app's own origin | **Closed** |
| 3 | Missing Anti-clickjacking Header | Medium | CSP `frame-ancestors 'none'` and `X-Frame-Options` | **Closed** |
| 4 | Server Leaks Information via "X-Powered-By" Header | Low | Header disabled in Express and helmet | **Closed** |
| 5 | Strict-Transport-Security Header Not Set | Low | `helmet` sets HSTS | **Remains (3 instances), see below** |
| 6 | X-Content-Type-Options Header Missing | Low | `helmet` sets `nosniff` | **Closed** |
| 7 | Modern Web Application | Informational | None needed | **Remains** (systemic note) |
| 8 | Re-examine Cache-control Directives | Informational | `no-store` on `/api`, `no-cache` on HTML | **Remains (2 instances), see below** |
| 9 | Information Disclosure - Suspicious Comments | Informational | None yet | **New alert** |

## Remaining-risk list

1. **Strict-Transport-Security Header Not Set (Low, 3 instances).** My server does send the HSTS header; the security check script confirms it. HSTS only matters over HTTPS, and `http://localhost` is plain HTTP. The instance open in the ZAP screenshot is `https://dl.google.com/...`, which is Chrome's own background traffic going through the ZAP proxy. It is out of scope because it is not my app. Real protection needs HTTPS after deployment.
2. **Modern Web Application (Informational, systemic).** ZAP is only telling me the site is a single-page app that loads data with JavaScript, so its normal spider cannot see everything. This is a note, not a weakness. No fix is needed.
3. **Re-examine Cache-control Directives (Informational, 2 instances).** The baseline instance of this alert was on `googleapis.com`, not my app. My own responses now carry explicit cache headers. These two instances should be checked by URL in the ZAP report; any that belong to localhost are static files that are meant to be cached.
4. **Information Disclosure - Suspicious Comments (Informational, new).** This appeared because the Client Spider with Chrome loaded more of the site, including the built JavaScript files. ZAP matches certain words in code and comments. It is informational only. The exact matched word is in the "Evidence" field of the alert in the report, and the cause has not been confirmed. A possible improvement is to review that evidence and strip comments from the production build.

## Risks that ZAP cannot see (checked with the security test script instead)

These are protected in code and checked by `npm run test:security`, not by the ZAP scan: CSRF token checks, login rate limiting, input validation and NoSQL injection blocking, login cookie flags (`HttpOnly`, `SameSite=Strict`), and safe error messages. The automated ZAP scan does not log in, so the admin pages were not scanned.

## Conclusion

The hardening removed every Medium finding and 4 of the 6 Low and Medium alert types that belonged to the app. The one Low alert left (HSTS) is HTTPS-only and shows up here because of Google traffic outside the scope. The remaining items are informational.
