import { drizzle, type ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import * as SQLite from "expo-sqlite";
import * as schema from "./schema";

const migrationSql = `
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS app_migrations (
  id TEXT PRIMARY KEY NOT NULL,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS farmers (
  id TEXT PRIMARY KEY NOT NULL,
  agent_id TEXT NOT NULL,
  org_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  completeness_pct INTEGER NOT NULL DEFAULT 0,
  declined_consent INTEGER NOT NULL DEFAULT 0,
  local_version INTEGER NOT NULL DEFAULT 1,
  server_version INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced_at TEXT,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_farmers_agent ON farmers(agent_id);
CREATE INDEX IF NOT EXISTS idx_farmers_org ON farmers(org_id);
CREATE INDEX IF NOT EXISTS idx_farmers_status ON farmers(status);
CREATE INDEX IF NOT EXISTS idx_farmers_updated ON farmers(updated_at);

CREATE TABLE IF NOT EXISTS farmer_identities (
  id TEXT PRIMARY KEY NOT NULL,
  farmer_id TEXT NOT NULL REFERENCES farmers(id),
  full_legal_name TEXT,
  first_name TEXT,
  middle_name TEXT,
  surname TEXT,
  preferred_name TEXT,
  national_id_type TEXT,
  national_id_hash TEXT,
  national_id_last3 TEXT,
  primary_phone_hash TEXT,
  primary_phone_last4 TEXT,
  preferred_language TEXT,
  local_version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  synced_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_farmer_identities_farmer ON farmer_identities(farmer_id);

CREATE TABLE IF NOT EXISTS consents (
  id TEXT PRIMARY KEY NOT NULL,
  farmer_id TEXT NOT NULL REFERENCES farmers(id),
  version TEXT NOT NULL,
  declined INTEGER NOT NULL DEFAULT 0,
  method TEXT NOT NULL,
  language TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  gps_latitude REAL,
  gps_longitude REAL,
  gps_accuracy_m REAL,
  items_agreed TEXT NOT NULL,
  mpesa_authorized INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  synced_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_consents_farmer ON consents(farmer_id);

CREATE TABLE IF NOT EXISTS farms (
  id TEXT PRIMARY KEY NOT NULL,
  farmer_id TEXT NOT NULL REFERENCES farmers(id),
  name TEXT,
  tenure TEXT,
  size_reported_acres REAL,
  size_reported_source TEXT,
  size_gps_acres REAL,
  irrigation INTEGER,
  county TEXT,
  sub_county TEXT,
  ward TEXT,
  village TEXT,
  gps_latitude REAL,
  gps_longitude REAL,
  gps_accuracy_m REAL,
  local_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_farms_farmer ON farms(farmer_id);

CREATE TABLE IF NOT EXISTS farm_geometries (
  id TEXT PRIMARY KEY NOT NULL,
  farm_id TEXT NOT NULL REFERENCES farms(id),
  polygon_geojson TEXT NOT NULL,
  calculation_method TEXT NOT NULL,
  point_count INTEGER NOT NULL,
  distance_m REAL,
  accuracy_meters REAL,
  area_calculated_acres REAL NOT NULL,
  captured_at TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  synced_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_farm_geometries_farm ON farm_geometries(farm_id);

CREATE TABLE IF NOT EXISTS farm_geometry_points (
  id TEXT PRIMARY KEY NOT NULL,
  geometry_id TEXT NOT NULL REFERENCES farm_geometries(id),
  farm_id TEXT NOT NULL REFERENCES farms(id),
  sequence INTEGER NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  altitude REAL,
  accuracy_m REAL,
  captured_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_farm_geometry_points_geometry ON farm_geometry_points(geometry_id);
CREATE INDEX IF NOT EXISTS idx_farm_geometry_points_farm ON farm_geometry_points(farm_id);

CREATE TABLE IF NOT EXISTS affiliations (
  id TEXT PRIMARY KEY NOT NULL,
  farmer_id TEXT NOT NULL REFERENCES farmers(id),
  organization_name TEXT NOT NULL,
  institution_type TEXT NOT NULL,
  member_number TEXT,
  branch TEXT,
  membership_start TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  collection_centre TEXT,
  local_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_affiliations_farmer ON affiliations(farmer_id);

CREATE TABLE IF NOT EXISTS enterprises (
  id TEXT PRIMARY KEY NOT NULL,
  farmer_id TEXT NOT NULL REFERENCES farmers(id),
  farm_id TEXT NOT NULL REFERENCES farms(id),
  sector TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  local_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_enterprises_farmer ON enterprises(farmer_id);
CREATE INDEX IF NOT EXISTS idx_enterprises_farm ON enterprises(farm_id);
CREATE INDEX IF NOT EXISTS idx_enterprises_sector ON enterprises(sector);

CREATE TABLE IF NOT EXISTS production_cycles (
  id TEXT PRIMARY KEY NOT NULL,
  enterprise_id TEXT NOT NULL REFERENCES enterprises(id),
  sector TEXT NOT NULL,
  name TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  local_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_production_cycles_enterprise ON production_cycles(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_production_cycles_status ON production_cycles(status);

CREATE TABLE IF NOT EXISTS production_observations (
  id TEXT PRIMARY KEY NOT NULL,
  production_cycle_id TEXT NOT NULL REFERENCES production_cycles(id),
  enterprise_id TEXT NOT NULL REFERENCES enterprises(id),
  schema_id TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  section TEXT NOT NULL,
  payload TEXT NOT NULL,
  observed_at TEXT NOT NULL,
  local_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_production_observations_cycle ON production_observations(production_cycle_id);
CREATE INDEX IF NOT EXISTS idx_production_observations_enterprise ON production_observations(enterprise_id);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY NOT NULL,
  production_cycle_id TEXT NOT NULL REFERENCES production_cycles(id),
  enterprise_id TEXT NOT NULL REFERENCES enterprises(id),
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KES',
  occurred_at TEXT NOT NULL,
  notes TEXT,
  local_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_expenses_cycle ON expenses(production_cycle_id);
CREATE INDEX IF NOT EXISTS idx_expenses_enterprise ON expenses(enterprise_id);

CREATE TABLE IF NOT EXISTS sector_schemas (
  id TEXT PRIMARY KEY NOT NULL,
  version TEXT NOT NULL,
  sector TEXT NOT NULL,
  definition_json TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sector_schemas_sector ON sector_schemas(sector);

CREATE TABLE IF NOT EXISTS sector_collection_responses (
  id TEXT PRIMARY KEY NOT NULL,
  enterprise_id TEXT NOT NULL REFERENCES enterprises(id),
  schema_id TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  payload TEXT NOT NULL,
  provenance_map TEXT NOT NULL DEFAULT '{}',
  local_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_sector_responses_enterprise ON sector_collection_responses(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_sector_responses_schema ON sector_collection_responses(schema_id);

CREATE TABLE IF NOT EXISTS evidence (
  id TEXT PRIMARY KEY NOT NULL,
  farmer_id TEXT NOT NULL REFERENCES farmers(id),
  farm_id TEXT,
  enterprise_id TEXT,
  category TEXT NOT NULL,
  local_uri TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'LOCAL',
  verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED',
  server_ref TEXT,
  created_at TEXT NOT NULL,
  synced_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_evidence_farmer ON evidence(farmer_id);
CREATE INDEX IF NOT EXISTS idx_evidence_sync_status ON evidence(sync_status);

CREATE TABLE IF NOT EXISTS local_files (
  id TEXT PRIMARY KEY NOT NULL,
  evidence_id TEXT REFERENCES evidence(id),
  local_uri TEXT NOT NULL,
  filename TEXT,
  mime_type TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_local_files_evidence ON local_files(evidence_id);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY NOT NULL,
  agent_id TEXT NOT NULL,
  farmer_id TEXT,
  type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'NORMAL',
  status TEXT NOT NULL DEFAULT 'OPEN',
  title TEXT NOT NULL,
  detail TEXT,
  due_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_tasks_agent ON tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  payload TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON audit_events(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS sync_outbox (
  entry_uuid TEXT PRIMARY KEY NOT NULL,
  operation_uuid TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  mutation_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  depends_on TEXT NOT NULL DEFAULT '[]',
  local_version INTEGER NOT NULL DEFAULT 1,
  server_baseline INTEGER,
  retry_count INTEGER NOT NULL DEFAULT 0,
  state TEXT NOT NULL DEFAULT 'PENDING_SYNC',
  last_error TEXT,
  next_retry_at TEXT,
  created_at TEXT NOT NULL,
  synced_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_sync_outbox_operation ON sync_outbox(operation_uuid);
CREATE INDEX IF NOT EXISTS idx_sync_outbox_state ON sync_outbox(state);
CREATE INDEX IF NOT EXISTS idx_sync_outbox_entity ON sync_outbox(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS sync_attempts (
  id TEXT PRIMARY KEY NOT NULL,
  entry_uuid TEXT NOT NULL REFERENCES sync_outbox(entry_uuid),
  attempt_number INTEGER NOT NULL,
  state TEXT NOT NULL,
  error_code TEXT,
  error_message TEXT,
  started_at TEXT NOT NULL,
  finished_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_sync_attempts_entry ON sync_attempts(entry_uuid);

CREATE TABLE IF NOT EXISTS server_mappings (
  id TEXT PRIMARY KEY NOT NULL,
  local_uuid TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  server_id TEXT NOT NULL,
  operation_uuid TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_server_mappings_local ON server_mappings(local_uuid, entity_type);
CREATE INDEX IF NOT EXISTS idx_server_mappings_server ON server_mappings(server_id, entity_type);

CREATE TABLE IF NOT EXISTS conflicts (
  id TEXT PRIMARY KEY NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  local_payload TEXT NOT NULL,
  remote_payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  created_at TEXT NOT NULL,
  resolved_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_conflicts_entity ON conflicts(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_conflicts_status ON conflicts(status);

CREATE TABLE IF NOT EXISTS collection_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  farmer_id TEXT,
  farm_id TEXT,
  current_step TEXT NOT NULL DEFAULT 'consent',
  step_states TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'LOCAL_DRAFT',
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_collection_sessions_farmer ON collection_sessions(farmer_id);
CREATE INDEX IF NOT EXISTS idx_collection_sessions_status ON collection_sessions(status);

CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_metadata (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_agent (
  id TEXT PRIMARY KEY NOT NULL,
  agent_id TEXT NOT NULL,
  org_id TEXT NOT NULL,
  org_name TEXT NOT NULL,
  cluster_name TEXT NOT NULL,
  auth_mode TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

`;

const FOLLOW_ON_MIGRATIONS: { id: string; statements: string[] }[] = [
  {
    id: "0002_conflict_fields",
    statements: [
      "ALTER TABLE conflicts ADD COLUMN operation_uuid TEXT",
      "ALTER TABLE conflicts ADD COLUMN code TEXT",
    ],
  },
  {
    id: "0003_plots_visits_cycles",
    statements: [
      `CREATE TABLE IF NOT EXISTS plots (
        id TEXT PRIMARY KEY NOT NULL,
        farmer_id TEXT NOT NULL REFERENCES farmers(id),
        farm_id TEXT NOT NULL REFERENCES farms(id),
        name TEXT NOT NULL,
        unit_type TEXT NOT NULL,
        area_ha REAL,
        notes TEXT,
        local_version INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced_at TEXT
      )`,
      "CREATE INDEX IF NOT EXISTS idx_plots_farm ON plots(farm_id)",
      "CREATE INDEX IF NOT EXISTS idx_plots_farmer ON plots(farmer_id)",
      `CREATE TABLE IF NOT EXISTS household_members (
        id TEXT PRIMARY KEY NOT NULL,
        farmer_id TEXT NOT NULL REFERENCES farmers(id),
        full_name TEXT NOT NULL,
        role TEXT NOT NULL,
        labour_contribution TEXT,
        local_version INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced_at TEXT
      )`,
      "CREATE INDEX IF NOT EXISTS idx_household_members_farmer ON household_members(farmer_id)",
      `CREATE TABLE IF NOT EXISTS visits (
        id TEXT PRIMARY KEY NOT NULL,
        farmer_id TEXT REFERENCES farmers(id),
        agent_id TEXT NOT NULL,
        purpose TEXT NOT NULL,
        respondent_role TEXT,
        interview_language TEXT NOT NULL DEFAULT 'en',
        outcome TEXT NOT NULL DEFAULT 'partial',
        started_at TEXT NOT NULL,
        ended_at TEXT,
        next_visit_at TEXT,
        gps_latitude REAL,
        gps_longitude REAL,
        gps_accuracy_m REAL,
        notes TEXT,
        local_version INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced_at TEXT
      )`,
      "CREATE INDEX IF NOT EXISTS idx_visits_farmer ON visits(farmer_id)",
      "CREATE INDEX IF NOT EXISTS idx_visits_agent ON visits(agent_id)",
      "CREATE INDEX IF NOT EXISTS idx_visits_purpose ON visits(purpose)",
      "ALTER TABLE enterprises ADD COLUMN plot_id TEXT",
      "CREATE INDEX IF NOT EXISTS idx_enterprises_plot ON enterprises(plot_id)",
      "ALTER TABLE production_cycles ADD COLUMN cycle_type TEXT NOT NULL DEFAULT 'season'",
      "ALTER TABLE production_cycles ADD COLUMN stage TEXT",
      "ALTER TABLE evidence ADD COLUMN plot_id TEXT",
      "ALTER TABLE evidence ADD COLUMN production_cycle_id TEXT",
      "ALTER TABLE collection_sessions ADD COLUMN plot_id TEXT",
      "ALTER TABLE collection_sessions ADD COLUMN visit_id TEXT",
    ],
  },
];

export type AppDatabase = ExpoSQLiteDatabase<typeof schema>;

let databasePromise: Promise<AppDatabase> | null = null;
let writeChain: Promise<unknown> = Promise.resolve();

export async function openAppDatabase(): Promise<AppDatabase> {
  if (!databasePromise) {
    databasePromise = (async () => {
      const sqlite = await SQLite.openDatabaseAsync("mkulimacollect.db");
      await applyMigrations(sqlite);
      return serializeTransactions(drizzle(sqlite, { schema }));
    })();
  }

  return databasePromise;
}

function serializeTransactions(db: AppDatabase): AppDatabase {
  const original = db.transaction.bind(db);

  Object.defineProperty(db, "transaction", {
    configurable: true,
    value: async (work: Parameters<AppDatabase["transaction"]>[0], config?: Parameters<AppDatabase["transaction"]>[1]) => {
      const run = writeChain.then(async () => {
        try {
          return await original(work, config);
        } catch (caught) {
          const message = caught instanceof Error ? caught.message : String(caught);
          if (!/failed to run query ['"]begin['"]/i.test(message)) {
            throw caught;
          }
          await new Promise((resolve) => setTimeout(resolve, 50));
          return original(work, config);
        }
      });
      writeChain = run.then(() => undefined, () => undefined);
      return run;
    },
  });

  return db;
}

export async function applyMigrations(sqlite: SQLite.SQLiteDatabase): Promise<void> {
  await sqlite.execAsync(`
    CREATE TABLE IF NOT EXISTS app_migrations (
      id TEXT PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const appliedRows = await sqlite.getAllAsync<{ id: string }>("SELECT id FROM app_migrations");
  const applied = new Set(appliedRows.map((row) => row.id));

  if (!applied.has("0001_initial")) {
    await sqlite.execAsync(migrationSql);
    await sqlite.runAsync("INSERT INTO app_migrations (id, applied_at) VALUES (?, datetime('now'))", "0001_initial");
  }

  for (const migration of FOLLOW_ON_MIGRATIONS) {
    if (applied.has(migration.id)) {
      continue;
    }

    for (const statement of migration.statements) {
      try {
        await sqlite.execAsync(statement);
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : String(caught);
        if (!/duplicate column name/i.test(message)) {
          throw caught;
        }
      }
    }

    await sqlite.runAsync("INSERT INTO app_migrations (id, applied_at) VALUES (?, datetime('now'))", migration.id);
  }
}
