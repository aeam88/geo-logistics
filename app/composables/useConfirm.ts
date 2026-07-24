import { ref } from 'vue'

interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  confirmColor?: 'error' | 'primary' | 'warning' | 'success'
}

const isOpen = ref(false)
const options = ref<ConfirmOptions>({ title: '' })
let resolvePromise: ((value: boolean) => void) | null = null

export function useConfirm() {
  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    options.value = {
      confirmLabel: 'Confirmar',
      cancelLabel: 'Cancelar',
      confirmColor: 'error',
      ...opts,
    }
    isOpen.value = true

    return new Promise<boolean>((resolve) => {
      resolvePromise = resolve
    })
  }

  const onConfirm = () => {
    isOpen.value = false
    resolvePromise?.(true)
    resolvePromise = null
  }

  const onCancel = () => {
    isOpen.value = false
    resolvePromise?.(false)
    resolvePromise = null
  }

  return { isOpen, options, confirm, onConfirm, onCancel }
}
