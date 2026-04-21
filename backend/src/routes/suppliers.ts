import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

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
    const supplierId = (req as any).user.supplierId;

    // Verify supplier owns these requests
    if (supplierId !== id && (req as any).user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get supplier's inventory products
    const supplierInventory = await prisma.inventory.findMany({
      where: { supplier_id: id },
      select: { product_id: true },
    });

    const productIds = supplierInventory.map(inv => inv.product_id);

    // Get pending orders for products this supplier has
    const requests = await prisma.order.findMany({
      where: {
        product_id: { in: productIds },
        status: 'PENDING',
        matched_supplier_id: null,
      },
      include: {
        product: true,
        buyer: { select: { id: true, name: true } },
        supplier: true,
      },
      orderBy: { urgency: 'asc' }, // P1 first
    });

    // Calculate match scores and distances for each request
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      select: { latitude: true, longitude: true, rating: true },
    });

    const requestsWithScores = requests.map(req => {
      const distance = calculateDistance(
        supplier!.latitude,
        supplier!.longitude,
        req.buyer.address ? 19.0760 : 19.0760, // Use buyer's coordinates if available
        req.buyer.address ? 72.8777 : 72.8777
      );

      const score = calculateMatchScore(
        distance,
        supplier!.rating,
        req.urgency
      );

      return {
        ...req,
        distance: distance.toFixed(1),
        score: Math.min(100, Math.round(score * 100)),
        price: 1450, // Default price, should come from inventory
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
    const supplierId = (req as any).user.supplierId;

    if (supplierId !== id && (req as any).user.role !== 'ADMIN') {
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
    const supplierId = (req as any).user.supplierId;

    if (supplierId !== id && (req as any).user.role !== 'ADMIN') {
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
        supplier: { select: { rating: true } },
      },
      orderBy: { updated_at: 'desc' },
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
          earnings: order.quantity * (inventory?.price_per_unit || 1450),
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
    const supplierId = (req as any).user.supplierId;

    if (supplierId !== id && (req as any).user.role !== 'ADMIN') {
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

// PATCH /api/suppliers/:id/inventory/:productId - Update inventory quantity
router.patch('/:id/inventory/:productId', authenticateToken, async (req, res) => {
  try {
    const { id, productId } = req.params;
    const { quantity } = req.body;
    const supplierId = (req as any).user.supplierId;

    if (supplierId !== id && (req as any).user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const inventory = await prisma.inventory.update({
      where: {
        supplier_id_product_id: {
          supplier_id: id,
          product_id: productId,
        },
      },
      data: {
        quantity: parseInt(quantity),
      },
      include: {
        product: true,
      },
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
