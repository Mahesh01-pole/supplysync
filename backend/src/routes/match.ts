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

    // Raw PostGIS Match: We calculate the physical ST_DistanceSphere between
    // the buyer's lat/lng and all suppliers holding > 0 of this product.
    const sql = `
      SELECT
        s.id,
        s.company_name as name,
        s.rating,
        ST_DistanceSphere(s.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)) AS distance_meters,
        i.quantity,
        i.price_per_unit as price
      FROM "Supplier" s
      JOIN "Inventory" i ON s.id = i.supplier_id
      WHERE i.product_id = $3::uuid
        AND i.quantity > 0
        AND s.active = true
      ORDER BY
        CASE WHEN $4 = 'P1' THEN ST_DistanceSphere(s.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)) END ASC,
        s.rating DESC
      LIMIT 1;
    `;

    const matches: any[] = await prisma.$queryRawUnsafe(sql, lng, lat, product_id, urgency || 'P3');

    if (!matches || matches.length === 0) {
      return res.status(404).json({ error: 'No supplier found within proximity with sufficient inventory.' });
    }

    const winner = matches[0];
    const distanceKm = winner.distance_meters / 1000;

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
    const maxDistance = 50; // 50 km
    const distanceScore = Math.max(0, (1 - distanceKm / maxDistance)) * 40;
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

