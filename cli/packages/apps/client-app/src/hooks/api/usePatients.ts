/**
 * usePatients Hook
 * TanStack Query hooks for patient data with automatic masking
 */

import { useAuditLog } from "@/hooks/security/useAuditLog";
import { useMasking } from "@/hooks/security/useMasking";
import { apiClient } from "@/lib/api/client";
import type { Patient } from "@/lib/api/types";
import { API_ROUTES } from "@health-v1/shared/api/routes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const PATIENTS_QUERY_KEYS = {
  all: ["patients"] as const,
  lists: () => [...PATIENTS_QUERY_KEYS.all, "list"] as const,
  list: (filters?: unknown) => [...PATIENTS_QUERY_KEYS.lists(), { filters }] as const,
  details: () => [...PATIENTS_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...PATIENTS_QUERY_KEYS.details(), id] as const,
};

/**
 * Get all patients
 */
export function usePatients(filters?: unknown) {
  const { logPHI } = useAuditLog();

  return useQuery({
    queryKey: PATIENTS_QUERY_KEYS.list(filters),
    queryFn: async () => {
      const response = await apiClient.get<Patient[]>(API_ROUTES.PATIENTS.LIST);

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data) {
        throw new Error("No data returned");
      }

      // Log PHI access
      logPHI("patients", undefined, { action: "list" });

      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Get single patient by ID
 */
export function usePatient(id: string) {
  const { logPHI } = useAuditLog();

  return useQuery({
    queryKey: PATIENTS_QUERY_KEYS.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<Patient>(API_ROUTES.PATIENTS.GET(id));

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data) {
        throw new Error("No data returned");
      }

      // Log PHI access
      logPHI("patients", id, { action: "view" });

      return response.data;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

/**
 * Create patient mutation
 */
export function useCreatePatient() {
  const queryClient = useQueryClient();
  const { logState } = useAuditLog();

  return useMutation({
    mutationFn: async (patient: Omit<Patient, "id" | "createdAt" | "createdBy">) => {
      const response = await apiClient.post<Patient>(API_ROUTES.PATIENTS.CREATE, patient);

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data) {
        throw new Error("No data returned");
      }

      // Log state change
      logState("CREATE", "patients", response.data.id, { action: "create" });

      return response.data;
    },
    onSuccess: () => {
      // Invalidate patients list
      queryClient.invalidateQueries({ queryKey: PATIENTS_QUERY_KEYS.lists() });
    },
  });
}

/**
 * Update patient mutation
 */
export function useUpdatePatient() {
  const queryClient = useQueryClient();
  const { logState } = useAuditLog();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Patient> & { id: string }) => {
      const response = await apiClient.put<Patient>(API_ROUTES.PATIENTS.UPDATE(id), updates);

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data) {
        throw new Error("No data returned");
      }

      // Log state change
      logState("UPDATE", "patients", id, { action: "update", updates });

      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate specific patient and list
      queryClient.invalidateQueries({ queryKey: PATIENTS_QUERY_KEYS.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: PATIENTS_QUERY_KEYS.lists() });
    },
  });
}

/**
 * Delete patient mutation
 */
export function useDeletePatient() {
  const queryClient = useQueryClient();
  const { logState } = useAuditLog();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(API_ROUTES.PATIENTS.DELETE(id));

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Log state change
      logState("DELETE", "patients", id, { action: "delete" });
    },
    onSuccess: () => {
      // Invalidate patients list
      queryClient.invalidateQueries({ queryKey: PATIENTS_QUERY_KEYS.lists() });
    },
  });
}
