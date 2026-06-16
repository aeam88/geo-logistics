import { authClient } from '../utils/auth'

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  if (to.path === '/login' || to.path === '/register') return

  let session = null
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000)

    const res = await Promise.race([
      authClient.getSession(),
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener('abort', () => reject(new Error('timeout')))
      }),
    ]) as any

    clearTimeout(timeout)
    session = res?.data
  } catch {
    return navigateTo('/login')
  }

  if (!session) {
    return navigateTo('/login')
  }

  const role = (session.user as any).role

  if (to.path === '/') {
    return navigateTo(role === 'driver' ? '/chofer' : '/dashboard')
  }

  if (to.path.startsWith('/chofer') && role !== 'driver') {
    return navigateTo('/dashboard')
  }

  if (to.path.startsWith('/dashboard') && role !== 'dispatcher' && role !== 'admin') {
    return navigateTo('/chofer')
  }
})
