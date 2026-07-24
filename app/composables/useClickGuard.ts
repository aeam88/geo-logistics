import { ref } from 'vue'

export function useClickGuard(minIntervalMs = 1000) {
  const locked = ref(false)

  const guard = async <T>(fn: () => T | Promise<T>): Promise<T | undefined> => {
    if (locked.value) return undefined
    locked.value = true
    try {
      return await fn()
    } finally {
      setTimeout(() => { locked.value = false }, minIntervalMs)
    }
  }

  return { locked, guard }
}
