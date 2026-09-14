import { SecureTokenStore } from "@/features/auth/SecureTokenStore";
import { getAppVersion } from "@/lib/appVersion";
import { assertHttpsUrl } from "@/lib/httpsUrl";
import type { MkulimaScoreApi } from "../ApiClient";
import type {
  AgentCredentials,
  AgentProfile,
  AuthResult,
  BootstrapConfig,
  CreateFarmerPayload,
  EvidenceMetadata,
  FarmerAssignment,
  FarmerSyncResult,
  PresignedUploadResult,
  SyncBatch,
  SyncBatchResult,
  TaskAssignment,
} from "../types";

const DEFAULT_API_BASE_URL = "https://staging-api.mkulimascore.com";
const API_PREFIX = "/api/v1";
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  auth?: boolean;
  json?: Record<string, unknown>;
  urlEncoded?: URLSearchParams;
};

type PlatformToken = {
  access_token: string;
  token_type?: string;
  refresh_token?: string;
  expires_in?: number;
};

type PlatformUser = {
  id: number;
  email: string;
  full_name?: string | null;
  institution_id?: number | null;
  role_name?: string | null;
  dashboard_role?: string | null;
};

type MobileSyncResponse = {
  sync_batch_id: string;
  status: "accepted" | "partial" | "rejected";
  server_cursor?: string | null;
  correlation_id?: string;
  results: MobileOperationResult[];
  rejected?: MobileOperationIssue[];
  conflicts?: MobileOperationIssue[];
};

type MobileOperationResult = {
  local_id: string;
  operation_id?: string | null;
  server_entity_id?: string | null;
  status: "received" | "accepted" | "processing" | "needs_correction" | "needs_review" | "conflict" | "rejected" | "ingested" | "canonicalized";
  server_version?: number | null;
  warnings?: string[];
};

type MobileOperationIssue = {
  local_id?: string | null;
  operation_id?: string | null;
  code?: string | null;
  message?: string | null;
};

type MobileUploadAuthorization = {
  evidence_id: string;
  upload_url: string;
  expires_at: string;
};

export class ProductionApiAdapter implements MkulimaScoreApi {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor() {
    this.baseUrl = assertHttpsUrl(
      process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL,
      process.env.EXPO_PUBLIC_ENVIRONMENT === "development",
    );
    this.timeoutMs = Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS ?? "30000");
  }

  async authenticate(credentials: AgentCredentials): Promise<AuthResult> {
    const body = new URLSearchParams();
    body.set("username", credentials.agentId);
    body.set("password", credentials.password);

    const token = await this.request<PlatformToken>("/auth/login/access-token", {
      method: "POST",
      auth: false,
      urlEncoded: body,
    });

    await SecureTokenStore.setAccessToken(token.access_token);
    if (token.refresh_token) {
      await SecureTokenStore.setRefreshToken(token.refresh_token);
    }
    const user = await this.request<PlatformUser>("/auth/me", { auth: true });
    if (!user.institution_id) {
      throw new Error("MkulimaScore did not return an institution for this agent. Tenant must come from the server.");
    }
    const orgId = String(user.institution_id);

    return {
      accessToken: token.access_token,
      refreshToken: token.refresh_token ?? "",
      expiresAt: new Date(Date.now() + expiryMs(token.expires_in)).toISOString(),
      agent: toAgentProfile(user, orgId),
    };
  }

  async refreshSession(refreshToken: string): Promise<AuthResult> {
    if (!refreshToken) {
      throw new Error("Session expired. Sign in again.");
    }

    try {
      const token = await this.request<PlatformToken>("/auth/refresh", {
        method: "POST",
        auth: false,
        json: { refresh_token: refreshToken },
      });
      await SecureTokenStore.setAccessToken(token.access_token);
      if (token.refresh_token) {
        await SecureTokenStore.setRefreshToken(token.refresh_token);
      }
      const user = await this.request<PlatformUser>("/auth/me", { auth: true });
      const orgId = String(user.institution_id ?? "unknown");
      return {
        accessToken: token.access_token,
        refreshToken: token.refresh_token ?? refreshToken,
        expiresAt: new Date(Date.now() + expiryMs(token.expires_in)).toISOString(),
        agent: toAgentProfile(user, orgId),
      };
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Refresh failed";
      if (/404|405|not found/i.test(message)) {
        throw new Error("Session expired. Sign in again.");
      }
      throw caught instanceof Error ? caught : new Error(message);
    }
  }

  async revokeDevice(deviceId: string): Promise<void> {
    try {
      await this.request("/mobile/devices/revoke", {
        method: "POST",
        auth: true,
        json: { device_id: deviceId },
      });
    } catch {
      try {
        await this.request("/auth/logout", { method: "POST", auth: true });
      } catch {
        // Local session is still cleared by the caller.
      }
    }
  }

  async getBootstrapConfig(agentId: string): Promise<BootstrapConfig> {
    const response = await this.request<Record<string, unknown>>("/mobile/bootstrap", {
      method: "POST",
      auth: true,
      json: {
        agent_id: agentId,
        device_id: await getDeviceId(),
        app_version: getAppVersion(),
      },
    });

    return {
      agentId,
      serverTime: getOptionalString(response, "server_time") ?? new Date().toISOString(),
      minSupportedVersion: getOptionalString(response, "min_supported_version") ?? getAppVersion(),
      consentVersion: getOptionalString(response, "consent_version") ?? "mkulimascore-v1",
    };
  }

  async getAssignedFarmers(_agentId: string, since?: string): Promise<FarmerAssignment[]> {
    const query = since ? `?since=${encodeURIComponent(since)}` : "";
    const response = await this.request<unknown[]>(`/mobile/assignments${query}`, { auth: true });

    return response.map((item) => {
      const row = asRecord(item);
      return {
        id: requireResultId(row),
        name: getOptionalString(row, "name") ?? "Assigned farmer",
        village: getOptionalString(row, "village") ?? getOptionalString(row, "ward") ?? "",
        status: getOptionalString(row, "status") ?? "assigned",
        updatedAt: getOptionalString(row, "updated_at") ?? new Date().toISOString(),
      };
    });
  }

  async getTasks(_agentId: string, since?: string): Promise<TaskAssignment[]> {
    const query = since ? `?since=${encodeURIComponent(since)}` : "";
    const response = await this.request<unknown[]>(`/mobile/tasks${query}`, { auth: true });

    return response.map((item) => {
      const row = asRecord(item);
      const task: TaskAssignment = {
        id: requireResultId(row),
        agentId: getOptionalString(row, "agent_id") ?? "",
        type: getOptionalString(row, "type") ?? "FIELD_COLLECTION",
        priority: toPriority(getOptionalString(row, "priority")),
        title: getOptionalString(row, "title") ?? "Field task",
      };

      const farmerId = getOptionalString(row, "farmer_id");
      const detail = getOptionalString(row, "detail");
      const dueDate = getOptionalString(row, "due_date");

      if (farmerId) {
        task.farmerId = farmerId;
      }
      if (detail) {
        task.detail = detail;
      }
      if (dueDate) {
        task.dueDate = dueDate;
      }

      return task;
    });
  }

  async createFarmer(payload: CreateFarmerPayload): Promise<FarmerSyncResult> {
    const result = await this.submitSyncBatch({
      operations: [
        {
          operationUuid: payload.operationUuid,
          entityType: "farmer",
          mutationType: "CREATE",
          localEntityId: payload.localUuid,
          dependsOn: [],
          serverBaseline: null,
          payload: {
            ...payload.payload,
            localUuid: payload.localUuid,
            agentId: payload.agentId,
            orgId: payload.orgId,
          },
        },
      ],
    });

    const accepted = result.accepted.find((item) => item.operationUuid === payload.operationUuid);
    const rejected = result.rejected.find((item) => item.operationUuid === payload.operationUuid);

    if (!accepted) {
      throw new Error(rejected ? `${rejected.code}: ${rejected.message}` : "MkulimaScore did not acknowledge farmer creation.");
    }

    return {
      operationUuid: payload.operationUuid,
      msid: accepted.serverId,
      serverVersion: accepted.serverVersion,
    };
  }

  async requestEvidenceUploadUrl(meta: EvidenceMetadata): Promise<PresignedUploadResult> {
    const response = await this.request<MobileUploadAuthorization>("/mobile/evidence/upload-authorization", {
      method: "POST",
      auth: true,
      json: {
        evidence_id: meta.evidenceId,
        farmer_id: meta.farmerId,
        evidence_type: meta.category,
        mime_type: meta.mimeType,
        file_hash: meta.fileHash,
        file_size_bytes: meta.fileSizeBytes,
        device_id: await getDeviceId(),
      },
    });

    return {
      evidenceServerId: response.evidence_id,
      presignedUrl: response.upload_url,
      expiresAt: response.expires_at,
    };
  }

  async confirmEvidenceUpload(evidenceId: string, serverRef: string, etag: string): Promise<void> {
    await this.request(`/mobile/evidence/${encodeURIComponent(evidenceId)}/finalize`, {
      method: "POST",
      auth: true,
      json: {
        server_ref: serverRef,
        etag,
        device_id: await getDeviceId(),
      },
    });
  }

  async submitSyncBatch(batch: SyncBatch): Promise<SyncBatchResult> {
    const response = await this.request<MobileSyncResponse>("/mobile/sync", {
      method: "POST",
      auth: true,
      json: {
        sync_batch_id: createSyncBatchId(),
        device_id: await getDeviceId(),
        app_version: getAppVersion(),
        client_time: new Date().toISOString(),
        baseline_cursor: batch.baselineCursor ?? null,
        changes: batch.operations.map((operation) => ({
          local_id: operation.localEntityId ?? getLocalEntityId(operation.payload) ?? operation.operationUuid,
          operation_id: operation.operationUuid,
          idempotency_key: operation.operationUuid,
          entity_type: operation.entityType,
          operation: toMobileOperation(operation.mutationType),
          depends_on: operation.dependsOn ?? [],
          baseline_version: operation.serverBaseline ?? null,
          schema_version: getOptionalString(operation.payload, "schemaVersion") ?? getOptionalString(operation.payload, "schemaId") ?? "unknown",
          payload: operation.payload,
        })),
      },
    });

    const accepted: SyncBatchResult["accepted"] = [];
    const rejected: SyncBatchResult["rejected"] = [];
    const conflicts: NonNullable<SyncBatchResult["conflicts"]> = [];

    for (const operation of response.results) {
      const operationUuid = operation.operation_id ?? operation.local_id;
      if (isAcceptedStatus(operation.status)) {
        accepted.push({
          operationUuid,
          serverId: operation.server_entity_id ?? response.sync_batch_id,
          serverVersion: operation.server_version ?? 1,
        });
      } else if (operation.status === "conflict") {
        conflicts.push({
          operationUuid,
          code: operation.status,
          message: operation.warnings?.join("; ") || "MkulimaScore reported a sync conflict.",
        });
      } else {
        rejected.push({
          operationUuid,
          code: operation.status,
          message: operation.warnings?.join("; ") || "MkulimaScore ingestion requires attention.",
        });
      }
    }

    for (const issue of response.rejected ?? []) {
      rejected.push({
        operationUuid: issue.operation_id ?? issue.local_id ?? response.sync_batch_id,
        code: issue.code ?? "mobile_sync_issue",
        message: issue.message ?? "MkulimaScore ingestion rejected this change.",
      });
    }

    for (const issue of response.conflicts ?? []) {
      conflicts.push({
        operationUuid: issue.operation_id ?? issue.local_id ?? response.sync_batch_id,
        code: issue.code ?? "conflict",
        message: issue.message ?? "MkulimaScore reported a sync conflict.",
      });
    }

    return { accepted, rejected, conflicts, serverCursor: response.server_cursor ?? null };
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const headers: Record<string, string> = {};
    let body: RequestInit["body"] | undefined;

    if (options.auth !== false) {
      const token = await SecureTokenStore.getAccessToken();
      if (!token) {
        throw new Error("Missing MkulimaScore access token. Please sign in again.");
      }
      headers.Authorization = `Bearer ${token}`;
    }

    if (options.json) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.json);
    } else if (options.urlEncoded) {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      body = options.urlEncoded.toString();
    }

    try {
      const response = await fetch(`${this.baseUrl}${API_PREFIX}${path}`, {
        method: options.method ?? "GET",
        headers,
        body,
        signal: controller.signal,
      });
      const text = await response.text();
      const data = text ? safeJsonParse(text) : null;

      if (!response.ok) {
        throw new Error(formatApiError(response.status, data, text));
      }

      return data as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function expiryMs(expiresIn?: number): number {
  if (typeof expiresIn === "number" && Number.isFinite(expiresIn) && expiresIn > 0) {
    return expiresIn * 1000;
  }
  return TOKEN_TTL_MS;
}

async function getDeviceId(): Promise<string> {
  const existing = await SecureTokenStore.getDeviceId();
  if (existing) {
    return existing;
  }

  throw new Error("Device id is missing. Please sign in again.");
}

function createSyncBatchId(): string {
  return `batch_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function toMobileOperation(mutationType: string): "upsert" | "delete" {
  return mutationType === "DELETE" ? "delete" : "upsert";
}

function toAgentProfile(user: PlatformUser, orgId: string): AgentProfile {
  return {
    id: String(user.id),
    name: user.full_name ?? user.email,
    email: user.email,
    orgId,
    orgName: orgId === "unknown" ? "MkulimaScore" : `Institution ${orgId}`,
    clusterName: "MkulimaScore",
    role: toAgentRole(user.role_name ?? user.dashboard_role),
  };
}

function toAgentRole(role?: string | null): AgentProfile["role"] {
  const normalized = role?.toLowerCase() ?? "";
  if (normalized.includes("admin")) {
    return "ADMIN";
  }
  if (normalized.includes("supervisor") || normalized.includes("manager")) {
    return "SUPERVISOR";
  }
  return "FIELD_AGENT";
}

function toPriority(value: string | null): TaskAssignment["priority"] {
  if (value === "LOW" || value === "HIGH") {
    return value;
  }
  return "NORMAL";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function getOptionalString(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function requireResultId(payload: Record<string, unknown>): string {
  const id = getOptionalString(payload, "id") ?? getOptionalString(payload, "farmer_id") ?? getOptionalString(payload, "task_id");
  if (!id && typeof payload.id === "number") {
    return String(payload.id);
  }
  if (!id) {
    throw new Error("MkulimaScore mobile response item is missing an id.");
  }
  return id;
}

function getLocalEntityId(payload: Record<string, unknown>): string | null {
  return (
    getOptionalString(payload, "localUuid") ??
    getOptionalString(payload, "farmerLocalUuid") ??
    getOptionalString(payload, "farmLocalUuid") ??
    getOptionalString(payload, "enterpriseLocalUuid") ??
    getOptionalString(payload, "productionCycleLocalUuid") ??
    getOptionalString(payload, "observationLocalUuid") ??
    getOptionalString(payload, "responseLocalUuid") ??
    getOptionalString(payload, "evidenceLocalUuid") ??
    getOptionalString(payload, "consentLocalUuid") ??
    getOptionalString(payload, "affiliationLocalUuid")
  );
}

function isAcceptedStatus(status: MobileOperationResult["status"]): boolean {
  return status === "received" || status === "accepted" || status === "processing" || status === "ingested" || status === "canonicalized";
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function formatApiError(status: number, data: unknown, raw: string): string {
  const record = asRecord(data);
  const detail = record.detail;

  if (typeof detail === "string") {
    return `MkulimaScore API ${status}: ${detail}`;
  }

  if (Array.isArray(detail)) {
    return `MkulimaScore API ${status}: ${JSON.stringify(detail)}`;
  }

  return `MkulimaScore API ${status}: ${raw || "Request failed"}`;
}

