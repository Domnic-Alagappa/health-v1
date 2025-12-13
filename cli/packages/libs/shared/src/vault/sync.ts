/**
 * Zanzibar-Vault Sync Service
 * 
 * Provides real-time synchronization between Zanzibar permission changes
 * and RustyVault ACL policies.
 */

import type { VaultCapability } from './types';
import {
  generateRealmPolicy,
  generateServiceRealmPolicy,
  type RealmMembership,
  type VaultPolicyClient,
  type ZanzibarClient,
} from './permissions';

/**
 * Configuration for the sync service
 */
export interface SyncConfig {
  /** Sync interval in seconds (0 = manual only) */
  syncIntervalSeconds: number;
  /** Enable automatic sync on permission changes */
  autoSync: boolean;
  /** Clean up old policies before syncing */
  cleanupOldPolicies: boolean;
  /** Prefix for generated policy names */
  policyPrefix: string;
}

/**
 * Default sync configuration
 */
export const DEFAULT_SYNC_CONFIG: SyncConfig = {
  syncIntervalSeconds: 60,
  autoSync: true,
  cleanupOldPolicies: true,
  policyPrefix: 'zanzibar-',
};

/**
 * Sync state for tracking
 */
export interface SyncState {
  lastSyncTime: Date | null;
  lastSyncStatus: 'success' | 'failed' | 'pending' | null;
  syncedPolicies: string[];
  errors: string[];
}

/**
 * Zanzibar-Vault Sync Service
 * 
 * Manages synchronization of Zanzibar permissions to Vault policies.
 * Supports:
 * - User realm memberships → User-scoped vault policies
 * - Service realm access → Service-scoped vault policies
 * - Periodic sync with configurable interval
 * - Manual sync on demand
 */
export class ZanzibarVaultSync {
  private config: SyncConfig;
  private zanzibarClient: ZanzibarClient;
  private vaultClient: VaultPolicyClient;
  private state: SyncState;
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    zanzibarClient: ZanzibarClient,
    vaultClient: VaultPolicyClient,
    config: Partial<SyncConfig> = {}
  ) {
    this.zanzibarClient = zanzibarClient;
    this.vaultClient = vaultClient;
    this.config = { ...DEFAULT_SYNC_CONFIG, ...config };
    this.state = {
      lastSyncTime: null,
      lastSyncStatus: null,
      syncedPolicies: [],
      errors: [],
    };
  }

  /**
   * Start periodic sync
   */
  startPeriodicSync(): void {
    if (this.config.syncIntervalSeconds <= 0) {
      console.warn('Sync interval is 0 or negative, periodic sync disabled');
      return;
    }

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(
      () => this.syncAll().catch(console.error),
      this.config.syncIntervalSeconds * 1000
    );

    console.log(`Started periodic sync every ${this.config.syncIntervalSeconds}s`);
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Get current sync state
   */
  getState(): SyncState {
    return { ...this.state };
  }

  /**
   * Sync all users and services (full sync)
   */
  async syncAll(): Promise<void> {
    this.state.lastSyncStatus = 'pending';
    this.state.errors = [];
    
    try {
      // In a real implementation, you would iterate over all users/services
      // For now, this is a placeholder that shows the pattern
      console.log('Full sync started...');
      
      this.state.lastSyncTime = new Date();
      this.state.lastSyncStatus = 'success';
    } catch (error) {
      this.state.lastSyncStatus = 'failed';
      this.state.errors.push(error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Sync a specific user's realm policies
   */
  async syncUser(userId: string): Promise<string[]> {
    const policyNames: string[] = [];

    try {
      // Get user's realm memberships from Zanzibar
      const memberships = await this.zanzibarClient.getUserRealms(userId);

      // Clean up old policies if configured
      if (this.config.cleanupOldPolicies) {
        await this.cleanupUserPolicies(userId);
      }

      // Generate and apply new policies
      for (const { realmId, role } of memberships) {
        const policyName = `${this.config.policyPrefix}user-${userId}-realm-${realmId}-${role}`;
        const policy = generateRealmPolicy(realmId, role);
        
        await this.vaultClient.writePolicy(policyName, policy);
        policyNames.push(policyName);
      }

      this.state.syncedPolicies = [
        ...this.state.syncedPolicies.filter(p => !p.includes(`user-${userId}-`)),
        ...policyNames,
      ];

      return policyNames;
    } catch (error) {
      const errorMsg = `Failed to sync user ${userId}: ${error instanceof Error ? error.message : error}`;
      this.state.errors.push(errorMsg);
      throw new Error(errorMsg);
    }
  }

  /**
   * Sync a specific service's realm policies
   */
  async syncService(
    serviceId: string,
    defaultCapabilities: VaultCapability[] = ['read', 'list']
  ): Promise<string[]> {
    const policyNames: string[] = [];

    try {
      // Get service's realm access from Zanzibar
      const memberships = await this.zanzibarClient.getServiceRealms(serviceId);

      // Clean up old policies if configured
      if (this.config.cleanupOldPolicies) {
        await this.cleanupServicePolicies(serviceId);
      }

      // Generate and apply new policies
      for (const { realmId } of memberships) {
        const policyName = `${this.config.policyPrefix}service-${serviceId}-realm-${realmId}`;
        const policy = generateServiceRealmPolicy(serviceId, realmId, defaultCapabilities);
        
        await this.vaultClient.writePolicy(policyName, policy);
        policyNames.push(policyName);
      }

      this.state.syncedPolicies = [
        ...this.state.syncedPolicies.filter(p => !p.includes(`service-${serviceId}-`)),
        ...policyNames,
      ];

      return policyNames;
    } catch (error) {
      const errorMsg = `Failed to sync service ${serviceId}: ${error instanceof Error ? error.message : error}`;
      this.state.errors.push(errorMsg);
      throw new Error(errorMsg);
    }
  }

  /**
   * Clean up old user policies
   */
  private async cleanupUserPolicies(userId: string): Promise<void> {
    const allPolicies = await this.vaultClient.listPolicies();
    const userPolicyPrefix = `${this.config.policyPrefix}user-${userId}-`;

    for (const policy of allPolicies) {
      if (policy.startsWith(userPolicyPrefix)) {
        await this.vaultClient.deletePolicy(policy);
      }
    }
  }

  /**
   * Clean up old service policies
   */
  private async cleanupServicePolicies(serviceId: string): Promise<void> {
    const allPolicies = await this.vaultClient.listPolicies();
    const servicePolicyPrefix = `${this.config.policyPrefix}service-${serviceId}-`;

    for (const policy of allPolicies) {
      if (policy.startsWith(servicePolicyPrefix)) {
        await this.vaultClient.deletePolicy(policy);
      }
    }
  }

  /**
   * Handle Zanzibar permission change event
   * Call this when a permission is added/removed in Zanzibar
   */
  async onPermissionChange(event: PermissionChangeEvent): Promise<void> {
    if (!this.config.autoSync) {
      return;
    }

    switch (event.subjectType) {
      case 'user':
        await this.syncUser(event.subjectId);
        break;
      case 'service':
        await this.syncService(event.subjectId);
        break;
    }
  }
}

/**
 * Permission change event from Zanzibar
 */
export interface PermissionChangeEvent {
  /** Type of subject (user or service) */
  subjectType: 'user' | 'service';
  /** ID of the subject */
  subjectId: string;
  /** Realm affected */
  realmId: string;
  /** Type of change */
  changeType: 'added' | 'removed' | 'updated';
  /** Role in the realm */
  role?: string;
}

/**
 * Create a mock Zanzibar client for testing
 */
export function createMockZanzibarClient(
  userRealms: Record<string, RealmMembership[]> = {},
  serviceRealms: Record<string, RealmMembership[]> = {}
): ZanzibarClient {
  return {
    async getUserRealms(userId: string): Promise<RealmMembership[]> {
      return userRealms[userId] || [];
    },
    async getServiceRealms(serviceId: string): Promise<RealmMembership[]> {
      return serviceRealms[serviceId] || [];
    },
  };
}

/**
 * Create a mock Vault policy client for testing
 */
export function createMockVaultClient(): VaultPolicyClient & { policies: Record<string, string> } {
  const policies: Record<string, string> = {};
  
  return {
    policies,
    async writePolicy(name: string, policy: string): Promise<void> {
      policies[name] = policy;
    },
    async deletePolicy(name: string): Promise<void> {
      delete policies[name];
    },
    async listPolicies(): Promise<string[]> {
      return Object.keys(policies);
    },
  };
}

