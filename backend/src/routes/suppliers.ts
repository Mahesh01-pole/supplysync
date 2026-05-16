import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Helper: resolve supplierId from JWT claim OR by looking up user's supplier in DB
async function resolveSupplierIdForUser(user: any): Promise<string | null> {
  if (user.supplierId) return user.supplierId;
  if (user.role !== 'SUPPLIER' && user.role !== 'ADMIN') return null;
  const supplier = await prisma.supplier.findFirst({ where: { user_id: user.id }, select: { id: true } });
  return supplier?.id ?? null;
}

// GET /api/suppliers - List all suppliers
router.get('/', async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { active: true },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    res.json(suppliers);
  } catch (error) {
    console.error('Suppliers list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/suppliers/:id - Get supplier details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        inventory: { include: { product: true } },
      },
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json(supplier);
  } catch (error) {
    console.error('Supplier details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/suppliers/:id/requests - Get pending requests for supplier
router.get('/:id/requests', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Resolve supplierId from JWT or DB fallback
    const resolvedSupplierId = await resolveSupplierIdForUser(user);

    // Verify supplier owns these requests
    if (resolvedSupplierId !== id && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get all orders matched to this supplier that are awaiting dispatch
    const requests = await prisma.order.findMany({
      where: {
        matched_supplier_id: id,
        status: 'MATCHED', // Orders matched to this supplier but not yet dispatched
      },
      include: {
        product: true,
        buyer: { select: { id: true, name: true } },
        matched_supplier: true,
      },
      orderBy: { urgency: 'asc' }, // P1 first
    });

    // Get supplier location for distance calculation
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      select: { latitude: true, longitude: true, rating: true },
    });

    const requestsWithScores = requests.map(req => {
      const distance = supplier?.latitude && supplier?.longitude
        ? calculateDistance(
            supplier.latitude,
            supplier.longitude,
            req.delivery_lat ?? 19.0760,
            req.delivery_lng ?? 72.8777
          )
        : 0;

      const score = calculateMatchScore(
        distance,
        Number(supplier?.rating ?? 4),
        req.urgency
      );

      return {
        ...req,
        distance: `${distance.toFixed(1)} km`,
        score: Math.min(100, Math.round(score * 100)),
        price: req.quantity * 1450,
      };
    });

    res.json(requestsWithScores);
  } catch (error) {
    console.error('Supplier requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/suppliers/:id/active-deliveries - Get active deliveries
router.get('/:id/active-deliveries', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const resolvedSupplierId = await resolveSupplierIdForUser(user);

    if (resolvedSupplierId !== id && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const deliveries = await prisma.order.findMany({
      where: {
        matched_supplier_id: id,
        status: { in: ['DISPATCHED', 'IN_TRANSIT'] },
      },
      include: {
        product: true,
        buyer: { select: { id: true, name: true } },
        tracking: true,
      },
      orderBy: { created_at: 'desc' },
    });

    res.json(deliveries);
  } catch (error) {
    console.error('Active deliveries error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/suppliers/:id/history - Get completed orders
router.get('/:id/history', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const resolvedSupplierId = await resolveSupplierIdForUser(user);

    if (resolvedSupplierId !== id && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const history = await prisma.order.findMany({
      where: {
        matched_supplier_id: id,
        status: 'DELIVERED',
      },
      include: {
        product: true,
        buyer: { select: { id: true, name: true } },
        matched_supplier: { select: { rating: true } },
      },
      orderBy: { delivered_at: 'desc' },
    });

    // Calculate earnings for each order
    const historyWithEarnings = await Promise.all(
      history.map(async order => {
        const inventory = await prisma.inventory.findUnique({
          where: {
            supplier_id_product_id: {
              supplier_id: id,
              product_id: order.product_id,
            },
          },
          select: { price_per_unit: true },
        });

        return {
          ...order,
          earnings: order.quantity * Number(inventory?.price_per_unit || 1450),
          fulfillmentTime: order.estimated_delivery_minutes,
        };
      })
    );

    res.json(historyWithEarnings);
  } catch (error) {
    console.error('Supplier history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/suppliers/:id/inventory - Get supplier inventory
router.get('/:id/inventory', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const resolvedSupplierId = await resolveSupplierIdForUser(user);

    if (resolvedSupplierId !== id && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const inventory = await prisma.inventory.findMany({
      where: { supplier_id: id },
      include: {
        product: true,
      },
    });

    res.json(inventory);
  } catch (error) {
    console.error('Supplier inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/suppliers/:id/inventory - Add a NEW product to supplier inventory
router.post('/:id/inventory', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { product_id, quantity, price_per_unit } = req.body;
    const user = (req as any).user;
    const resolvedSupplierId = await resolveSupplierIdForUser(user);

    if (resolvedSupplierId !== id && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!product_id || quantity === undefined || price_per_unit === undefined) {
      return res.status(400).json({ error: 'product_id, quantity, and price_per_unit are required' });
    }

    // Check if already exists
    const existing = await prisma.inventory.findUnique({
      where: { supplier_id_product_id: { supplier_id: id, product_id } },
    });
    if (existing) {
      return res.status(409).json({ error: 'Product already in inventory. Use the edit (pencil) button to update it.' });
    }

    const item = await prisma.inventory.create({
      data: {
        supplier_id: id,
        product_id,
        quantity: parseInt(quantity),
        price_per_unit: parseFloat(price_per_unit),
      },
      include: { product: true },
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Add inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/suppliers/:id/inventory/:productId - Update inventory quantity and/or price
router.patch('/:id/inventory/:productId', authenticateToken, async (req, res) => {
  try {
    const { id, productId } = req.params;
    const { quantity, price_per_unit } = req.body;
    const user = (req as any).user;
    const resolvedSupplierId = await resolveSupplierIdForUser(user);

    if (resolvedSupplierId !== id && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updateData: any = {};
    if (quantity !== undefined) updateData.quantity = parseInt(quantity);
    if (price_per_unit !== undefined) updateData.price_per_unit = parseFloat(price_per_unit);

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Nothing to update. Provide quantity or price_per_unit.' });
    }

    const inventory = await prisma.inventory.update({
      where: {
        supplier_id_product_id: {
          supplier_id: id,
          product_id: productId,
        },
      },
      data: updateData,
      include: { product: true },
    });

    res.json(inventory);
  } catch (error) {
    console.error('Inventory update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to calculate distance using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper function to calculate match score
function calculateMatchScore(distance: number, rating: number, urgency: string): number {
  const maxDistance = 50; // 50 km is max
  const distanceScore = Math.max(0, 1 - (distance / maxDistance));
  const ratingScore = rating / 5;

  // Weight based on urgency
  const weights = {
    P1: { distance: 0.5, rating: 0.5 },
    P2: { distance: 0.4, rating: 0.6 },
    P3: { distance: 0.3, rating: 0.7 },
  };

  const weight = weights[urgency as keyof typeof weights] || weights.P3;
  return (distanceScore * weight.distance) + (ratingScore * weight.rating);
}

export default router;
