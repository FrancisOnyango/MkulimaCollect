# MKULIMACOLLECT — MASTER FIGMA PRODUCT DESIGN PROMPT

Design a complete, production-grade mobile application called **MkulimaCollect**, the field data collection application for **MkulimaScore**.

MkulimaScore is agricultural credit-intelligence infrastructure that converts consented, verified farmer, farm, production, financial, behavioural and geospatial evidence into lender-grade agricultural intelligence.

MkulimaCollect is used primarily by trained field agents, cooperative/SACCO officers and authorized data collectors to onboard and progressively update farmers.

This must NOT look like a generic survey app.

It should feel like a sophisticated, trustworthy agricultural field operating system designed for real-world use in rural Africa.

---

# 1. PRODUCT PRINCIPLES

Design around these principles:

1. **Offline first**
2. **Fast field collection**
3. **Camera heavy**
4. **GPS and geospatial verification**
5. **Progressive data collection**
6. **Sector-aware forms**
7. **Evidence before assumptions**
8. **Clear consent and data governance**
9. **Visible collection quality**
10. **Simple enough for repeated field use**
11. **Low cognitive load**
12. **Large touch targets**
13. **Minimal typing**
14. **One-hand usability where possible**
15. **Save continuously**
16. **Never lose collected data**
17. **Strong audit trail**
18. **Designed for unreliable connectivity**
19. **Designed for Android first**
20. **Professional enough for deployment by banks, SACCOs and development institutions**

Do not make the application look childish, overly colourful or like a consumer fintech wallet.

---

# 2. VISUAL DIRECTION

Create an exceptional, minimal and premium visual system.

Overall feel:

* agricultural intelligence
* field verification
* precision
* trust
* institutional credibility
* African agriculture without visual clichés

Use:

* clean white/off-white surfaces
* deep agricultural green as primary accent
* dark charcoal typography
* subtle neutral grey surfaces
* restrained status colours
* generous whitespace
* strong information hierarchy
* rounded but not overly playful cards
* crisp iconography
* subtle maps and geospatial visual language
* professional typography
* strong contrast for outdoor sunlight

Avoid:

* cartoon farmers
* excessive illustrations
* excessive gradients
* excessive glassmorphism
* neon colours
* crowded dashboards
* unnecessary charts
* decorative agricultural imagery
* gamification

Design initially around a modern Android phone approximately 390 × 844 px.

Also create reusable responsive components suitable for tablets.

---

# 3. PRIMARY USER

## Field Agent

A field agent may be responsible for 50–500+ assigned farmers.

They may work:

* in villages
* on farms
* at cooperative offices
* at milk collection centres
* at factories
* in markets
* in remote areas
* with intermittent or zero connectivity

The application therefore needs persistent local storage and highly visible sync states.

---

# 4. PRIMARY NAVIGATION

Use a bottom navigation with approximately five primary areas:

### Home

Agent operations dashboard.

### Farmers

Assigned farmer registry.

### Collect

Fast primary action for new farmer / new data collection.

### Tasks

Follow-ups, corrections, verification requests and incomplete records.

### More

Sync centre, profile, settings, help and device information.

A prominent floating or central **+ Collect** action can be used where appropriate.

---

# 5. AGENT LOGIN AND DEVICE SECURITY

Design:

### Welcome screen

MkulimaCollect logo
“Field intelligence for agriculture.”

Actions:

* Sign in
* Device setup

### Agent authentication

Capture:

* phone/email/agent ID
* password/PIN
* optional OTP
* organization
* assigned branch/region

Support:

* secure login
* session lock
* biometric unlock where available
* offline PIN re-entry
* automatic timeout
* device registration

After login show:

**Francis O.**
Field Agent
Kiambu Cluster 04

Device status:

* Registered
* Secure
* Last synchronization
* App version

---

# 6. HOME — FIELD OPERATIONS DASHBOARD

Create a clean operational dashboard.

Header:

**Good morning, Francis**

Subtext:

Kiambu • Cluster 04

Show:

### Today

Assigned visits
12

Completed
7

In progress
2

Pending
3

---

### Farmer onboarding

Assigned farmers
183

Complete
121

Incomplete
42

Needs correction
6

Not started
14

---

### Synchronization

Use an important offline/sync component.

Example:

**17 records waiting to sync**

4 photos pending

Last sync: 10:42 AM

Button:

**Sync now**

Show connectivity indicator:

● Online

or

● Offline — your work is saved on this device

Offline should NEVER feel like an error.

---

### Data-quality queue

Examples:

4 profiles missing GPS

3 records need evidence

2 duplicate candidates

6 records returned by QA

Button:

**Review issues**

---

# 7. FARMER REGISTRY

Design farmer list with:

* search
* filter
* sort
* clusters
* villages
* value chains
* status

Each farmer card should display:

**Mary Wanjiku**

Farmer ID: MS-KE-004829

Githunguri • Kiambu

Dairy • Maize

Profile completeness: 82%

Status:

Verified / Incomplete / Draft / Needs review / Pending sync

Last update:

14 Aug 2026

Show contextual sync icon.

Filters:

* Assigned to me
* Not started
* In progress
* Complete
* Needs correction
* Unsynced
* Dairy
* Coffee
* Tea
* Maize
* Other sector
* Location

---

# 8. START NEW FARMER

Do NOT show a huge form.

Create a step-based onboarding flow.

Top of screen:

New farmer

Step 2 of 9

Progress indicator.

Primary stages:

1. Consent
2. Identity
3. Household & membership
4. Farm
5. Enterprise
6. Production
7. Financial
8. Evidence
9. Review

Allow:

**Save & exit**

at every stage.

Autosave continuously.

---

# 9. CONSENT — MANDATORY FIRST STEP

No scoring-related data collection proceeds before consent.

Screen title:

## Farmer consent

Explain simply:

“MkulimaScore uses information about the farmer, farm, production and financial activity to create agricultural financial-readiness and risk intelligence for approved financial partners.”

Consent should cover:

* farmer identity information
* farm information
* GPS location
* farm boundary/polygon capture
* agricultural production data
* photographs and documents
* SACCO/cooperative information
* savings records
* loan records
* repayment information
* authorized financial transaction information
* M-PESA/business records where separately authorized
* assessment for credit readiness
* sharing relevant assessment outputs with approved finance partners
* future profile updates and monitoring

Clearly state:

**A MkulimaScore assessment does not guarantee that a lender will approve a loan.**

Provide options:

☐ Farmer understands the purpose

☐ Farmer agrees to data collection

☐ Farmer agrees to GPS/farm mapping

☐ Farmer agrees to relevant cooperative/SACCO records being used

☐ Farmer agrees to sharing permitted assessment information with approved financing partners

Additional consent:

☐ Authorize M-PESA statement processing

Do not pre-check consent boxes.

Capture:

* consent given: yes/no
* consent date
* consent time
* consent method
* agent
* GPS location of consent
* language used
* farmer signature
* fingerprint/mark where legally/operationally appropriate
* witness where required
* consent version
* optional photograph of signed consent

Actions:

**Farmer consents**

**Farmer declines**

If consent is declined, gracefully end collection and save only permitted administrative metadata.

Include:

“Farmer may request correction or withdrawal of consent where applicable.”

---

# 10. FARMER IDENTITY / KYC

Create a camera-assisted KYC screen.

Capture:

### Basic identity

* full legal name
* first name
* middle name
* surname
* preferred name
* national ID / approved identity reference
* ID type
* ID number
* ID last digits/hash representation for controlled displays
* date of birth
* age where DOB unavailable
* gender
* primary phone number
* alternative phone number
* email if available
* preferred communication language

Do not unnecessarily expose complete ID numbers after capture.

### ID evidence

Actions:

**Scan front**

**Scan back**

Capture:

* ID photograph
* document type
* document number
* issue information where needed
* verification status

Show:

✓ Document captured

Do not automatically trust OCR values.

Show extracted values for agent confirmation.

---

# 11. LOCATION

Capture administrative location:

* country
* county
* sub-county
* ward
* location
* sub-location
* village
* nearest centre/town
* optional postal/location description

Capture:

* current GPS latitude
* longitude
* GPS accuracy
* altitude where useful
* capture timestamp

Provide:

**Capture location**

Display:

Accuracy ±6 m

Do not allow an inaccurate fix to appear verified.

---

# 12. HOUSEHOLD PROFILE

Capture relevant livelihood context:

* household size
* number of adults
* number of dependants
* primary livelihood
* secondary livelihood
* years farming
* farmer role
* household decision-maker where relevant
* other income-generating activities
* number of economically active household members

Avoid intrusive information that is not necessary for assessment.

---

# 13. SACCO / COOPERATIVE / GROUP MEMBERSHIP

Capture:

* cooperative/SACCO/group name
* member number
* membership start date/year
* active/inactive status
* branch
* farmer group
* producer organization
* collection centre
* factory
* processor where applicable
* buyer/offtaker affiliation

Capture available records:

* savings balance/history
* contributions
* loan history
* input credit
* repayment records
* produce delivery history
* payments from cooperative/buyer

Allow organization member record to be matched with preloaded registry data.

Show:

**Possible member match**

Mary Wanjiku
Member 04287
Phone ending 284

Actions:

**Confirm match**

**Not this farmer**

---

# 14. FARM MANAGEMENT

One farmer may have MULTIPLE farms.

Design:

## Farms

Farm 1
2.4 acres
Dairy + maize
Mapped ✓

Farm 2
0.8 acres
Avocado
Mapping incomplete

Action:

**+ Add farm**

---

# 15. FARM PROFILE

For every farm capture:

* farm name/local identifier
* farm ownership/tenure
* owned
* leased
* family-owned
* communal
* other

Capture:

* farm size
* size unit
* source of farm-size information
* farmer reported
* title/lease
* GPS calculation
* cooperative record
* other verified source

Record source explicitly.

Capture:

* years farming this farm
* primary use
* irrigation availability
* irrigation type
* water source
* electricity availability where relevant
* road accessibility
* approximate distance to road
* approximate distance to market
* approximate distance to collection centre/buyer
* storage availability
* basic farm infrastructure
* mechanization/assets where relevant

---

# 16. GPS FARM MAPPING

Create one of the best UX flows in the entire application.

Screen:

## Map farm

Map view.

Current location marker.

Actions:

**Capture farm point**

**Walk boundary**

**Draw boundary**

**Save polygon**

While walking:

Boundary recording

Points captured: 14

Distance walked: 463 m

Accuracy: ±4 m

Show polygon visually.

Calculate:

Area: 2.38 acres

Allow agent to compare:

Farmer reported: 2.5 acres
GPS measured: 2.38 acres

Flag large discrepancies without making a credit decision.

Record:

* latitude
* longitude
* polygon coordinates
* calculated acreage/hectares
* GPS accuracy
* capture date
* agent/device
* mapping method

Must work offline with cached/base mapping strategy where technically supported.

---

# 17. ENTERPRISES

A farmer may have multiple agricultural enterprises.

Examples:

Dairy
Coffee
Maize
Avocado

Allow:

**+ Add enterprise**

Each enterprise gets:

* value chain
* subtype/breed/variety
* farm
* scale
* start year
* season/cycle
* active/inactive
* primary/secondary enterprise
* irrigation
* enterprise assets
* production history
* buyer
* costs
* evidence
* risks

Selecting the value chain MUST dynamically load the appropriate sector module.

---

# 18. SUPPORTED VALUE CHAINS

Design dynamic modules for at least:

1. Dairy
2. Maize
3. Tea
4. Coffee
5. Avocado
6. Rice
7. Irish potatoes
8. Poultry
9. Tomato
10. Macadamia
11. Aquaculture
12. Livestock meat
13. Beans
14. Horticulture / configurable horticultural crops

Architecture must allow new value chains to be added without redesigning the app.

---

# 19. UNIVERSAL PRODUCTION DATA

For every enterprise capture:

### Production capacity

* enterprise size
* acreage/hectares
* livestock numbers where relevant
* planted area
* productive area
* production units

### Production history

Allow at least:

* current cycle
* previous cycle
* previous 2–3 cycles where available

Capture:

* production volume
* unit
* yield
* harvest/delivery dates
* number of harvests
* frequency
* losses
* rejected produce
* home consumption
* sold volume

### Sales

Capture:

* buyer/offtaker
* cooperative/processor
* market channel
* sales frequency
* volume sold
* price per unit
* total value
* payment method
* payment frequency
* payment delay
* recurring buyer relationship
* contractual/offtake arrangement where available

### Evidence

* delivery statement
* receipt
* invoice
* collection record
* buyer statement
* cooperative record
* photograph
* other source

---

# 20. INPUTS AND COSTS

Capture relevant production costs:

* seed/planting material
* fertilizer
* pesticides
* herbicides
* fungicides
* animal feed
* supplements
* veterinary costs
* labour
* machinery
* irrigation
* electricity/fuel
* transport
* storage
* packaging
* processing
* land lease
* other major costs

For inputs capture:

* input
* quantity
* source/supplier
* amount
* frequency
* cash/credit
* outstanding input credit
* evidence available

Do not require unrealistic accounting precision from smallholders.

Allow:

Exact amount
Estimated amount
Unknown

Record confidence/source.

---

# 21. DAIRY MODULE

Create a dedicated dairy flow.

### Herd

Capture:

* total cattle
* dairy cattle
* lactating cows
* dry cows
* heifers
* calves
* bulls
* breeds
* average herd age where useful

### Milk production

* litres per day
* morning production
* evening production where available
* average litres per lactating cow
* production days
* seasonal high
* seasonal low
* historical production

### Milk sales

* buyer/processor
* cooperative
* collection centre
* litres delivered
* delivery frequency
* rejected/spoiled milk
* price per litre
* payment cycle
* payment method
* average monthly milk income

### Costs

* feed expenditure
* fodder
* concentrates
* veterinary expenses
* artificial insemination/breeding
* labour
* water
* transport

### Animal health

* vaccination
* veterinary access
* major disease history
* mastitis incidence where relevant
* mortality
* insurance where applicable

### Assets/evidence

* cowshed
* chaff cutter
* milking equipment
* cooling access
* feed storage

Evidence:

* processor statements
* cooperative delivery records
* milk receipts
* payment statements
* veterinary records
* livestock photographs

---

# 22. COFFEE MODULE

Capture:

* acreage
* number of coffee trees
* productive trees
* variety
* age of trees
* production season
* flowering/harvest cycle
* cherry production
* historical deliveries
* kilograms delivered
* yield
* cooperative/factory
* processor
* buyer
* cherry price
* parchment/processed output where relevant
* payment timing
* advance payments
* final payment
* bonus payment
* annual/seasonal income
* quality/grade where available
* input credit
* fertilizer
* pesticides
* pruning
* labour
* disease/pest history
* irrigation
* transport

Evidence:

* factory delivery records
* cooperative statements
* payment statements
* receipts
* farm/tree photographs

---

# 23. TEA MODULE

Capture:

* tea acreage
* productive acreage
* number/age of bushes where available
* factory
* buying centre
* cooperative affiliation
* green leaf kilograms
* monthly delivery history
* delivery frequency
* average monthly production
* seasonal variation
* price per kilogram
* monthly payment
* bonus cycle
* bonus history where available
* fertilizer/input credit
* labour costs
* plucking costs
* transport
* disease/pest history
* rainfall sensitivity
* delivery records

Evidence:

* factory statement
* buying-centre receipts
* cooperative records
* payment records

---

# 24. MAIZE MODULE

Capture:

* acreage planted
* acreage harvested
* variety
* seed source
* planting date
* expected harvest
* production cycle
* bags/kilograms harvested
* historical harvests
* yield per acre
* quantity sold
* quantity stored
* household consumption
* losses
* post-harvest losses
* storage method
* buyer
* sales timing
* price
* market channel
* fertilizer
* seed
* pesticides/herbicides
* mechanization
* labour
* rainfall dependence
* irrigation
* drought history
* pest/disease history

Evidence:

* input receipts
* harvest photograph
* storage photograph
* sales receipts
* buyer records

---

# 25. AVOCADO MODULE

Capture:

* acreage
* number of trees
* productive trees
* variety
* tree age
* planting year
* flowering period
* harvest season
* harvest cycles
* kilograms/fruits harvested
* historical output
* rejected produce
* export-grade percentage where available
* grade/quality
* buyer/exporter/aggregator
* contracted buyer
* price
* payment cycle
* irrigation
* fertilizer/manure
* pest management
* pruning
* labour
* certification where available
* transport
* post-harvest handling

Evidence:

* buyer delivery records
* export/aggregator receipts
* certification
* farm/tree photographs

---

# 26. RICE MODULE

Capture:

* acreage
* variety
* scheme/location
* irrigated/rain-fed
* water source
* planting method
* planting date
* harvest date
* production cycle
* kilograms/bags harvested
* yield
* historical production
* milling arrangement
* quantity sold
* buyer
* price
* storage
* household consumption
* seed
* fertilizer
* pesticides
* labour
* irrigation/water charges
* machinery
* transport
* flood/drought exposure

---

# 27. IRISH POTATO MODULE

Capture:

* acreage
* variety
* planting date
* expected harvest
* crop cycle
* seed source
* bags/kilograms harvested
* yield
* historical cycles
* buyer
* broker/market
* price
* sales timing
* storage
* rejected produce
* seed cost
* fertilizer
* fungicide/pesticide
* labour
* transport
* irrigation
* blight/disease history
* post-harvest losses

---

# 28. POULTRY MODULE

Capture:

* production type:

  * layers
  * broilers
  * indigenous
  * dual purpose

Capture:

* current bird population
* batch size
* age
* breed
* production cycle
* mortality
* historical batches

For layers:

* eggs/day
* trays/day
* laying rate
* eggs sold
* egg price

For broilers:

* birds sold per cycle
* live weight where available
* selling price
* cycle length

Costs:

* chicks
* feed
* vaccination
* veterinary
* labour
* electricity
* housing
* transport

Capture:

* buyer
* market
* mortality history
* vaccination
* disease history
* housing type
* biosecurity indicators

Evidence:

* feed receipts
* veterinary records
* buyer receipts
* flock photographs

---

# 29. TOMATO MODULE

Capture:

* acreage
* variety
* greenhouse/open field
* number of plants where available
* irrigation
* planting date
* harvest period
* production cycle
* kilograms/crates harvested
* harvest frequency
* yield
* rejected/spoiled produce
* buyer
* market
* price
* price variation
* perishability losses
* seed/seedling
* fertilizer
* pesticide/fungicide
* labour
* irrigation
* packaging
* transport
* disease history
* market access

---

# 30. MACADAMIA MODULE

Capture:

* acreage
* number of trees
* productive trees
* variety
* tree age
* harvest season
* kilograms harvested
* historical harvest
* quality/grade
* rejected nuts
* buyer/processor
* price
* payment cycle
* fertilizer/manure
* pruning
* pest/disease history
* labour
* transport
* certification where available

---

# 31. AQUACULTURE MODULE

Capture:

* fish species
* production system
* pond/cage/tank
* number of ponds/cages
* pond size
* stocking capacity
* fingerlings stocked
* stocking date
* survival/mortality
* production cycle
* harvest date
* kilograms harvested
* average fish weight
* historical cycles
* buyer
* price per kilogram
* feed use
* feed cost
* fingerling cost
* water source
* water reliability
* disease history
* veterinary/aquaculture support
* labour
* transport
* cold-chain access

Evidence:

* pond photographs
* stocking receipts
* feed receipts
* sales records

---

# 32. LIVESTOCK MEAT MODULE

Support:

* cattle
* goats
* sheep
* pigs
* other configurable livestock

Capture:

* species
* breed
* number owned
* age classes
* breeding stock
* animals purchased
* animals sold
* mortality
* production cycle
* average sale weight
* sale frequency
* buyer
* market
* price
* feed
* grazing
* veterinary costs
* vaccination
* disease history
* water access
* pasture availability
* insurance where available

Evidence:

* livestock photographs
* veterinary records
* purchase/sales receipts
* market records

---

# 33. BEANS MODULE

Capture:

* acreage
* variety
* planting date
* harvest date
* cycle
* kilograms/bags harvested
* historical harvest
* yield
* quantity sold
* household consumption
* storage
* post-harvest loss
* buyer
* price
* seed
* fertilizer
* pesticides
* labour
* irrigation
* rainfall dependence
* disease/pest incidence

---

# 34. HORTICULTURE MODULE

Make this highly configurable.

Capture:

* crop
* variety
* acreage
* greenhouse/open field
* irrigation
* planting date
* harvest cycle
* harvest frequency
* kilograms/crates/pieces
* historical production
* quality/grade
* rejected produce
* buyer
* contract/offtake
* market
* sales frequency
* price
* perishability
* post-harvest losses
* cold-chain access
* packaging
* transport
* seed/seedlings
* fertilizer
* crop protection
* labour
* certification
* irrigation costs

---

# 35. CLIMATE AND PRODUCTION RISK

Do not ask the farmer technical climate-science questions.

Collect observable field information.

Capture:

* drought experienced
* flood experienced
* irregular rainfall
* water shortage
* crop failure
* significant pest event
* significant disease event
* livestock disease event
* mortality
* production shock
* market shock
* price shock

For each:

* year/season
* severity
* production impact
* recovery
* evidence where available

Capture:

* irrigation access
* water reliability
* diversification
* storage
* insurance
* alternative income
* climate-sensitive production dependencies

Geospatial/environmental enrichment itself happens on the central platform.

Do NOT expose proprietary geospatial risk calculations in the field app.

---

# 36. FINANCIAL PROFILE

Create a structured financial module.

Capture:

### Income

* agriculture income
* major enterprise income
* secondary enterprise income
* non-farm income
* income frequency
* seasonality
* payment channel

Avoid forcing false monthly income estimates when income is seasonal.

Support:

Daily
Weekly
Monthly
Per production cycle
Seasonal
Annual

### Savings

* SACCO savings
* group savings
* bank savings where provided
* frequency
* approximate balance/range where appropriate
* historical consistency
* source

### Existing credit

For each loan:

* lender
* loan type
* purpose
* disbursement date
* original amount
* outstanding balance
* tenor
* repayment frequency
* installment
* repayment status
* arrears
* days past due where available
* completed/current/defaulted/restructured
* source of information

### Input credit

Capture:

* supplier
* amount/value
* input type
* repayment method
* outstanding amount
* repayment history

Clearly distinguish:

**Verified record**

from:

**Farmer reported**

Self-reported financial information should visibly carry a lower-evidence/source status rather than being presented as verified.

---

# 37. M-PESA STATEMENT COLLECTION

Only show this module when separately authorized by the farmer.

Screen:

## Add M-PESA statement

Explain why it is being requested.

Options:

**Upload PDF**

**Select file**

Capture:

* statement period
* statement file
* associated phone number
* farmer authorization
* file status

If the PDF is encrypted, securely capture:

**Statement password**

The password must be treated as sensitive information.

Design requirements:

* masked by default
* reveal toggle
* never display after successful upload
* never store as ordinary visible profile data
* encrypted transfer to central processing system

IMPORTANT:

MkulimaCollect DOES NOT parse the M-PESA statement locally.

The encrypted document and required processing credential are securely transferred to the central MkulimaScore platform.

Central processing handles:

* parsing
* validation
* extraction
* confidence
* failure handling

Field app statuses:

Uploaded

Processing

Processed

Needs new statement

Incorrect password

Unable to process

Never expose proprietary financial-behaviour calculations.

---

# 38. EVIDENCE VAULT

Create a beautiful evidence capture interface.

Evidence categories:

* National ID
* consent
* farm
* livestock
* crop
* cooperative
* SACCO
* buyer
* delivery record
* payment statement
* M-PESA statement
* bank document
* sales receipt
* input receipt
* veterinary record
* production record
* loan record
* repayment record
* certification
* title/lease
* other

Actions:

**Take photo**

**Upload file**

**Scan document**

**Add existing photo**

For every evidence item store metadata:

* type
* farmer
* farm
* enterprise
* source
* date
* capture timestamp
* agent
* GPS where appropriate
* verification status
* notes

Evidence states:

Draft

Uploaded

Processing

Verified

Needs review

Rejected

Re-upload requested

---

# 39. CAMERA UX

Camera should be first-class.

Use:

* full-screen capture
* document framing guides
* quality checks
* retake
* flash
* multiple-page capture
* automatic compression without destroying readability

After capture:

Document type

Date

Related enterprise

Source

Optional note

Then:

**Save evidence**

---

# 40. DATA SOURCE AND CONFIDENCE

Every important field should be capable of recording its source.

Sources may include:

* farmer reported
* field observation
* GPS measured
* cooperative
* SACCO
* buyer
* processor
* document
* M-PESA
* bank
* government/registry
* other authorized partner

Do NOT show proprietary numeric scoring confidence calculations.

Instead use collection-language such as:

Verified

Supported by evidence

Farmer reported

Needs verification

Missing evidence

---

# 41. PROFILE COMPLETENESS

The agent needs collection completeness, NOT proprietary credit scoring.

Show:

## Profile completeness

Identity
100%

Farm
90%

Production
76%

Financial
62%

Evidence
81%

Overall collection:

**82% complete**

Next best actions:

* Add latest milk delivery statement
* Map Farm 2 boundary
* Confirm existing SACCO loan
* Complete dairy input costs

Do not reveal scoring weights.

---

# 42. REVIEW BEFORE SUBMISSION

Create a comprehensive but clean review screen.

Sections:

Consent ✓

Identity ✓

Membership ✓

Farm ✓

Dairy ⚠

Financial ✓

Evidence ⚠

Show warnings:

2 items require attention

* Farm 2 boundary not captured
* Latest production evidence unavailable

Allow:

**Edit section**

Then:

**Submit farmer profile**

Submission confirmation:

Farmer profile submitted

MS-KE-004829

18 Aug 2026 • 14:42

---

# 43. QUALITY ASSURANCE

Some submissions are returned for correction.

Agent receives:

## Needs correction

Mary Wanjiku

2 issues

1. GPS accuracy was above acceptable collection quality.
2. ID photograph is unreadable.

Actions:

**Fix now**

**Open farmer**

Do not reveal internal fraud rules, thresholds or scoring logic.

---

# 44. DUPLICATE HANDLING

When possible duplicate farmer is detected:

## Possible existing farmer

Mary Wanjiku

Phone ending 284

Githunguri

Similarity detected

Actions:

**Review profile**

**Same farmer**

**Different farmer**

Do not show technical duplicate-detection algorithms.

---

# 45. OFFLINE EXPERIENCE

Offline operation is mandatory.

At all times show a subtle connectivity indicator.

When offline:

**Offline**

“Your work is being saved on this device.”

User can:

* create farmer
* edit farmer
* capture GPS
* map farm
* add enterprise
* enter production
* capture photos
* attach locally stored files
* complete forms
* submit to local queue

When submission happens offline:

✓ Saved

**Waiting to sync**

Never use alarming red error messaging simply because the device has no internet.

---

# 46. SYNC CENTRE

Create a dedicated screen:

## Sync Centre

Connection:

Online — 4G

Last successful sync:

10:42 AM

### Waiting

17 farmer records

43 images

3 documents

Estimated upload size:
28 MB

Primary:

**Sync now**

Show individual statuses:

Queued

Uploading

Synced

Conflict

Retry required

Do not discard records after failed synchronization.

Support:

* retry
* resumable upload
* queue
* conflict resolution
* local backup state

---

# 47. TASKS

Design operational task management.

Task categories:

* Visit farmer
* Complete profile
* Capture GPS
* Collect evidence
* Correct record
* Follow up production
* Confirm repayment
* Update season
* Verify buyer
* Revisit farm

Each task:

Farmer

Village

Priority

Due date

Type

Offline availability

Provide:

**Start task**

---

# 48. REPAYMENT AND OUTCOME FOLLOW-UP

MkulimaCollect should also support post-lending feedback where agents/authorized institutions need it.

Capture:

* facility/lender reference
* approved amount
* disbursed amount
* disbursement date
* loan purpose
* tenor
* repayment schedule
* repayment status
* amount repaid
* outstanding amount
* days past due where authorized
* completed
* current
* late
* defaulted
* restructured
* follow-up notes
* evidence

This closes the data feedback loop.

Do NOT display predicted-vs-actual model logic to normal field agents.

---

# 49. FARMER TIMELINE

Design a chronological farmer history:

14 Aug

Milk delivery statement added

11 Aug

Production updated

03 Aug

Farm boundary verified

21 Jul

Profile created

06 Jul

Consent recorded

Allow filters:

Production
Financial
Farm
Evidence
Loans
Verification

---

# 50. FARMER PROFILE SCREEN

Header:

Mary Wanjiku

MS-KE-004829

Verified identity ✓

Githunguri, Kiambu

Dairy • Maize

Collection status:

82% complete

Tabs or sections:

Overview

Farms

Enterprises

Production

Financial

Evidence

Activity

Tasks

Do NOT expose the lender-facing 0–1000 credit score in the normal field interface.

Do NOT expose:

* scoring formulas
* model weights
* thresholds
* internal fraud rules
* exposure formulas
* proprietary reason-code generation
* ML architecture

---

# 51. FORM DESIGN SYSTEM

Do not use endless text fields.

Prefer:

* segmented controls
* yes/no
* chips
* dropdowns
* searchable lists
* steppers
* numeric keypads
* unit selectors
* date pickers
* camera actions
* GPS actions
* conditional questions

Example:

How is this farm held?

[Owned]

[Leased]

[Family]

[Other]

Rather than a dropdown when only four options exist.

---

# 52. CONDITIONAL LOGIC

Forms must dynamically react.

Example:

Does the farm have irrigation?

No

→ Skip irrigation details.

Yes

→ Ask:

Water source

Irrigation type

Irrigated acreage

Reliability

Similarly:

Value chain = Dairy

→ Load dairy module.

Value chain = Coffee

→ Load coffee module.

Farmer has existing loan = No

→ Skip loan detail.

M-PESA consent = No

→ Do not show statement upload request.

---

# 53. VALIDATION

Use helpful inline validation.

Examples:

“Phone number appears incomplete.”

“GPS accuracy is currently ±38 m. Move to an open area and try again.”

“Harvest cannot occur before planting date.”

“Reported farm size differs significantly from GPS-measured area. Please confirm.”

Avoid blaming the agent.

---

# 54. FIELD NOTES

Allow quick notes:

* text
* optional voice note
* photograph

Examples:

“Farmer leases second plot during potato season.”

“Current dairy production lower due to feed shortage.”

Store:

author
time
date
farmer
farm/enterprise association

---

# 55. AGENT ROUTES AND CLUSTERS

Design an assigned-work screen:

## My area

Cluster 04

Githunguri

183 farmers

Show:

* villages
* assigned farmers
* completed
* pending
* priority visits

Optional map of assigned farmers.

Do not continuously track agent location unnecessarily.

Use location only for legitimate collection and operational purposes.

---

# 56. ADMINISTRATIVE METADATA

Automatically associate records with:

* farmer ID
* agent ID
* organization
* device ID
* application version
* timestamp
* record source
* creation date
* modification date
* synchronization timestamp
* collection mode
* online/offline
* verification status

These should mostly be system-generated rather than manually entered.

---

# 57. PRIVACY AND SECURITY UX

Show appropriate role-based access.

Do not allow an agent to browse unrelated farmer records.

Sensitive information should be masked where possible.

Examples:

National ID
•••••••482

Phone
07•• ••• 284

Provide visible consent status.

Maintain audit history.

Never make raw partner records unnecessarily downloadable from the mobile app.

---

# 58. IP PROTECTION

This is critical.

The field application is an evidence collection and verification interface.

Do NOT expose or design screens containing:

* MkulimaScore scoring formula
* individual model weights
* scoring thresholds
* internal schemas
* confidence calculation formulas
* exposure recommendation formulas
* proprietary geospatial calculations
* model training data
* fraud-detection rules
* raw scoring code
* internal algorithm descriptions

Collection requirements can be visible.

Proprietary transformation from data → intelligence remains on the MkulimaScore central platform.

---

# 59. ACCESSIBILITY AND FIELD CONDITIONS

Design for:

* bright sunlight
* low-end Android devices
* gloves/dust where possible
* users in motion
* intermittent network
* large datasets
* one-handed use
* limited time per farmer

Minimum touch targets should be comfortable.

Avoid tiny text.

Use high contrast.

Persist partially completed forms.

---

# 60. LANGUAGE ARCHITECTURE

Design the system so interface language can later switch between:

English

Kiswahili

Other local languages

Do not hard-code screen layouts that break when translated.

---

# 61. KEY REUSABLE COMPONENTS

Create a reusable Figma component library for:

* navigation bar
* top app bar
* farmer card
* farm card
* enterprise card
* task card
* evidence card
* status badge
* sync badge
* offline banner
* progress indicator
* profile completeness
* form section header
* segmented selector
* input field
* quantity + unit field
* currency field
* GPS capture field
* document upload
* camera capture
* consent checkbox
* signature field
* timeline item
* warning card
* QA issue
* empty state
* success state
* skeleton/loading state

Build proper variants.

---

# 62. REQUIRED END-TO-END PROTOTYPE

Produce a clickable prototype for this exact flow:

Agent login

↓

Home dashboard

↓

Start new farmer

↓

Consent

↓

Identity capture

↓

ID camera capture

↓

Location

↓

SACCO/member matching

↓

Create Farm 1

↓

GPS location

↓

Walk farm boundary

↓

Add enterprise

↓

Select Dairy

↓

Complete dairy herd data

↓

Add milk production

↓

Add buyer

↓

Capture milk delivery statement

↓

Complete financial profile

↓

Optional M-PESA consent

↓

Upload statement

↓

Review profile

↓

Submit while OFFLINE

↓

Profile enters sync queue

↓

Connectivity restored

↓

Sync centre uploads record

↓

Successful synchronization

↓

Farmer profile shows complete/synced state

---

# 63. SECOND PROTOTYPE

Create another flow demonstrating sector modularity:

Existing farmer

↓

Add Enterprise

↓

Coffee

↓

Coffee acreage

↓

Tree information

↓

Season

↓

Production

↓

Cooperative/factory

↓

Delivery history

↓

Payment cycle

↓

Input credit

↓

Evidence

↓

Save

This demonstrates that MkulimaCollect is not built only for dairy.

---

# 64. EMPTY STATES

Create thoughtful empty states.

Example:

## No production records yet

“Production history helps build a more complete farmer record.”

**Add production**

Avoid marketing language.

---

# 65. SUCCESS STATES

Example:

## Farm mapped

2.38 acres

18 boundary points

GPS accuracy: Good

**Continue**

---

# 66. FINAL DESIGN DELIVERABLE

Produce a coherent Figma application covering approximately 35–50 carefully designed core screens plus component variants rather than hundreds of repetitive form screens.

Create:

### Page 1 — Foundations

Colours
Typography
Spacing
Grid
Icons
Accessibility

### Page 2 — Components

Complete reusable component system.

### Page 3 — Agent Operations

Login
Home
Farmers
Tasks
Routes
Sync

### Page 4 — Farmer Onboarding

Consent
Identity
KYC
Membership
Location

### Page 5 — Farm & Geo

Farm profile
GPS
Polygon mapping
Farm infrastructure

### Page 6 — Enterprises

Universal enterprise flow and sector selector.

### Page 7 — Sector Modules

Representative high-detail screens for:

Dairy
Coffee
Tea
Maize
Avocado
Poultry

And reusable patterns for all other supported chains.

### Page 8 — Financial & Evidence

Savings
Loans
Repayment
M-PESA
Documents
Camera
Evidence vault

### Page 9 — QA & Sync

Completeness
Review
Corrections
Duplicates
Offline
Sync centre

### Page 10 — Prototype

End-to-end clickable field workflows.

---

# 67. THE EXPERIENCE WE ARE AIMING FOR

The final product should communicate:

“This application knows exactly what evidence is required to understand an agricultural enterprise.”

An agent should never feel that they are completing a generic questionnaire.

The application should intelligently guide them through:

**Who is the farmer?**

↓

**Where is the farm?**

↓

**What does the farmer produce?**

↓

**How does that specific agricultural enterprise operate?**

↓

**What evidence supports what the farmer has told us?**

↓

**How does money flow through the enterprise?**

↓

**What records can be independently verified?**

↓

**What is still missing?**

↓

**Can this record safely synchronize to MkulimaScore?**

Design MkulimaCollect as the **trusted evidence acquisition layer of MkulimaScore's agricultural intelligence infrastructure**.

The result must feel polished enough to deploy with major financial institutions, but simple enough for an agent standing on a farm with an Android phone and no internet connection.
