import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const NEW_PRODUCTS = [
  // Mechanical
  { name: "Linear Guide Rail 15mm", category: "Mechanical", unit: "pcs", description: "Precision linear guide rail for CNC and automation" },
  { name: "Ball Screw Assembly SFU1605", category: "Mechanical", unit: "pcs", description: "High-precision ball screw 1605 for linear motion" },
  { name: "Timing Belt HTD 5M", category: "Mechanical", unit: "meters", description: "HTD 5M timing belt for synchronous drives" },
  { name: "Flexible Jaw Coupling D25", category: "Couplings", unit: "pcs", description: "Spider jaw coupling for motor shaft connection" },
  { name: "Helical Gear Module 2", category: "Mechanical", unit: "pcs", description: "Precision helical gear module 2, 20 teeth" },
  { name: "Worm Gear Reducer 1:30", category: "Mechanical", unit: "pcs", description: "Right angle worm gear speed reducer 1:30 ratio" },

  // Electrical
  { name: "VFD Drive 1.5kW 3-Phase", category: "Electrical", unit: "pcs", description: "Variable frequency drive for 3-phase motor control" },
  { name: "PLC CPU Module S7-1200", category: "Electrical", unit: "pcs", description: "Siemens S7-1200 compatible PLC CPU module" },
  { name: "HMI Touch Panel 7 inch", category: "Electrical", unit: "pcs", description: "7-inch industrial HMI touch panel with Ethernet" },
  { name: "SMPS 24V 10A DIN Rail", category: "Electrical", unit: "pcs", description: "Switched-mode power supply 24VDC 10A for DIN rail" },
  { name: "Circuit Breaker 3P 25A", category: "Electrical", unit: "pcs", description: "3-pole miniature circuit breaker 25A" },
  { name: "Contactor LC1-D25 220V", category: "Electrical", unit: "pcs", description: "25A AC contactor coil 220V" },

  // Hydraulics & Pneumatics
  { name: "Hydraulic Cylinder 50mm Bore", category: "Hydraulics", unit: "pcs", description: "Double-acting hydraulic cylinder 50mm bore 200mm stroke" },
  { name: "Solenoid Directional Valve 4/3", category: "Valves", unit: "pcs", description: "4/3 way solenoid directional control valve" },
  { name: "Air Regulator Filter 1/2 inch", category: "Pneumatics", unit: "pcs", description: "Combination air filter regulator with gauge" },
  { name: "Pneumatic Gripper Parallel 40mm", category: "Pneumatics", unit: "pcs", description: "Parallel pneumatic gripper 40mm stroke" },

  // Sensors & Instruments
  { name: "Photoelectric Sensor Diffuse 1m", category: "Sensors", unit: "pcs", description: "Diffuse reflective photoelectric sensor 1m range" },
  { name: "Load Cell 500kg", category: "Instruments", unit: "pcs", description: "S-type compression load cell 500kg capacity" },
  { name: "Ultrasonic Level Sensor", category: "Sensors", unit: "pcs", description: "Non-contact ultrasonic level sensor 4-20mA output" },
  { name: "Digital Pressure Transmitter", category: "Instruments", unit: "pcs", description: "4-20mA digital pressure transmitter 0-10 bar" },

  // Seals & Maintenance
  { name: "Polyurethane Seal Kit", category: "Seals", unit: "kits", description: "Complete PU seal kit for hydraulic cylinders" },
  { name: "Industrial Grease NLGI 2 1kg", category: "Mechanical", unit: "kg", description: "Lithium complex grease NLGI grade 2" },
  { name: "Anti-Vibration Mount M10", category: "Mechanical", unit: "pcs", description: "Rubber anti-vibration mount M10 stud" },

  // Bearings
  { name: "Tapered Roller Bearing 30206", category: "Bearings", unit: "pcs", description: "Tapered roller bearing 30x62x17.25mm" },
  { name: "Self-Aligning Ball Bearing 1207", category: "Bearings", unit: "pcs", description: "Double row self-aligning ball bearing 35mm bore" },
  { name: "Needle Roller Bearing NA4907", category: "Bearings", unit: "pcs", description: "Needle roller bearing with inner ring 35x55x20mm" },

  // Cables & Connectors
  { name: "Encoder Cable 10m Shielded", category: "Electrical", unit: "pcs", description: "6-core shielded encoder cable 10 meters" },
  { name: "M12 Sensor Connector 4-Pin", category: "Electrical", unit: "pcs", description: "M12 4-pin A-coded male connector with cable" },
  { name: "Flexible Cable Carrier 25x38mm", category: "Mechanical", unit: "meters", description: "Cable drag chain 25x38mm internal size" },

  // Safety
  { name: "Safety Light Curtain Type 4", category: "Sensors", unit: "pcs", description: "Type 4 safety light curtain 300mm protective height" },
  { name: "Emergency Stop Button 40mm", category: "Electrical", unit: "pcs", description: "40mm mushroom head emergency stop button NO+NC" },
];

async function main() {
  console.log(`Adding ${NEW_PRODUCTS.length} new products to the platform...`);

  let added = 0;
  for (const product of NEW_PRODUCTS) {
    try {
      await prisma.product.create({ data: product });
      console.log(` ✓ ${product.name}`);
      added++;
    } catch (e: any) {
      if (e.code === 'P2002') {
        console.log(` - Skipped (already exists): ${product.name}`);
      } else {
        console.error(` ✗ Failed: ${product.name}`, e.message);
      }
    }
  }

  const total = await prisma.product.count();
  console.log(`\nDone! Added ${added} new products. Total in platform: ${total}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
