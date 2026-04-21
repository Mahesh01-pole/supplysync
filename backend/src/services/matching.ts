import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface OrderCriteria {
  id: string;
  qty: number;
  urgency: 'P1' | 'P2' | 'P3';
  lon: number;
  lat: number;
}

export async function findBestSupplier(order: OrderCriteria) {
  // Use PostGIS spatial query to find active suppliers within 100km
  // and join with inventory to get the available stock
  
  const query = `
    SELECT 
      s.id, 
      s.rating, 
      s.total_orders_fulfilled,
      s.avg_fulfillment_time_minutes,
      i.quantity as stock,
      ST_Distance(s.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) / 1000 AS distance_km
    FROM "Supplier" s
    JOIN "Inventory" i ON s.id = i.supplier_id
    WHERE i.product_id = $3 
      AND s.active = true
      AND ST_DWithin(s.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 100000)
    ORDER BY distance_km ASC
    LIMIT 20;
  `;
  
  // Note: in actual implementation we need order.product_id, which we pass as $3.
  // For the sake of this mock/prototype according to spec, let's assume raw data comes in.
}

export function scoreSupplier(
  supplier: any, 
  order: { qty: number, urgency: 'P1' | 'P2' | 'P3' }, 
  distanceKm: number
) {
  // 0–1, penalties for distance. e.g. 100km = 0 score
  const distanceScore = Math.max(0, 1 - distanceKm / 100);
  
  // 0–1, full stock = 1
  const stockScore = Math.min(supplier.stock / order.qty, 1);
  
  // Rating score 0-1
  const ratingScore = supplier.rating / 5;
  
  // Reliability score (assumed fulfillment rate passed in)
  const reliabilityScore = supplier.fulfillmentRate || 0.9; // fallback if not calculated

  let distanceWeight, stockWeight, ratingWeight, reliabilityWeight;

  switch (order.urgency) {
    case 'P1':
      distanceWeight = 0.50;
      stockWeight = 0.30;
      ratingWeight = 0.10;
      reliabilityWeight = 0.10;
      break;
    case 'P2':
      distanceWeight = 0.35;
      stockWeight = 0.35;
      ratingWeight = 0.15;
      reliabilityWeight = 0.15;
      break;
    case 'P3':
    default:
      distanceWeight = 0.20;
      stockWeight = 0.30;
      ratingWeight = 0.25;
      reliabilityWeight = 0.25;
      break;
  }

  const finalScore = (distanceScore * distanceWeight) +
                     (stockScore * stockWeight) +
                     (ratingScore * ratingWeight) +
                     (reliabilityScore * reliabilityWeight);

  return finalScore;
}
