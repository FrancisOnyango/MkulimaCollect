# MkulimaCollect — Repository Structure Steering

## Workspace Layout Decision

The workspace root `c:\Users\FRANC\Pictures\MkulimaCollect\` contains two distinct codebases:

```
MkulimaCollect/                   ← workspace root
  src/                            ← FIGMA PROTOTYPE (read-only design reference)
  package.json                    ← Figma Make / Vite (DO NOT MODIFY)
  vite.config.ts                  ← Figma Make (DO NOT MODIFY)
  index.html                      ← Figma Make (DO NOT MODIFY)
  .figma/                         ← Figma Make tooling (DO NOT MODIFY)
  apps/
    collect/                      ← PRODUCTION EXPO APP (all new code goes here)
  .kiro/
    steering/                     ← Architecture rules
    specs/
      mkulimacollect-app/         ← Spec documents
```

## Rule: Never Modify the Figma Prototype

Files under `src/`, `package.json`, `vite.config.ts`, `index.html`, `.figma/` are the design reference. They must never be:
- Modified to run React Native code
- Deleted or renamed
- Treated as production source files
- Imported from `apps/collect/`

## Production App Root: `apps/collect/`

All production code lives under `apps/collect/`. This is a standalone Expo managed-workflow application with its own `package.json`, `app.json`, `tsconfig.json`, `babel.config.js`, and `metro.config.js`.

## `apps/collect/` Full Structure

```
apps/collect/
  app/                            # Expo Router — file = screen
    _layout.tsx                   # Root: AuthProvider, ThemeProvider, DBProvider
    +not-found.tsx
    (auth)/
      _layout.tsx
      login.tsx
      device-setup.tsx
    (tabs)/
      _layout.tsx                 # Bottom tab navigator
      index.tsx                   # Home dashboard
      farmers/
        _layout.tsx
        index.tsx                 # Farmer list with search/filter
        [farmerId]/
          _layout.tsx             # Farmer profile shell
          index.tsx               # Overview tab
          farms.tsx               # Farms tab
          enterprises.tsx         # Enterprises tab
          financial.tsx           # Financial tab
          evidence.tsx            # Evidence tab
          activity.tsx            # Activity/audit tab
      tasks.tsx                   # Task list
      more.tsx                    # Settings / sync / agent profile
    collect/
      _layout.tsx                 # Wizard shell (progress bar, autosave indicator)
      index.tsx                   # Step router (redirects to first incomplete step)
      consent.tsx
      identity.tsx
      location.tsx
      membership.tsx
      farm.tsx
      enterprise.tsx
      [sector].tsx                # Dynamic sector form (reads schema from engine)
      financial.tsx
      evidence-review.tsx
      review.tsx
    farms/
      [farmId]/
        _layout.tsx
        index.tsx                 # Farm detail
        boundary.tsx              # GPS boundary capture (MapLibre)
    enterprises/
      [enterpriseId]/
        _layout.tsx
        index.tsx
        production.tsx
        costs.tsx
        evidence.tsx
    evidence/
      [evidenceId].tsx            # Evidence detail
      capture.tsx                 # Camera / document capture
    sync/
      index.tsx                   # Sync centre
    gps/
      boundary.tsx                # Standalone GPS boundary screen

  components/                     # Reusable React Native components
    ui/                           # Atomic, no domain knowledge
      Badge.tsx
      Button.tsx
      Card.tsx
      CompletenessBar.tsx
      ConnectivityIndicator.tsx
      EmptyState.tsx
      Field.tsx
      IconButton.tsx
      LoadingSpinner.tsx
      ProgressSteps.tsx
      SafeArea.tsx
      Skeleton.tsx
      TopBar.tsx
    forms/                        # Domain-aware form primitives
      CameraAction.tsx
      ConsentCheckbox.tsx
      CurrencyField.tsx
      DateField.tsx
      DocumentUpload.tsx
      GpsField.tsx
      MultiSelect.tsx
      NumericStepper.tsx
      ProvenanceSelect.tsx
      SearchableSelect.tsx
      SegmentedControl.tsx
      SignaturePad.tsx
      UnitField.tsx
    domain/                       # Farmer/farm/enterprise display components
      ActivityTimeline.tsx
      EvidenceCard.tsx
      FarmerCard.tsx
      FarmerHeader.tsx
      FarmCard.tsx
      EnterpriseCard.tsx
      ProfileCompleteness.tsx
      QaIssueCard.tsx
      SyncBanner.tsx
      SyncItemRow.tsx
      TaskCard.tsx
    map/
      BoundaryMap.tsx
      GpsAccuracyIndicator.tsx
      PolygonOverlay.tsx

  features/                       # Domain business logic (no UI)
    auth/
      AuthProvider.tsx
      SessionManager.ts
      SecureTokenStore.ts
    farmers/
      farmerRepository.ts
      useFarmer.ts
      useFarmerList.ts
      farmerCompleteness.ts
    farms/
      farmRepository.ts
      boundaryRepository.ts
      useFarm.ts
    enterprises/
      enterpriseRepository.ts
      useEnterprise.ts
    collection/
      collectionRepository.ts
      useCollectionWizard.ts
      wizardState.ts
    sector-engine/
      SchemaEngine.ts
      SectorSchemaRegistry.ts
      FieldRenderer.tsx
      validators.ts
      schemas/
        dairy.schema.ts
        maize.schema.ts
        tea.schema.ts
        coffee.schema.ts
        avocado.schema.ts
        rice.schema.ts
        irish-potato.schema.ts
        poultry.schema.ts
        tomato.schema.ts
        macadamia.schema.ts
        aquaculture.schema.ts
        livestock-meat.schema.ts
        beans.schema.ts
        horticulture.schema.ts
    evidence/
      evidenceRepository.ts
      CameraService.ts
      FileUploadQueue.ts
      useEvidence.ts
    sync/
      SyncEngine.ts
      SyncOutbox.ts
      SyncQueue.ts
      useSyncStatus.ts
      conflictResolver.ts
    tasks/
      taskRepository.ts
      useTaskList.ts
    geo/
      GpsService.ts
      BoundaryService.ts
      AreaCalculator.ts

  lib/
    db/
      database.ts                 # expo-sqlite init, drizzle instance
      schema.ts                   # All Drizzle table definitions
      migrations/                 # SQL migration files (sequential)
        0001_initial.sql
      seed/                       # Dev-only seed data
    api/
      types.ts                    # All API TypeScript interfaces
      ApiClient.ts                # Adapter interface definition
      adapters/
        LocalDevelopmentAdapter.ts
        MockRemoteAdapter.ts
        ProductionApiAdapter.ts
    storage/
      LocalFileStore.ts
    crypto/
      HashUtil.ts

  constants/
    colors.ts                     # Ported from Figma src/index.css tokens
    spacing.ts
    typography.ts
    theme.ts
    provenance.ts
    syncStates.ts
    sectorIds.ts

  types/
    farmer.ts
    farm.ts
    enterprise.ts
    evidence.ts
    sync.ts
    sector.ts
    api.ts
    geo.ts

  hooks/
    useConnectivity.ts
    useGps.ts
    useCamera.ts
    useOfflineSync.ts

  assets/
    fonts/
      InstrumentSans-Regular.ttf
      InstrumentSans-SemiBold.ttf
      DMMono-Regular.ttf
    images/
      icon.png
      splash.png
      adaptive-icon.png

  app.json
  eas.json
  babel.config.js
  metro.config.js
  tailwind.config.js
  tsconfig.json
  package.json
  .env.example
  .gitignore
```

## Import Rules

- Screens (`app/`) import from `components/`, `features/`, `hooks/`, `constants/`, `types/`
- `features/` import from `lib/db/`, `lib/api/`, `lib/storage/`, `constants/`, `types/`
- `lib/db/` must NOT import from `features/` or `app/` (dependency inversion)
- `lib/api/` must NOT import from `lib/db/` directly
- Circular imports are forbidden

## Naming Conventions

- Screen files: `PascalCase.tsx` (Expo Router requires default export)
- Component files: `PascalCase.tsx`
- Hook files: `useCamelCase.ts`
- Repository files: `camelCaseRepository.ts`
- Service files: `PascalCaseService.ts`
- Schema files: `kebab-case.schema.ts`
- Type files: `camelCase.ts`
- SQL migration files: `0001_description.sql` (sequential, never renamed)
