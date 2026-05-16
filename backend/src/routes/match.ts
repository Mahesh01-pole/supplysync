import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// POST /api/match
router.post('/', async (req, res) => {
  try {
    const { product_id, lat, lng, urgency } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Missing coordinates (lat, lng).' });
    }

    if (!product_id) {
      return res.status(400).json({ error: 'Missing product_id.' });
    }

    // Since PostGIS is not installed, we fetch suppliers and use Haversine in JS
    const suppliers: any[] = await prisma.$queryRawUnsafe(`
      SELECT
        s.id,
        s.company_name as name,
        s.rating,
        s.latitude,
        s.longitude,
        i.quantity,
        i.price_per_unit as price
      FROM "Supplier" s
      JOIN "Inventory" i ON s.id = i.supplier_id
      WHERE i.product_id = $1::uuid
        AND i.quantity > 0
        AND s.active = true
        AND s.latitude IS NOT NULL
        AND s.longitude IS NOT NULL
    `, product_id);

    if (!suppliers || suppliers.length === 0) {
      return res.status(404).json({ error: 'No supplier found within proximity with sufficient inventory.' });
    }

    // Haversine formula
    const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    const suppliersWithDist = suppliers.map(s => {
      const dist = getDistanceKm(lat, lng, s.latitude, s.longitude);
      return { ...s, distanceKm: dist };
    });

    // Filter within 10000km and sort by distance
    const nearby = suppliersWithDist.filter(s => s.distanceKm <= 10000);
    
    if (nearby.length === 0) {
      return res.status(404).json({ error: 'No suppliers found.' });
    }

    // Sort: if P1 prioritize distance, else sort by distance
    nearby.sort((a, b) => a.distanceKm - b.distanceKm);

    const winner = nearby[0];
    const distanceKm = winner.distanceKm;

    // Calculate real ETA based on distance and urgency
    const speedKmh = {
      'P1': 40, // Fast track - 40 km/h average
      'P2': 30, // Standard - 30 km/h average
      'P3': 25  // Economy - 25 km/h average
    };

    const baseSpeed = speedKmh[urgency as keyof typeof speedKmh] || 30;
    const etaMinutes = Math.ceil((distanceKm / baseSpeed) * 60);

    // Calculate match score (0-100)
    // Factors: distance (40%), rating (30%), inventory (20%), urgency fulfillment (10%)
    const maxDistance = Math.max(...nearby.map(s => s.distanceKm), 1); // dynamic normalization
    const distanceScore = Math.max(0, (1 - winner.distanceKm / maxDistance)) * 40;
    const ratingScore = (winner.rating / 5) * 30;
    const inventoryScore = Math.min(winner.quantity / 100, 1) * 20;
    const urgencyBonus = urgency === 'P1' ? 10 : urgency === 'P2' ? 5 : 0;
    const totalScore = Math.min(100, Math.round(distanceScore + ratingScore + inventoryScore + urgencyBonus));

    res.json({
      id: winner.id,
      name: winner.name,
      rating: winner.rating.toString(),
      distance: `${distanceKm.toFixed(1)} km`,
      eta: `${etaMinutes} mins`,
      score: totalScore,
      price: winner.price.toString(),
      quantity_available: winner.quantity
    });

  } catch (error) {
    console.error('Match error:', error);
    res.status(500).json({ error: 'Internal Server Error during matching.' });
  }
});

export default router;

