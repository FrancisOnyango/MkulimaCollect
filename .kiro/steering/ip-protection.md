# MkulimaCollect — IP Protection Steering

## Core Principle

MkulimaCollect is an evidence acquisition layer. All transformation from collected evidence into agricultural intelligence happens exclusively on the MkulimaScore server platform. The mobile application must never contain, expose, or hint at the proprietary logic that generates that intelligence.

## What MUST NOT Appear in This Codebase

The following are absolutely prohibited anywhere in `apps/collect/` -- in source code, comments, configuration, log messages, UI text, schema files, or documentation:

| Category | Examples of prohibited content |
|---|---|
| Scoring formulas | Any arithmetic that produces a creditworthiness number |
| Model weights | Coefficients, feature importances, beta values |
| Score thresholds | "Score above X qualifies for Y product" |
| Lending rules | Eligibility criteria, loan sizing formulas |
| Exposure formulas | Debt-to-income ratios used for credit decisions |
| Fraud detection rules | Specific signals, thresholds, rule combinations |
| Proprietary geospatial calculations | NDVI thresholds, rainfall indices mapped to risk |
| Model architecture | ML model type, training approach, feature list |
| Model training data | Any reference to what data trained the model |
| Internal reason codes | Server-generated reason codes for credit decisions |
| The 0-1000 score | The lender-facing MkulimaScore numeric score |

## What IS Permitted

- Collection field labels (e.g. "Litres of milk per day")
- Completeness percentages (collection quality, not credit quality)
- Provenance tags (FARMER_REPORTED, DOCUMENT, GPS_MEASURED)
- Evidence status (UPLOADED, VERIFIED, NEEDS_REVIEW)
- Farmer record status (DRAFT, IN_PROGRESS, SUBMITTED, VERIFIED)
- Quality queue issues (e.g. "GPS accuracy was above acceptable collection quality")
- Next best actions (e.g. "Add latest milk delivery statement") -- collection guidance only
- Sector schema field definitions (data collection logic only)

## Sector Schema IP Rule

Sector schemas define what to collect and how to collect it. They must never contain:

```typescript
// PROHIBITED:
{ field: 'milk_litres_per_day', scoringWeight: 0.23, threshold: { min: 10 } }

// PERMITTED:
{ id: 'milk_litres_per_day', label: 'Litres per day (total)', type: 'number',
  min: 0, provenanceOptions: ['FARMER_REPORTED', 'DOCUMENT'] }
```

## UI Text Rules

| Prohibited UI text | Permitted alternative |
|---|---|
| "This farmer scores well on dairy" | "Dairy module 88% complete" |
| "High creditworthiness indicator" | "Supported by evidence" |
| "Likely to qualify for financing" | (never show this) |
| "Score: 742" | (never show a numeric score to field agents) |
| "Confidence: 94%" | "Verified" or "Supported by evidence" |

## Completeness vs. Credit Quality

Profile completeness (e.g. "82% complete") is a collection completeness metric only. It must never be framed as a credit quality indicator in UI labels, comments, variable names, log messages, or analytics events.

Acceptable variable names: `completeness_pct`, `collection_completeness`, `profile_completeness`
Prohibited variable names: `credit_score`, `risk_score`, `qualification_pct`, `creditworthiness`

## API Response Handling

1. If a server response includes a numeric score field: do not surface it to field agents in the standard UI
2. If a server response includes reason codes or model outputs: log to audit trail only, do not display
3. If a server response includes duplicate-detection confidence scores: display only as "Possible match found"

## Code Review Gate

Any pull request touching:
- `features/sector-engine/schemas/`
- `lib/api/types.ts`
- Any screen in `collect/`
- `features/farmers/farmerCompleteness.ts`

...requires explicit confirmation that no scoring logic, weights, or thresholds have been introduced.
