import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@supplysync.com' },
      include: { supplier: true }
    });
    console.log(user);
  } catch (e) {
    console.error("DB ERROR:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
