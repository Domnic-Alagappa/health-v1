/**
 * Test Data Generators
 * Utilities for generating test data in E2E tests
 */

/**
 * Generate a random email address for testing
 */
export function generateTestEmail(prefix = "test"): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}-${timestamp}-${random}@example.com`;
}

/**
 * Generate a random string of specified length
 */
export function generateRandomString(length = 10): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate test user data
 */
export function generateTestUser(overrides?: Partial<TestUser>): TestUser {
  return {
    email: generateTestEmail("user"),
    password: "TestPassword123!",
    firstName: "Test",
    lastName: "User",
    role: "doctor",
    ...overrides,
  };
}

/**
 * Generate test patient data
 */
export function generateTestPatient(overrides?: Partial<TestPatient>): TestPatient {
  return {
    firstName: "John",
    lastName: "Doe",
    dateOfBirth: "1990-01-01",
    email: generateTestEmail("patient"),
    phone: "555-0100",
    ...overrides,
  };
}

export interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface TestPatient {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
}

/**
 * Default test credentials (should match your test database)
 */
export const DEFAULT_TEST_CREDENTIALS = {
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || "admin@example.com",
    password: process.env.TEST_ADMIN_PASSWORD || "admin123",
  },
  doctor: {
    email: process.env.TEST_DOCTOR_EMAIL || "doctor@example.com",
    password: process.env.TEST_DOCTOR_PASSWORD || "doctor123",
  },
  nurse: {
    email: process.env.TEST_NURSE_EMAIL || "nurse@example.com",
    password: process.env.TEST_NURSE_PASSWORD || "nurse123",
  },
  receptionist: {
    email: process.env.TEST_RECEPTIONIST_EMAIL || "receptionist@example.com",
    password: process.env.TEST_RECEPTIONIST_PASSWORD || "receptionist123",
  },
};
