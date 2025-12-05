/**
 * Auto-Registration System
 * Automatically registers UI entities for access control
 */

import { registerPage, registerButton, registerField, registerApi } from "../api/ui-entities";

/**
 * Auto-register a page when route loads
 */
export async function autoRegisterPage(
  name: string,
  path: string,
  description?: string
): Promise<void> {
  try {
    await registerPage({ name, path, description });
    console.log(`Auto-registered page: ${name} (${path})`);
  } catch (error) {
    // Page might already be registered, which is fine
    console.debug(`Page ${name} may already be registered:`, error);
  }
}

/**
 * Auto-register buttons with data-permission attribute
 */
export async function autoRegisterButtons(
  pageId: string,
  pageName: string
): Promise<void> {
  const buttons = document.querySelectorAll('[data-permission^="button:"]');
  
  for (const button of buttons) {
    const permissionAttr = button.getAttribute("data-permission");
    if (!permissionAttr) continue;

    const buttonId = permissionAttr.replace("button:", "");
    const label = button.textContent?.trim() || buttonId;
    const action = button.getAttribute("data-action") || undefined;

    try {
      await registerButton({
        page_id: pageId,
        button_id: buttonId,
        label,
        action,
      });
      console.log(`Auto-registered button: ${buttonId} on page ${pageName}`);
    } catch (error) {
      console.debug(`Button ${buttonId} may already be registered:`, error);
    }
  }
}

/**
 * Auto-register fields with data-permission attribute
 */
export async function autoRegisterFields(
  pageId: string,
  pageName: string
): Promise<void> {
  const fields = document.querySelectorAll('[data-permission^="field:"]');
  
  for (const field of fields) {
    const permissionAttr = field.getAttribute("data-permission");
    if (!permissionAttr) continue;

    const fieldId = permissionAttr.replace("field:", "");
    const label = field.getAttribute("data-label") || 
                  (field as HTMLElement).getAttribute("aria-label") ||
                  fieldId;
    const fieldType = field.getAttribute("data-field-type") ||
                     (field.tagName === "INPUT" ? (field as HTMLInputElement).type : "text");

    try {
      await registerField({
        page_id: pageId,
        field_id: fieldId,
        label,
        field_type: fieldType,
      });
      console.log(`Auto-registered field: ${fieldId} on page ${pageName}`);
    } catch (error) {
      console.debug(`Field ${fieldId} may already be registered:`, error);
    }
  }
}

/**
 * Auto-register APIs on API client initialization
 * This should be called when the API client is set up
 */
export async function autoRegisterApi(
  endpoint: string,
  method: string,
  description?: string
): Promise<void> {
  try {
    await registerApi({ endpoint, method, description });
    console.log(`Auto-registered API: ${method} ${endpoint}`);
  } catch (error) {
    console.debug(`API ${method} ${endpoint} may already be registered:`, error);
  }
}

/**
 * Initialize auto-registration for a page
 * Call this when a page component mounts
 */
export async function initializePageAutoRegistration(
  pageName: string,
  pagePath: string
): Promise<string | null> {
  try {
    // First, register the page
    await autoRegisterPage(pageName, pagePath);
    
    // Get the page ID (we'd need to fetch it or return it from registerPage)
    // For now, we'll need to query for it
    const { listPages } = await import("../api/ui-entities");
    const pagesResponse = await listPages();
    const registeredPage = pagesResponse.data?.pages?.find(
      (p) => p.name === pageName
    );

    if (registeredPage) {
      // Auto-register buttons and fields
      await autoRegisterButtons(registeredPage.id, pageName);
      await autoRegisterFields(registeredPage.id, pageName);
      return registeredPage.id;
    }

    return null;
  } catch (error) {
    console.error("Failed to initialize page auto-registration:", error);
    return null;
  }
}

