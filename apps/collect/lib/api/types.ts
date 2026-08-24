export type AgentCredentials = {
  agentId: string;
  password: string;
  orgId: string;
  deviceId: string;
};

export type AgentProfile = {
  id: string;
  name: string;
  email: string;
  orgId: string;
  orgName: string;
  clusterName: string;
  role: "FIELD_AGENT" | "SUPERVISOR" | "ADMIN";
};

export type AuthResult = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  agent: AgentProfile;
};

export type BootstrapConfig = {
  agentId: string;
  serverTime: string;
  minSupportedVersion: string;
  consentVersion: string;
};

export type FarmerAssignment = {
  id: string;
  name: string;
  village: string;
  status: string;
  updatedAt: string;
};

export type TaskAssignment = {
  id: string;
  agentId: string;
  farmerId?: string;
  type: string;
  priority: "LOW" | "NORMAL" | "HIGH";
  title: string;
  detail?: string;
  dueDate?: string;
};

export type CreateFarmerPayload = {
  operationUuid: string;
  localUuid: string;
  agentId: string;
  orgId: string;
  payload: Record<string, unknown>;
};

export type FarmerSyncResult = {
  operationUuid: string;
  msid: string;
  serverVersion: number;
};

export type EvidenceMetadata = {
  evidenceId: string;
  farmerId: string;
  category: string;
  mimeType: string;
  fileHash: string;
  fileSizeBytes: number;
};

export type PresignedUploadResult = {
  evidenceServerId: string;
  presignedUrl: string;
  expiresAt: string;
};

export type SyncBatch = {
  operations: {
    operationUuid: string;
    entityType: string;
    mutationType: string;
    payload: Record<string, unknown>;
  }[];
};

export type SyncBatchResult = {
  accepted: {
    operationUuid: string;
    serverId: string;
    serverVersion: number;
  }[];
  rejected: {
    operationUuid: string;
    code: string;
    message: string;
  }[];
};
