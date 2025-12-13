/**
 * RustyVault Types
 * Shared types for vault integration across all UIs
 */

// Vault capabilities (similar to HashiCorp Vault)
export type VaultCapability = 
  | 'create' 
  | 'read' 
  | 'update' 
  | 'delete' 
  | 'list' 
  | 'sudo' 
  | 'deny'
  | 'root';

export interface VaultTokenInfo {
  id: string;
  accessor: string;
  policies: string[];
  path: string;
  meta?: Record<string, string>;
  displayName?: string;
  numUses: number;
  orphan: boolean;
  ttl: number;
  explicitMaxTtl: number;
  creationTime: number;
  creationTtl: number;
  expireTime?: string;
  renewable: boolean;
  entityId?: string;
}

export interface VaultSecret<T = Record<string, unknown>> {
  requestId: string;
  leaseId?: string;
  renewable: boolean;
  leaseDuration: number;
  data: T;
  wrapInfo?: {
    token: string;
    accessor: string;
    ttl: number;
    creationTime: string;
    wrappedAccessor?: string;
  };
  warnings?: string[];
  auth?: VaultAuth;
}

export interface VaultAuth {
  clientToken: string;
  accessor: string;
  policies: string[];
  tokenPolicies: string[];
  metadata?: Record<string, string>;
  leaseDuration: number;
  renewable: boolean;
  entityId?: string;
  tokenType: 'service' | 'batch';
  orphan: boolean;
}

export interface VaultPolicy {
  name: string;
  rules: string; // HCL or JSON policy rules
}

export interface VaultCapabilitiesResponse {
  capabilities: VaultCapability[];
  [path: string]: VaultCapability[];
}

export interface VaultHealthResponse {
  initialized: boolean;
  sealed: boolean;
  standby: boolean;
  performanceStandby: boolean;
  replicationPerformanceMode: string;
  replicationDrMode: string;
  serverTimeUtc: number;
  version: string;
  clusterName?: string;
  clusterId?: string;
}

export interface VaultError {
  errors: string[];
}

// Permission mapping between health-v1 and vault paths
export interface VaultPathMapping {
  healthPermission: string;  // e.g., "patients:view"
  vaultPath: string;         // e.g., "secret/data/patients/*"
  capabilities: VaultCapability[];
}

// Secrets engine types
export type SecretsEngineType = 'kv' | 'kv-v2' | 'pki' | 'transit' | 'database' | 'aws' | 'gcp';

export interface SecretsEngineMount {
  type: SecretsEngineType;
  description?: string;
  config?: {
    defaultLeaseTtl?: number;
    maxLeaseTtl?: number;
    forceNoCache?: boolean;
  };
  options?: Record<string, string>;
}

