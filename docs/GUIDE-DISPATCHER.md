# Guía del Despachador — GeoLogistics

## Inicio de Sesión

1. Navega a `https://tudominio.com/login`
2. Ingresa tu email y contraseña
3. Serás redirigido al **Panel de Despacho**

---

## Panel Principal (`/dashboard`)

### Vista general
El panel muestra un **mapa interactivo** a la derecha y una **lista de conductores** a la izquierda.

### Conductores (panel izquierdo)
- Cada tarjeta muestra: patente, estado (En Ruta / Idle / Offline), ubicación GPS
- Los conductores **en ruta** tienen indicador verde pulsante
- Los conducts **idle** tienen indicador ámbar
- La lista es virtualizada (funciona con 100+ conductores)

### Mapa (panel derecho)
- **Paradas** aparecen como marcadores numerados (agrupados con clustering)
- **Conductores** aparecen como íconos de camión coloreados por estado
- **Zonas** aparecen como polígonos azules semitransparentes
- El mapa carga paradas por viewport (lazy load) para mayor performance

### Navbar
- **Rutas** → Gestión de rutas diarias
- **Zonas** → Crear/editar zonas de reparto
- **Admin** → Gestionar usuarios y organización
- **Analytics** → Métricas y reportes

---

## Gestión de Rutas (`/dashboard/routes`)

### Crear una ruta
1. Click en **"+ Nueva Ruta"**
2. Selecciona el **conductor** (patente)
3. Selecciona la **zona** de reparto
4. Elige la **fecha**
5. Opcional: distancia y duración estimada
6. Click **"Crear Ruta"**

### Agregar paradas a una ruta
1. Expande la ruta clickando en ella
2. Abajo verás el formulario **"Agregar Parada"**
3. Completa: nombre del cliente, dirección, lat/lng (opcional)
4. Click **"+ Agregar Parada"**
5. Repite para cada parada

### Reordenar paradas
- **Arrastra y suelta** las paradas para cambiar el orden de entrega
- El número de parada se actualiza automáticamente

### Despachar una ruta
- Click **"Despachar"** en la fila de la ruta
- **Validaciones automáticas:**
  - ✅ Debe tener conductor asignado
  - ✅ Debe tener al menos 1 parada
  - ✅ No puede estar ya despachada o completada
- Al despachar, el conductor recibe una **notificación push**

---

## Gestión de Zonas (`/dashboard/zones`)

### Crear una zona
1. Pestaña **"Crear Nueva Zona"**
2. Click **"Dibujar Polígono"**
3. Haz **click** en el mapa para agregar puntos del polígono
4. Haz **doble click** o presiona **"Cerrar Polígono"** para terminar
5. Click **"Guardar Zona"** → escribe un nombre

### Ver zonas existentes
- Pestaña **"Zonas Guardadas"**
- Cada tarjeta muestra un preview del polígono
- Click **"Ver Detalle"** para ver el mapa grande
- Click **"Eliminar Zona"** para borrar

---

## Panel de Admin (`/dashboard/admin`)

### Gestionar Usuarios
- Pestaña **"Usuarios"**
- Lista todos los usuarios de la organización
- Cambiar rol desde el select de cada fila

### Invitar Usuarios
- Pestaña **"Invitaciones"** → click **"+ Nueva Invitación"**
- Ingresa email y selecciona rol
- Comparte el token generado con el usuario invitado

### Configuración
- Pestaña **"Configuración"**
- Ver datos de la organización
- Crear nueva organización si no tienes una

---

## Analytics (`/dashboard/analytics`)

### Métricas disponibles
- **Rutas**: total, completadas, pendientes, tasa de completado
- **Entregas**: total, exitosas, fallidas, tasa de éxito
- **Performance**: distancia promedio, duración promedio
- **Gráfico de barras**: rutas por día

### Filtros
- Selecciona rango de fechas (desde/hasta)
- Click **"Actualizar"**

### Exportar datos
- Click **"Exportar CSV"** en el header
- Descarga archivo con todas las métricas

---

## Atajos de Teclado

| Acción | Atajo |
|---|---|
| Navegar al mapa | Click en el mapa |
| Zoom in/out | Scroll del mouse / pinch |
| Centrar mapa | Botón flotante abajo-derecha |

---

Volver al [README](../README.md)
