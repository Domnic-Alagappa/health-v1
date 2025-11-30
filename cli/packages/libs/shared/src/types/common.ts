/**
 * Common utility types
 */

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export interface RequestConfig {
  method?: HttpMethod
  headers?: Record<string, string>
  body?: unknown
  timeout?: number
  signal?: AbortSignal
}

