/**
 * Encryption Middleware
 * Encrypts sensitive fields in state before storing
 * Note: In a real implementation, this would use the encryption service
 */

import type { StateCreator } from "zustand"
import { SECURITY_CONFIG } from "@/lib/constants/security"

// Fields that should be encrypted in state
const ENCRYPTED_FIELDS = ["ssn", "creditCard", "password", "token", "secret"]

/**
 * Check if a field name should be encrypted
 */
function shouldEncryptField(fieldName: string): boolean {
  return ENCRYPTED_FIELDS.some((encryptedField) =>
    fieldName.toLowerCase().includes(encryptedField.toLowerCase())
  )
}

/**
 * Encrypt a value (placeholder - in production, use actual encryption)
 */
async function encryptValue(value: unknown): Promise<string> {
  // In production, this would call the encryption service
  // For now, we'll just return a placeholder
  if (typeof value === "string") {
    // In a real implementation, this would encrypt the value
    // return await encryptionService.encrypt(value);
    return value // Placeholder - actual encryption would happen here
  }
  return String(value)
}

/**
 * Decrypt a value (placeholder - in production, use actual decryption)
 */
async function decryptValue(encryptedValue: string): Promise<string> {
  // In production, this would call the decryption service
  // For now, we'll just return the value as-is
  // return await encryptionService.decrypt(encryptedValue);
  return encryptedValue // Placeholder - actual decryption would happen here
}

/**
 * Encrypt sensitive fields in an object
 */
async function encryptObject(obj: unknown): Promise<unknown> {
  if (!obj || typeof obj !== "object") return obj

  if (Array.isArray(obj)) {
    return Promise.all(obj.map((item) => encryptObject(item)))
  }

  const encrypted: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (shouldEncryptField(key) && typeof value === "string") {
      encrypted[key] = await encryptValue(value)
      encrypted[`${key}_encrypted`] = true // Flag to indicate encryption
    } else if (typeof value === "object" && value !== null) {
      encrypted[key] = await encryptObject(value)
    } else {
      encrypted[key] = value
    }
  }

  return encrypted
}

/**
 * Decrypt sensitive fields in an object
 */
async function decryptObject(obj: unknown): Promise<unknown> {
  if (!obj || typeof obj !== "object") return obj

  if (Array.isArray(obj)) {
    return Promise.all(obj.map((item) => decryptObject(item)))
  }

  const decrypted: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (
      shouldEncryptField(key) &&
      typeof value === "string" &&
      (obj as Record<string, unknown>)[`${key}_encrypted`]
    ) {
      decrypted[key] = await decryptValue(value as string)
    } else if (key.endsWith("_encrypted")) {
    } else if (typeof value === "object" && value !== null) {
      decrypted[key] = await decryptObject(value)
    } else {
      decrypted[key] = value
    }
  }

  return decrypted
}

/**
 * Encryption middleware that encrypts sensitive fields before storing
 * Note: This is a placeholder implementation. In production, you would:
 * 1. Use actual encryption service
 * 2. Handle async encryption/decryption properly
 * 3. Store encryption metadata
 */
export function encryptionMiddleware<T>(config: StateCreator<T>): StateCreator<T> {
  return (set, get, api) => {
    // Wrap set function to encrypt sensitive data
    const setWithEncryption = async (
      partial: T | Partial<T> | ((state: T) => T | Partial<T>),
      replace?: boolean
    ) => {
      let encryptedPartial = partial

      // If partial is an object, encrypt sensitive fields
      if (typeof partial === "object" && partial !== null && !Array.isArray(partial)) {
        encryptedPartial = (await encryptObject(partial)) as T | Partial<T>
      } else if (typeof partial === "function") {
        // For function updates, we'd need to encrypt after the function runs
        // This is more complex and would require a different approach
        const currentState = get()
        const newState = partial(currentState)
        if (typeof newState === "object" && newState !== null) {
          encryptedPartial = (await encryptObject(newState)) as T | Partial<T>
        } else {
          encryptedPartial = newState
        }
      }

      // Call original set with encrypted data
      return set(encryptedPartial, replace)
    }

    // Note: In a real implementation, you'd also need to decrypt when reading
    // This would require wrapping the get function as well

    return config(setWithEncryption, get, api)
  }
}
