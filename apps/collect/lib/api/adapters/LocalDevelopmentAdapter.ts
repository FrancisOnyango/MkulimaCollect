import type { MkulimaScoreApi } from "../ApiClient";
import type {
  AgentCredentials,
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

export class LocalDevelopmentAdapter implements MkulimaScoreApi {
  private readonly latencyMs = Number(process.env.EXPO_PUBLIC_MOCK_SYNC_LATENCY_MS ?? 650);
  private readonly failureEvery = Number(process.env.EXPO_PUBLIC_MOCK_SYNC_FAIL_EVERY ?? 0);
  private readonly responseLossEvery = Number(process.env.EXPO_PUBLIC_MOCK_SYNC_RESPONSE_LOSS_EVERY ?? 0);
  private callCount = 0;

  async authenticate(credentials: AgentCredentials): Promise<AuthResult> {
    await this.wait();
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();

    return {
      accessToken: `dev-access-${credentials.deviceId}`,
      refreshToken: `dev-refresh-${credentials.deviceId}`,
      expiresAt,
      agent: {
        id: "AGT-00284",
        name: "Francis O.",
        email: credentials.agentId || "francis.o@mkulima",
        orgId: credentials.orgId || "mkulimascore-field-ops",
        orgName: "MkulimaScore Field Operations",
        clusterName: "Kiambu Pilot",
        role: "FIELD_AGENT",
      },
    };
  }

  async refreshSession(refreshToken: string): Promise<AuthResult> {
    return this.authenticate({
      agentId: "francis.o@mkulima",
      password: refreshToken,
      orgId: "kiambu-sacco-network",
      deviceId: "dev-device",
    });
  }

  async revokeDevice(): Promise<void> {
    return;
  }

  async getBootstrapConfig(agentId: string): Promise<BootstrapConfig> {
    return {
      agentId,
      serverTime: new Date().toISOString(),
      minSupportedVersion: "0.1.0",
      consentVersion: "1.0.0",
    };
  }

  async getAssignedFarmers(): Promise<FarmerAssignment[]> {
    return [];
  }

  async getTasks(agentId: string): Promise<TaskAssignment[]> {
    return [
      {
        id: "task-dev-001",
        agentId,
        type: "GPS",
        priority: "HIGH",
        title: "Map farm boundary",
        detail: "Capture GPS boundary for a dairy enterprise",
        dueDate: new Date().toISOString().slice(0, 10),
      },
    ];
  }

  async createFarmer(payload: CreateFarmerPayload): Promise<FarmerSyncResult> {
    await this.simulateNetwork();
    return {
      operationUuid: payload.operationUuid,
      msid: `MS-KE-${payload.localUuid.slice(0, 6).toUpperCase()}`,
      serverVersion: 1,
    };
  }

  async requestEvidenceUploadUrl(meta: EvidenceMetadata): Promise<PresignedUploadResult> {
    await this.simulateNetwork();
    return {
      evidenceServerId: `EVD-${meta.evidenceId.slice(0, 8).toUpperCase()}`,
      presignedUrl: "https://example.invalid/dev-upload",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  }

  async confirmEvidenceUpload(): Promise<void> {
    await this.simulateNetwork();
    return;
  }

  async submitSyncBatch(batch: SyncBatch): Promise<SyncBatchResult> {
    await this.simulateNetwork();
    return {
      accepted: batch.operations.map((operation, index) => ({
        operationUuid: operation.operationUuid,
        serverId: `DEV-${operation.entityType.toUpperCase()}-${index + 1}`,
        serverVersion: 1,
      })),
      rejected: [],
    };
  }

  private async simulateNetwork() {
    await this.wait();
    this.callCount += 1;

    if (this.failureEvery > 0 && this.callCount % this.failureEvery === 0) {
      throw new Error("DEV_MOCK_NETWORK_FAILURE");
    }

    if (this.responseLossEvery > 0 && this.callCount % this.responseLossEvery === 0) {
      throw new Error("DEV_MOCK_RESPONSE_LOSS_AFTER_ACCEPT");
    }
  }

  private async wait() {
    await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
  }
}
