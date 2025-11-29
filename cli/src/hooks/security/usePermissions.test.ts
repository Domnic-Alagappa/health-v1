/**
 * usePermissions Hook Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermissions } from './usePermissions';
import { useAuthStore } from '@/stores/authStore';
import { PERMISSIONS, ROLE_PERMISSIONS } from '@/lib/constants/permissions';

describe('usePermissions', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      permissions: [],
      role: null,
    });
  });

  it('should return permissions from store', () => {
    const testPermissions = [PERMISSIONS.PATIENTS.VIEW, PERMISSIONS.PATIENTS.EDIT];
    useAuthStore.setState({ permissions: testPermissions });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.permissions).toEqual(testPermissions);
  });

  it('should return role from store', () => {
    useAuthStore.setState({ role: 'doctor' });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.role).toBe('doctor');
  });

  it('should check if user has permission', () => {
    const testPermissions = [PERMISSIONS.PATIENTS.VIEW];
    useAuthStore.setState({ permissions: testPermissions });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.hasPermission(PERMISSIONS.PATIENTS.VIEW)).toBe(true);
    expect(result.current.hasPermission(PERMISSIONS.PATIENTS.EDIT)).toBe(false);
  });

  it('should check if user has any of the permissions', () => {
    const testPermissions = [PERMISSIONS.PATIENTS.VIEW];
    useAuthStore.setState({ permissions: testPermissions });

    const { result } = renderHook(() => usePermissions());

    expect(
      result.current.hasAnyPermission([
        PERMISSIONS.PATIENTS.VIEW,
        PERMISSIONS.PATIENTS.EDIT,
      ])
    ).toBe(true);

    expect(
      result.current.hasAnyPermission([
        PERMISSIONS.PATIENTS.EDIT,
        PERMISSIONS.CLINICAL.VIEW,
      ])
    ).toBe(false);
  });

  it('should check if user has all permissions', () => {
    const testPermissions = [
      PERMISSIONS.PATIENTS.VIEW,
      PERMISSIONS.PATIENTS.EDIT,
    ];
    useAuthStore.setState({ permissions: testPermissions });

    const { result } = renderHook(() => usePermissions());

    expect(
      result.current.hasAllPermissions([
        PERMISSIONS.PATIENTS.VIEW,
        PERMISSIONS.PATIENTS.EDIT,
      ])
    ).toBe(true);

    expect(
      result.current.hasAllPermissions([
        PERMISSIONS.PATIENTS.VIEW,
        PERMISSIONS.CLINICAL.VIEW,
      ])
    ).toBe(false);
  });

  it('should check if user has role', () => {
    useAuthStore.setState({ role: 'doctor' });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.hasRole('doctor')).toBe(true);
    expect(result.current.hasRole('nurse')).toBe(false);
  });

  it('should check if user has any of the roles', () => {
    useAuthStore.setState({ role: 'doctor' });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.hasAnyRole(['doctor', 'nurse'])).toBe(true);
    expect(result.current.hasAnyRole(['nurse', 'admin'])).toBe(false);
  });

  it('should get permissions for current role', () => {
    useAuthStore.setState({ role: 'doctor' });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.rolePermissions).toEqual(ROLE_PERMISSIONS.doctor);
  });
});

