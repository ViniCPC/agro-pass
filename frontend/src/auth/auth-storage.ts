const TOKEN_KEY = 'agropass.accessToken'
const USER_KEY = 'agropass.user'
// Accounts of a server demo visit, to switch roles without signing in.
const DEMO_SESSION_KEY = 'agropass.demoSession'

export function getAccessToken() {
  return typeof window === 'undefined' ? null : window.localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser<T>() {
  if (typeof window === 'undefined') return null
  const value = window.localStorage.getItem(USER_KEY)
  if (!value) return null

  try {
    return JSON.parse(value) as T
  } catch {
    clearAuthStorage()
    return null
  }
}

export function setAuthStorage(token: string, user: unknown) {
  window.localStorage.setItem(TOKEN_KEY, token)
  window.localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuthStorage() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(TOKEN_KEY)
  window.localStorage.removeItem(USER_KEY)
  window.localStorage.removeItem(DEMO_SESSION_KEY)
}

export function getStoredDemoSession<T>() {
  if (typeof window === 'undefined') return null
  try {
    const value = window.localStorage.getItem(DEMO_SESSION_KEY)
    return value ? (JSON.parse(value) as T) : null
  } catch {
    return null
  }
}

export function setStoredDemoSession(session: unknown) {
  window.localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session))
}
