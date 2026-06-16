# Geo-Logistics Optimizer (B2B Fleet Tracker) 🚚📍

Una plataforma SaaS de logística y optimización de rutas B2B diseñada para correr en el *Edge*. Permite a los despachadores monitorear flotas en tiempo real a través de mapas interactivos, mientras que los conductores transmiten su telemetría GPS desde una experiencia móvil PWA simplificada que funciona sin conexión a internet.

## 🚀 Stack Tecnológico

| Componente | Tecnología |
|---|---|
| **Framework** | [Nuxt 4](https://nuxt.com/) (SSR híbrido, estructura modular `app/`) |
| **Base de Datos** | [Turso](https://turso.tech/) (SQLite distribuida en el Edge) |
| **ORM** | [Drizzle ORM](https://orm.drizzle.team/) (Tipado estricto en TypeScript) |
| **Autenticación** | [Better Auth](https://www.better-auth.com/) (Plugin Admin, RBAC) |
| **Mapas** | [Leaflet](https://leafletjs.com/) + MarkerCluster + Drawing |
| **Tiempo Real** | Server-Sent Events (SSE) nativos en Nitro |
| **PWA** | Service Worker + IndexedDB + Background Sync |
| **Push Notifications** | Web Push API + VAPID keys |
| **UI** | Tailwind CSS v4 + @nuxt/ui |

---

## 🏗️ Arquitectura

### Multi-tenant
Cada empresa logística es un tenant aislado con `organizationId` en todas las tablas. Los usuarios tienen roles granulares (`admin`, `dispatcher`, `driver`, `fleet_manager`, `viewer`).

### Tiempo Real
SSE unidireccional para transmitir GPS de conductores a despachadores. Bus de eventos en memoria con timeout de 2 segundos en auth para evitar cuelgues.

### GIS sin PostGIS
Polígonos de reparto serializados como GeoJSON en campos `text`. Fórmula de Haversine inyectada en Drizzle para búsquedas de proximidad.

### PWA Offline-First
Service Worker con cache strategies (network-first para API, cache-first para assets). IndexedDB para almacenar ruta del día. Cola de sincronización para GPS y entregas offline.

---

## 🛠️ Estructura del Proyecto

```text
├── app/
│   ├── components/
│   │   ├── MapCore.client.vue           # Mapa Leaflet con clustering y lazy load
│   │   ├── ZoneEditor.client.vue        # Editor de zonas con dibujo de polígonos
│   │   ├── ZoneMapPreview.client.vue    # Preview de zonas en tarjetas
│   │   └── SignaturePad.client.vue      # Canvas de firma digital
│   ├── composables/
│   │   ├── useGpsTracker.ts            # GPS con throttling (50m / 10s)
│   │   ├── useGpsBatcher.ts            # Batch de historial GPS cada 30s
│   │   └── usePushNotifications.ts     # Suscripción a push notifications
│   ├── middleware/
│   │   └── auth.global.ts              # RBAC: redirige según rol
│   ├── pages/
│   │   ├── login.vue / register.vue    # Autenticación con Better Auth
│   │   ├── dashboard/
│   │   │   ├── index.vue               # Panel principal (mapa + conductores)
│   │   │   ├── routes/index.vue        # Gestión de rutas con drag & drop
│   │   │   ├── zones/index.vue         # Gestión de zonas con Leaflet Draw
│   │   │   ├── admin/index.vue         # Panel admin (usuarios, organizaciones)
│   │   │   └── analytics/index.vue     # Métricas y reportes
│   │   └── chofer/index.vue            # App del conductor (PWA offline)
│   └── utils/
│       ├── offlineStorage.ts           # IndexedDB para modo offline
│       └── auth.ts                     # Cliente Better Auth
├── server/
│   ├── api/
│   │   ├── auth/[...all].ts            # Better Auth catch-all
│   │   ├── dashboard/
│   │   │   ├── index.get.ts            # Datos del dashboard (zonas, paradas, conductores)
│   │   │   └── analytics.get.ts        # Métricas de flota
│   │   ├── drivers/
│   │   │   ├── update.post.ts          # Real-time: actualiza posición
│   │   │   ├── stream.get.ts           # SSE: transmite GPS a despachadores
│   │   │   ├── my-route.get.ts         # Ruta del día del conductor
│   │   │   ├── history/batch.post.ts   # Batch insert de historial GPS
│   │   │   ├── paginated.get.ts        # Conductores paginados
│   │   │   └── register.post.ts        # Registro de conductor con patente
│   │   ├── routes/
│   │   │   ├── index.get.ts / .post.ts # CRUD de rutas
│   │   │   ├── [id].get.ts / .put.ts   # Detalle y actualización
│   │   │   ├── [id]/stops.get.ts / .post.ts  # Paradas de una ruta
│   │   │   ├── [id]/reorder.put.ts     # Reordenar paradas
│   │   │   └── [id]/stops.post.ts      # Agregar parada a ruta
│   │   ├── stops/
│   │   │   ├── viewport.get.ts         # Paradas visibles en el mapa (lazy load)
│   │   │   ├── [id]/deliver.post.ts    # Marcar entrega + evidencia
│   │   │   └── [id]/fail.post.ts       # Marcar falla
│   │   ├── zones/                      # CRUD de zonas GeoJSON
│   │   ├── orders/                     # CRUD de órdenes de pedido
│   │   ├── clients/                    # CRUD de clientes B2B
│   │   ├── vehicles/                   # CRUD de vehículos
│   │   ├── push/                       # Push notifications (subscribe, vapid-key)
│   │   ├── invitations/               # Aceptar invitación a organización
│   │   ├── webhooks/turso.post.ts      # Webhook de Turso Cloud
│   │   ├── admin/
│   │   │   ├── organizations/          # CRUD de organizaciones
│   │   │   ├── invitations/            # Crear invitaciones
│   │   │   ├── assign-user.post.ts     # Asignar usuario a organización
│   │   │   ├── users.get.ts            # Listar usuarios
│   │   │   └── archive-gps.post.ts     # Archivar historial GPS antiguo
│   │   └── seed.post.ts               # Seed de datos de desarrollo
│   ├── db/
│   │   ├── schema.ts                   # 16 tablas Drizzle
│   │   └── migrations/                 # Migraciones SQL generadas
│   ├── tasks/
│   │   └── archive-gps.ts             # Cron job diario de archivado
│   └── utils/
│       ├── auth.ts                     # Better Auth config
│       ├── guards.ts                   # Auth con timeout de 2s
│       ├── tenant.ts                   # Contexto multi-tenant
│       ├── telemetry.ts               # Bus de eventos SSE
│       ├── rateLimit.ts               # Rate limiting en memoria
│       ├── zonesCache.ts              # Cache de zonas con TTL 1h
│       ├── gpsArchive.ts             # Archivado de GPS antiguo
│       ├── pushNotifications.ts       # Envío de push notifications
│       ├── seed.ts                    # Seed de desarrollo
│       └── db.ts                      # Cliente libSQL
├── public/
│   ├── sw.js                          # Service Worker (offline + cache + push)
│   ├── manifest.json                  # PWA manifest
│   └── icon-*.svg                     # Iconos PWA
├── tests/
│   └── telemetry.test.ts             # Tests del bus de telemetría
└── scripts/
    ├── apply-migrations.ts           # Aplicar migraciones a Turso Cloud
    └── check-db.ts                   # Verificar conexión a DB
```

---

## 📊 Modelo de Datos (16 tablas)

### Auth & Organización
- `user` — Usuarios con `organizationId` y `role`
- `session`, `account`, `verification` — Better Auth
- `organizations` — Empresas/tenants
- `invitations` — Invitaciones con token

### Logística
- `drivers` — Conductores con vehículo y posición actual
- `vehicles` — Vehículos separados del conductor
- `routes` — Rutas diarias con estado
- `deliveryStops` — Paradas de entrega ordenadas
- `orders` — Órdenes de pedido B2B
- `clients` — Clientes de la empresa
- `dispatchZones` — Polígonos GeoJSON de zonas

### Telemetría & Evidencia
- `locationHistory` — Historial GPS (archivado cada 90 días)
- `deliveryEvidences` — Foto + firma digital + notas
- `pushSubscriptions` — Suscripciones push por usuario

---

## 🚀 Comandos

```bash
# Instalar dependencias
npm install

# Turso local
npm run dev:db

# Desarrollo
npm run dev

# Generar migraciones
npm run db:generate

# Aplicar migraciones
npm run db:migrate

# Seed de desarrollo (POST /api/seed)
npm run db:seed

# Tests
npm test

# Build producción
npm run build

# Deploy a Vercel
npx vercel --prod
```

---

## 🔄 Variables de Entorno (.env)

```bash
# Base de datos
NODE_ENV=development
DATABASE_URL=http://127.0.0.1:8080
DATABASE_AUTH_TOKEN=

# Better Auth
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=tu_secret_aqui

# Push Notifications (VAPID)
VAPID_PUBLIC_KEY=tu_public_key
VAPID_PRIVATE_KEY=tu_private_key
```

---

## 📱 Funcionalidades

### Panel del Despachador (`/dashboard`)
- Mapa interactivo con clustering de marcadores
- Lazy load de paradas por viewport
- Gestión de rutas con drag & drop
- Creación de zonas con Leaflet Draw
- Panel de admin multi-tenant
- Analytics y exportación CSV

### App del Conductor (`/chofer`)
- PWA instalable (funciona sin internet)
- Ruta del día con lista de paradas
- Captura de evidencia: foto + firma digital
- GPS con throttling (50m / 10s)
- Batch de historial GPS cada 30s
- Modo offline con sincronización automática
- Push notifications

### Multi-tenant
- Organizaciones aisladas
- Invitaciones con token
- Roles: admin, dispatcher, driver, fleet_manager, viewer

---

## 🏁 Fases de Desarrollo

| Fase | Estado | Descripción |
|---|---|---|
| **F1** | ✅ | Fundamentos: Auth, guards, schema, seed, tests, rate limit |
| **F2** | ✅ | Core: CRUD completo, rutas, paradas, zonas, firma digital |
| **F3** | ✅ | Performance: Throttling GPS, batching, clustering, cache, paginación |
| **F4** | ✅ | Multi-tenant: Organizaciones, invitaciones, admin panel |
| **F5** | ✅ | PWA: Offline, IndexedDB, background sync, push notifications |
| **F6** | ✅ | Analytics: Métricas de flota, exportación CSV |
| **F7** | ⏳ | DevOps: Docker, tests E2E, deploy, monitoreo |
