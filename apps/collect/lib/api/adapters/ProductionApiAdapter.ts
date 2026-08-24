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

function notConfigured(): never {
  throw new Error("ProductionApiAdapter is not configured. Backend endpoint documentation is required before production sync can run.");
}

export class ProductionApiAdapter implements MkulimaScoreApi {
  async authenticate(_credentials: AgentCredentials): Promise<AuthResult> {
    notConfigured();
  }

  async refreshSession(_refreshToken: string): Promise<AuthResult> {
    notConfigured();
  }

  async revokeDevice(_deviceId: string): Promise<void> {
    notConfigured();
  }

  async getBootstrapConfig(_agentId: string): Promise<BootstrapConfig> {
    notConfigured();
  }

  async getAssignedFarmers(_agentId: string, _since?: string): Promise<FarmerAssignment[]> {
    notConfigured();
  }

  async getTasks(_agentId: string, _since?: string): Promise<TaskAssignment[]> {
    notConfigured();
  }

  async createFarmer(_payload: CreateFarmerPayload): Promise<FarmerSyncResult> {
    notConfigured();
  }

  async requestEvidenceUploadUrl(_meta: EvidenceMetadata): Promise<PresignedUploadResult> {
    notConfigured();
  }

  async confirmEvidenceUpload(_evidenceId: string, _serverRef: string, _etag: string): Promise<void> {
    notConfigured();
  }

  async submitSyncBatch(_batch: SyncBatch): Promise<SyncBatchResult> {
    notConfigured();
  }
}
