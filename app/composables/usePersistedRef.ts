import { ref, watch } from 'vue'

export function usePersistedRef<T>(key: string, defaultValue: T) {
  if (import.meta.server) return ref(defaultValue)

  const stored = localStorage.getItem(key)
  const initial = stored !== null ? (JSON.parse(stored) as T) : defaultValue

  const data = ref(initial) as any

  watch(data, (val) => {
    localStorage.setItem(key, JSON.stringify(val))
  }, { deep: true })

  return data
}
