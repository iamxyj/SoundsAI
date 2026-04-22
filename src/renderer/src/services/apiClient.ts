import type { ApiErrorPayload } from '@renderer/types/music'
import { readStorage, writeStorage } from '@renderer/utils/storage'

const API_BASE_URL_KEY = 'sounds-ai/api-base-url'

let apiBaseUrl = readStorage<string>(API_BASE_URL_KEY, 'http://127.0.0.1:3000')
let authCookie = ''

export class ApiRequestError extends Error {
  code?: number

  constructor(message: string, code?: number) {
    super(message)
    this.name = 'ApiRequestError'
    this.code = code
  }
}

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(`${normalizeBaseUrl(apiBaseUrl)}${path}`)
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    url.searchParams.set(key, String(value))
  })
  if (authCookie && !url.searchParams.has('cookie')) {
    url.searchParams.set('cookie', authCookie)
  }
  return url.toString()
}

async function parseResponse<T>(response: Response): Promise<T> {
  let payload: (T & ApiErrorPayload) | null = null

  try {
    payload = (await response.json()) as T & ApiErrorPayload
  } catch {
    throw new ApiRequestError('服务返回了无法解析的数据。')
  }

  if (!response.ok) {
    throw new ApiRequestError(payload.message || payload.msg || '请求失败。', response.status)
  }

  if (typeof payload.code === 'number' && ![200, 801, 803].includes(payload.code)) {
    throw new ApiRequestError(payload.message || payload.msg || '接口返回异常。', payload.code)
  }

  return payload as T
}

export function configureApiClient(options: { baseUrl?: string; cookie?: string }): void {
  if (options.baseUrl) {
    apiBaseUrl = normalizeBaseUrl(options.baseUrl)
    writeStorage(API_BASE_URL_KEY, apiBaseUrl)
  }

  if (typeof options.cookie === 'string') {
    authCookie = options.cookie
  }
}

export function getApiBaseUrl(): string {
  return apiBaseUrl
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  const response = await fetch(buildUrl(path, params), {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  })

  return parseResponse<T>(response)
}

export async function apiPost<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  const body = new URLSearchParams()

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    body.set(key, String(value))
  })

  if (authCookie && !body.has('cookie')) {
    body.set('cookie', authCookie)
  }

  const response = await fetch(buildUrl(path), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    },
    body
  })

  return parseResponse<T>(response)
}
