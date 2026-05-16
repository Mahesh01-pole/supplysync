import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const products = await p.product.findMany({ orderBy: { name: 'asc' } });
  console.log(`Total products in platform: ${products.length}`);
  products.forEach(x => console.log(` - [${x.category}] ${x.name}`));
  await p.$disconnect();
})();
