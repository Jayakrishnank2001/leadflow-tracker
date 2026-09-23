import { vi } from 'vitest'

export interface StubbedResponse {
  ok: boolean
  status: number
  json: () => Promise<unknown>
}

/** Minimal stand-in for a `Response` — enough for what `lib/api.ts` uses. */
export function jsonResponse(body: unknown, status = 200): StubbedResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

/** Simulates a non-JSON error body (e.g. an HTML error page from a proxy). */
export function unparsableResponse(status: number): StubbedResponse {
  return {
    ok: false,
    status,
    json: async () => {
      throw new Error('Unexpected token < in JSON')
    },
  }
}

/** Replaces global fetch with a stub and returns the mock for assertions. */
export function stubFetch(
  response: StubbedResponse | ((url: string, init?: RequestInit) => StubbedResponse),
) {
  const mock = vi.fn(async (url: string, init?: RequestInit) =>
    typeof response === 'function' ? response(url, init) : response,
  )
  vi.stubGlobal('fetch', mock)
  return mock
}
