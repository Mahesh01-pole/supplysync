import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// High-density industrial hubs (lat, lng) to cluster the random generation somewhat realistically
const HUB_COORDS = [
  { lat: 48.1351, lng: 11.5820, name: 'Munich, Germany' },
  { lat: 34.0522, lng: -118.2437, name: 'Los Angeles, USA' },
  { lat: 35.6895, lng: 139.6917, name: 'Tokyo, Japan' },
  { lat: 22.5431, lng: 114.0579, name: 'Shenzhen, China' },
  { lat: 37.5665, lng: 126.9780, name: 'Seoul, South Korea' },
  { lat: 19.0760, lng: 72.8777, name: 'Mumbai, India' },
  { lat: 28.6139, lng: 77.2090, name: 'New Delhi, India' },
  { lat: 52.5200, lng: 13.4050, name: 'Berlin, Germany' },
  { lat: 51.5074, lng: -0.1278, name: 'London, UK' },
  { lat: 43.6510, lng: -79.3470, name: 'Toronto, Canada' },
  { lat: -23.5505, lng: -46.6333, name: 'Sao Paulo, Brazil' },
  { lat: 25.2048, lng: 55.2708, name: 'Dubai, UAE' },
  { lat: -33.8688, lng: 151.2093, name: 'Sydney, Australia' },
  { lat: 1.3521, lng: 103.8198, name: 'Singapore' },
  { lat: 55.7558, lng: 37.6173, name: 'Moscow, Russia' },
  { lat: 45.4215, lng: -75.6972, name: 'Ottawa, Canada' },
  { lat: 41.9028, lng: 12.4964, name: 'Rome, Italy' },
  { lat: 48.8566, lng: 2.3522, name: 'Paris, France' },
  { lat: -26.2041, lng: 28.0473, name: 'Johannesburg, South Africa' },
  { lat: 14.5995, lng: 120.9842, name: 'Manila, Philippines' }
];

async function main() {
  console.log('Seeding Worldwide Suppliers...');
  
  // Ensure we have some products
  const products = await prisma.product.findMany();
  if (products.length === 0) {
    console.error('No products found. Please run the default seed first to populate products.');
    return;
  }

  const saltRounds = 10;
  const defaultPasswordHash = await bcrypt.hash('Test@1234', saltRounds);

  const BATCH_SIZE = 50;
  const TOTAL_SUPPLIERS = 500;
  
  for (let i = 0; i < TOTAL_SUPPLIERS; i += BATCH_SIZE) {
    console.log(`Processing batch ${i} to ${i + BATCH_SIZE}...`);
    
    for (let j = 0; j < BATCH_SIZE; j++) {
      const hub = faker.helpers.arrayElement(HUB_COORDS);
      // Randomize slightly around the hub (+/- 2 degrees)
      const lat = hub.lat + (faker.number.float({ min: -2, max: 2 }));
      const lng = hub.lng + (faker.number.float({ min: -2, max: 2 }));
      
      const companyName = faker.company.name() + ' ' + faker.helpers.arrayElement(['Industries', 'Manufacturing', 'Logistics', 'Supplies', 'Global', 'Corp', 'Ltd']);
      const email = faker.internet.email({ provider: 'test.com', firstName: `supplier_${i}_${j}` }).toLowerCase();
      
      const user = await prisma.user.create({
        data: {
          email,
          password_hash: defaultPasswordHash,
          name: faker.person.fullName(),
          role: 'SUPPLIER',
          company: companyName,
          phone: faker.phone.number(),
          supplier: {
            create: {
              company_name: companyName,
              address: `${faker.location.streetAddress()}, ${hub.name}`,
              latitude: lat,
              longitude: lng,
              rating: faker.number.float({ min: 3.5, max: 5.0, fractionDigits: 1 }),
              active: true,
              avg_fulfillment_time_minutes: faker.number.int({ min: 15, max: 240 })
            }
          }
        },
        include: { supplier: true }
      });

      // Create realistic inventory
      const supplierId = user.supplier!.id;
      // Assign 3-8 random products to this supplier
      const numProducts = faker.number.int({ min: 3, max: 8 });
      const selectedProducts = faker.helpers.arrayElements(products, numProducts);
      
      await prisma.inventory.createMany({
        data: selectedProducts.map(p => ({
          supplier_id: supplierId,
          product_id: p.id,
          quantity: faker.number.int({ min: 0, max: 10000 }),
          price_per_unit: faker.number.float({ min: 50, max: 5000, fractionDigits: 2 }),
          updated_at: faker.date.recent()
        }))
      });
    }
  }

  console.log(`Successfully created ${TOTAL_SUPPLIERS} worldwide suppliers!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
