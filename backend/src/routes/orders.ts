import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/orders - List all orders (with filtering by role)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, urgency, buyerId, supplierId, limit = 50, offset = 0 } = req.query;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    // Build where clause based on filters and user role
    let where: any = {};

    if (userRole === 'BUYER') {
      where.buyer_id = userId;
    } else if (userRole === 'SUPPLIER') {
      where.matched_supplier_id = (req as any).user.supplierId;
    }
    // ADMIN can see all

    if (status) where.status = status;
    if (urgency) where.urgency = urgency;
    if (buyerId) where.buyer_id = buyerId;
    if (supplierId) where.matched_supplier_id = supplierId;

    const orders = await prisma.order.findMany({
      where,
      include: {
        buyer: { select: { id: true, name: true, company: true } },
        product: { select: { id: true, name: true } },
        matched_supplier: { select: { id: true, company_name: true, rating: true, address: true, latitude: true, longitude: true } },
        order_events: { orderBy: { timestamp: 'desc' } },
        tracking: true,
      },
      orderBy: { created_at: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.order.count({ where });

    res.json({
      data: orders,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error) {
    console.error('Orders list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/:id - Get single order details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        buyer: { select: { id: true, name: true, company: true, email: true } },
        product: true,
        matched_supplier: { select: { id: true, company_name: true, rating: true, address: true, latitude: true, longitude: true, avg_fulfillment_time_minutes: true } },
        order_events: { orderBy: { timestamp: 'desc' } },
        tracking: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Order details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders - Create new order
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { product_id, quantity, delivery_address, delivery_lat, delivery_lng, urgency, matched_supplier_id, match_score } = req.body;
    const userId = (req as any).user.id;

    if (!product_id || !quantity || !delivery_address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate order number
    const orderCount = await prisma.order.count();
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, '0')}`;

    const order = await prisma.order.create({
      data: {
        order_number: orderNumber,
        buyer_id: userId,
        product_id,
        quantity: parseInt(quantity),
        delivery_address,
        delivery_lat: parseFloat(delivery_lat),
        delivery_lng: parseFloat(delivery_lng),
        urgency: urgency || 'P3',
        status: 'PENDING',
        matched_supplier_id: matched_supplier_id || undefined,
        match_score: match_score ? parseInt(match_score) : undefined,
        estimated_delivery_minutes: urgency === 'P1' ? 25 : urgency === 'P2' ? 40 : 60,
      },
      include: {
        buyer: true,
        product: true,
        matched_supplier: true,
      },
    });

    // Create initial order event
    await prisma.orderEvent.create({
      data: {
        order_id: order.id,
        event_type: 'CREATED',
        description: 'Order created',
      },
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/orders/:id/status - Update order status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userRole = (req as any).user.role;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Only admin and suppliers can update status
    if (!['ADMIN', 'SUPPLIER'].includes(userRole)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        buyer: true,
        product: true,
        matched_supplier: true,
      },
    });

    // Create order event
    await prisma.orderEvent.create({
      data: {
        order_id: id,
        event_type: status,
        description: `Order status changed to ${status}`,
      },
    });

    // If status is IN_TRANSIT, create delivery tracking record
    if (status === 'IN_TRANSIT') {
      const existingTracking = await prisma.deliveryTracking.findUnique({ where: { order_id: id } });
      if (!existingTracking) {
        await prisma.deliveryTracking.create({
          data: {
            order_id: id,
            rider_lat: order.matched_supplier?.latitude || 19.0760,
            rider_lng: order.matched_supplier?.longitude || 72.8777,
            driver_name: 'Driver',
            driver_phone: '9820000001',
            driver_rating: 4.8,
          },
        });
      }
    }

    res.json(order);
  } catch (error) {
    console.error('Order status update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/:id/tracking - Get delivery tracking
router.get('/:id/tracking', async (req, res) => {
  try {
    const { id } = req.params;

    const tracking = await prisma.deliveryTracking.findUnique({
      where: { order_id: id },
    });

    if (!tracking) {
      return res.status(404).json({ error: 'Tracking not found' });
    }

    res.json(tracking);
  } catch (error) {
    console.error('Tracking fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders/:id/tracking - Update delivery tracking
router.post('/:id/tracking', async (req, res) => {
  try {
    const { id } = req.params;
    const { rider_lat, rider_lng, speed_kmh, heading } = req.body;

    if (!rider_lat || !rider_lng) {
      return res.status(400).json({ error: 'Coordinates required' });
    }

    const tracking = await prisma.deliveryTracking.upsert({
      where: { order_id: id },
      update: {
        rider_lat: parseFloat(rider_lat),
        rider_lng: parseFloat(rider_lng),
        speed_kmh: speed_kmh ? parseFloat(speed_kmh) : undefined,
        heading: heading ? parseFloat(heading) : undefined,
        timestamp: new Date(),
      },
      create: {
        order_id: id,
        rider_lat: parseFloat(rider_lat),
        rider_lng: parseFloat(rider_lng),
        driver_name: 'Driver',
        driver_phone: '0000000000',
        driver_rating: 5.0,
      },
    });

    res.json(tracking);
  } catch (error) {
    console.error('Tracking update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
