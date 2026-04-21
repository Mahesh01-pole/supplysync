import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── 30 suppliers across Mumbai metro (real lat/lng) ─────────────────────────
const supplierData = [
  { name: 'Acme Industrial Pipes & Valves',   address: 'Andheri East, Mumbai',           lat: 19.1136, lng: 72.8697, rating: 4.4, fulfilled: 320, avgTime: 30, email: 'acme@supplysync.com' },
  { name: 'Global Tech Components',            address: 'Navi Mumbai, MH',                lat: 19.0330, lng: 73.0297, rating: 4.6, fulfilled: 450, avgTime: 38, email: 'globaltech@supplysync.com' },
  { name: 'Precision Engineering Pro',         address: 'Thane West, MH',                 lat: 19.2183, lng: 72.9781, rating: 4.8, fulfilled: 610, avgTime: 25, email: 'precision@supplysync.com' },
  { name: 'FastFix Industrial Supplies',       address: 'Kurla West, Mumbai',             lat: 19.0728, lng: 72.8826, rating: 4.2, fulfilled: 180, avgTime: 45, email: 'fastfix@supplysync.com' },
  { name: 'Powai Mechanical Works',            address: 'Powai, Mumbai',                  lat: 19.1176, lng: 72.9060, rating: 4.7, fulfilled: 275, avgTime: 32, email: 'powai@supplysync.com' },
  { name: 'Sion Engineering Hub',              address: 'Sion, Mumbai',                   lat: 19.0433, lng: 72.8616, rating: 4.3, fulfilled: 310, avgTime: 40, email: 'sion@supplysync.com' },
  { name: 'Goregaon Parts Depot',              address: 'Goregaon East, Mumbai',          lat: 19.1663, lng: 72.8526, rating: 4.5, fulfilled: 390, avgTime: 35, email: 'goregaon@supplysync.com' },
  { name: 'Malad Industrial Zone',             address: 'Malad West, Mumbai',             lat: 19.1870, lng: 72.8479, rating: 4.1, fulfilled: 210, avgTime: 50, email: 'malad@supplysync.com' },
  { name: 'Borivali Tech Supplies',            address: 'Borivali East, Mumbai',          lat: 19.2297, lng: 72.8637, rating: 4.6, fulfilled: 285, avgTime: 28, email: 'borivali@supplysync.com' },
  { name: 'Vashi Component Store',             address: 'Vashi, Navi Mumbai',             lat: 19.0760, lng: 72.9980, rating: 4.9, fulfilled: 520, avgTime: 22, email: 'vashi@supplysync.com' },
  { name: 'Panvel Heavy Parts',                address: 'Panvel, Navi Mumbai',            lat: 18.9940, lng: 73.1120, rating: 3.9, fulfilled: 160, avgTime: 60, email: 'panvel@supplysync.com' },
  { name: 'Dombivli Spare Parts',              address: 'Dombivli East, Thane',           lat: 19.2170, lng: 73.0890, rating: 4.3, fulfilled: 190, avgTime: 47, email: 'dombivli@supplysync.com' },
  { name: 'Kalyan Industrial Traders',         address: 'Kalyan West, Thane',             lat: 19.2403, lng: 73.1305, rating: 4.2, fulfilled: 230, avgTime: 55, email: 'kalyan@supplysync.com' },
  { name: 'Bandra Hydro Equipment',            address: 'Bandra East, Mumbai',            lat: 19.0596, lng: 72.8562, rating: 4.7, fulfilled: 340, avgTime: 30, email: 'bandra@supplysync.com' },
  { name: 'Dadar Machine Tools',               address: 'Dadar West, Mumbai',             lat: 19.0176, lng: 72.8439, rating: 4.5, fulfilled: 260, avgTime: 42, email: 'dadar@supplysync.com' },
  { name: 'Chembur Process Equipment',         address: 'Chembur, Mumbai',                lat: 19.0562, lng: 72.9005, rating: 4.4, fulfilled: 195, avgTime: 38, email: 'chembur@supplysync.com' },
  { name: 'Mulund Auto Parts',                 address: 'Mulund West, Mumbai',            lat: 19.1697, lng: 72.9559, rating: 4.6, fulfilled: 315, avgTime: 33, email: 'mulund@supplysync.com' },
  { name: 'Airoli Fluid Systems',              address: 'Airoli, Navi Mumbai',            lat: 19.1566, lng: 72.9988, rating: 4.8, fulfilled: 420, avgTime: 26, email: 'airoli@supplysync.com' },
  { name: 'Belapur Controls & Valves',         address: 'CBD Belapur, Navi Mumbai',       lat: 19.0217, lng: 73.0379, rating: 4.3, fulfilled: 175, avgTime: 44, email: 'belapur@supplysync.com' },
  { name: 'Vikhroli Tech Hub',                 address: 'Vikhroli East, Mumbai',          lat: 19.1080, lng: 72.9267, rating: 4.5, fulfilled: 300, avgTime: 36, email: 'vikhroli@supplysync.com' },
  { name: 'Ghatkopar Gear Works',             address: 'Ghatkopar East, Mumbai',         lat: 19.0863, lng: 72.9085, rating: 4.2, fulfilled: 145, avgTime: 52, email: 'ghatkopar@supplysync.com' },
  { name: 'Santacruz Electrical Parts',        address: 'Santacruz East, Mumbai',         lat: 19.0810, lng: 72.8502, rating: 4.6, fulfilled: 370, avgTime: 29, email: 'santacruz@supplysync.com' },
  { name: 'Jogeshwari Hydraulics',             address: 'Jogeshwari West, Mumbai',        lat: 19.1327, lng: 72.8336, rating: 4.4, fulfilled: 220, avgTime: 40, email: 'jogeshwari@supplysync.com' },
  { name: 'Versova Seals & Gaskets',           address: 'Versova, Mumbai',                lat: 19.1308, lng: 72.8209, rating: 4.1, fulfilled: 130, avgTime: 58, email: 'versova@supplysync.com' },
  { name: 'Kharghar Industrial Zone',          address: 'Kharghar, Navi Mumbai',          lat: 19.0473, lng: 73.0699, rating: 4.7, fulfilled: 480, avgTime: 24, email: 'kharghar@supplysync.com' },
  { name: 'Nerul Parts Distribution',          address: 'Nerul, Navi Mumbai',             lat: 19.0361, lng: 73.0169, rating: 4.5, fulfilled: 265, avgTime: 34, email: 'nerul@supplysync.com' },
  { name: 'Turbhe Engineering Supplies',       address: 'Turbhe, Navi Mumbai',            lat: 19.0840, lng: 73.0349, rating: 4.3, fulfilled: 198, avgTime: 41, email: 'turbhe@supplysync.com' },
  { name: 'Wadala Precision Components',       address: 'Wadala, Mumbai',                 lat: 19.0219, lng: 72.8573, rating: 4.6, fulfilled: 355, avgTime: 31, email: 'wadala@supplysync.com' },
  { name: 'Parel Machine Center',              address: 'Lower Parel, Mumbai',            lat: 18.9974, lng: 72.8337, rating: 4.8, fulfilled: 510, avgTime: 23, email: 'parel@supplysync.com' },
  { name: 'Dharavi Industrial Traders',        address: 'Dharavi, Mumbai',                lat: 19.0437, lng: 72.8540, rating: 4.0, fulfilled: 120, avgTime: 65, email: 'dharavi@supplysync.com' },
];

// ─── 20 industrial products ───────────────────────────────────────────────────
const productData = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Industrial Valve Actuator Model 4', description: 'High-pressure electro-pneumatic actuator for industrial valves', category: 'Valves', unit: 'pcs' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Hydraulic Pump Assembly HP-500',    description: '500 bar hydraulic pump assembly for heavy machinery',          category: 'Hydraulics', unit: 'pcs' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Deep Groove Ball Bearing 6205',     description: 'Precision deep groove ball bearing, 25mm bore',                category: 'Bearings', unit: 'pcs' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Pressure Gauge 0-400 Bar',          description: 'Digital pressure gauge with stainless steel Bourdon tube',     category: 'Instruments', unit: 'pcs' },
  { id: '55555555-5555-5555-5555-555555555555', name: 'Electromagnetic Flow Meter DN50',   description: 'Flanged electromagnetic flow meter for conductive liquids',     category: 'Instruments', unit: 'pcs' },
  { id: '66666666-6666-6666-6666-666666666666', name: 'Solenoid Valve 24VDC 2-Way',       description: '24VDC direct-acting solenoid valve, stainless body',           category: 'Valves', unit: 'pcs' },
  { id: '77777777-7777-7777-7777-777777777777', name: 'Pneumatic Cylinder 80mm Bore',     description: 'Double-acting pneumatic cylinder, 80mm bore 200mm stroke',     category: 'Pneumatics', unit: 'pcs' },
  { id: '88888888-8888-8888-8888-888888888888', name: 'Nitrile O-Ring Seal Kit 50pc',     description: 'Assorted nitrile rubber O-rings, 50-piece industrial kit',      category: 'Seals', unit: 'kit' },
  { id: '99999999-9999-9999-9999-999999999999', name: 'Gear Coupling Type GE-70',         description: 'Flexible jaw coupling for motor-to-gearbox connection',         category: 'Couplings', unit: 'pcs' },
  { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'PT100 Temperature Sensor',         description: 'Class A platinum resistance thermometer, -50 to +400°C',       category: 'Sensors', unit: 'pcs' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', name: 'Inductive Proximity Switch 12mm',  description: 'NPN flush inductive proximity sensor, 12mm M12 thread',        category: 'Sensors', unit: 'pcs' },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', name: 'DIN Rail Relay Module 24VDC',      description: '10A SPDT relay module for DIN rail mounting',                   category: 'Electrical', unit: 'pcs' },
  { id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', name: 'Conveyor Belt 1000mm × 5m',        description: 'PU flat conveyor belt, food-grade, 1000mm width',              category: 'Mechanical', unit: 'mtr' },
  { id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', name: 'Roller Chain ASA 50-1',            description: 'ANSI standard single-strand roller chain, 10 ft',              category: 'Mechanical', unit: 'pcs' },
  { id: 'ffffffff-ffff-ffff-ffff-ffffffffffff', name: 'Coolant Pump 0.25kW',              description: 'Centrifugal coolant pump for CNC & grinding machines',          category: 'Hydraulics', unit: 'pcs' },
  { id: '00000000-0000-0000-aaaa-aaaaaaaaaaaa', name: 'AC Servo Motor 750W',              description: '750W AC servo motor with incremental encoder 2500ppr',         category: 'Electrical', unit: 'pcs' },
  { id: '00000000-0000-0000-bbbb-bbbbbbbbbbbb', name: 'Encoder Disc 1024 PPR',            description: 'Incremental optical encoder disc, 1024 pulses per revolution',  category: 'Sensors', unit: 'pcs' },
  { id: '00000000-0000-0000-cccc-cccccccccccc', name: 'Safety Relief Valve 1 inch',       description: 'Spring-loaded safety valve, 1 inch BSP, 10-40 bar setting',   category: 'Valves', unit: 'pcs' },
  { id: '00000000-0000-0000-dddd-dddddddddddd', name: 'Hydraulic Filter Cartridge 10µ',   description: '10 micron hydraulic oil filter cartridge, high flow',           category: 'Hydraulics', unit: 'pcs' },
  { id: '00000000-0000-0000-eeee-eeeeeeeeeeee', name: 'Full Port Ball Valve DN25',        description: 'Three-piece full port ball valve, stainless 316L, DN25',       category: 'Valves', unit: 'pcs' },
];

// ─── Price map per product (₹/unit) ──────────────────────────────────────────
const priceMap: Record<string, number> = {
  '11111111-1111-1111-1111-111111111111': 1450,
  '22222222-2222-2222-2222-222222222222': 18500,
  '33333333-3333-3333-3333-333333333333': 320,
  '44444444-4444-4444-4444-444444444444': 2800,
  '55555555-5555-5555-5555-555555555555': 24000,
  '66666666-6666-6666-6666-666666666666': 950,
  '77777777-7777-7777-7777-777777777777': 3200,
  '88888888-8888-8888-8888-888888888888': 480,
  '99999999-9999-9999-9999-999999999999': 1750,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa': 1200,
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb': 680,
  'cccccccc-cccc-cccc-cccc-cccccccccccc': 390,
  'dddddddd-dddd-dddd-dddd-dddddddddddd': 8500,
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee': 1100,
  'ffffffff-ffff-ffff-ffff-ffffffffffff': 6200,
  '00000000-0000-0000-aaaa-aaaaaaaaaaaa': 45000,
  '00000000-0000-0000-bbbb-bbbbbbbbbbbb': 3800,
  '00000000-0000-0000-cccc-cccccccccccc': 2100,
  '00000000-0000-0000-dddd-dddddddddddd': 750,
  '00000000-0000-0000-eeee-eeeeeeeeeeee': 1900,
};

async function main() {
  console.log('🌱 Seeding SupplySync Database…');

  // ── Wipe in dependency order ────────────────────────────────────────────────
  await prisma.deliveryTracking.deleteMany({});
  await prisma.orderEvent.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('✅ Cleared existing data');

  const hash = (pw: string) => bcrypt.hash(pw, 10);
  const testPw = await hash('Test@1234');

  // ── Test accounts ────────────────────────────────────────────────────────────
  const buyer = await prisma.user.create({
    data: { email: 'buyer@test.com', password_hash: testPw, role: 'BUYER',    name: 'Ravi Kumar',      company: 'Tata Motors Ltd.',      phone: '9820001111' },
  });
  const admin = await prisma.user.create({
    data: { email: 'admin@test.com', password_hash: testPw, role: 'ADMIN',    name: 'Priya Sharma',                                      phone: '9820002222' },
  });

  // Legacy credential aliases accepted by existing login hint on the login page
  await prisma.user.createMany({
    data: [
      { email: 'buyer@supplysync.com',    password_hash: await hash('password123'), role: 'BUYER',    name: 'Demo Buyer',    company: 'Demo Corp' },
      { email: 'admin@supplysync.com',    password_hash: await hash('admin123'),    role: 'ADMIN',    name: 'Demo Admin' },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Test accounts created (buyer@test.com / admin@test.com / Test@1234)');

  // ── Products ─────────────────────────────────────────────────────────────────
  for (const p of productData) {
    await prisma.product.create({ data: p });
  }
  console.log('✅ 20 products created');

  // ── 30 Suppliers ─────────────────────────────────────────────────────────────
  const createdSuppliers: { id: string; lat: number; lng: number }[] = [];
  let supplierUserForTest: { id: string; supplierId: string } | null = null;

  for (let i = 0; i < supplierData.length; i++) {
    const s = supplierData[i];
    const supUser = await prisma.user.create({
      data: {
        email: s.email,
        password_hash: testPw,
        role: 'SUPPLIER',
        name: s.name,
        company: s.name,
        phone: `982000${String(i + 3).padStart(4, '0')}`,
      },
    });

    const supplier = await prisma.supplier.create({
      data: {
        user_id: supUser.id,
        company_name: s.name,
        address: s.address,
        latitude: s.lat,
        longitude: s.lng,
        rating: s.rating,
        active: true,
        total_orders_fulfilled: s.fulfilled,
        avg_fulfillment_time_minutes: s.avgTime,
      },
    });

    createdSuppliers.push({ id: supplier.id, lat: s.lat, lng: s.lng });

    // Assign inventory: each supplier carries a random subset of ~8 products
    const productIds = productData.map(p => p.id);
    const assignedProducts = productIds.filter((_, idx) => (idx + i) % 3 !== 0); // skip every 3rd rotated
    for (const productId of assignedProducts) {
      await prisma.inventory.create({
        data: {
          supplier_id: supplier.id,
          product_id: productId,
          quantity: 100 + Math.floor(Math.random() * 400),
          price_per_unit: priceMap[productId] ?? 1000,
        },
      });
    }

    // Use supplier@test.com for the first supplier
    if (i === 0) {
      supplierUserForTest = { id: supUser.id, supplierId: supplier.id };
    }

    if ((i + 1) % 10 === 0) console.log(`✅ Seeded ${i + 1}/30 suppliers`);
  }

  // Create supplier@test.com pointing to first supplier
  await prisma.user.upsert({
    where: { email: 'supplier@test.com' },
    update: {},
    create: {
      email: 'supplier@test.com',
      password_hash: testPw,
      role: 'SUPPLIER',
      name: 'Demo Supplier',
      company: supplierData[0].name,
      phone: '9820009999',
      supplier: {
        create: {
          company_name: supplierData[0].name + ' (Test)',
          address: supplierData[0].address,
          latitude: supplierData[0].lat,
          longitude: supplierData[0].lng,
          rating: 4.5,
          active: true,
          total_orders_fulfilled: 50,
          avg_fulfillment_time_minutes: 35,
        },
      },
    },
  });
  console.log('✅ supplier@test.com / Test@1234 ready');

  // ── 50 orders in various statuses ────────────────────────────────────────────
  const statuses = ['PENDING', 'MATCHED', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED'] as const;
  const urgencies = ['P1', 'P2', 'P3'] as const;
  const addresses = [
    { addr: 'Tata Motors Gate 3, Pimpri, Pune', lat: 18.6285, lng: 73.8014 },
    { addr: 'Larsen & Toubro Campus, Powai, Mumbai', lat: 19.1176, lng: 72.9060 },
    { addr: 'Mahindra Tech Park, Airoli, Navi Mumbai', lat: 19.1566, lng: 72.9988 },
    { addr: 'Bharat Forge, Mundhwa, Pune', lat: 18.5314, lng: 73.9321 },
    { addr: 'Siemens Factory, Kalwa, Thane', lat: 19.1920, lng: 73.0440 },
    { addr: 'Atlas Copco, Dombivli, Thane', lat: 19.2170, lng: 73.0890 },
    { addr: 'Godrej Appliances, Vikhroli, Mumbai', lat: 19.1080, lng: 72.9267 },
    { addr: 'BHEL Office Complex, Bhandup, Mumbai', lat: 19.1500, lng: 72.9420 },
    { addr: 'Thermax Works, Kasarwadi, Pune', lat: 18.6450, lng: 73.8280 },
    { addr: 'Fiat Chrysler Plant, Ranjangaon, Pune', lat: 18.7550, lng: 74.2800 },
  ];

  const now = new Date();

  for (let i = 1; i <= 50; i++) {
    const statusIndex = i <= 5 ? 3 : (i - 1) % 5; // first 5 are IN_TRANSIT for WS demo
    const status = statuses[statusIndex];
    const urgency = urgencies[(i - 1) % 3];
    const loc = addresses[(i - 1) % addresses.length];
    const supplier = createdSuppliers[(i - 1) % createdSuppliers.length];
    const product = productData[(i - 1) % productData.length];
    const qty = 10 + (i * 7) % 90; // 10–99
    const daysAgo = Math.floor((50 - i) / 5);
    const createdAt = new Date(now.getTime() - daysAgo * 86400000 - (i * 3600000));

    const order = await prisma.order.create({
      data: {
        order_number: `ORD-2025-${String(i).padStart(4, '0')}`,
        buyer_id: buyer.id,
        product_id: product.id,
        quantity: qty,
        delivery_address: loc.addr,
        delivery_lat: loc.lat,
        delivery_lng: loc.lng,
        urgency,
        status,
        matched_supplier_id: status !== 'PENDING' ? supplier.id : null,
        match_score: status !== 'PENDING' ? (75 + (i % 20)) : null,
        estimated_delivery_minutes: urgency === 'P1' ? 25 : urgency === 'P2' ? 40 : 60,
        created_at: createdAt,
        matched_at: status !== 'PENDING' ? new Date(createdAt.getTime() + 120000) : null,
        dispatched_at: ['DISPATCHED', 'IN_TRANSIT', 'DELIVERED'].includes(status) ? new Date(createdAt.getTime() + 900000) : null,
        delivered_at: status === 'DELIVERED' ? new Date(createdAt.getTime() + (urgency === 'P1' ? 1800000 : 3600000)) : null,
      },
    });

    // Create order event
    await prisma.orderEvent.create({
      data: { order_id: order.id, event_type: 'CREATED', description: 'Order placed by buyer', timestamp: createdAt },
    });

    if (status !== 'PENDING') {
      await prisma.orderEvent.create({
        data: { order_id: order.id, event_type: 'MATCHED', description: `Matched to supplier`, timestamp: new Date(createdAt.getTime() + 120000) },
      });
    }

    if (['DISPATCHED', 'IN_TRANSIT', 'DELIVERED'].includes(status)) {
      await prisma.orderEvent.create({
        data: { order_id: order.id, event_type: 'DISPATCHED', description: 'Order dispatched from supplier', timestamp: new Date(createdAt.getTime() + 900000) },
      });
    }

    if (['IN_TRANSIT', 'DELIVERED'].includes(status)) {
      await prisma.orderEvent.create({
        data: { order_id: order.id, event_type: 'IN_TRANSIT', description: 'Rider picked up the order', timestamp: new Date(createdAt.getTime() + 1200000) },
      });
      // Create delivery tracking for IN_TRANSIT orders
      await prisma.deliveryTracking.upsert({
        where: { order_id: order.id },
        update: {},
        create: {
          order_id: order.id,
          rider_lat: supplier.lat,
          rider_lng: supplier.lng,
          speed_kmh: 30 + (i % 20),
          heading: (i * 37) % 360,
          driver_name: ['Arjun S.', 'Raju G.', 'Mohan K.', 'Suresh P.', 'Vijay R.'][i % 5],
          driver_phone: `98200${String(10000 + i).slice(1)}`,
          driver_rating: 4.0 + (i % 10) / 10,
        },
      });
    }

    if (status === 'DELIVERED') {
      await prisma.orderEvent.create({
        data: { order_id: order.id, event_type: 'DELIVERED', description: 'Order delivered to buyer', timestamp: new Date(createdAt.getTime() + (urgency === 'P1' ? 1800000 : 3600000)) },
      });
    }
  }
  console.log('✅ 50 orders seeded (first 5 are IN_TRANSIT → picked up by WebSocket simulator)');

  console.log('\n🎉 Seeding Complete!');
  console.log('──────────────────────────────────────────');
  console.log('Test Credentials:');
  console.log('  Buyer:    buyer@test.com    / Test@1234');
  console.log('  Supplier: supplier@test.com / Test@1234');
  console.log('  Admin:    admin@test.com    / Test@1234');
  console.log('──────────────────────────────────────────');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
