import { sql } from "drizzle-orm";
import { sqliteTable, text, real, integer, index } from "drizzle-orm/sqlite-core";

// 0. ORGANIZACIONES (Multi-tenant)
export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

// 0.1 INVITACIONES
export const invitations = sqliteTable("invitations", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role").notNull(),
  token: text("token").notNull().unique(),
  invitedBy: text("invited_by").notNull().references(() => user.id),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  acceptedAt: integer("accepted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (table) => ({
  orgIdx: index("invitations_org_idx").on(table.organizationId),
  tokenIdx: index("invitations_token_idx").on(table.token),
}));

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  role: text("role").default("driver").notNull(),
  banned: integer("banned", { mode: "boolean" }).default(false),
  banReason: text("ban_reason"),
  banExpires: integer("ban_expires", { mode: "timestamp" }),
}, (table) => ({
  orgIdx: index("user_org_idx").on(table.organizationId),
}));

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// CLIENTES / EMPRESAS B2B
export const clients = sqliteTable("clients", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address"),
  contactPhone: text("contact_phone"),
  taxId: text("tax_id"),
  email: text("email"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
}, (table) => ({
  orgIdx: index("clients_org_idx").on(table.organizationId),
}));

// VEHÍCULOS
export const vehicles = sqliteTable("vehicles", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  plate: text("plate").notNull(),
  type: text("type", { enum: ["camion", "furgon", "moto", "camioneta"] }).default("furgon"),
  capacityKg: real("capacity_kg"),
  status: text("status", { enum: ["active", "maintenance", "retired"] }).default("active").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
}, (table) => ({
  orgIdx: index("vehicles_org_idx").on(table.organizationId),
}));

// CONDUCTORES
export const drivers = sqliteTable("drivers", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  vehicleId: text("vehicle_id").references(() => vehicles.id, { onDelete: "set null" }),
  vehiclePlate: text("vehicle_plate").notNull(),
  status: text("status", { enum: ["idle", "en_ruta", "offline"] }).default("idle").notNull(),
  currentLat: real("current_lat"),
  currentLng: real("current_lng"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
}, (table) => ({
  orgIdx: index("drivers_org_idx").on(table.organizationId),
  userIdIdx: index("drivers_user_id_idx").on(table.userId),
  vehicleIdIdx: index("drivers_vehicle_id_idx").on(table.vehicleId),
  statusIdx: index("drivers_status_idx").on(table.status),
}));

// ZONAS GEOGRÁFICAS
export const dispatchZones = sqliteTable("dispatch_zones", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  geometryJson: text("geometry_json").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
}, (table) => ({
  orgIdx: index("zones_org_idx").on(table.organizationId),
}));

// ÓRDENES DE PEDIDO
export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  clientId: text("client_id").references(() => clients.id, { onDelete: "set null" }),
  routeId: text("route_id").references(() => routes.id, { onDelete: "set null" }),
  referenceCode: text("reference_code"),
  itemsCount: integer("items_count").default(1),
  weightKg: real("weight_kg"),
  priority: text("priority", { enum: ["baja", "normal", "alta", "urgente"] }).default("normal"),
  notes: text("notes"),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryLat: real("delivery_lat"),
  deliveryLng: real("delivery_lng"),
  status: text("status", { enum: ["pendiente", "asignada", "en_ruta", "entregada", "fallida", "cancelada"] }).default("pendiente").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
}, (table) => ({
  orgIdx: index("orders_org_idx").on(table.organizationId),
  clientIdx: index("orders_client_idx").on(table.clientId),
  routeIdx: index("orders_route_idx").on(table.routeId),
  statusIdx: index("orders_status_idx").on(table.status),
}));

// RUTAS DIARIAS
export const routes = sqliteTable("routes", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  driverId: text("driver_id").references(() => drivers.id, { onDelete: "set null" }),
  zoneId: text("zone_id").references(() => dispatchZones.id, { onDelete: "cascade" }),
  optimizedDistanceKm: real("optimized_distance_km"),
  estimatedDurationMins: integer("estimated_duration_mins"),
  date: text("date").notNull(),
  status: text("status", { enum: ["pendiente", "despachada", "completada"] }).default("pendiente").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
}, (table) => ({
  orgIdx: index("routes_org_idx").on(table.organizationId),
  driverIdx: index("routes_driver_idx").on(table.driverId),
  dateIdx: index("routes_date_idx").on(table.date),
}));

// 5. PUNTOS DE ENTREGA (Paradas dentro de una ruta)
export const deliveryStops = sqliteTable("delivery_stops", {
  id: text("id").primaryKey(),
  routeId: text("route_id").references(() => routes.id, { onDelete: "cascade" }),
  orderId: text("order_id").references(() => orders.id, { onDelete: "set null" }),
  clientName: text("client_name").notNull(),
  address: text("address").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  stopOrder: integer("stop_order").notNull(),
  status: text("status", { enum: ["pendiente", "entregado", "fallido"] }).default("pendiente").notNull(),
  timeWindowStart: text("time_window_start"),
  timeWindowEnd: text("time_window_end"),
  deliveredAt: integer("delivered_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
}, (table) => ({
  coordsIdx: index("coords_idx").on(table.lat, table.lng),
  routeIdx: index("route_idx").on(table.routeId),
  orderIdx: index("stops_order_idx").on(table.orderId),
}));

// 6. EVIDENCIAS DE ENTREGA (Foto, firma digital, notas)
export const deliveryEvidences = sqliteTable("delivery_evidences", {
  id: text("id").primaryKey(),
  stopId: text("stop_id").notNull().references(() => deliveryStops.id, { onDelete: "cascade" }),
  photoUrl: text("photo_url"),       // URL o base64 de la foto
  signatureData: text("signature_data"), // SVG path o base64 del canvas
  recipientName: text("recipient_name"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// 8. SUSCRIPCIONES PUSH NOTIFICATION
export const pushSubscriptions = sqliteTable("push_subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: index("push_sub_user_idx").on(table.userId),
}));

// 7. HISTORIAL DE UBICACIONES GPS (Traza completa de movimiento)
export const locationHistory = sqliteTable("location_history", {
  id: text("id").primaryKey(),
  driverId: text("driver_id").notNull().references(() => drivers.id, { onDelete: "cascade" }),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  accuracy: real("accuracy"),
  speed: real("speed"),
  heading: real("heading"),
  recordedAt: integer("recorded_at", { mode: "timestamp" }).notNull(),
}, (table) => ({
  driverRecordedIdx: index("loc_hist_driver_recorded_idx").on(table.driverId, table.recordedAt),
}));