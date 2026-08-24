# Requirements Document

## Requirements


## Introduction

MkulimaCollect is the production Android-first offline-first field data collection application for the MkulimaScore agricultural intelligence platform. It enables trained field agents, cooperative officers, and authorized data collectors to onboard farmers, capture farm and enterprise data, record evidence, and synchronize records to the MkulimaScore backend.

The application is the **evidence acquisition layer** of MkulimaScore. It does not contain scoring logic, model weights, or credit-decision rules.

## Glossary

| Term | Definition |
|---|---|
| Agent | Authorized field data collector using MkulimaCollect |
| Farmer | Smallholder farmer whose data is being collected |
| MSID | MkulimaScore canonical farmer ID (e.g. MS-KE-004829); assigned by server after sync |
| local_uuid | Client-generated UUID used as primary key before MSID is assigned |
| Sector | Agricultural value chain (Dairy, Maize, Tea, etc.) |
| Sector Schema | Versioned data-collection definition for a specific sector |
| Enterprise | A farmer's operation of a specific sector on a specific farm |
| Evidence | Any document, photograph, or record that supports a data claim |
| Provenance | The source/chain-of-custody of a collected data point |
| Completeness | Collection completeness percentage (not a creditworthiness metric) |
| Sync Outbox | Durable queue of pending mutations to be sent to the server |
| Offline | Normal operating mode; no connectivity required for core functions |
| QA Review | Server-generated correction request returned to agent |

---

## Requirement 1: Agent Authentication and Device Security

**User Story:** As a field agent, I want to authenticate securely on my Android device so that I can access my assigned farmers and work offline with confidence that data is protected.

### Acceptance Criteria

1. WHERE the app is opened for the first time, WHEN the agent taps "Device setup", THEN the app guides the agent through device registration with the MkulimaScore platform.
2. WHEN the agent enters valid credentials (Agent ID/email + password/PIN + organization), THEN the app authenticates and loads the home dashboard within 3 seconds on a 3G connection.
3. WHEN the agent authenticates successfully, THEN the access token and refresh token are stored exclusively in expo-secure-store (Android Keystore backed) and never in SQLite, AsyncStorage, or any log.
4. WHEN the device has been idle for 8 hours, THEN the app requires PIN or biometric re-entry before resuming; partial data already collected is preserved.
5. WHEN the access token is within 5 minutes of expiry and connectivity is available, THEN the app silently refreshes the token without disrupting the agent's workflow.
6. WHEN connectivity is unavailable at app open, THEN IF a valid cached session exists, the agent may enter their PIN to resume offline; ELSE the app shows a clear message that initial login requires connectivity.
7. WHEN an administrator revokes a device remotely, THEN the next API call returns 401, the app clears the session, deletes tokens from SecureStore, and redirects to the login screen without deleting collected farmer data.
8. IF biometric authentication is unavailable on the device, THEN PIN entry is accepted as the fallback without degrading other functionality.
9. WHEN the agent signs out, THEN the app revokes the refresh token on the server, clears tokens from SecureStore, clears all Zustand UI state, and preserves all SQLite farmer data for re-login by the same agent.
10. THE login screen must display the device registration status, last sync time, and app version without requiring network access.

---

## Requirement 2: Home Dashboard

**User Story:** As a field agent, I want a clear operational dashboard showing my daily progress, sync status, and data quality issues so that I can plan and prioritize my field work effectively.

### Acceptance Criteria

1. WHEN the agent lands on the home screen, THEN today's assigned visits, completed, in-progress, and pending counts are displayed, read from SQLite without a network call.
2. WHEN the agent's device is offline, THEN the sync banner displays "Working offline — your work is saved on this device" in amber; no red error state is shown.
3. WHEN unsynced records exist and the device is online, THEN the sync banner shows the count of waiting records, estimated size, last sync time, and a "Sync now" button.
4. WHEN the agent taps "Sync now", THEN the SyncEngine processes the outbox and the banner updates in real-time as records transition to SYNCED.
5. WHEN the farmer onboarding summary is displayed, THEN it shows assigned, complete, incomplete, needs-correction, and not-started counts from SQLite.
6. WHEN the quality queue section is displayed, THEN it shows counts of farmers missing GPS, records needing evidence, duplicate candidates, and records returned by QA, all read from SQLite.
7. THE connectivity indicator (online/offline dot) must be visible on the home screen at all times and update within 2 seconds of a connectivity change.

---

## Requirement 3: Farmer Registry

**User Story:** As a field agent, I want to browse, search, and filter my assigned farmers so that I can quickly find and open any farmer record.

### Acceptance Criteria

1. WHEN the Farmers tab is opened, THEN all assigned farmers load from SQLite and render in under 300ms even with 500 records, using FlashList with recycled item views.
2. WHEN the agent types in the search field, THEN results filter by name, farmer ID, and location within 200ms using a SQLite LIKE query with debounce.
3. WHEN a filter chip is selected (e.g. "Dairy", "Unsynced", "Correction"), THEN the list immediately filters to matching farmers from SQLite.
4. WHEN a farmer card is displayed, THEN it shows full name, MSID or local_uuid, location, enterprise tags, profile completeness bar, status badge, last update date, and an amber dot if unsynced.
5. WHEN the agent taps a farmer card, THEN the Farmer Profile screen opens with data loaded from SQLite without a network call.
6. THE completeness bar color must be green for ≥80%, amber for ≥50%, red for <50%.
7. THE status badge must correctly reflect one of: Verified, In progress, Draft, Needs correction, Pending sync.

---

## Requirement 4: Farmer Consent

**User Story:** As a field agent, I want to record informed, verified consent before collecting any scoring-related data so that the farmer's rights are protected and the record is legally defensible.

### Acceptance Criteria

1. WHEN a new farmer collection is started, THEN the Consent step is the mandatory first step; no other collection step may be accessed without a completed or declined consent record.
2. WHEN the consent screen is displayed, THEN it shows a plain-language explanation of data use, a list of individual consent items as unchecked checkboxes, and the optional M-PESA processing consent item separately.
3. WHEN the agent taps "Farmer consents", THEN all required consent items must be checked; IF any are unchecked, THEN the app prevents progression and highlights missing items.
4. WHEN consent is completed, THEN the app captures: consent date, consent time (auto from device), method (written/verbal/digital), language, agent GPS location and accuracy, and the consent schema version.
5. WHEN the agent captures a farmer signature, THEN the signature image is stored as a local file and linked to the consent record; the local_uri is stored in SQLite.
6. WHEN the agent taps "Photograph signed consent", THEN the camera opens in document-capture mode and the resulting image is linked to the consent record as evidence.
7. WHEN a farmer declines consent, THEN the app gracefully records only permitted administrative metadata, displays a message confirming no scoring data will be collected, and the wizard ends without creating a farmer profile.
8. THE consent record must include the GPS coordinates of WHERE consent was given, as a provenance record of the consent act itself.
9. IF the current active consent schema version differs from the version on the device, THEN the app must not allow consent collection until a new version is bootstrapped from the server or used offline with the cached version with a visible version indicator.

---

## Requirement 5: Farmer Identity Collection

**User Story:** As a field agent, I want to collect and verify a farmer's identity information using camera-assisted capture so that the record is accurate and supported by documentary evidence.

### Acceptance Criteria

1. WHEN the Identity step is displayed, THEN the agent can capture: full legal name, first/middle/surname, preferred name, ID type, ID number, date of birth, gender, primary phone, alternative phone, and preferred language.
2. WHEN the agent captures the ID number, THEN the raw value is hashed (SHA-256) and only the last 3 digits are retained in the displayed field after save; the raw value is not persisted to SQLite.
3. WHEN the agent taps "Scan front" or "Scan back", THEN the camera opens in document-capture mode with a framing guide; after capture, the image is stored locally and linked to the identity record.
4. WHEN an ID image is captured, THEN any OCR-extracted values (name, ID number, DOB) are displayed for agent confirmation before being accepted; pre-extracted values do not auto-populate without agent review.
5. WHEN a phone number is stored or displayed anywhere in the app, THEN it is masked: `07•• ••• 284`; only the last 4 digits are visible in list and profile views.
6. WHEN the identity step is saved, THEN the data is written to SQLite and a sync outbox entry is created atomically in the same transaction.
7. WHEN the identity step is partially complete, THEN the agent may tap "Save & exit" and return later; the saved state is restored when the wizard is reopened for this farmer.

---

## Requirement 6: Location Collection

**User Story:** As a field agent, I want to capture the farmer's administrative location and GPS coordinates so that the farm can be precisely located and the data enriched geospatially.

### Acceptance Criteria

1. WHEN the Location step is displayed, THEN the agent can enter: country, county, sub-county, ward, village, and nearest centre/town, with searchable select inputs populated from bootstrap configuration.
2. WHEN the agent taps "Capture location", THEN expo-location acquires GPS coordinates; the app displays latitude, longitude, accuracy in metres, and altitude.
3. IF GPS accuracy is worse than 20 metres, THEN the app displays a warning "GPS accuracy is currently ±Xm. Move to an open area and try again" and does not mark the location as high-quality.
4. WHEN GPS accuracy is ≤10 metres, THEN the reading is marked as acceptable and displayed with a green accuracy indicator.
5. WHEN the GPS location is captured, THEN latitude, longitude, accuracy, and capture timestamp are stored in the farm record with provenance = 'GPS_MEASURED'.
6. THE agent may proceed with the wizard without capturing GPS; the missing GPS will appear in the quality queue as a next best action.

---

## Requirement 7: Membership and Cooperative Collection

**User Story:** As a field agent, I want to record the farmer's cooperative, SACCO, and group memberships so that institutional affiliations and records can be linked to the farmer profile.

### Acceptance Criteria

1. WHEN the Membership step is displayed, THEN the agent can record: cooperative/SACCO/group name (searchable from bootstrap list), member number, branch, collection centre, member-since year, and active/inactive status.
2. WHEN the agent enters a member number and the device is online, THEN the app queries the duplicate-check API; IF a possible member match is returned, THEN it is displayed with name, phone suffix, and cooperative for agent confirmation.
3. WHEN the agent taps "Confirm match", THEN the membership record is linked to the registry match and pre-filled data from the registry is marked as provenance = 'INSTITUTIONAL_REGISTRY'.
4. WHEN the agent taps "Not this farmer", THEN the potential match is dismissed and the agent-entered data is retained with provenance = 'FARMER_REPORTED'.
5. WHEN the device is offline during membership entry, THEN the duplicate-check is skipped gracefully; a note is stored that registry matching is pending; the server performs matching on sync.
6. THE agent may add multiple membership records to represent multiple cooperative/SACCO affiliations.

---

## Requirement 8: Farm Management

**User Story:** As a field agent, I want to create and manage multiple farms for one farmer so that each farm's size, tenure, location, and boundary can be recorded accurately.

### Acceptance Criteria

1. WHEN the Farm step is displayed in the wizard, THEN the agent can create a new farm with: name, tenure (Owned/Leased/Family/Communal), size, size unit, size source, irrigation details (conditional), and basic infrastructure notes.
2. WHEN the farmer has an existing farm, THEN the Farms tab on the farmer profile shows all farms; the agent can add additional farms with "+ Add farm".
3. WHEN a farm size is entered by the agent as farmer-reported, THEN it is stored in `size_reported_acres` with `size_reported_source = 'FARMER_REPORTED'`.
4. WHEN GPS boundary capture is completed, THEN the calculated area is stored in `size_gps_acres`; `size_reported_acres` is never overwritten.
5. WHEN `size_gps_acres` and `size_reported_acres` differ by more than 15%, THEN the app flags this with the message "Reported farm size differs significantly from GPS-measured area. Please confirm with farmer." — no automatic adjustment is made.
6. IF the irrigation field is set to Yes, THEN the water source, irrigation type, and irrigated acreage fields are shown (conditional logic); IF No, THEN these fields are hidden.
7. A farm without a GPS boundary is valid and can be submitted; missing boundary appears as a next best action in the quality queue.

---

## Requirement 9: GPS Farm Boundary Mapping

**User Story:** As a field agent, I want to capture an accurate GPS boundary polygon for a farm by walking the perimeter or drawing on a map so that the farm area can be verified independently of farmer reporting.

### Acceptance Criteria

1. WHEN the GPS boundary screen opens, THEN a map view is displayed (MapLibre) with the agent's current GPS position indicated; IF no map tiles are available offline, THEN the GPS position marker and polygon capture functions still operate.
2. WHEN the agent taps "Walk boundary", THEN expo-location begins recording GPS points at regular intervals; the captured polygon is drawn on screen in real time with point count, distance walked, and current accuracy displayed.
3. WHEN the agent taps "Stop recording", THEN the polygon is closed and the calculated area in acres is displayed alongside the farmer-reported size for comparison.
4. WHEN the agent taps "Draw boundary", THEN the agent can tap points on the map to manually define the boundary; at least 3 points required to form a valid polygon.
5. WHEN the agent taps "Capture point", THEN a single GPS point is captured for farms where only a centroid is practical.
6. WHEN the agent taps "Save polygon", THEN the GeoJSON polygon, point count, total distance, worst-fix accuracy, calculated area, capture timestamp, agent ID, and device ID are stored in SQLite.
7. WHEN GPS accuracy during walk exceeds 15 metres, THEN a warning indicator is shown on the accuracy display; the agent may continue but the accuracy flag is stored.
8. THE agent may redo the boundary capture; previous captures are replaced by the new one; historical captures are retained in audit_events.

---

## Requirement 10: Enterprise Selection and Management

**User Story:** As a field agent, I want to select one or more agricultural enterprises for a farm so that the appropriate sector-specific data collection modules are loaded for each enterprise.

### Acceptance Criteria

1. WHEN the Enterprise step is displayed, THEN all 14 supported value chains are shown as selectable tiles; the agent may select multiple enterprises for a single farm.
2. WHEN the agent selects an enterprise, THEN a new enterprise record is created in SQLite with the selected sector ID; a sector-specific collection step is queued in the wizard.
3. WHEN the agent proceeds after enterprise selection, THEN separate form steps are shown for each selected enterprise using the sector schema engine.
4. WHEN the agent adds an enterprise to a farm that already has enterprises, THEN the new enterprise is appended; existing enterprise data is unaffected.
5. THE same sector (e.g. Dairy) may be added to different farms of the same farmer as independent enterprise records.
6. WHEN an enterprise is marked inactive, THEN it is retained in the record with `active = false`; it does not appear in active enterprise counts but is preserved for audit.

---

## Requirement 11: Sector Data Collection Engine

**User Story:** As a field agent, I want the data collection form to adapt dynamically to the specific agricultural sector so that I collect the right information for each enterprise without navigating irrelevant questions.

### Acceptance Criteria

1. WHEN a sector is selected, THEN the sector schema engine loads the versioned schema for that sector and renders all sections and fields.
2. WHEN a conditional field's condition is not met, THEN that field is hidden and its value is not required; WHEN the condition is met, THEN the field appears inline.
3. WHEN the agent enters a value that fails validation (e.g. harvest date before planting date, number outside min/max range), THEN an inline error message is displayed in plain agent-friendly language.
4. WHEN the agent completes a field that has `provenanceOptions`, THEN a provenance selector appears allowing the agent to tag the source of that value.
5. WHEN the agent taps an `evidencePrompt` field action (e.g. "Capture milk delivery statement"), THEN the camera/document capture screen opens and the resulting evidence item is linked to that enterprise.
6. WHEN a sector schema is updated on the server and bootstrapped to the device, THEN existing `sector_collection_responses` records for the old version are preserved; new collection uses the new version.
7. WHEN a new sector is added to the server schema registry and bootstrapped, THEN it appears in the enterprise selection grid without any code change to the collection engine.
8. THE sector engine MUST NOT contain scoring weights, credit thresholds, or model coefficients.

---

## Requirement 12: Evidence Capture

**User Story:** As a field agent, I want to photograph documents, scan ID cards, and capture evidence files so that every data claim is supported by verifiable source material.

### Acceptance Criteria

1. WHEN the agent taps a camera action, THEN the camera opens in full-screen mode with a document framing guide overlay; the agent can capture, review, and retake before saving.
2. WHEN an image is captured, THEN it is compressed to a maximum of 2 MB while preserving document text readability; quality is validated before saving.
3. WHEN the agent selects a file from the device gallery or files (PDF), THEN the file is validated for MIME type (image/jpeg, image/png, application/pdf only) and size (maximum 20 MB).
4. WHEN an evidence item is saved, THEN a SHA-256 hash of the file is computed and stored in the evidence record; the local file is retained in the app-private document directory.
5. WHEN an evidence item is created, THEN its metadata (category, acquisition method, farmer, farm, enterprise, capture timestamp, agent, GPS if appropriate) is stored in SQLite and a sync outbox entry is created.
6. WHEN the device is offline, THEN captured evidence remains in the local queue with sync_status = 'LOCAL'; the agent is shown a count of pending evidence items in the Sync Centre.
7. WHEN syncing evidence, THEN the app requests a presigned upload URL from the server, uploads the binary to that URL, and confirms the upload; the presigned URL is held in memory only and never persisted.
8. WHEN an evidence item on the server has verification_status = 'VERIFIED', THEN the app requires explicit agent confirmation before a new local upload can replace it.
9. THE camera must support multi-page document capture (sequential photos linked to the same evidence record).

---

## Requirement 13: Financial Data Collection

**User Story:** As a field agent, I want to collect the farmer's income sources, savings, and existing loans with clear provenance so that financial data is accurately recorded with appropriate source flags.

### Acceptance Criteria

1. WHEN the Financial step is displayed, THEN the agent can record income sources, savings records, and existing loans; each record carries a provenance tag.
2. WHEN a loan is entered as farmer-reported, THEN it is visually flagged with "Farmer reported — not yet verified" in the UI; no loan is presented as verified without an evidence link.
3. WHEN the agent captures income, THEN the frequency options are: Daily, Weekly, Monthly, Per production cycle, Seasonal, Annual — not forced into a monthly estimate.
4. WHEN the M-PESA consent item in the Consent step was NOT authorized, THEN the M-PESA statement upload section is not shown in the Financial step.
5. WHEN M-PESA consent WAS authorized, THEN the agent may upload a PDF statement; the upload includes a password field IF the PDF requires one.
6. WHEN the M-PESA password is entered, THEN: the field uses secureTextEntry; the value is transmitted directly to the server API over HTTPS; the value is cleared from component state immediately after the API call completes (success or failure); it is never written to SQLite, SecureStore, logs, or analytics.
7. WHEN the financial step is partially complete, THEN "Save & exit" preserves all entered data and the step remains IN_PROGRESS.
8. THE app must support recording multiple loans from different lenders.

---

## Requirement 14: Collection Review and Offline Submission

**User Story:** As a field agent, I want to review a farmer profile summary before submitting so that I can identify and optionally address gaps before the record enters the sync queue.

### Acceptance Criteria

1. WHEN the Review step is displayed, THEN it shows a section-by-section completion checklist with green checkmarks for complete sections and amber warnings for sections with missing items.
2. WHEN the review shows warnings, THEN each warning describes the specific missing item in plain language (e.g. "Farm 2 boundary not captured", "Latest production evidence unavailable").
3. WHEN the agent taps "Edit" next to a section, THEN the wizard navigates back to that specific step with existing data pre-populated.
4. WHEN the agent taps "Submit farmer profile", THEN: the farmer status is set to SUBMITTED; the sync outbox entry state is set to PENDING_SYNC; the success screen is shown; all data is committed to SQLite in a single transaction before the success screen appears.
5. WHEN the device is offline at submission, THEN the success screen shows "Saved — waiting to sync" with an amber offline indicator; no error state is shown.
6. WHEN connectivity is restored after offline submission, THEN the SyncEngine processes the outbox automatically and the success screen (if still visible) transitions to "Synced".
7. THE agent may submit a profile with warnings present; submission is not blocked by missing optional data.

---

## Requirement 15: Durable Sync and Outbox

**User Story:** As a field agent and as the MkulimaScore platform, I want all collected data to synchronize reliably and idempotently so that no records are lost, duplicated, or incorrectly ordered.

### Acceptance Criteria

1. WHEN a mutation is written to SQLite, THEN a corresponding sync_outbox entry is written atomically in the same database transaction; no entity write occurs without a paired outbox entry.
2. WHEN the SyncEngine processes the outbox, THEN it respects the `depends_on` array; entries with unresolved dependencies are skipped until their dependencies reach SYNCED state.
3. WHEN a sync operation succeeds (server HTTP 2xx), THEN: the outbox entry is marked SYNCED; the server's assigned ID is written to server_mappings; subsequent child records use the resolved server ID.
4. WHEN a sync operation fails (network error, HTTP 5xx), THEN the entry transitions to RETRY and waits the appropriate backoff period before retrying.
5. WHEN the server returns HTTP 409 with the same operation_uuid, THEN the client treats this as success (not an error) and marks the entry SYNCED.
6. WHEN the app is killed or the device reboots during sync, THEN on next launch the SyncEngine resumes processing from all PENDING_SYNC and RETRY entries; no data is lost.
7. WHEN an entry reaches 10 retries, THEN it transitions to FAILED_PERMANENTLY and is surfaced in the quality queue for agent awareness; data is not deleted.
8. WHEN a farmer CREATE succeeds and the server returns an MSID, THEN the MSID is stored in server_mappings and all subsequent outbox entries for that farmer's farms and enterprises include the resolved MSID.
9. THE sync engine must operate on a background thread and must not block the UI thread.

---

## Requirement 16: Sync Centre

**User Story:** As a field agent, I want a dedicated sync management screen so that I can see the exact state of all pending uploads and manually trigger synchronization.

### Acceptance Criteria

1. WHEN the Sync Centre is opened, THEN it shows: connection status with signal type (Online/Offline), last successful sync timestamp, and counts of records in each state (queued, uploading, synced, retry, failed).
2. WHEN the Sync Centre is open, THEN each pending record is listed with: farmer name, record type, file size (for evidence), and current state (Queued/Uploading/Synced/Retry required).
3. WHEN the agent taps "Sync now" and the device is online, THEN the SyncEngine begins processing and individual record statuses update in real time.
4. WHEN the device is offline, THEN the "Sync now" button is disabled and the offline status is displayed clearly.
5. WHEN a record transitions from Uploading to Synced, THEN its row updates without a full list refresh.
6. WHEN a record is in RETRY state, THEN the next retry time is displayed.
7. WHEN a record is in FAILED_PERMANENTLY state, THEN it is shown in red with guidance to contact support.

---

## Requirement 17: Task Management

**User Story:** As a field agent, I want to see my prioritized task list so that I can complete follow-up actions, corrections, and evidence collection requests efficiently.

### Acceptance Criteria

1. WHEN the Tasks tab is opened, THEN tasks are loaded from SQLite and displayed with farmer name, village, task type, priority, due date, and offline availability indicator.
2. WHEN filter chips are used, THEN the list filters by: All, Today, High priority, GPS tasks, Evidence tasks, Correction tasks.
3. WHEN a task is overdue (due_date < today), THEN the due date is displayed in red with a "due today" badge.
4. WHEN the agent taps "Start task", THEN the app navigates directly to the relevant farmer or collection step for that task.
5. WHEN the agent marks a task done, THEN the task status is updated in SQLite and an audit event is written; the task is visually dimmed but not removed from the list until next sync.
6. WHEN new tasks are pushed from the server on sync, THEN they appear in the task list without requiring a manual refresh.
7. WHEN the device is offline, THEN offline-capable tasks are accessible and can be completed; tasks that require connectivity show a clear indicator.

---

## Requirement 18: Farmer Profile View

**User Story:** As a field agent, I want to view a complete farmer profile with all collected data organized by tabs so that I can quickly assess what has been collected and what remains outstanding.

### Acceptance Criteria

1. WHEN the Farmer Profile is opened, THEN the header shows: farmer name, local_uuid or MSID, status badge, location, enterprise tags, and profile completeness percentage; all loaded from SQLite without a network call.
2. WHEN the Overview tab is displayed, THEN it shows: identity section summary, consent summary with date and method, next best actions list, and a "Continue collecting" button.
3. WHEN the Farms tab is displayed, THEN all farms are listed with name, size (reported and GPS if captured), tenure, mapping status, and enterprises.
4. WHEN the Enterprises tab is displayed, THEN all enterprises are listed with sector, completeness, income summary, and evidence status.
5. WHEN the Financial tab is displayed, THEN income sources, savings, and loans are shown with provenance tags; farmer-reported data is visually distinguished from verified data.
6. WHEN the Evidence tab is displayed, THEN all evidence items are listed with category, capture date, and verification status; the agent can add new evidence from this tab.
7. WHEN the Activity tab is displayed, THEN the audit_events for this farmer are shown in reverse chronological order with date, event type, and description.
8. THE profile view MUST NOT display a MkulimaScore numeric credit score, model weights, or any proprietary scoring output.

---

## Requirement 19: QA Correction Workflow

**User Story:** As a field agent, I want to receive and resolve quality assurance corrections from the platform so that farmer records meet the required data quality standard.

### Acceptance Criteria

1. WHEN the server returns QA issues for a farmer on sync, THEN the farmer's status is updated to NEEDS_CORRECTION and a QA review record is written to SQLite.
2. WHEN a farmer has a QA review, THEN an indicator is shown on their farmer card in the list; the correction detail appears in the quality queue on the home screen.
3. WHEN the agent opens a QA review, THEN each issue is described in plain, agent-friendly language (e.g. "GPS accuracy was above acceptable collection quality") without exposing internal scoring rules.
4. WHEN the agent taps "Fix now" on a QA issue, THEN the app navigates directly to the relevant field or evidence step.
5. WHEN all issues in a QA review have been addressed, THEN the review is marked IN_PROGRESS locally; the updated farmer record enters the sync outbox for re-submission.
6. WHEN the server confirms the QA issues are resolved, THEN the farmer status is updated to SUBMITTED or VERIFIED accordingly.

---

## Requirement 20: Duplicate Farmer Handling

**User Story:** As a field agent, I want to be alerted when the platform detects a possible duplicate farmer so that I can confirm whether this is the same person or a different individual before creating a new record.

### Acceptance Criteria

1. WHEN the server returns a possible duplicate match on sync, THEN the agent is shown a card with the matching farmer's name, phone suffix, location, and cooperative membership.
2. WHEN the agent taps "Same farmer", THEN the local record is linked to the existing MSID and the duplicate flag is cleared; no new farmer record is created on the server.
3. WHEN the agent taps "Different farmer", THEN the new farmer record is confirmed as a distinct individual and proceeds through normal sync.
4. THE app must never silently merge two farmer records without explicit agent confirmation.
5. THE duplicate detection algorithm and confidence scores are NOT displayed to the agent; only "Possible match found" is shown.

---

## Requirement 21: IP and Scoring Logic Boundary

**User Story:** As MkulimaScore, I want to ensure that the mobile application contains no proprietary scoring logic, model weights, or credit-decision rules so that the platform's intellectual property is protected.

### Acceptance Criteria

1. WHEN any sector schema file is inspected, THEN it contains ONLY: field IDs, labels, types, validation rules, provenance options, evidence prompts, conditional rules, and units — no scoring weights, thresholds, or model coefficients.
2. WHEN the farmer profile completeness is displayed, THEN it is labeled as "Profile completeness" or "Collection completeness" — never as a credit score, risk indicator, or qualification metric.
3. WHEN the app receives a server response that includes a numeric score, THEN that score is NOT displayed to field agents in the standard agent UI.
4. WHEN any screen or component is implemented, THEN no variable name, log message, or UI label may use the words: score, risk_score, credit_score, creditworthiness, qualification_pct, or equivalent scoring terminology.
5. THE codebase review gate requires explicit confirmation that no scoring logic has been introduced in any PR touching sector schemas, completeness calculations, or API response handling.


