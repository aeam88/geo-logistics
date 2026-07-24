<template>
  <div class="min-h-screen bg-slate-900 flex items-center justify-center p-4">
    <ClientOnly>
    <div class="w-full max-w-md">
      <div class="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-xl">
        <div class="text-center mb-8">
          <div class="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-white">GeoLogistics</h1>
          <p class="text-slate-400 text-sm mt-1">Panel de Control de Flota</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label class="block text-sm font-semibold text-slate-300 mb-1.5">Email</label>
            <input
              v-model="email"
              type="email"
              placeholder="tu@email.com"
              class="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors"
              :disabled="loading"
            />
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-300 mb-1.5">Contraseña</label>
            <input
              v-model="password"
              type="password"
              placeholder="••••••••"
              class="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors"
              :disabled="loading"
            />
          </div>

          <div v-if="error" class="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3 rounded-lg font-bold text-base bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <div v-if="loading" class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            {{ loading ? 'Ingresando...' : 'Iniciar Sesión' }}
          </button>
        </form>

        <p class="text-center mt-6 text-sm text-slate-500">
          ¿No tienes cuenta?
          <NuxtLink to="/register" class="text-indigo-400 hover:text-indigo-300 font-semibold">
            Registrarse
          </NuxtLink>
        </p>
      </div>
    </div>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { authClient } from '../utils/auth'

definePageMeta({
  title: 'Iniciar Sesión',
})

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  error.value = ''
  loading.value = true

  try {
    const { data, error: authError } = await authClient.signIn.email({
      email: email.value,
      password: password.value,
    })

    if (authError) {
      error.value = authError.message || 'Credenciales inválidas'
      return
    }

    if (data?.user) {
      const role = (data.user as any).role
      if (role === 'driver' || role === 'dispatcher' || role === 'admin') {
        await navigateTo(role === 'driver' ? '/chofer' : '/dashboard')
      } else {
        await navigateTo('/')
      }
    }
  } catch (e: any) {
    error.value = e?.message || 'Error al iniciar sesión'
  } finally {
    loading.value = false
  }
}
</script>
