# Guía de Deployment — GeoLogistics (Vercel)

## Requisitos Previos

- Node.js 20+
- Cuenta en [Turso](https://turso.tech/) con database creada
- Cuenta en [Vercel](https://vercel.com/)
- VAPID keys para push notifications

## 1. Preparar Variables de Entorno

Las variables se configuran en el dashboard de Vercel (Settings → Environment Variables):

```bash
# Base de datos Turso Cloud
DATABASE_URL=libsql://tu-base.turso.io
DATABASE_AUTH_TOKEN=tu_token_de_turso

# Better Auth
BETTER_AUTH_URL=https://tu-app.vercel.app
BETTER_AUTH_SECRET=string_largo_y_aleatorio_minimo_32_caracteres

# Push Notifications
VAPID_PUBLIC_KEY=tu_public_key
VAPID_PRIVATE_KEY=tu_private_key

# CORS
ALLOWED_ORIGIN=https://tu-app.vercel.app
```

**Generar VAPID keys:**
```bash
npx web-push generate-vapid-keys
```

## 2. Aplicar Migraciones a Turso Cloud

```bash
# Generar migraciones
npx drizzle-kit generate

# Aplicar a Turso Cloud
npx drizzle-kit migrate

# O usar el script
npx tsx scripts/apply-migrations.ts

# Seed de datos iniciales (opcional)
curl -X POST https://tu-app.vercel.app/api/seed
```

## 3. Deploy a Vercel

### Opción A: Vercel CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Opción B: Git Integration (recomendado)
1. Sube el código a GitHub/GitLab
2. Conecta el repo en [vercel.com/new](https://vercel.com/new)
3. Vercel detecta automáticamente Nuxt 4
4. Configura las variables de entorno en el dashboard
5. Cada push a `main` hace deploy automático

## 4. Configurar en Vercel Dashboard

### Build Settings
| Setting | Valor |
|---|---|
| Framework | Nuxt.js |
| Build Command | `npx nuxt build` |
| Output Directory | `.output` |
| Install Command | `npm install` |

### Node.js Version
- **20.x** (recomendado)

### Environment Variables
Configurar todas las variables en **Production**, **Preview**, y **Development** según el entorno.

## 5. Verificar Deployment

```bash
# Verificar que la app responde
curl https://tu-app.vercel.app/

# Verificar API
curl https://tu-app.vercel.app/api/dashboard

# Verificar auth
curl https://tu-app.vercel.app/api/auth/session
```

## 6. Configuración Post-Deploy

### Dominio Personalizado
1. Vercel Dashboard → Settings → Domains
2. Agrega tu dominio
3. Configura DNS (CNAME o A Record)

### HTTPS
Vercel maneja SSL automáticamente para todos los dominios.

### Logs
Vercel Dashboard → Logs para ver errores en tiempo real.

## Variables de Entorno Resumen

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | Sí | URL de Turso Cloud |
| `DATABASE_AUTH_TOKEN` | Sí | Token de Turso |
| `BETTER_AUTH_URL` | Sí | URL de la app en Vercel |
| `BETTER_AUTH_SECRET` | Sí | Secret de Better Auth |
| `VAPID_PUBLIC_KEY` | Sí | Para push notifications |
| `VAPID_PRIVATE_KEY` | Sí | Para push notifications |
| `ALLOWED_ORIGIN` | No | Dominio para CORS |

---

Volver al [README](../README.md)
