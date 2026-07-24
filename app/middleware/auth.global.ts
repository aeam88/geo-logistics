import { authClient } from '../utils/auth'

const PUBLIC_ROUTES = ['/login', '/register']

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const isPublicRoute = PUBLIC_ROUTES.includes(to.path)

  let session = null
  let timedOut = false
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
    session = res?.data ?? null
  } catch {
    timedOut = true
  }

  // Timed out → allow navigation, server-side guards protect API calls
  if (timedOut) {
    return
  }

  // Has valid session
  if (session?.user) {
    const role = (session.user as any).role

    // Logged-in users should not see login/register
    if (isPublicRoute) {
      return navigateTo(role === 'driver' ? '/chofer' : '/dashboard')
    }

    if (to.path === '/') {
      return navigateTo(role === 'driver' ? '/chofer' : '/dashboard')
    }

    if (to.path.startsWith('/chofer') && role !== 'driver') {
      return navigateTo('/dashboard')
    }

    if (to.path.startsWith('/dashboard') && role !== 'dispatcher' && role !== 'admin') {
      return navigateTo('/chofer')
    }

    return
  }

  // No session and trying to access a protected route
  if (!isPublicRoute) {
    return navigateTo('/login')
  }
})
