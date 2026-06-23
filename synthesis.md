# Security Review Synthesis: Glowtris ROADMAP.md

## 1. Consensus & Core Vulnerabilities
All panelists (Draft, Gemini Flash, Gemini Pro, Claude Sonnet) identified the following critical security gaps that must be addressed:
- **Anti-Cheat & Score Plausibility (High Risk):** Currently, clients can submit any score without validation. **Consensus Resolution:** Implement a server-issued session token (signed HMAC containing start time and seed). The score submission API must validate the minimum elapsed time and theoretically possible score.
- **Missing HTTP Security Headers & XSS (High Risk):** `vercel.json` lacks strict security headers (CSP, X-Frame-Options). Additionally, user `displayName`s from the leaderboard must be strictly sanitized to prevent Cross-Site Scripting (XSS).
- **Rate Limiting (Medium Risk):** APIs (auth, score submission) are vulnerable to DDoS and billing abuse. **Resolution:** Implement IP-based and UID-based rate limiting using Redis.
- **Webhook Idempotency (Medium Risk):** Lemon Squeezy webhooks could be replayed, crediting shields multiple times. **Resolution:** Use Redis `SETNX` on the `event_id` to prevent double-crediting.

## 2. Unique Insights & Deep Dives
- **Client State Encapsulation (Gemini Pro):** The game state (e.g., `window.score`) is currently exposed globally, making DevTools tampering trivial. State must be encapsulated in closures.
- **API Data Masking (Gemini Pro):** Ensure leaderboard payloads strip internal Firebase UIDs and only return public names and scores.
- **Firebase Auth Domain Restriction (Gemini Pro):** Restrict Firebase Auth authorized domains strictly to `glowtris.com` and `prevglow.vercel.app` to prevent API key hijacking.
- **Inconsistent CORS (Claude Sonnet):** Identified that `maintenance.js` currently uses a wildcard `Access-Control-Allow-Origin: *`, breaking the CORS rule.
- **VAPID Key Validation (Claude Sonnet):** Keys must have length/format checks before being stored to prevent batch job crashes.

## 3. Final Recommendations for ROADMAP.md
We will append a comprehensive set of Security Principles to `ROADMAP.md` and add the highest priority items to the `v0.9.5` and `v1.0.0` checklists.

**To be added to v0.9.5 Gate:**
- HTTP Security Headers in `vercel.json` (CSP, X-Frame-Options).
- Anti-Cheat MVP (Server-issued signed session tokens to validate elapsed time).
- XSS strict sanitization for display names.

**To be added to v1.0.0 Auth / v1.1.0 Monetization:**
- Firebase Authorized domains restriction.
- Rate limiting (IP/UID) on all Vercel edge functions.
- Webhook idempotency (`SETNX`) for payments.
- Client state encapsulation (hide global window variables).
