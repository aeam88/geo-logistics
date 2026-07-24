<template>
  <div class="min-h-screen bg-slate-50 font-sans">
    <header class="h-12 md:h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        </div>
        <span class="font-bold text-sm text-slate-800">Admin Panel</span>
      </div>
      <NuxtLink to="/dashboard" class="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors">← Volver</NuxtLink>
    </header>

    <main class="max-w-5xl mx-auto px-4 py-6">
      <div class="flex gap-2 mb-6 border-b border-gray-200 pb-3">
        <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
          class="px-4 py-2 rounded-lg text-xs font-bold transition-all"
          :class="activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'">
          {{ tab.label }}
        </button>
      </div>

      <div v-if="activeTab === 'users'">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-slate-800">Usuarios de la Empresa</h2>
          <button @click="showInviteModal = true" class="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-500 transition-colors">
            + Invitar Usuario
          </button>
        </div>

        <div class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table class="w-full text-left">
            <thead class="bg-slate-50 border-b border-gray-100">
              <tr>
                <th class="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nombre</th>
                <th class="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</th>
                <th class="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rol</th>
                <th class="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="u in usersList" :key="u.id" class="hover:bg-slate-50 transition-colors">
                <td class="px-5 py-3 text-sm font-semibold text-slate-800">{{ u.name }}</td>
                <td class="px-5 py-3 text-sm text-slate-500">{{ u.email }}</td>
                <td class="px-5 py-3">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                    :class="roleBadge(u.role)">
                    {{ u.role }}
                  </span>
                </td>
                <td class="px-5 py-3">
                  <select v-if="u.id !== currentUserId" @change="changeRole(u.id, ($event.target as HTMLSelectElement).value)"
                    :value="u.role" class="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white">
                    <option value="admin">Admin</option>
                    <option value="dispatcher">Dispatcher</option>
                    <option value="driver">Driver</option>
                    <option value="viewer">Viewer</option>
                    <option value="fleet_manager">Fleet Manager</option>
                  </select>
                  <span v-else class="text-[10px] text-slate-400">Tú</span>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="usersList.length === 0" class="p-8 text-center text-sm text-slate-400">
            No hay usuarios en esta organización
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'invitations'">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-slate-800">Invitaciones Pendientes</h2>
          <button @click="showInviteModal = true" class="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-500 transition-colors">
            + Nueva Invitación
          </button>
        </div>

        <div class="space-y-3">
          <div v-for="inv in pendingInvitations" :key="inv.id" class="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <div class="text-sm font-semibold text-slate-800">{{ inv.email }}</div>
              <div class="text-[10px] text-slate-400">Rol: {{ inv.role }} · Expira: {{ formatDate(inv.expiresAt) }}</div>
            </div>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-600 border border-amber-200">Pendiente</span>
          </div>
          <div v-if="pendingInvitations.length === 0" class="p-8 text-center text-sm text-slate-400">
            No hay invitaciones pendientes
          </div>
        </div>
      </div>
      <div v-if="activeTab === 'settings'">
        <h2 class="text-lg font-bold text-slate-800 mb-4">Configuración de la Empresa</h2>
        <div v-if="currentOrg" class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nombre</label>
            <div class="text-sm font-semibold text-slate-800">{{ currentOrg.name }}</div>
          </div>
          <div>
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Slug</label>
            <div class="text-sm font-mono text-slate-600">{{ currentOrg.slug }}</div>
          </div>
          <div>
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">ID</label>
            <div class="text-[11px] font-mono text-slate-400">{{ currentOrg.id }}</div>
          </div>
        </div>
        <div v-else class="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
          <p class="text-sm text-slate-500 mb-4">No perteneces a ninguna organización todavía.</p>
          <button @click="showCreateOrgModal = true" class="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-500 transition-colors">
            Crear Organización
          </button>
        </div>
      </div>
    </main>

    <div v-if="showInviteModal" class="fixed inset-0 z-9999 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showInviteModal = false"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <h3 class="text-lg font-bold text-slate-800">Invitar Usuario</h3>
        <div>
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Email</label>
          <input v-model="inviteEmail" type="email" placeholder="correo@empresa.com" class="w-full px-3 py-2 rounded-lg bg-slate-50 border border-gray-200 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500">
        </div>
        <div>
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Rol</label>
          <select v-model="inviteRole" class="w-full px-3 py-2 rounded-lg bg-slate-50 border border-gray-200 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="dispatcher">Dispatcher</option>
            <option value="driver">Driver</option>
            <option value="viewer">Viewer (Solo lectura)</option>
            <option value="fleet_manager">Fleet Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div class="flex gap-3 pt-2">
          <button @click="showInviteModal = false" class="flex-1 py-2 rounded-lg text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancelar</button>
          <button @click="sendInvite" :disabled="!inviteEmail || sendingInvite" class="flex-1 py-2 rounded-lg text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors">
            {{ sendingInvite ? 'Enviando...' : 'Enviar Invitación' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showCreateOrgModal" class="fixed inset-0 z-9999 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showCreateOrgModal = false"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <h3 class="text-lg font-bold text-slate-800">Crear Organización</h3>
        <div>
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Nombre</label>
          <input v-model="orgName" type="text" placeholder="Mi Empresa SpA" class="w-full px-3 py-2 rounded-lg bg-slate-50 border border-gray-200 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500">
        </div>
        <div>
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Slug (identificador URL)</label>
          <input v-model="orgSlug" type="text" placeholder="mi-empresa" class="w-full px-3 py-2 rounded-lg bg-slate-50 border border-gray-200 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500">
        </div>
        <div class="flex gap-3 pt-2">
          <button @click="showCreateOrgModal = false" class="flex-1 py-2 rounded-lg text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancelar</button>
          <button @click="createOrg" :disabled="!orgName || !orgSlug || creatingOrg" class="flex-1 py-2 rounded-lg text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors">
            {{ creatingOrg ? 'Creando...' : 'Crear' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { authClient } from '../../../utils/auth';

useHead({ title: 'Admin Panel | GeoLogistics' });

const toast = useToast();

const activeTab = ref<'users' | 'invitations' | 'settings'>('users');
const tabs = [
  { id: 'users' as const, label: 'Usuarios' },
  { id: 'invitations' as const, label: 'Invitaciones' },
  { id: 'settings' as const, label: 'Configuración' },
];

const { data: orgsData, refresh: refreshOrgs } = await useFetch('/api/admin/organizations', {
  headers: import.meta.dev ? { 'x-bypass-auth': 'true' } : {},
});

const currentOrg = computed(() => orgsData.value?.data?.[0] || null);

const { data: usersData, refresh: refreshUsers } = await useFetch('/api/admin/users', {
  headers: import.meta.dev ? { 'x-bypass-auth': 'true' } : {},
});

const usersList = computed(() => usersData.value?.data ?? []);
const currentUserId = ref('');

onMounted(async () => {
  try {
    const { data } = await authClient.getSession();
    if (data?.user?.id) {
      currentUserId.value = data.user.id;
    }
  } catch {}
});

const pendingInvitations = computed<any[]>(() => []);

const showInviteModal = ref(false);
const inviteEmail = ref('');
const inviteRole = ref('driver');
const sendingInvite = ref(false);

const showCreateOrgModal = ref(false);
const orgName = ref('');
const orgSlug = ref('');
const creatingOrg = ref(false);

const sendInvite = async () => {
  if (!inviteEmail.value || !currentOrg.value) return;
  sendingInvite.value = true;
  try {
    await $fetch('/api/admin/invitations', {
      method: 'POST',
      headers: import.meta.dev ? { 'x-bypass-auth': 'true' } : {},
      body: {
        email: inviteEmail.value,
        role: inviteRole.value,
        organizationId: currentOrg.value.id,
      },
    });
    showInviteModal.value = false;
    inviteEmail.value = '';
    toast.add({ title: 'Invitación enviada', description: 'Comparte el token con el usuario.', color: 'success', icon: 'i-lucide-check-circle' });
  } catch (e: any) {
    toast.add({ title: 'Error', description: e?.data?.statusMessage || e.message, color: 'error', icon: 'i-lucide-x-circle' });
  } finally {
    sendingInvite.value = false;
  }
};

const createOrg = async () => {
  if (!orgName.value || !orgSlug.value) return;
  creatingOrg.value = true;
  try {
    const res = await $fetch('/api/admin/organizations', {
      method: 'POST',
      headers: import.meta.dev ? { 'x-bypass-auth': 'true' } : {},
      body: { name: orgName.value, slug: orgSlug.value },
    });

    if (res.success && currentUserId.value) {
      await $fetch('/api/admin/assign-user', {
        method: 'POST',
        headers: import.meta.dev ? { 'x-bypass-auth': 'true' } : {},
        body: {
          userId: currentUserId.value,
          organizationId: (res.data as any).id,
          role: 'admin',
        },
      });
    }

    showCreateOrgModal.value = false;
    orgName.value = '';
    orgSlug.value = '';
    refreshOrgs();
  } catch (e: any) {
    toast.add({ title: 'Error', description: e?.data?.statusMessage || e.message, color: 'error', icon: 'i-lucide-x-circle' });
  } finally {
    creatingOrg.value = false;
  }
};

const changeRole = async (userId: string, newRole: string) => {
  try {
    await $fetch('/api/admin/assign-user', {
      method: 'POST',
      headers: import.meta.dev ? { 'x-bypass-auth': 'true' } : {},
      body: { userId, organizationId: currentOrg.value?.id, role: newRole },
    });
    refreshUsers();
    toast.add({ title: 'Rol actualizado', color: 'success', icon: 'i-lucide-check-circle' });
  } catch (e: any) {
    toast.add({ title: 'Error', description: e?.data?.statusMessage || e.message, color: 'error', icon: 'i-lucide-x-circle' });
  }
};

const roleBadge = (role: string) => {
  const badges: Record<string, string> = {
    admin: 'bg-rose-100 text-rose-700 border border-rose-200',
    dispatcher: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
    driver: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    viewer: 'bg-slate-100 text-slate-600 border border-slate-200',
    fleet_manager: 'bg-amber-100 text-amber-700 border border-amber-200',
  };
  return badges[role] || 'bg-slate-100 text-slate-600 border border-slate-200';
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
};
</script>
