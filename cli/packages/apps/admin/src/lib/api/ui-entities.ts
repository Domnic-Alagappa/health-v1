/**
 * UI Entity API Client
 * Handles registration and management of UI entities (pages, buttons, fields, APIs)
 */

import { apiRequest } from "./client";
import type { ApiResponse } from "./types";

export interface UiPage {
  id: string;
  name: string;
  path: string;
  description?: string;
  zanzibar_resource: string;
}

export interface UiButton {
  id: string;
  page_id: string;
  button_id: string;
  label: string;
  action?: string;
  zanzibar_resource: string;
}

export interface UiField {
  id: string;
  page_id: string;
  field_id: string;
  label: string;
  field_type: string;
  zanzibar_resource: string;
}

export interface UiApiEndpoint {
  id: string;
  endpoint: string;
  method: string;
  description?: string;
  zanzibar_resource: string;
}

export interface RegisterPageRequest {
  name: string;
  path: string;
  description?: string;
}

export interface RegisterButtonRequest {
  page_id: string;
  button_id: string;
  label: string;
  action?: string;
}

export interface RegisterFieldRequest {
  page_id: string;
  field_id: string;
  label: string;
  field_type: string;
}

export interface RegisterApiRequest {
  endpoint: string;
  method: string;
  description?: string;
}

/**
 * Register a new UI page
 */
export async function registerPage(
  request: RegisterPageRequest
): Promise<UiPage> {
  return apiRequest<UiPage>("/api/admin/ui/pages", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * List all registered pages
 */
export async function listPages(): Promise<ApiResponse<{ pages: UiPage[] }>> {
  return apiRequest("/api/admin/ui/pages");
}

/**
 * Register a new UI button
 */
export async function registerButton(
  request: RegisterButtonRequest
): Promise<UiButton> {
  return apiRequest<UiButton>("/api/admin/ui/buttons", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * List buttons for a page
 */
export async function listButtonsForPage(
  pageId: string
): Promise<ApiResponse<{ buttons: UiButton[] }>> {
  return apiRequest(`/api/admin/ui/pages/${pageId}/buttons`);
}

/**
 * Register a new UI field
 */
export async function registerField(
  request: RegisterFieldRequest
): Promise<UiField> {
  return apiRequest<UiField>("/api/admin/ui/fields", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * List fields for a page
 */
export async function listFieldsForPage(
  pageId: string
): Promise<ApiResponse<{ fields: UiField[] }>> {
  return apiRequest(`/api/admin/ui/pages/${pageId}/fields`);
}

/**
 * Register a new API endpoint
 */
export async function registerApi(
  request: RegisterApiRequest
): Promise<UiApiEndpoint> {
  return apiRequest<UiApiEndpoint>("/api/admin/ui/apis", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * List all registered API endpoints
 */
export async function listApis(): Promise<ApiResponse<{ apis: UiApiEndpoint[] }>> {
  return apiRequest("/api/admin/ui/apis");
}

