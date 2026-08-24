# MkulimaCollect — Product Steering

## What MkulimaCollect Is

MkulimaCollect is the **field data collection application** for MkulimaScore. It is used by trained field agents, cooperative/SACCO officers and authorized data collectors to onboard and progressively update farmer records.

MkulimaScore converts consented, verified farmer, farm, production, financial, behavioural and geospatial evidence into lender-grade agricultural intelligence. MkulimaCollect is the **evidence acquisition layer** — it does not contain scoring logic.

## What MkulimaCollect Is NOT

- Not a credit-scoring engine
- Not a consumer fintech wallet
- Not a generic survey app
- Not a standalone backend system

## Primary User

A **field agent** responsible for 50–500+ assigned farmers, working:
- In villages, on farms, at cooperative offices
- With intermittent or zero connectivity
- On Android phones in bright sunlight

## Product Principles (must be preserved in every implementation decision)

1. Offline first — every core action works with zero connectivity
2. Fast field collection — minimal friction per data point
3. Camera-heavy — evidence capture is a primary workflow
4. GPS and geospatial verification — farm boundaries are first-class
5. Progressive data collection — partial records are valid and valuable
6. Sector-aware forms — Dairy feels like a Dairy form, not a generic questionnaire
7. Evidence before assumptions — all financial claims need a stated source
8. Clear consent and data governance — consent precedes all collection
9. Visible collection quality — agents see completeness at all times
10. Low cognitive load — minimal typing, large touch targets, one-hand usability
11. Continuous autosave — never lose collected data
12. Strong audit trail — every significant action is attributable
13. Android first — design and test for Android; iOS follows
14. Professional grade — suitable for deployment by banks, SACCOs, development institutions

## Design Reference

The Figma Make prototype at the workspace root (`src/`, `package.json`, `vite.config.ts`) is the **visual and product design reference**. It must not be modified, converted or deleted. The production application at `apps/collect/` must reproduce the quality and intent of the prototype using native React Native components.

Key design assets to preserve:
- Color palette: brand green `#1A5C35`, charcoal scale, amber/red status colors
- Typography: Instrument Sans (display/UI), DM Mono (data/IDs)
- Navigation: bottom tabs with central FAB collect button
- Status semantics: verified/incomplete/draft/correction/inprogress/unsynced
- Offline indicator: always visible, amber (never red error)
- Profile completeness: green ≥80%, amber ≥50%, red <50%

## IP Protection

The field application MUST NOT contain or expose:
- MkulimaScore scoring formulas or model weights
- Credit thresholds or lending rules
- Internal fraud-detection rules
- Proprietary geospatial risk calculations
- Model training data or architecture descriptions
- The lender-facing 0–1000 score

Collection requirements and field labels may be visible. All transformation from evidence → intelligence happens on the MkulimaScore server platform.

## Navigation Structure

- **(auth)**: login, device-setup
- **(tabs)**: home, farmers, tasks, more
- **collect/**: new farmer wizard steps
- **farms/**: farm detail and GPS boundary
- **enterprises/**: enterprise detail and sector forms
- **evidence/**: evidence vault and camera capture
- **sync/**: sync centre
- **gps/**: boundary capture

## Offline Indicator Semantics

Offline is a **normal operational state**, never an error. Use neutral amber. Message: "Your work is saved on this device."
