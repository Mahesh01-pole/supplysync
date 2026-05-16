import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const supplierCount = await p.supplier.count();
  const inventoryCount = await p.inventory.count();
  const userCount = await p.user.count({ where: { role: 'SUPPLIER' } });
  console.log('=== Worldwide Suppliers Dataset Verification ===');
  console.log(`Total Suppliers: ${supplierCount}`);
  console.log(`Supplier Users:  ${userCount}`);
  console.log(`Inventory Items: ${inventoryCount}`);
  await p.$disconnect();
})();
