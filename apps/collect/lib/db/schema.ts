import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const farmers = sqliteTable(
  "farmers",
  {
    id: text("id").primaryKey(),
    agentId: text("agent_id").notNull(),
    orgId: text("org_id").notNull(),
    status: text("status").notNull().default("DRAFT"),
    completenessPct: integer("completeness_pct").notNull().default(0),
    declinedConsent: integer("declined_consent", { mode: "boolean" }).notNull().default(false),
    localVersion: integer("local_version").notNull().default(1),
    serverVersion: integer("server_version"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    syncedAt: text("synced_at"),
    deletedAt: text("deleted_at"),
  },
  (table) => ({
    agentIdx: index("idx_farmers_agent").on(table.agentId),
    orgIdx: index("idx_farmers_org").on(table.orgId),
    statusIdx: index("idx_farmers_status").on(table.status),
    updatedIdx: index("idx_farmers_updated").on(table.updatedAt),
  }),
);

export const farmerIdentities = sqliteTable(
  "farmer_identities",
  {
    id: text("id").primaryKey(),
    farmerId: text("farmer_id").notNull().references(() => farmers.id),
    fullLegalName: text("full_legal_name"),
    firstName: text("first_name"),
    middleName: text("middle_name"),
    surname: text("surname"),
    preferredName: text("preferred_name"),
    nationalIdType: text("national_id_type"),
    nationalIdHash: text("national_id_hash"),
    nationalIdLast3: text("national_id_last3"),
    primaryPhoneHash: text("primary_phone_hash"),
    primaryPhoneLast4: text("primary_phone_last4"),
    preferredLanguage: text("preferred_language"),
    localVersion: integer("local_version").notNull().default(1),
    updatedAt: text("updated_at").notNull(),
    syncedAt: text("synced_at"),
  },
  (table) => ({
    farmerIdx: index("idx_farmer_identities_farmer").on(table.farmerId),
  }),
);

export const consents = sqliteTable(
  "consents",
  {
    id: text("id").primaryKey(),
    farmerId: text("farmer_id").notNull().references(() => farmers.id),
    version: text("version").notNull(),
    declined: integer("declined", { mode: "boolean" }).notNull().default(false),
    method: text("method").notNull(),
    language: text("language").notNull(),
    agentId: text("agent_id").notNull(),
    gpsLatitude: real("gps_latitude"),
    gpsLongitude: real("gps_longitude"),
    gpsAccuracyM: real("gps_accuracy_m"),
    itemsAgreed: text("items_agreed").notNull(),
    mpesaAuthorized: integer("mpesa_authorized", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
    syncedAt: text("synced_at"),
  },
  (table) => ({
    farmerIdx: index("idx_consents_farmer").on(table.farmerId),
  }),
);

export const farms = sqliteTable(
  "farms",
  {
    id: text("id").primaryKey(),
    farmerId: text("farmer_id").notNull().references(() => farmers.id),
    name: text("name"),
    tenure: text("tenure"),
    sizeReportedAcres: real("size_reported_acres"),
    sizeReportedSource: text("size_reported_source"),
    sizeGpsAcres: real("size_gps_acres"),
    irrigation: integer("irrigation", { mode: "boolean" }),
    county: text("county"),
    subCounty: text("sub_county"),
    ward: text("ward"),
    village: text("village"),
    gpsLatitude: real("gps_latitude"),
    gpsLongitude: real("gps_longitude"),
    gpsAccuracyM: real("gps_accuracy_m"),
    localVersion: integer("local_version").notNull().default(1),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    syncedAt: text("synced_at"),
  },
  (table) => ({
    farmerIdx: index("idx_farms_farmer").on(table.farmerId),
  }),
);

export const farmGeometries = sqliteTable(
  "farm_geometries",
  {
    id: text("id").primaryKey(),
    farmId: text("farm_id").notNull().references(() => farms.id),
    polygonGeojson: text("polygon_geojson").notNull(),
    calculationMethod: text("calculation_method").notNull(),
    pointCount: integer("point_count").notNull(),
    distanceM: real("distance_m"),
    accuracyMeters: real("accuracy_meters"),
    areaCalculatedAcres: real("area_calculated_acres").notNull(),
    capturedAt: text("captured_at").notNull(),
    agentId: text("agent_id").notNull(),
    syncedAt: text("synced_at"),
  },
  (table) => ({
    farmIdx: index("idx_farm_geometries_farm").on(table.farmId),
  }),
);

export const farmGeometryPoints = sqliteTable(
  "farm_geometry_points",
  {
    id: text("id").primaryKey(),
    geometryId: text("geometry_id").notNull().references(() => farmGeometries.id),
    farmId: text("farm_id").notNull().references(() => farms.id),
    sequence: integer("sequence").notNull(),
    latitude: real("latitude").notNull(),
    longitude: real("longitude").notNull(),
    altitude: real("altitude"),
    accuracyM: real("accuracy_m"),
    capturedAt: text("captured_at").notNull(),
  },
  (table) => ({
    geometryIdx: index("idx_farm_geometry_points_geometry").on(table.geometryId),
    farmIdx: index("idx_farm_geometry_points_farm").on(table.farmId),
  }),
);

export const affiliations = sqliteTable(
  "affiliations",
  {
    id: text("id").primaryKey(),
    farmerId: text("farmer_id").notNull().references(() => farmers.id),
    organizationName: text("organization_name").notNull(),
    institutionType: text("institution_type").notNull(),
    memberNumber: text("member_number"),
    branch: text("branch"),
    membershipStart: text("membership_start"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    collectionCentre: text("collection_centre"),
    localVersion: integer("local_version").notNull().default(1),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    syncedAt: text("synced_at"),
  },
  (table) => ({
    farmerIdx: index("idx_affiliations_farmer").on(table.farmerId),
  }),
);

export const enterprises = sqliteTable(
  "enterprises",
  {
    id: text("id").primaryKey(),
    farmerId: text("farmer_id").notNull().references(() => farmers.id),
    farmId: text("farm_id").notNull().references(() => farms.id),
    sector: text("sector").notNull(),
    status: text("status").notNull().default("DRAFT"),
    localVersion: integer("local_version").notNull().default(1),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    syncedAt: text("synced_at"),
  },
  (table) => ({
    farmerIdx: index("idx_enterprises_farmer").on(table.farmerId),
    farmIdx: index("idx_enterprises_farm").on(table.farmId),
    sectorIdx: index("idx_enterprises_sector").on(table.sector),
  }),
);

export const productionCycles = sqliteTable(
  "production_cycles",
  {
    id: text("id").primaryKey(),
    enterpriseId: text("enterprise_id").notNull().references(() => enterprises.id),
    sector: text("sector").notNull(),
    name: text("name").notNull(),
    startedAt: text("started_at").notNull(),
    endedAt: text("ended_at"),
    status: text("status").notNull().default("ACTIVE"),
    localVersion: integer("local_version").notNull().default(1),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    syncedAt: text("synced_at"),
  },
  (table) => ({
    enterpriseIdx: index("idx_production_cycles_enterprise").on(table.enterpriseId),
    statusIdx: index("idx_production_cycles_status").on(table.status),
  }),
);

export const productionObservations = sqliteTable(
  "production_observations",
  {
    id: text("id").primaryKey(),
    productionCycleId: text("production_cycle_id").notNull().references(() => productionCycles.id),
    enterpriseId: text("enterprise_id").notNull().references(() => enterprises.id),
    schemaId: text("schema_id").notNull(),
    schemaVersion: text("schema_version").notNull(),
    section: text("section").notNull(),
    payload: text("payload").notNull(),
    observedAt: text("observed_at").notNull(),
    localVersion: integer("local_version").notNull().default(1),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    syncedAt: text("synced_at"),
  },
  (table) => ({
    cycleIdx: index("idx_production_observations_cycle").on(table.productionCycleId),
    enterpriseIdx: index("idx_production_observations_enterprise").on(table.enterpriseId),
  }),
);

export const expenses = sqliteTable(
  "expenses",
  {
    id: text("id").primaryKey(),
    productionCycleId: text("production_cycle_id").notNull().references(() => productionCycles.id),
    enterpriseId: text("enterprise_id").notNull().references(() => enterprises.id),
    category: text("category").notNull(),
    amount: real("amount").notNull(),
    currency: text("currency").notNull().default("KES"),
    occurredAt: text("occurred_at").notNull(),
    notes: text("notes"),
    localVersion: integer("local_version").notNull().default(1),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    syncedAt: text("synced_at"),
  },
  (table) => ({
    cycleIdx: index("idx_expenses_cycle").on(table.productionCycleId),
    enterpriseIdx: index("idx_expenses_enterprise").on(table.enterpriseId),
  }),
);

export const sectorSchemas = sqliteTable(
  "sector_schemas",
  {
    id: text("id").primaryKey(),
    version: text("version").notNull(),
    sector: text("sector").notNull(),
    definitionJson: text("definition_json").notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    sectorIdx: index("idx_sector_schemas_sector").on(table.sector),
  }),
);

export const sectorCollectionResponses = sqliteTable(
  "sector_collection_responses",
  {
    id: text("id").primaryKey(),
    enterpriseId: text("enterprise_id").notNull().references(() => enterprises.id),
    schemaId: text("schema_id").notNull(),
    schemaVersion: text("schema_version").notNull(),
    payload: text("payload").notNull(),
    provenanceMap: text("provenance_map").notNull().default("{}"),
    localVersion: integer("local_version").notNull().default(1),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    syncedAt: text("synced_at"),
  },
  (table) => ({
    enterpriseIdx: index("idx_sector_responses_enterprise").on(table.enterpriseId),
    schemaIdx: index("idx_sector_responses_schema").on(table.schemaId),
  }),
);

export const evidence = sqliteTable(
  "evidence",
  {
    id: text("id").primaryKey(),
    farmerId: text("farmer_id").notNull().references(() => farmers.id),
    farmId: text("farm_id"),
    enterpriseId: text("enterprise_id"),
    category: text("category").notNull(),
    localUri: text("local_uri").notNull(),
    mimeType: text("mime_type").notNull(),
    fileSizeBytes: integer("file_size_bytes").notNull(),
    sha256: text("sha256").notNull(),
    syncStatus: text("sync_status").notNull().default("LOCAL"),
    verificationStatus: text("verification_status").notNull().default("UNVERIFIED"),
    serverRef: text("server_ref"),
    createdAt: text("created_at").notNull(),
    syncedAt: text("synced_at"),
  },
  (table) => ({
    farmerIdx: index("idx_evidence_farmer").on(table.farmerId),
    statusIdx: index("idx_evidence_sync_status").on(table.syncStatus),
  }),
);

export const localFiles = sqliteTable(
  "local_files",
  {
    id: text("id").primaryKey(),
    evidenceId: text("evidence_id").references(() => evidence.id),
    localUri: text("local_uri").notNull(),
    filename: text("filename"),
    mimeType: text("mime_type").notNull(),
    fileSizeBytes: integer("file_size_bytes").notNull(),
    sha256: text("sha256").notNull(),
    source: text("source").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    evidenceIdx: index("idx_local_files_evidence").on(table.evidenceId),
  }),
);

export const tasks = sqliteTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    agentId: text("agent_id").notNull(),
    farmerId: text("farmer_id"),
    type: text("type").notNull(),
    priority: text("priority").notNull().default("NORMAL"),
    status: text("status").notNull().default("OPEN"),
    title: text("title").notNull(),
    detail: text("detail"),
    dueDate: text("due_date"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    syncedAt: text("synced_at"),
  },
  (table) => ({
    agentIdx: index("idx_tasks_agent").on(table.agentId),
    statusIdx: index("idx_tasks_status").on(table.status),
  }),
);

export const auditEvents = sqliteTable(
  "audit_events",
  {
    id: text("id").primaryKey(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    action: text("action").notNull(),
    actorId: text("actor_id").notNull(),
    payload: text("payload").notNull().default("{}"),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    entityIdx: index("idx_audit_events_entity").on(table.entityType, table.entityId),
  }),
);

export const syncOutbox = sqliteTable(
  "sync_outbox",
  {
    entryUuid: text("entry_uuid").primaryKey(),
    operationUuid: text("operation_uuid").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    mutationType: text("mutation_type").notNull(),
    payload: text("payload").notNull(),
    dependsOn: text("depends_on").notNull().default("[]"),
    localVersion: integer("local_version").notNull().default(1),
    serverBaseline: integer("server_baseline"),
    retryCount: integer("retry_count").notNull().default(0),
    state: text("state").notNull().default("PENDING_SYNC"),
    lastError: text("last_error"),
    nextRetryAt: text("next_retry_at"),
    createdAt: text("created_at").notNull(),
    syncedAt: text("synced_at"),
  },
  (table) => ({
    operationIdx: index("idx_sync_outbox_operation").on(table.operationUuid),
    stateIdx: index("idx_sync_outbox_state").on(table.state),
    entityIdx: index("idx_sync_outbox_entity").on(table.entityType, table.entityId),
  }),
);

export const syncAttempts = sqliteTable(
  "sync_attempts",
  {
    id: text("id").primaryKey(),
    entryUuid: text("entry_uuid").notNull().references(() => syncOutbox.entryUuid),
    attemptNumber: integer("attempt_number").notNull(),
    state: text("state").notNull(),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    startedAt: text("started_at").notNull(),
    finishedAt: text("finished_at"),
  },
  (table) => ({
    entryIdx: index("idx_sync_attempts_entry").on(table.entryUuid),
  }),
);

export const serverMappings = sqliteTable(
  "server_mappings",
  {
    id: text("id").primaryKey(),
    localUuid: text("local_uuid").notNull(),
    entityType: text("entity_type").notNull(),
    serverId: text("server_id").notNull(),
    operationUuid: text("operation_uuid"),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    localIdx: index("idx_server_mappings_local").on(table.localUuid, table.entityType),
    serverIdx: index("idx_server_mappings_server").on(table.serverId, table.entityType),
  }),
);

export const conflicts = sqliteTable(
  "conflicts",
  {
    id: text("id").primaryKey(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    localPayload: text("local_payload").notNull(),
    remotePayload: text("remote_payload").notNull(),
    status: text("status").notNull().default("OPEN"),
    createdAt: text("created_at").notNull(),
    resolvedAt: text("resolved_at"),
  },
  (table) => ({
    entityIdx: index("idx_conflicts_entity").on(table.entityType, table.entityId),
    statusIdx: index("idx_conflicts_status").on(table.status),
  }),
);

export const collectionSessions = sqliteTable(
  "collection_sessions",
  {
    id: text("id").primaryKey(),
    farmerId: text("farmer_id"),
    farmId: text("farm_id"),
    currentStep: text("current_step").notNull().default("consent"),
    stepStates: text("step_states").notNull().default("{}"),
    status: text("status").notNull().default("LOCAL_DRAFT"),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => ({
    farmerIdx: index("idx_collection_sessions_farmer").on(table.farmerId),
    statusIdx: index("idx_collection_sessions_status").on(table.status),
  }),
);

export const appConfig = sqliteTable("app_config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const appMetadata = sqliteTable("app_metadata", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const localAgent = sqliteTable("local_agent", {
  id: text("id").primaryKey(),
  agentId: text("agent_id").notNull(),
  orgId: text("org_id").notNull(),
  orgName: text("org_name").notNull(),
  clusterName: text("cluster_name").notNull(),
  authMode: text("auth_mode").notNull(),
  updatedAt: text("updated_at").notNull(),
});
