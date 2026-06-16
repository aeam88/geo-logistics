# Guía del Conductor — GeoLogistics

## Instalación como App (PWA)

### En Android (Chrome)
1. Abre `https://tudominio.com/login` en Chrome
2. Toca el menú (⋮) → **"Agregar a pantalla de inicio"**
3. Confirma → La app aparece como un ícono en tu celular

### En iPhone (Safari)
1. Abre `https://tudominio.com/login` en Safari
2. Toca el botón de compartir (📤)
3. Selecciona **"Agregar a pantalla de inicio"**
4. Confirma → La app aparece en tu pantalla de inicio

**Importante:** La app funciona **sin internet** después de la primera carga. Puedes entregar paquetes aunque no tengas señal.

---

## Inicio de Sesión

1. Abre la app (ícono en pantalla de inicio)
2. Ingresa tu email y contraseña
3. Serás redirigido a **"Mi Ruta Hoy"**

---

## Pantalla Principal (`/chofer`)

### Sin ruta asignada
Si no tienes ruta para hoy, verás un mensaje indicándolo. Contacta a tu despachador.

### Con ruta asignada
- **Barra de progreso**: Muestra cuántas entregas has completado
- **Lista de paradas**: Cada parada con cliente, dirección y estado
- **Indicador de estado** en el header:
  - `✓ Online` = Conectado
  - `⚡ Offline` = Sin internet (la app sigue funcionando)
  - `🔄 N` = Sincronizando N cambios pendientes
  - `🔔` = Notificaciones push activas

---

## Iniciar Jornada

1. Presiona el botón **"INICIAR RUTA"**
2. La app activará tu GPS automáticamente
3. Tu posición se enviará al despachador en tiempo real
4. El botón cambiará a **"FINALIZAR JORNADA"**

**Nota:** La app funciona sin internet. Si pierdes señal:
- Las entregas se guardan localmente
- Los datos GPS se almacenan en el celular
- Al recuperar señal, se sincronizan automáticamente

---

## Entregar un Paquete

### Paso 1: Seleccionar parada
- Toca la parada que vas a entregar en la lista
- Se abrirá el detalle con: cliente, dirección, peso, ventana horaria

### Paso 2: Capturar evidencia (opcional)
- **Foto**: Toca el ícono de cámara y toma una foto del paquete entregado
- **Firma**: Dibuja la firma del receptor en el recuadro
- **Nombre**: Escribe quién recibió el paquete
- **Notas**: Comentarios adicionales

### Paso 3: Marcar como entregado
- Presiona el botón verde **"Entregado"**
- La parada se marca como completada
- La barra de progreso avanza

### Si no puedes entregar
- Presiona el botón rojo **"Fallido"**
- Selecciona el motivo
- La parada queda registrada como fallida

---

## Modo Offline

La app está diseñada para funcionar **sin conexión a internet**:

### Qué funciona offline
- ✅ Ver tu ruta y paradas
- ✅ Marcar entregas
- ✅ Tomar fotos
- ✅ Capturar firmas
- ✅ Tu GPS sigue funcionando (el navegador tiene GPS propio)

### Qué se sincroniza al recuperar señal
- 🔄 Posiciones GPS acumuladas
- 🔄 Entregas marcadas
- 🔄 Firmas y fotos capturadas

### Indicador de estado
- `⚡ Offline` en el header indica que estás sin señal
- Los cambios se guardan localmente
- Al volver online, se sincronizan automáticamente

---

## Notificaciones Push

Si las notificaciones están activas (🔔 verde en el header):
- Recibirás alertas cuando el despachador te asigne una ruta
- Recibirás recordatorios de entrega
- Al tocar la notificación, se abre la app

Si no están activas (🔔 Off):
- Toca el ícono para activarlas
- Acepta el permiso del navegador

---

## Finalizar Jornada

1. Presiona **"FINALIZAR JORNADA"**
2. Se detiene el envío de GPS
3. Se sincronizan todos los datos pendientes
4. Tu estado cambia a "idle" en el mapa del despachador

---

## Cerrar Sesión

Toca **"Salir"** en la esquina superior derecha.

---

## Solución de Problemas

| Problema | Solución |
|---|---|
| La app no carga | Verifica tu conexión a internet y recarga |
| GPS no funciona | Verifica que hayas dado permiso de ubicación |
| No puedo entregar | Usa el botón "Fallido" y explica el motivo |
| La app se cierra | Vuelve a abrirla desde el ícono de pantalla de inicio |
| No llegan notificaciones | Verifica que estén activadas en la configuración del teléfono |

---

Volver al [README](../README.md)
