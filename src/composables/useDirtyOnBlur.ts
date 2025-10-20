import { ref, type Ref, type ComputedRef, unref } from 'vue'

export function useDirtyOnBlur<T>(
  currentValue: Ref<T> | ComputedRef<T>,
  onApply?: () => void | Promise<void>
) {
  const isOpen = ref(false)
  const initialValue = ref<T>()
  const isDirty = ref(false)

  const onShow = () => {
    isOpen.value = true
    isDirty.value = false
    // Clone do valor atual
    initialValue.value = JSON.parse(JSON.stringify(unref(currentValue)))
  }

  const onUpdate = (newValue: T) => {
    if (!isOpen.value) return
    isDirty.value = JSON.stringify(initialValue.value) !== JSON.stringify(newValue)
  }

  const onHide = async () => {
    if (isDirty.value && onApply) {
      await onApply()
    }
    isOpen.value = false
    isDirty.value = false
  }

  return { onShow, onUpdate, onHide, isDirty }
}

