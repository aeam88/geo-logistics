import { authClient } from './auth'

const REFRESH_INTERVAL_MS = 5 * 60 * 1000
let refreshTimer: ReturnType<typeof setInterval> | null = null
let isRefreshing = false

async function tryRefresh(): Promise<boolean> {
  if (isRefreshing) return false
  isRefreshing = true
  try {
    const { data } = await authClient.getSession()
    isRefreshing = false
    return !!data?.user
  } catch {
    isRefreshing = false
    return false
  }
}

export function useSessionRefresh() {
  const startPolling = () => {
    if (refreshTimer) return
    refreshTimer = setInterval(async () => {
      const valid = await tryRefresh()
      if (!valid) {
        stopPolling()
        await navigateTo('/login')
      }
    }, REFRESH_INTERVAL_MS)
  }

  const stopPolling = () => {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }

  return { startPolling, stopPolling }
}

export async function fetchWithRetry<T>(
  url: string,
  opts: Record<string, any> = {}
): Promise<any> {
  try {
        return await $fetch(url, opts) as any
  } catch (err: any) {
    if (err?.statusCode === 401 || err?.status === 401) {
      const recovered = await tryRefresh()
      if (recovered) {
        return await $fetch(url, opts) as any
      }
      await navigateTo('/login')
      throw err
    }
    throw err
  }
}
