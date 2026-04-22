import { computed, reactive } from 'vue'
import {
  configureApiClient,
  getApiBaseUrl
} from '@renderer/services/apiClient'
import {
  loginWithCookie,
  loginWithPhone,
  logout as logoutRequest,
  validateSession
} from '@renderer/services/authService'
import type { AuthSession, LoginMethod, LoginStatus } from '@renderer/types/music'
import { readStorage, removeStorage, writeStorage } from '@renderer/utils/storage'

const SESSION_KEY = 'sounds-ai/auth-session'

interface AuthState {
  baseUrl: string
  session: AuthSession | null
  loginStatus: LoginStatus
  loading: boolean
  error: string | null
}

const persistedSession = readStorage<AuthSession | null>(SESSION_KEY, null)

const state = reactive<AuthState>({
  baseUrl: getApiBaseUrl(),
  session: persistedSession,
  loginStatus: persistedSession?.loginStatus ?? 'anonymous',
  loading: false,
  error: null
})

configureApiClient({
  baseUrl: state.baseUrl,
  cookie: state.session?.cookie ?? ''
})

function persistSession(session: AuthSession | null): void {
  state.session = session
  if (session) {
    writeStorage(SESSION_KEY, session)
  } else {
    removeStorage(SESSION_KEY)
  }
}

async function completeLogin(loginMethod: LoginMethod, payload: Promise<AuthSession>): Promise<void> {
  state.loading = true
  state.error = null

  try {
    const session = await payload
    session.loginMethod = loginMethod
    session.loginStatus = 'authenticated'
    configureApiClient({
      baseUrl: state.baseUrl,
      cookie: session.cookie
    })
    persistSession(session)
    state.loginStatus = 'authenticated'
  } catch (error) {
    persistSession(null)
    configureApiClient({ cookie: '' })
    state.loginStatus = 'error'
    state.error = error instanceof Error ? error.message : '登录失败，请稍后重试。'
    throw error
  } finally {
    state.loading = false
  }
}

export function useAuthStore() {
  const isAuthenticated = computed(() => state.loginStatus === 'authenticated' && !!state.session)

  async function restoreSession(): Promise<void> {
    if (!state.session) {
      state.loginStatus = 'anonymous'
      return
    }

    state.loading = true
    state.error = null
    state.loginStatus = 'restoring'

    try {
      const session = await validateSession(state.session)
      configureApiClient({
        baseUrl: state.baseUrl,
        cookie: session.cookie
      })
      persistSession(session)
      state.loginStatus = 'authenticated'
    } catch (error) {
      persistSession(null)
      configureApiClient({ cookie: '' })
      state.loginStatus = 'expired'
      state.error = error instanceof Error ? error.message : '登录态已失效，请重新登录。'
    } finally {
      state.loading = false
    }
  }

  function setBaseUrl(baseUrl: string): void {
    state.baseUrl = baseUrl.trim()
    configureApiClient({
      baseUrl: state.baseUrl,
      cookie: state.session?.cookie ?? ''
    })
  }

  async function signInWithPhone(phone: string, password: string): Promise<void> {
    return completeLogin('phone', loginWithPhone(phone, password))
  }

  async function signInWithCookie(cookie: string): Promise<void> {
    return completeLogin('cookie', loginWithCookie(cookie))
  }

  async function signOut(): Promise<void> {
    state.loading = true
    state.error = null
    try {
      await logoutRequest()
    } finally {
      persistSession(null)
      configureApiClient({ baseUrl: state.baseUrl, cookie: '' })
      state.loginStatus = 'anonymous'
      state.loading = false
    }
  }

  return {
    state,
    isAuthenticated,
    restoreSession,
    setBaseUrl,
    signInWithPhone,
    signInWithCookie,
    signOut
  }
}
