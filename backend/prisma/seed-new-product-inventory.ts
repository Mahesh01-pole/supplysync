/**
 * seed-new-product-inventory.ts
 * 
 * Distributes the 31 newly added products across existing suppliers.
 * Each new product gets assigned to 40–120 random suppliers with
 * realistic stock (100–5000 units) and pricing.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Price ranges per category (₹)
const PRICE_BY_CATEGORY: Record<string, [number, number]> = {
  'Mechanical':   [200,  8000],
  'Electrical':   [500,  25000],
  'Hydraulics':   [800,  15000],
  'Pneumatics':   [400,  12000],
  'Valves':       [600,  10000],
  'Sensors':      [300,  18000],
  'Instruments':  [500,  20000],
  'Bearings':     [100,  3000],
  'Couplings':    [300,  6000],
  'Seals':        [150,  2000],
};

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randPrice(category: string): number {
  const [min, max] = PRICE_BY_CATEGORY[category] ?? [200, 5000];
  return Math.round(randInt(min, max) / 50) * 50; // round to nearest 50
}

async function main() {
  // Get all new products (those without any inventory yet)
  const newProducts = await prisma.product.findMany({
    where: {
      inventory: { none: {} }, // products with zero inventory entries
    },
  });

  if (newProducts.length === 0) {
    console.log('✅ All products already have inventory. Nothing to seed.');
    await prisma.$disconnect();
    return;
  }

  console.log(`Found ${newProducts.length} products with no inventory. Seeding...`);

  // Get all supplier IDs
  const suppliers = await prisma.supplier.findMany({
    select: { id: true },
    where: { active: true },
  });

  const supplierIds = suppliers.map(s => s.id);
  console.log(`Total active suppliers: ${supplierIds.length}`);

  let totalCreated = 0;

  for (const product of newProducts) {
    // Assign each product to 60–150 random suppliers
    const assignCount = randInt(60, 150);
    const shuffled = [...supplierIds].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(assignCount, supplierIds.length));

    const records = selected.map(supplierId => ({
      supplier_id: supplierId,
      product_id: product.id,
      quantity: randInt(50, 5000),
      price_per_unit: randPrice(product.category ?? 'Mechanical'),
    }));

    // Batch insert (skip conflicts — supplier may already have this product)
    await prisma.inventory.createMany({
      data: records,
      skipDuplicates: true,
    });

    totalCreated += records.length;
    console.log(` ✓ [${product.category}] ${product.name} → ${records.length} suppliers`);
  }

  const totalInventory = await prisma.inventory.count();
  console.log(`\n✅ Done! Created ${totalCreated} new inventory entries.`);
  console.log(`   Total inventory records: ${totalInventory}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
