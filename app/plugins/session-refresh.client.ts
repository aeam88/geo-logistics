import { useSessionRefresh } from '../utils/sessionRefresh'

export default defineNuxtPlugin(() => {
  if (import.meta.server) return

  const { startPolling, stopPolling } = useSessionRefresh()
  startPolling()

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => stopPolling())
  }
})
