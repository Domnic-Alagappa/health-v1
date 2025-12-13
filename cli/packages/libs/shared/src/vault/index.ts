/**
 * RustyVault Integration for all health-v1 UIs
 * 
 * This module provides unified secrets access and ACL checking
 * across admin, client, and vault UIs.
 * 
 * Key features:
 * - Vault client for API communication
 * - Zustand store for vault state
 * - React hooks for vault operations
 * - Permission mappings (health-v1 → vault paths)
 * - Zanzibar-Vault sync for realm policies
 */

export * from './client';
export * from './store';
export * from './hooks';
export * from './types';
export * from './permissions';
export * from './components';
export * from './sync';

