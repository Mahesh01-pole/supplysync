import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { broadcastLocationUpdate } from '../websocket/ws-server';

const router = Router();
const prisma = new PrismaClient();

// POST /api/tracking/update
// Expected body: { orderId: string, lat: number, lng: number, status?: string, eta_minutes?: number }
router.post('/update', async (req, res) => {
  try {
    const { orderId, lat, lng, status, eta_minutes } = req.body;

    if (!orderId || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Missing required fields: orderId, lat, lng' });
    }

    // Default status/eta if not provided
    const updateStatus = status || 'IN_TRANSIT';
    const updateEta = eta_minutes || 10;

    // Persist to DeliveryTracking table
    await prisma.deliveryTracking.upsert({
      where: { order_id: orderId },
      update: {
        rider_lat: lat,
        rider_lng: lng,
        timestamp: new Date(),
      },
      create: {
        order_id: orderId,
        rider_lat: lat,
        rider_lng: lng,
        driver_name: 'Driver',
        driver_phone: '0000000000',
        driver_rating: 5.0,
        timestamp: new Date(),
      },
    });

    // Update order status if needed
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (order && updateStatus !== order.status) {
      // Update order status
      await prisma.order.update({
        where: { id: orderId },
        data: { status: updateStatus }
      });

      // Create order event
      await prisma.orderEvent.create({
        data: {
          order_id: orderId,
          event_type: updateStatus,
          description: `Order status changed to ${updateStatus}`,
          latitude: lat,
          longitude: lng,
        }
      });

      // If delivered, update final tracking data
      if (updateStatus === 'DELIVERED') {
        await prisma.deliveryTracking.update({
          where: { order_id: orderId },
          data: { timestamp: new Date() }
        });
      }
    }

    const update = {
      orderId,
      lat,
      lng,
      status: updateStatus,
      eta_minutes: updateEta
    };

    // Broadcast this real coordinate to all connected WebSockets looking at this order
    broadcastLocationUpdate(update);

    res.json({ success: true, message: 'Location updated and broadcasted', update });
  } catch (error) {
    console.error('Error broadcasting update', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;

