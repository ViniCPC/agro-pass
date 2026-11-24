const TOKEN_KEY = 'agropass.accessToken'
const USER_KEY = 'agropass.user'

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
}
