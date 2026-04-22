import { ApiRequestError, apiGet, apiPost } from '@renderer/services/apiClient'
import type { AuthSession, LoginMethod } from '@renderer/types/music'

interface LoginProfilePayload {
  userId?: number
  nickname?: string
  avatarUrl?: string
}

interface LoginStatusResponse {
  code: number
  data?: {
    account?: {
      id?: number
    }
    profile?: LoginProfilePayload
  }
}

interface LoginResponse {
  code: number
  cookie?: string
  profile?: LoginProfilePayload
  account?: {
    id?: number
  }
}

function buildSession(
  payload: {
    cookie: string
    profile?: LoginProfilePayload
    accountId?: number
  },
  loginMethod: LoginMethod
): AuthSession {
  return {
    userId: payload.profile?.userId ?? payload.accountId ?? 0,
    nickname: payload.profile?.nickname ?? '网易云用户',
    avatarUrl: payload.profile?.avatarUrl ?? '',
    cookie: payload.cookie,
    loginMethod,
    loginStatus: 'authenticated'
  }
}

export async function loginWithPhone(phone: string, password: string): Promise<AuthSession> {
  const response = await apiPost<LoginResponse>('/login/cellphone', {
    phone,
    password
  })

  if (!response.cookie) {
    throw new ApiRequestError('登录成功，但未返回可用的 Cookie。')
  }

  return buildSession(
    {
      cookie: response.cookie,
      profile: response.profile,
      accountId: response.account?.id
    },
    'phone'
  )
}

export async function loginWithCookie(cookie: string): Promise<AuthSession> {
  const status = await fetchLoginStatus(cookie)

  return buildSession(
    {
      cookie,
      profile: status.data?.profile,
      accountId: status.data?.account?.id
    },
    'cookie'
  )
}

export async function fetchLoginStatus(cookie: string): Promise<LoginStatusResponse> {
  return apiGet<LoginStatusResponse>('/login/status', { cookie, timestamp: Date.now() })
}

export async function validateSession(session: AuthSession): Promise<AuthSession> {
  const status = await fetchLoginStatus(session.cookie)

  const accountId = status.data?.account?.id ?? session.userId
  if (!accountId) {
    throw new ApiRequestError('当前登录态已失效，请重新登录。', 301)
  }

  return buildSession(
    {
      cookie: session.cookie,
      profile: status.data?.profile,
      accountId
    },
    session.loginMethod
  )
}

export async function logout(): Promise<void> {
  try {
    await apiGet('/logout', { timestamp: Date.now() })
  } catch {
    // Ignore logout failures and clear local session anyway.
  }
}
