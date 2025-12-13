/**
 * UI Entity API Client
 * Handles registration and management of UI entities (pages, buttons, fields, APIs)
 */

import { API_ROUTES, apiRequest } from "./client";
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
  return apiRequest<UiPage>(API_ROUTES.ADMIN.UI.PAGES, {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * List all registered pages
 */
export async function listPages(): Promise<ApiResponse<{ pages: UiPage[] }>> {
  return apiRequest(API_ROUTES.ADMIN.UI.PAGES);
}

/**
 * Register a new UI button
 */
export async function registerButton(
  request: RegisterButtonRequest
): Promise<UiButton> {
  return apiRequest<UiButton>(API_ROUTES.ADMIN.UI.BUTTONS, {
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
  return apiRequest(API_ROUTES.ADMIN.UI.PAGES_BUTTONS(pageId));
}

/**
 * Register a new UI field
 */
export async function registerField(
  request: RegisterFieldRequest
): Promise<UiField> {
  return apiRequest<UiField>(API_ROUTES.ADMIN.UI.FIELDS, {
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
  return apiRequest(API_ROUTES.ADMIN.UI.PAGES_FIELDS(pageId));
}

/**
 * Register a new API endpoint
 */
export async function registerApi(
  request: RegisterApiRequest
): Promise<UiApiEndpoint> {
  return apiRequest<UiApiEndpoint>(API_ROUTES.ADMIN.UI.APIS, {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * List all registered API endpoints
 */
export async function listApis(): Promise<ApiResponse<{ apis: UiApiEndpoint[] }>> {
  return apiRequest(API_ROUTES.ADMIN.UI.APIS);
}

