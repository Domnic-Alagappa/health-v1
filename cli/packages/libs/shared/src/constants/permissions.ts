/**
 * Permission Constants
 * All permissions used throughout the application
 */

export const PERMISSIONS = {
  // Patient permissions
  PATIENTS: {
    VIEW: "patients:view",
    CREATE: "patients:create",
    UPDATE: "patients:update",
    DELETE: "patients:delete",
    VIEW_SSN: "patients:view:ssn",
    VIEW_FULL: "patients:view:full",
  },

  // User permissions
  USERS: {
    VIEW: "users:view",
    CREATE: "users:create",
    UPDATE: "users:update",
    DELETE: "users:delete",
  },

  // Clinical permissions
  CLINICAL: {
    VIEW: "clinical:view",
    CREATE: "clinical:create",
    UPDATE: "clinical:update",
    DELETE: "clinical:delete",
  },

  // Orders permissions
  ORDERS: {
    VIEW: "orders:view",
    CREATE: "orders:create",
    UPDATE: "orders:update",
    DELETE: "orders:delete",
  },

  // Results permissions
  RESULTS: {
    VIEW: "results:view",
    CREATE: "results:create",
    UPDATE: "results:update",
    DELETE: "results:delete",
  },

  // Pharmacy permissions
  PHARMACY: {
    VIEW: "pharmacy:view",
    CREATE: "pharmacy:create",
    UPDATE: "pharmacy:update",
    DELETE: "pharmacy:delete",
  },

  // Scheduling permissions
  SCHEDULING: {
    VIEW: "scheduling:view",
    CREATE: "scheduling:create",
    UPDATE: "scheduling:update",
    DELETE: "scheduling:delete",
  },

  // Revenue permissions
  REVENUE: {
    VIEW: "revenue:view",
    CREATE: "revenue:create",
    UPDATE: "revenue:update",
    DELETE: "revenue:delete",
  },

  // Analytics permissions
  ANALYTICS: {
    VIEW: "analytics:view",
    EXPORT: "analytics:export",
  },

  // Settings permissions
  SETTINGS: {
    VIEW: "settings:view",
    UPDATE: "settings:update",
  },
} as const;

export type Permission =
  | (typeof PERMISSIONS.PATIENTS)[keyof typeof PERMISSIONS.PATIENTS]
  | (typeof PERMISSIONS.USERS)[keyof typeof PERMISSIONS.USERS]
  | (typeof PERMISSIONS.CLINICAL)[keyof typeof PERMISSIONS.CLINICAL]
  | (typeof PERMISSIONS.ORDERS)[keyof typeof PERMISSIONS.ORDERS]
  | (typeof PERMISSIONS.RESULTS)[keyof typeof PERMISSIONS.RESULTS]
  | (typeof PERMISSIONS.PHARMACY)[keyof typeof PERMISSIONS.PHARMACY]
  | (typeof PERMISSIONS.SCHEDULING)[keyof typeof PERMISSIONS.SCHEDULING]
  | (typeof PERMISSIONS.REVENUE)[keyof typeof PERMISSIONS.REVENUE]
  | (typeof PERMISSIONS.ANALYTICS)[keyof typeof PERMISSIONS.ANALYTICS]
  | (typeof PERMISSIONS.SETTINGS)[keyof typeof PERMISSIONS.SETTINGS];

// Role-based permission mappings
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: Object.values(PERMISSIONS).flatMap((category) => Object.values(category)),
  doctor: [
    PERMISSIONS.PATIENTS.VIEW,
    PERMISSIONS.PATIENTS.VIEW_FULL,
    PERMISSIONS.CLINICAL.VIEW,
    PERMISSIONS.CLINICAL.CREATE,
    PERMISSIONS.CLINICAL.UPDATE,
    PERMISSIONS.ORDERS.VIEW,
    PERMISSIONS.ORDERS.CREATE,
    PERMISSIONS.RESULTS.VIEW,
    PERMISSIONS.SCHEDULING.VIEW,
  ],
  nurse: [
    PERMISSIONS.PATIENTS.VIEW,
    PERMISSIONS.CLINICAL.VIEW,
    PERMISSIONS.CLINICAL.UPDATE,
    PERMISSIONS.ORDERS.VIEW,
    PERMISSIONS.RESULTS.VIEW,
    PERMISSIONS.SCHEDULING.VIEW,
  ],
  receptionist: [
    PERMISSIONS.PATIENTS.VIEW,
    PERMISSIONS.PATIENTS.CREATE,
    PERMISSIONS.SCHEDULING.VIEW,
    PERMISSIONS.SCHEDULING.CREATE,
    PERMISSIONS.SCHEDULING.UPDATE,
  ],
};
