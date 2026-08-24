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
} from "./types";

export interface MkulimaScoreApi {
  authenticate(credentials: AgentCredentials): Promise<AuthResult>;
  refreshSession(refreshToken: string): Promise<AuthResult>;
  revokeDevice(deviceId: string): Promise<void>;
  getBootstrapConfig(agentId: string): Promise<BootstrapConfig>;
  getAssignedFarmers(agentId: string, since?: string): Promise<FarmerAssignment[]>;
  getTasks(agentId: string, since?: string): Promise<TaskAssignment[]>;
  createFarmer(payload: CreateFarmerPayload): Promise<FarmerSyncResult>;
  requestEvidenceUploadUrl(meta: EvidenceMetadata): Promise<PresignedUploadResult>;
  confirmEvidenceUpload(evidenceId: string, serverRef: string, etag: string): Promise<void>;
  submitSyncBatch(batch: SyncBatch): Promise<SyncBatchResult>;
}
