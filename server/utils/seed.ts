import { db } from "../db";
import { eq } from "drizzle-orm";
import { auth } from "./auth";
import {
  organizations,
  user,
  clients,
  vehicles,
  drivers,
  dispatchZones,
  orders,
  routes,
  deliveryStops,
  locationHistory,
} from "../db/schema";

export async function runSeed() {
  console.log("[SEED] Starting development seed...");

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0]!;

  console.log("[SEED] Cleaning existing data...");
  await db.delete(locationHistory);
  await db.delete(deliveryStops);
  await db.delete(routes);
  await db.delete(orders);
  await db.delete(drivers);
  await db.delete(dispatchZones);
  await db.delete(clients);
  await db.delete(vehicles);
  await db.delete(user);
  await db.delete(organizations);
  console.log("[SEED] Clean done");

  const orgId = crypto.randomUUID();
  await db.insert(organizations).values({
    id: orgId,
    name: "GeoLogistics Demo",
    slug: "demo",
    address: "Av. Apoquindo 3000, Las Condes",
    phone: "+56 2 2100 1234",
    email: "demo@geologistics.cl",
    createdAt: now,
    updatedAt: now,
  });
  console.log("[SEED] Created organization: GeoLogistics Demo");

  const clientData = [
    { name: "Distribuidora El Sol", address: "Av. Kennedy 8900, Las Condes", phone: "+56 2 2345 6789", tax: "76.123.456-7" },
    { name: "Supermercados Unimarc", address: "Av. Libertador Bernardo O'Higgins 1234", phone: "+56 2 2100 3000", tax: "77.765.432-1" },
    { name: "Ferretería Norte Grande", address: "Av. Recoleta 3456", phone: "+56 2 2734 5678", tax: "78.901.234-5" },
    { name: "Restaurantes Doña Juanita", address: "Av. Providencia 4567", phone: "+56 2 2345 9000", tax: "79.876.543-2" },
    { name: "Electro Hogar Spa", address: "Av. Las Condes 7890", phone: "+56 2 2100 4500", tax: "80.123.987-6" },
  ];

  const clientIds: string[] = [];
  for (const c of clientData) {
    const id = crypto.randomUUID();
    clientIds.push(id);
    await db.insert(clients).values({
      id,
      organizationId: orgId,
      name: c.name,
      address: c.address,
      contactPhone: c.phone,
      taxId: c.tax,
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log("[SEED] Created 5 clients");

  const vehicleData = [
    { plate: "FL-99-PT", type: "furgon" as const, capacity: 1500 },
    { plate: "BJ-77-KL", type: "camioneta" as const, capacity: 800 },
    { plate: "CR-44-MN", type: "camion" as const, capacity: 5000 },
    { plate: "DP-22-XZ", type: "furgon" as const, capacity: 1200 },
    { plate: "GT-11-AA", type: "moto" as const, capacity: 50 },
  ];

  const vehicleIds: string[] = [];
  for (const v of vehicleData) {
    const id = crypto.randomUUID();
    vehicleIds.push(id);
    await db.insert(vehicles).values({
      id,
      organizationId: orgId,
      plate: v.plate,
      type: v.type,
      capacityKg: v.capacity,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log("[SEED] Created 5 vehicles");

  const zoneCentroId = crypto.randomUUID();
  const zoneNorteId = crypto.randomUUID();

  await db.insert(dispatchZones).values([
    {
      id: zoneCentroId,
      organizationId: orgId,
      name: "Zona Centro - Santiago",
      geometryJson: JSON.stringify({
        type: "Polygon",
        coordinates: [
          [
            [-70.68, -33.47],
            [-70.62, -33.47],
            [-70.62, -33.43],
            [-70.68, -33.43],
            [-70.68, -33.47],
          ],
        ],
      }),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: zoneNorteId,
      organizationId: orgId,
      name: "Zona Norte - Santiago",
      geometryJson: JSON.stringify({
        type: "Polygon",
        coordinates: [
          [
            [-70.68, -33.43],
            [-70.62, -33.43],
            [-70.62, -33.39],
            [-70.68, -33.39],
            [-70.68, -33.43],
          ],
        ],
      }),
      createdAt: now,
      updatedAt: now,
    },
  ]);
  console.log("[SEED] Created 2 dispatch zones");

  const userData = [
    { name: "Carlos Conductor", email: "driver@demo.cl", role: "driver" as const },
    { name: "María Despachadora", email: "dispatcher@demo.cl", role: "dispatcher" as const },
    { name: "Pedro Admin", email: "admin@demo.cl", role: "admin" as const },
    { name: "Ana Viewer", email: "viewer@demo.cl", role: "viewer" as const },
    { name: "Luis Fleet", email: "fleet@demo.cl", role: "fleet_manager" as const },
  ];

  const defaultPassword = "demo1234";
  const userIds: string[] = [];

  for (const u of userData) {
    try {
      const response = await auth.handler(
        new Request("http://localhost/api/auth/sign-up/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: u.email,
            password: defaultPassword,
            name: u.name,
          }),
        })
      );

      const body = await response.json();
      const userId = body?.user?.id;

      if (userId) {
        userIds.push(userId);
        await db.update(user)
          .set({ organizationId: orgId, role: u.role })
          .where(eq(user.id, userId));
        console.log(`[SEED] Created user: ${u.email} -> ${userId}`);
      } else {
        console.error(`[SEED] No userId for ${u.email}:`, body);
        userIds.push(crypto.randomUUID());
      }
    } catch (err: any) {
      console.log(`[SEED] User ${u.email} error:`, err.message?.substring(0, 80));
      const existing = await db.query.user.findFirst({
        where: (t, { eq }) => eq(t.email, u.email),
      });
      if (existing) {
        userIds.push(existing.id);
        await db.update(user)
          .set({ organizationId: orgId, role: u.role })
          .where(eq(user.id, existing.id));
        console.log(`[SEED] Found existing: ${u.email} -> ${existing.id}`);
      } else {
        userIds.push(crypto.randomUUID());
        console.error(`[SEED] ${u.email} not created and not found!`);
      }
    }
  }
  console.log("[SEED] Created 5 users with passwords (password: demo1234)");

  const driverStatus = ["en_ruta", "idle", "offline", "en_ruta", "idle"] as const;
  const driverCoords = [
    { lat: -33.456, lng: -70.648 },
    { lat: -33.452, lng: -70.642 },
    { lat: -33.458, lng: -70.655 },
    { lat: -33.449, lng: -70.650 },
    { lat: -33.460, lng: -70.640 },
  ];

  const driverIds: string[] = [];
  for (let i = 0; i < 5; i++) {
    const id = crypto.randomUUID();
    driverIds.push(id);
    await db.insert(drivers).values({
      id,
      organizationId: orgId,
      userId: userIds[i]!,
      vehicleId: vehicleIds[i]!,
      vehiclePlate: vehicleData[i]!.plate,
      status: driverStatus[i]!,
      currentLat: driverCoords[i]!.lat,
      currentLng: driverCoords[i]!.lng,
      updatedAt: now,
    });
  }
  console.log("[SEED] Created 5 drivers with vehicle assignments");

  const orderItems = [
    { count: 12, weight: 45.5, priority: "normal" as const },
    { count: 3, weight: 8.2, priority: "alta" as const },
    { count: 50, weight: 120.0, priority: "normal" as const },
    { count: 7, weight: 22.1, priority: "baja" as const },
    { count: 1, weight: 2.5, priority: "urgente" as const },
    { count: 20, weight: 65.0, priority: "normal" as const },
    { count: 4, weight: 15.3, priority: "alta" as const },
    { count: 8, weight: 30.0, priority: "normal" as const },
    { count: 2, weight: 5.0, priority: "baja" as const },
    { count: 15, weight: 48.7, priority: "normal" as const },
    { count: 6, weight: 18.4, priority: "alta" as const },
    { count: 30, weight: 95.2, priority: "normal" as const },
    { count: 9, weight: 28.0, priority: "baja" as const },
    { count: 5, weight: 12.6, priority: "normal" as const },
    { count: 11, weight: 38.9, priority: "urgente" as const },
  ];

  const deliveryAddresses = [
    { addr: "Av. Libertador 1234", lat: -33.455, lng: -70.645 },
    { addr: "Merced 456", lat: -33.452, lng: -70.642 },
    { addr: "Alameda 789", lat: -33.458, lng: -70.648 },
    { addr: "Estado 101", lat: -33.449, lng: -70.650 },
    { addr: "San Diego 202", lat: -33.460, lng: -70.640 },
    { addr: "Recoleta 303", lat: -33.453, lng: -70.647 },
    { addr: "Patronato 505", lat: -33.457, lng: -70.643 },
    { addr: "Independencia 707", lat: -33.451, lng: -70.649 },
    { addr: "Mapocho 909", lat: -33.459, lng: -70.641 },
    { addr: "Bellavista 111", lat: -33.454, lng: -70.646 },
    { addr: "Providencia 222", lat: -33.456, lng: -70.644 },
    { addr: "Las Condes 333", lat: -33.450, lng: -70.651 },
    { addr: "Vitacura 444", lat: -33.461, lng: -70.639 },
    { addr: "Ñuñoa 555", lat: -33.448, lng: -70.652 },
    { addr: "La Reina 666", lat: -33.462, lng: -70.638 },
  ];

  const orderIds: string[] = [];
  for (let i = 0; i < 15; i++) {
    const id = crypto.randomUUID();
    orderIds.push(id);
    const clientIdx = i % clientData.length;
    await db.insert(orders).values({
      id,
      organizationId: orgId,
      clientId: clientIds[clientIdx]!,
      referenceCode: `ORD-2024-${1000 + i}`,
      itemsCount: orderItems[i]!.count,
      weightKg: orderItems[i]!.weight,
      priority: orderItems[i]!.priority,
      notes: i % 3 === 0 ? "Entregar en recepción. Llamar antes." : null,
      deliveryAddress: deliveryAddresses[i]!.addr,
      deliveryLat: deliveryAddresses[i]!.lat,
      deliveryLng: deliveryAddresses[i]!.lng,
      status: i < 10 ? "asignada" : "pendiente",
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log("[SEED] Created 15 orders");

  const routeIds: string[] = [];
  const routeDefs = [
    { driverIdx: 0, zoneIdx: 0, status: "despachada" as const, dist: 45.2, mins: 120, orderCount: 4 },
    { driverIdx: 1, zoneIdx: 1, status: "pendiente" as const, dist: 32.8, mins: 90, orderCount: 3 },
    { driverIdx: 3, zoneIdx: 0, status: "despachada" as const, dist: 58.5, mins: 150, orderCount: 3 },
  ];

  let orderCursor = 0;
  for (const r of routeDefs) {
    const id = crypto.randomUUID();
    routeIds.push(id);
    await db.insert(routes).values({
      id,
      organizationId: orgId,
      driverId: driverIds[r.driverIdx]!,
      zoneId: r.zoneIdx === 0 ? zoneCentroId : zoneNorteId,
      optimizedDistanceKm: r.dist,
      estimatedDurationMins: r.mins,
      date: todayStr,
      status: r.status,
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log("[SEED] Created 3 routes");

  const stopNames = [
    ["Ferretería El Martillo", "Café Central", "Librería Universitaria", "Farmacias Cruz"],
    ["Supermercado Unimarc", "Panadería San Antonio", "Papelera Los Andes"],
    ["Restaurante La Cazuela", "Boutique Moda", "Electro Hogar"],
  ];

  let stopCursor = 0;
  for (let r = 0; r < routeIds.length; r++) {
    const routeOrderCount = routeDefs[r]!.orderCount;

    for (let s = 0; s < routeOrderCount; s++) {
      const idx = stopCursor;
      await db.insert(deliveryStops).values({
        id: crypto.randomUUID(),
        routeId: routeIds[r]!,
        orderId: orderIds[idx]!,
        clientName: stopNames[r]![s]!,
        address: deliveryAddresses[idx]!.addr,
        lat: deliveryAddresses[idx]!.lat,
        lng: deliveryAddresses[idx]!.lng,
        stopOrder: s + 1,
        status: s === 0 ? "entregado" : "pendiente",
        timeWindowStart: "09:00",
        timeWindowEnd: "13:00",
        deliveredAt: s === 0 ? now : null,
        createdAt: now,
        updatedAt: now,
      });
      stopCursor++;
    }
  }
  console.log("[SEED] Created 10 delivery stops linked to orders");
  
  const histEntries = [];
  for (let i = 0; i < 20; i++) {
    histEntries.push({
      id: crypto.randomUUID(),
      driverId: driverIds[0]!,
      lat: -33.456 + i * 0.0005,
      lng: -70.648 + i * 0.0003,
      accuracy: 8.5 + Math.random() * 4,
      speed: 25 + Math.random() * 15,
      recordedAt: new Date(now.getTime() - (20 - i) * 60000),
    });
  }
  await db.insert(locationHistory).values(histEntries);
  console.log("[SEED] Created 20 location history points");

  console.log("[SEED] Done! Development data ready.");
  return {
    organization: { id: orgId, name: "GeoLogistics Demo", slug: "demo" },
    clients: clientData.length,
    vehicles: vehicleData.length,
    zones: 2,
    drivers: 5,
    orders: orderItems.length,
    routes: routeDefs.length,
    stops: 10,
    locationHistory: histEntries.length,
  };
}
