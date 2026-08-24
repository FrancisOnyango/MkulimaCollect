# MkulimaCollect — Security Steering

## Threat Model and Mitigations

### 1. Lost or Stolen Device

**Threat:** Unauthorized person accesses a field agent's device and reads farmer PII or sensitive financial data.

**Mitigations:**
- Session timeout: access token expires after configurable idle period (default 8 hours)
- Biometric lock via `expo-local-authentication` before session resumes after timeout
- Offline PIN re-entry supported when biometrics unavailable
- Remote device revocation: agent or admin calls `revokeDevice(deviceId)` on the server; next sync attempt returns 401 and clears local session
- Android Keystore-backed encryption for `expo-secure-store` values
- SQLite WAL file and database file should be stored in app-private directory (default on Android)
- No farmer PII in system notifications or Android recents/app switcher previews (`android.allowBackup: false` in app manifest; `FLAG_SECURE` on sensitive activities)

### 2. Compromised Agent Account

**Threat:** Agent credentials stolen via phishing or physical access; attacker authenticates to the server.

**Mitigations:**
- Device-bound sessions: tokens are bound to `device_id`; server validates device registration on every request
- Server-side session revocation available to admin
- All agent actions written to `audit_events` table; server also maintains audit log
- Agent can only access farmers assigned to their organization and cluster — enforced server-side
- Client must not cache a list of unassigned farmers or expose cross-tenant data

### 3. Leaked Authentication Token

**Threat:** Access token extracted from device storage or intercepted in transit.

**Mitigations:**
- Tokens stored exclusively in `expo-secure-store` (backed by Android Keystore)
- Never stored in: AsyncStorage, SQLite, local files, logs, crash reports
- Short-lived access tokens (configurable, recommend 1 hour)
- Refresh token rotation: each use of a refresh token invalidates the previous one
- All API requests over HTTPS/TLS only; certificate pinning recommended for production build
- If token found in a non-secure location during code review, treat as critical security defect

### 4. Unauthorized Tenant Access

**Threat:** Agent of Organization A accesses farmer records belonging to Organization B.

**Mitigations:**
- All API requests include `organization_id` in JWT claims — cannot be overridden by client
- Server enforces row-level security: queries scoped to agent's organization
- Client must never construct API requests that include another organization's IDs
- Local SQLite data is scoped to the authenticated agent's organization on bootstrap

### 5. Evidence URL Leakage

**Threat:** Presigned S3 URLs for evidence documents are logged, cached, or included in sync payloads where they could be intercepted.

**Mitigations:**
- Presigned URLs are held in memory only; never written to SQLite, logs, or state management stores
- TTL on presigned URLs: maximum 15 minutes
- After upload completes (or fails), the URL is immediately cleared from memory
- Evidence metadata sync payloads contain only `evidence_server_id`, not the object URL
- Agent UI never exposes direct S3 URLs; all access is through authenticated API endpoints

### 6. Replay Attacks

**Threat:** Captured HTTP request replayed to create duplicate records on the server.

**Mitigations:**
- Every CREATE operation carries a unique `operation_uuid` (client-generated UUID v4)
- Sent as `X-Idempotency-Key` request header
- Server deduplication window: if same `operation_uuid` received within 24 hours, return cached result without creating a duplicate
- Timestamps in payloads; server rejects requests with timestamps more than 5 minutes old (clock drift tolerance configurable)

### 7. Duplicate Farmer Submission

**Threat:** Poor connectivity causes retry storms; same farmer record submitted multiple times creating duplicates.

**Mitigations:**
- Idempotency key on every CREATE (see above)
- Client-side deduplication: SyncEngine checks `server_mappings` before retrying a CREATE
- Server-side duplicate detection runs independently and returns candidate matches
- Client shows duplicate candidates for agent review — never silently merges

### 8. Local Data Exposure via Logs

**Threat:** PII or financial data written to logs, crash reporters, or analytics.

**Mitigations:**
- No PII (names, ID numbers, phone numbers, financial values) in any log statement
- Log at levels DEBUG/INFO/WARN/ERROR; PII fields replaced with entity UUIDs in log messages
- Crash reporters (if used) must be configured to scrub PII fields before transmission
- National ID number stored as SHA-256 hash + last 3 digits only after initial capture; raw value must be cleared from component state immediately after hashing
- Phone numbers masked in display: `07•• ••• 284`

### 9. Malicious File Upload

**Threat:** Corrupted or malicious file submitted as evidence (e.g., polyglot image/script, oversized file, invalid MIME).

**Mitigations:**
- Client-side file size limit: 20 MB per evidence file (configurable)
- MIME type validation before upload: only allow image/jpeg, image/png, application/pdf
- Server performs independent virus/malware scan on receipt
- Files stored in app-private document directory; never executed locally
- File hash (SHA-256) computed client-side and included in upload confirmation; server validates integrity

### 10. M-PESA Statement Credential Handling

**Threat:** Farmer provides M-PESA statement password; credential stored insecurely or leaked.

**Mitigations (non-negotiable):**
- Password input field: `secureTextEntry={true}`, reveal toggle only on explicit tap
- Value held ONLY in React component state (`useState`) for the minimum required duration
- Transmitted directly to server API endpoint over HTTPS; never written to SQLite, SecureStore, logs, or analytics
- Cleared immediately after API call completes (success or failure)
- If upload requires retry, request fresh password from agent — never cache it
- If a future requirement proposes persisting this credential in any form: STOP. Require dedicated security review before implementation

### 11. Session Management Rules

```
Session lifecycle:
  Login → access_token (short-lived) + refresh_token (long-lived, device-bound)
       → stored in expo-secure-store only
  
  Each app foreground:
    if (access_token.expiry < now + 5min) → refresh silently
    if (refresh_token expired OR revoked) → force re-login
    if (idle_time > session_timeout) → require PIN/biometric before resuming
  
  Logout:
    → revoke refresh_token on server
    → delete both tokens from SecureStore
    → do NOT delete SQLite data (preserve offline drafts for re-login by same agent)
    → clear all Zustand UI state
```

## Secure Coding Rules

1. No hardcoded secrets, API keys, or credentials anywhere in source code
2. Use `EXPO_PUBLIC_` prefix only for non-sensitive public configuration
3. Sensitive config (API keys, signing keys) goes in EAS Secrets only
4. All network requests require valid session token; no anonymous API calls
5. SQLite queries use parameterized statements (Drizzle ORM enforces this)
6. No `eval()`, no `dangerouslySetInnerHTML` equivalent in React Native
7. All user-provided text inputs sanitized before SQLite write (Drizzle handles parameterization)
8. File paths constructed from trusted constants, not user input
9. `android:debuggable` must be `false` in production builds
10. Code review required for any change touching auth, sync, evidence upload, or financial data
