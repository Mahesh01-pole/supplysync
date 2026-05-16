import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { findBestSupplier } from '../services/matching';
import { addOrderToSimulation } from '../websocket/tracking-simulator';
import twilio from 'twilio';

const router = Router();
const prisma = new PrismaClient();

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

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
        buyer: { select: { id: true, name: true, company: true, phone: true } },
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

// GET /api/orders/public/:orderNumber - Public tracking endpoint (MUST be before /:id)
router.get('/public/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const order = await prisma.order.findUnique({
      where: { order_number: orderNumber },
      include: {
        product: true,
        matched_supplier: { select: { company_name: true, latitude: true, longitude: true } },
        tracking: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Public order fetch error:', error);
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
        buyer: { select: { id: true, name: true, company: true, email: true, phone: true } },
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

// POST /api/orders - Create new order with automatic matching
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { product_id, quantity, delivery_address, delivery_lat, delivery_lng, urgency } = req.body;
    const userId = (req as any).user.id;

    if (!product_id || !quantity || !delivery_address || !delivery_lat || !delivery_lng) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Find the best supplier using the matching engine or use the frontend's match
    let bestSupplier: any = null;
    let finalMatchScore = req.body.match_score || 95;

    if (req.body.matched_supplier_id) {
      const dbSupplier = await prisma.supplier.findUnique({ where: { id: req.body.matched_supplier_id } });
      if (dbSupplier) {
        bestSupplier = dbSupplier;
      }
    }

    if (!bestSupplier) {
      const matchingResults = await findBestSupplier({
        product_id,
        qty: parseInt(quantity),
        urgency: (urgency as any) || 'P3',
        lat: parseFloat(delivery_lat),
        lon: parseFloat(delivery_lng)
      });

      bestSupplier = matchingResults.length > 0 ? matchingResults[0] : null;
      if (bestSupplier) {
        finalMatchScore = bestSupplier.score;
      }
    }

    if (!bestSupplier) {
      return res.status(404).json({ error: 'No suitable supplier found within range' });
    }

    // 2. Generate order number
    const orderCount = await prisma.order.count();
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, '0')}`;

    // 3. Route distance calculation (OpenRouteService, fallback to Haversine)
    let route_polyline: any = null;
    let estimated_distance_km: number | null = null;
    let route_duration_sec: number | null = null;

    try {
      const supplierDetails = await prisma.supplier.findUnique({ where: { id: bestSupplier.id } });
      if (supplierDetails?.longitude && supplierDetails?.latitude) {
        // Try OpenRouteService (free, no API key needed for basic use)
        const orsUrl = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${process.env.ORS_API_KEY || ''}&start=${supplierDetails.longitude},${supplierDetails.latitude}&end=${delivery_lng},${delivery_lat}`;
        
        if (process.env.ORS_API_KEY) {
          try {
            const orsRes = await fetch(orsUrl);
            const orsData = await orsRes.json();
            if (orsData.features?.[0]?.properties?.segments?.[0]) {
              const seg = orsData.features[0].properties.segments[0];
              estimated_distance_km = seg.distance / 1000;
              route_duration_sec = seg.duration;
              route_polyline = {
                polyline: orsData.features[0].geometry,
                distance_km: estimated_distance_km,
                duration_sec: route_duration_sec
              };
            }
          } catch (orsErr) {
            console.warn("ORS routing failed, using Haversine:", orsErr);
          }
        }

        // Fallback: Haversine straight-line distance (add 30% for road winding)
        if (!estimated_distance_km) {
          const toRad = (deg: number) => deg * Math.PI / 180;
          const R = 6371; // Earth radius in km
          const dLat = toRad(parseFloat(delivery_lat) - supplierDetails.latitude);
          const dLon = toRad(parseFloat(delivery_lng) - supplierDetails.longitude);
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(supplierDetails.latitude)) *
            Math.cos(toRad(parseFloat(delivery_lat))) *
            Math.sin(dLon / 2) ** 2;
          const straightLine = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          estimated_distance_km = straightLine * 1.3; // ~30% road factor
        }
      }
    } catch (error) {
      console.error("Distance calculation error:", error);
    }

    // Calculate realistic ETA from distance
    // Average speeds (km/h): P1 = 80 (priority express), P2 = 60, P3 = 50
    const avgSpeedKmh = urgency === 'P1' ? 80 : urgency === 'P2' ? 60 : 50;
    const distanceBasedMinutes = estimated_distance_km
      ? Math.ceil((estimated_distance_km / avgSpeedKmh) * 60)
      : (urgency === 'P1' ? 25 : urgency === 'P2' ? 40 : 60); // fallback only if no distance
    const estimated_delivery_minutes = Math.max(distanceBasedMinutes, 5); // minimum 5 mins

    // 4. Create order with automatic match
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
        status: 'MATCHED', // Since we found a match automatically
        matched_supplier_id: bestSupplier.id,
        match_score: finalMatchScore,
        estimated_delivery_minutes,
        matched_at: new Date(),
        route_polyline: route_polyline || undefined,
      },
      include: {
        buyer: true,
        product: true,
        matched_supplier: true,
      },
    });

    // 5. Create initial order events
    await prisma.orderEvent.createMany({
      data: [
        {
          order_id: order.id,
          event_type: 'CREATED',
          description: 'Order created',
        },
        {
          order_id: order.id,
          event_type: 'MATCHED',
          description: `Automatically matched with ${bestSupplier.company_name} (Score: ${bestSupplier.score})`,
        }
      ]
    });

    res.status(201).json({
      ...order,
      estimated_distance_km: estimated_distance_km || bestSupplier?.distance_km
    });
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

    const updateData: any = { status };
    if (status === 'DISPATCHED') updateData.dispatched_at = new Date();
    if (status === 'DELIVERED') updateData.delivered_at = new Date();

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
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
      addOrderToSimulation(id);
    }

    // STEP 7: Twilio SMS Alerts for P1 Orders
    if (order.urgency === 'P1' && (status === 'DISPATCHED' || status === 'DELIVERED')) {
      if (twilioClient && process.env.TWILIO_PHONE_NUMBER && order.buyer.phone) {
        try {
          const tracking = await prisma.deliveryTracking.findUnique({ where: { order_id: id } });
          const driverName = tracking?.driver_name || 'Assigned Driver';
          const eta = order.estimated_delivery_minutes ? `${order.estimated_delivery_minutes} mins` : 'Unknown ETA';
          
          let messageBody = '';
          if (status === 'DISPATCHED') {
            messageBody = `SupplySync Alert: Your critical P1 order ${order.order_number} has been DISPATCHED by ${order.matched_supplier?.company_name || 'Supplier'}. Driver: ${driverName}. ETA: ${eta}.`;
          } else if (status === 'DELIVERED') {
            messageBody = `SupplySync Alert: Your critical P1 order ${order.order_number} has been successfully DELIVERED.`;
          }

          if (messageBody) {
            await twilioClient.messages.create({
              body: messageBody,
              from: process.env.TWILIO_PHONE_NUMBER,
              to: order.buyer.phone // Must be E.164 format, e.g., +919876543210
            });
            console.log(`Twilio SMS sent to ${order.buyer.phone} for order ${order.id} (${status})`);
          }
        } catch (smsError) {
          console.error("Failed to send Twilio SMS:", smsError);
        }
      } else {
        console.warn("Could not send SMS: Missing Twilio credentials or buyer phone number.");
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
