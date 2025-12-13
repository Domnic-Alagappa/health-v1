/**
 * Vault Permission Mappings
 * Maps health-v1 permissions to vault paths for unified access control
 */

import type { VaultCapability, VaultPathMapping } from './types';

/**
 * Default path mappings between health-v1 permissions and vault paths
 * 
 * This allows apps to check both:
 * 1. Health-v1 permission (e.g., "patients:view")
 * 2. Vault ACL (e.g., "secret/data/patients/*")
 */
export const DEFAULT_VAULT_PATH_MAPPINGS: VaultPathMapping[] = [
  // Patient secrets
  {
    healthPermission: 'patients:view',
    vaultPath: 'secret/data/patients/*',
    capabilities: ['read', 'list'],
  },
  {
    healthPermission: 'patients:view:ssn',
    vaultPath: 'secret/data/patients/*/ssn',
    capabilities: ['read'],
  },
  {
    healthPermission: 'patients:create',
    vaultPath: 'secret/data/patients/*',
    capabilities: ['create'],
  },
  {
    healthPermission: 'patients:update',
    vaultPath: 'secret/data/patients/*',
    capabilities: ['update'],
  },
  {
    healthPermission: 'patients:delete',
    vaultPath: 'secret/data/patients/*',
    capabilities: ['delete'],
  },

  // Clinical secrets (sensitive medical data)
  {
    healthPermission: 'clinical:view',
    vaultPath: 'secret/data/clinical/*',
    capabilities: ['read', 'list'],
  },
  {
    healthPermission: 'clinical:create',
    vaultPath: 'secret/data/clinical/*',
    capabilities: ['create'],
  },
  {
    healthPermission: 'clinical:update',
    vaultPath: 'secret/data/clinical/*',
    capabilities: ['update'],
  },

  // API keys and credentials
  {
    healthPermission: 'settings:view',
    vaultPath: 'secret/data/config/*',
    capabilities: ['read', 'list'],
  },
  {
    healthPermission: 'settings:update',
    vaultPath: 'secret/data/config/*',
    capabilities: ['create', 'update'],
  },

  // Encryption keys (for transit engine)
  {
    healthPermission: 'users:view',
    vaultPath: 'transit/keys/*',
    capabilities: ['read', 'list'],
  },
  {
    healthPermission: 'users:create',
    vaultPath: 'transit/keys/*',
    capabilities: ['create'],
  },
];

/**
 * Get vault path for a health-v1 permission
 */
export function getVaultPathForPermission(
  healthPermission: string,
  mappings: VaultPathMapping[] = DEFAULT_VAULT_PATH_MAPPINGS
): string | null {
  const mapping = mappings.find((m) => m.healthPermission === healthPermission);
  return mapping?.vaultPath || null;
}

/**
 * Get required vault capabilities for a health-v1 permission
 */
export function getVaultCapabilitiesForPermission(
  healthPermission: string,
  mappings: VaultPathMapping[] = DEFAULT_VAULT_PATH_MAPPINGS
): VaultCapability[] {
  const mapping = mappings.find((m) => m.healthPermission === healthPermission);
  return mapping?.capabilities || [];
}

/**
 * Check if a permission requires vault access
 */
export function permissionRequiresVault(
  healthPermission: string,
  mappings: VaultPathMapping[] = DEFAULT_VAULT_PATH_MAPPINGS
): boolean {
  return mappings.some((m) => m.healthPermission === healthPermission);
}

/**
 * Generate vault policy rules from health-v1 permissions
 * Useful for creating vault policies that match user roles
 */
export function generateVaultPolicyRules(
  healthPermissions: string[],
  mappings: VaultPathMapping[] = DEFAULT_VAULT_PATH_MAPPINGS
): string {
  const rules: Record<string, Set<VaultCapability>> = {};

  for (const permission of healthPermissions) {
    const mapping = mappings.find((m) => m.healthPermission === permission);
    if (mapping) {
      if (!rules[mapping.vaultPath]) {
        rules[mapping.vaultPath] = new Set();
      }
      mapping.capabilities.forEach((cap) => rules[mapping.vaultPath].add(cap));
    }
  }

  // Generate HCL-like policy
  const policyPaths = Object.entries(rules).map(([path, caps]) => {
    const capabilities = Array.from(caps).map((c) => `"${c}"`).join(', ');
    return `path "${path}" {\n  capabilities = [${capabilities}]\n}`;
  });

  return policyPaths.join('\n\n');
}

/**
 * Role to vault policy name mapping
 */
export const ROLE_TO_VAULT_POLICY: Record<string, string> = {
  admin: 'admin-policy',
  doctor: 'doctor-policy',
  nurse: 'nurse-policy',
  receptionist: 'receptionist-policy',
};

/**
 * Role to vault capabilities mapping
 * Maps roles to their default vault capabilities
 */
export const ROLE_CAPABILITIES: Record<string, VaultCapability[]> = {
  admin: ['create', 'read', 'update', 'delete', 'list', 'sudo'],
  doctor: ['create', 'read', 'update', 'list'],
  nurse: ['read', 'update', 'list'],
  receptionist: ['read', 'list'],
  viewer: ['read', 'list'],
  service: ['create', 'read', 'update', 'delete', 'list'],
};

/**
 * Get vault policy name for a role
 */
export function getVaultPolicyForRole(role: string): string {
  return ROLE_TO_VAULT_POLICY[role] || `${role}-policy`;
}

/**
 * Generate vault policies for all health-v1 roles
 */
export function generateVaultPoliciesForRoles(
  rolePermissions: Record<string, string[]>,
  mappings: VaultPathMapping[] = DEFAULT_VAULT_PATH_MAPPINGS
): Record<string, string> {
  const policies: Record<string, string> = {};

  for (const [role, permissions] of Object.entries(rolePermissions)) {
    policies[getVaultPolicyForRole(role)] = generateVaultPolicyRules(permissions, mappings);
  }

  return policies;
}

// ==========================================
// Realm-Specific Policy Generation
// ==========================================

/**
 * Generate vault policy from Zanzibar realm membership
 * Creates realm-scoped paths with role-appropriate capabilities
 */
export function generateRealmPolicy(realmId: string, role: string): string {
  const capabilities = ROLE_CAPABILITIES[role] || ['read'];
  const capabilitiesStr = capabilities.map((c) => `"${c}"`).join(', ');

  return `# Auto-generated from Zanzibar realm membership
# Role: ${role} in realm: ${realmId}

path "secret/realms/${realmId}/*" {
  capabilities = [${capabilitiesStr}]
}

path "secret/realms/${realmId}/+/data/*" {
  capabilities = [${capabilitiesStr}]
}

path "secret/realms/${realmId}/+/metadata/*" {
  capabilities = ["read", "list"]
}`;
}

/**
 * Generate vault policy for a service accessing a realm
 */
export function generateServiceRealmPolicy(
  serviceId: string,
  realmId: string,
  capabilities: VaultCapability[] = ['read', 'list']
): string {
  const capabilitiesStr = capabilities.map((c) => `"${c}"`).join(', ');

  return `# Service-to-realm access policy
# Service: ${serviceId} accessing realm: ${realmId}

path "secret/realms/${realmId}/*" {
  capabilities = [${capabilitiesStr}]
}

path "secret/services/${serviceId}/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}`;
}

/**
 * Realm membership info from Zanzibar
 */
export interface RealmMembership {
  realmId: string;
  role: string;
  realmUuid?: string;
}

/**
 * Generate vault policies for a user based on their Zanzibar realm memberships
 */
export function generateUserRealmPolicies(
  userId: string,
  memberships: RealmMembership[]
): Record<string, string> {
  const policies: Record<string, string> = {};

  for (const { realmId, role } of memberships) {
    const policyName = `user-${userId}-realm-${realmId}-${role}`;
    policies[policyName] = generateRealmPolicy(realmId, role);
  }

  return policies;
}

/**
 * Get policy names for a user's realm memberships
 */
export function getUserRealmPolicyNames(
  userId: string,
  memberships: RealmMembership[]
): string[] {
  return memberships.map(
    ({ realmId, role }) => `user-${userId}-realm-${realmId}-${role}`
  );
}

// ==========================================
// Zanzibar-Vault Sync Interface
// ==========================================

/**
 * Vault client interface for policy sync
 */
export interface VaultPolicyClient {
  writePolicy(name: string, policy: string): Promise<void>;
  deletePolicy(name: string): Promise<void>;
  listPolicies(): Promise<string[]>;
}

/**
 * Zanzibar client interface for realm queries
 */
export interface ZanzibarClient {
  getUserRealms(userId: string): Promise<RealmMembership[]>;
  getServiceRealms(serviceId: string): Promise<RealmMembership[]>;
}

/**
 * Sync user's realm permissions to vault policies
 * Call this when user's Zanzibar permissions change
 */
export async function syncUserRealmPolicies(
  zanzibarClient: ZanzibarClient,
  vaultClient: VaultPolicyClient,
  userId: string
): Promise<string[]> {
  // Get user's realm memberships from Zanzibar
  const memberships = await zanzibarClient.getUserRealms(userId);

  // Generate and apply vault policies
  const policies = generateUserRealmPolicies(userId, memberships);
  const policyNames: string[] = [];

  for (const [name, policy] of Object.entries(policies)) {
    await vaultClient.writePolicy(name, policy);
    policyNames.push(name);
  }

  return policyNames;
}

/**
 * Sync service's realm permissions to vault policies
 */
export async function syncServiceRealmPolicies(
  zanzibarClient: ZanzibarClient,
  vaultClient: VaultPolicyClient,
  serviceId: string
): Promise<string[]> {
  // Get service's realm access from Zanzibar
  const memberships = await zanzibarClient.getServiceRealms(serviceId);

  const policyNames: string[] = [];

  for (const { realmId } of memberships) {
    const policyName = `service-${serviceId}-realm-${realmId}`;
    const policy = generateServiceRealmPolicy(serviceId, realmId, ['read', 'list']);
    await vaultClient.writePolicy(policyName, policy);
    policyNames.push(policyName);
  }

  return policyNames;
}

/**
 * Clean up old policies for a user (call before sync)
 */
export async function cleanupUserPolicies(
  vaultClient: VaultPolicyClient,
  userId: string
): Promise<void> {
  const allPolicies = await vaultClient.listPolicies();
  const userPolicyPrefix = `user-${userId}-realm-`;

  for (const policy of allPolicies) {
    if (policy.startsWith(userPolicyPrefix)) {
      await vaultClient.deletePolicy(policy);
    }
  }
}

