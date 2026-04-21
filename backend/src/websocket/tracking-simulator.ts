import { PrismaClient } from '@prisma/client';

interface LocationUpdate {
  orderId: string;
  lat: number;
  lng: number;
  status: string;
  eta_minutes: number;
}

interface ActiveSimulation {
  orderId: string;
  lat: number;
  lng: number;
  targetLat: number;
  targetLng: number;
  eta: number;
  urgency: string;
}

let activeSimulations: ActiveSimulation[] = [];
const prisma = new PrismaClient();

// Initialize simulations from database
async function initializeSimulations() {
  try {
    const inTransitOrders = await prisma.order.findMany({
      where: { status: 'IN_TRANSIT' },
      include: { tracking: true, supplier: true },
    });

    activeSimulations = inTransitOrders.map(order => {
      const tracking = order.tracking;
      const startLat = tracking?.rider_lat || order.supplier?.latitude || 19.0760;
      const startLng = tracking?.rider_lng || order.supplier?.longitude || 72.8777;

      return {
        orderId: order.id,
        lat: startLat,
        lng: startLng,
        targetLat: order.delivery_lat,
        targetLng: order.delivery_lng,
        eta: order.estimated_delivery_minutes || 30,
        urgency: order.urgency,
      };
    });

    console.log(`Initialized tracking simulations for ${activeSimulations.length} orders`);
  } catch (error) {
    console.error('Error initializing simulations:', error);
  }
}

// Speed multiplier based on urgency
const speedMultiplier: Record<string, number> = {
  'P1': 0.08, // Faster interpolation for critical orders
  'P2': 0.06, // Standard speed
  'P3': 0.04, // Slower for non-urgent
};

export function simulateTracking(onUpdate: (update: LocationUpdate) => void) {
  // Initialize from database on startup
  initializeSimulations().then(() => {
    // We simulate live updates every 5 seconds for orders in transition
    const intervalId = setInterval(() => {
      if (activeSimulations.length === 0) {
        console.log('No active simulations, waiting...');
        // Try to re-initialize periodically
        initializeSimulations();
        return;
      }

      activeSimulations = activeSimulations.filter(sim => {
        // Interpolate towards target
        const speed = speedMultiplier[sim.urgency] || 0.06;
        sim.lat += (sim.targetLat - sim.lat) * speed;
        sim.lng += (sim.targetLng - sim.lng) * speed;

        // Decrease ETA
        sim.eta = Math.max(0, sim.eta - 0.08); // Decrease by ~0.08 min (5 seconds real time)

        // Determine status
        const status = sim.eta <= 0 ? 'DELIVERED' : 'IN_TRANSIT';

        onUpdate({
          orderId: sim.orderId,
          lat: parseFloat(sim.lat.toFixed(6)),
          lng: parseFloat(sim.lng.toFixed(6)),
          status,
          eta_minutes: Math.max(0, Math.ceil(sim.eta)),
        });

        // Keep only if not delivered
        return status === 'IN_TRANSIT';
      });
    }, 5000); // 5 second interval

    // Cleanup on exit
    process.on('SIGINT', () => {
      clearInterval(intervalId);
      process.exit(0);
    });
  });
}

// Function to add a new order to simulation (when order status changes to IN_TRANSIT)
export async function addOrderToSimulation(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { tracking: true, supplier: true },
    });

    if (!order) return;

    const tracking = order.tracking;
    const startLat = tracking?.rider_lat || order.supplier?.latitude || 19.0760;
    const startLng = tracking?.rider_lng || order.supplier?.longitude || 72.8777;

    activeSimulations.push({
      orderId: order.id,
      lat: startLat,
      lng: startLng,
      targetLat: order.delivery_lat,
      targetLng: order.delivery_lng,
      eta: order.estimated_delivery_minutes || 30,
      urgency: order.urgency,
    });

    console.log(`Added order ${orderId} to tracking simulation`);
  } catch (error) {
    console.error('Error adding order to simulation:', error);
  }
}

// Function to remove an order from simulation
export function removeOrderFromSimulation(orderId: string) {
  activeSimulations = activeSimulations.filter(sim => sim.orderId !== orderId);
  console.log(`Removed order ${orderId} from tracking simulation`);
}

