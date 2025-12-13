/**
 * RustyVault API Client
 * Universal vault client for all health-v1 UIs
 */

import type {
  VaultAuth,
  VaultCapabilitiesResponse,
  VaultCapability,
  VaultHealthResponse,
  VaultPolicy,
  VaultSecret,
  VaultTokenInfo,
} from './types';

export interface VaultClientConfig {
  baseUrl: string;
  namespace?: string;
}

export class VaultClient {
  private baseUrl: string;
  private namespace?: string;
  private token: string | null = null;

  constructor(config: VaultClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.namespace = config.namespace;
  }

  /**
   * Set the vault token for authenticated requests
   */
  setToken(token: string | null): void {
    this.token = token;
  }

  /**
   * Get the current token
   */
  getToken(): string | null {
    return this.token;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['X-Vault-Token'] = this.token;
    }

    if (this.namespace) {
      headers['X-Vault-Namespace'] = this.namespace;
    }

    return headers;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    
    const response = await fetch(url, {
      method,
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ errors: ['Unknown error'] }));
      throw new VaultApiError(
        error.errors?.[0] || `HTTP ${response.status}`,
        response.status,
        error.errors
      );
    }

    // Some endpoints return empty body
    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
  }

  // ============================================
  // System Endpoints
  // ============================================

  async health(): Promise<VaultHealthResponse> {
    return this.request<VaultHealthResponse>('GET', '/v1/sys/health');
  }

  async sealStatus(): Promise<{ sealed: boolean; t: number; n: number; progress: number }> {
    return this.request('GET', '/v1/sys/seal-status');
  }

  async unseal(key: string): Promise<{ sealed: boolean; progress: number }> {
    return this.request('POST', '/v1/sys/unseal', { key });
  }

  async seal(): Promise<void> {
    return this.request('POST', '/v1/sys/seal');
  }

  // ============================================
  // Auth Endpoints
  // ============================================

  async loginUserpass(username: string, password: string): Promise<VaultSecret<VaultAuth>> {
    const response = await this.request<{ auth: VaultAuth }>(
      'POST',
      `/v1/auth/userpass/login/${username}`,
      { password }
    );
    
    // Auto-set token after login
    if (response.auth?.clientToken) {
      this.token = response.auth.clientToken;
    }
    
    return {
      requestId: '',
      renewable: response.auth.renewable,
      leaseDuration: response.auth.leaseDuration,
      data: {} as VaultAuth,
      auth: response.auth,
    };
  }

  async loginToken(token: string): Promise<VaultTokenInfo> {
    this.token = token;
    return this.lookupSelf();
  }

  async lookupSelf(): Promise<VaultTokenInfo> {
    const response = await this.request<{ data: VaultTokenInfo }>(
      'GET',
      '/v1/auth/token/lookup-self'
    );
    return response.data;
  }

  async renewSelf(increment?: number): Promise<VaultAuth> {
    const response = await this.request<{ auth: VaultAuth }>(
      'POST',
      '/v1/auth/token/renew-self',
      increment ? { increment } : undefined
    );
    return response.auth;
  }

  async revokeSelf(): Promise<void> {
    await this.request('POST', '/v1/auth/token/revoke-self');
    this.token = null;
  }

  async createToken(options?: {
    policies?: string[];
    ttl?: string;
    displayName?: string;
    numUses?: number;
    renewable?: boolean;
  }): Promise<VaultAuth> {
    const response = await this.request<{ auth: VaultAuth }>(
      'POST',
      '/v1/auth/token/create',
      options
    );
    return response.auth;
  }

  // ============================================
  // KV v2 Secrets Engine
  // ============================================

  async kvRead<T = Record<string, unknown>>(
    mount: string,
    path: string,
    version?: number
  ): Promise<VaultSecret<{ data: T; metadata: Record<string, unknown> }>> {
    const versionParam = version !== undefined ? `?version=${version}` : '';
    return this.request(
      'GET',
      `/v1/${mount}/data/${path}${versionParam}`
    );
  }

  async kvWrite<T = Record<string, unknown>>(
    mount: string,
    path: string,
    data: T,
    options?: { cas?: number }
  ): Promise<VaultSecret<{ version: number; created_time: string; deletion_time: string }>> {
    return this.request(
      'POST',
      `/v1/${mount}/data/${path}`,
      { data, options }
    );
  }

  async kvDelete(mount: string, path: string, versions?: number[]): Promise<void> {
    if (versions) {
      // Soft delete specific versions
      await this.request('POST', `/v1/${mount}/delete/${path}`, { versions });
    } else {
      // Delete latest version
      await this.request('DELETE', `/v1/${mount}/data/${path}`);
    }
  }

  async kvUndelete(mount: string, path: string, versions: number[]): Promise<void> {
    await this.request('POST', `/v1/${mount}/undelete/${path}`, { versions });
  }

  async kvDestroy(mount: string, path: string, versions: number[]): Promise<void> {
    await this.request('POST', `/v1/${mount}/destroy/${path}`, { versions });
  }

  async kvList(mount: string, path: string = ''): Promise<string[]> {
    try {
      const response = await this.request<{ data: { keys: string[] } }>(
        'GET',
        `/v1/${mount}/metadata/${path}?list=true`
      );
      return response.data.keys;
    } catch (error) {
      if (error instanceof VaultApiError && error.status === 404) {
        return [];
      }
      throw error;
    }
  }

  async kvMetadata(mount: string, path: string): Promise<Record<string, unknown>> {
    const response = await this.request<{ data: Record<string, unknown> }>(
      'GET',
      `/v1/${mount}/metadata/${path}`
    );
    return response.data;
  }

  // ============================================
  // Policy Endpoints
  // ============================================

  async listPolicies(): Promise<string[]> {
    const response = await this.request<{ data: { keys: string[] } }>(
      'GET',
      '/v1/sys/policies/acl'
    );
    return response.data.keys;
  }

  async readPolicy(name: string): Promise<VaultPolicy> {
    const response = await this.request<{ data: { name: string; policy: string } }>(
      'GET',
      `/v1/sys/policies/acl/${name}`
    );
    return {
      name: response.data.name,
      rules: response.data.policy,
    };
  }

  async writePolicy(name: string, rules: string): Promise<void> {
    await this.request('POST', `/v1/sys/policies/acl/${name}`, { policy: rules });
  }

  async deletePolicy(name: string): Promise<void> {
    await this.request('DELETE', `/v1/sys/policies/acl/${name}`);
  }

  // ============================================
  // Capabilities (ACL checking)
  // ============================================

  async checkCapabilities(paths: string[]): Promise<VaultCapabilitiesResponse> {
    const response = await this.request<VaultCapabilitiesResponse>(
      'POST',
      '/v1/sys/capabilities-self',
      { paths }
    );
    return response;
  }

  async hasCapability(path: string, capability: VaultCapability): Promise<boolean> {
    const response = await this.checkCapabilities([path]);
    const caps = response[path] || response.capabilities || [];
    
    if (caps.includes('deny')) return false;
    if (caps.includes('root')) return true;
    
    return caps.includes(capability);
  }

  async canRead(path: string): Promise<boolean> {
    return this.hasCapability(path, 'read');
  }

  async canWrite(path: string): Promise<boolean> {
    const response = await this.checkCapabilities([path]);
    const caps = response[path] || response.capabilities || [];
    
    if (caps.includes('deny')) return false;
    if (caps.includes('root')) return true;
    
    return caps.includes('create') || caps.includes('update');
  }

  async canDelete(path: string): Promise<boolean> {
    return this.hasCapability(path, 'delete');
  }

  async canList(path: string): Promise<boolean> {
    return this.hasCapability(path, 'list');
  }
}

/**
 * Vault API Error
 */
export class VaultApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors: string[] = []
  ) {
    super(message);
    this.name = 'VaultApiError';
  }
}

/**
 * Create a configured vault client
 */
export function createVaultClient(baseUrl?: string): VaultClient {
  const url = baseUrl || 
    (typeof window !== 'undefined' 
      ? window.location.origin.replace(/:\d+$/, ':8200')
      : 'http://localhost:8200');
  
  return new VaultClient({ baseUrl: url });
}

