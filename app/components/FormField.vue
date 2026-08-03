<template>
  <div>
    <label class="block text-sm font-semibold text-slate-300 mb-1.5">{{ label }}</label>
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      class="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors"
      :class="$attrs.class"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
  label: string
  type?: string
  placeholder?: string
  disabled?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
