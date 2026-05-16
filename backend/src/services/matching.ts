import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize Mock Redis Client for Weather Caching (User does not have Redis)
const redisClient = {
  isOpen: false,
  on: (event: string, callback: any) => {},
  connect: async () => {},
  get: async (key: string) => null,
  setEx: async (key: string, time: number, value: string) => {}
};

interface OrderCriteria {
  product_id: string;
  qty: number;
  urgency: 'P1' | 'P2' | 'P3';
  lon: number;
  lat: number;
}

export async function findBestSupplier(order: OrderCriteria) {
  // Since PostGIS is not installed, we fetch suppliers and use Haversine in JS
  const suppliers: any[] = await prisma.$queryRaw`
    SELECT 
      s.id, 
      s.company_name,
      s.rating, 
      s.latitude,
      s.longitude,
      s.total_orders_fulfilled,
      s.avg_fulfillment_time_minutes,
      i.quantity as stock
    FROM "Supplier" s
    JOIN "Inventory" i ON s.id = i.supplier_id
    WHERE i.product_id = CAST(${order.product_id}::text AS UUID)
      AND i.quantity > 0
      AND s.active = true
      AND s.latitude IS NOT NULL
      AND s.longitude IS NOT NULL
  `;

  if (!suppliers || suppliers.length === 0) {
    return [];
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
    const dist = getDistanceKm(order.lat, order.lon, s.latitude, s.longitude);
    return { ...s, distance_km: dist };
  });

  // Filter out suppliers > 10000km
  const nearbySuppliers = suppliersWithDist.filter(s => s.distance_km <= 10000);

  if (nearbySuppliers.length === 0) {
    return [];
  }

  // Calculate dynamic max distance across all candidates for fair normalization
  const maxDist = Math.max(...nearbySuppliers.map(s => s.distance_km), 1);

  // Calculate scores for each supplier concurrently
  const scoredSuppliers = await Promise.all(
    nearbySuppliers.map(async (s) => {
      const breakdown = await scoreSupplier(
        s,
        { qty: order.qty, urgency: order.urgency, lon: order.lon, lat: order.lat },
        Number(s.distance_km),
        maxDist
      );
      
      return {
        ...s,
        score: parseFloat(breakdown.finalScore.toFixed(4)),
        weather_penalty: breakdown.weatherPenalty
      };
    })
  );

  // Sort by score descending
  const sortedByCandidates = scoredSuppliers.sort((a, b) => b.score - a.score);
  return sortedByCandidates;
}

export async function scoreSupplier(
  supplier: any, 
  order: { qty: number, urgency: 'P1' | 'P2' | 'P3', lon: number, lat: number }, 
  distanceKm: number,
  maxDistanceKm: number = 100
) {
  let weatherPenalty = 0;
  
  if (process.env.OPENWEATHERMAP_API_KEY) {
    // Cache key rounded to 2 decimal places to increase cache hit rate for nearby orders
    const cacheKey = `weather:${order.lat.toFixed(2)}:${order.lon.toFixed(2)}`;
    let weatherData;

    try {
      if (redisClient.isOpen) {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          weatherData = JSON.parse(cached);
        }
      }

      if (!weatherData) {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${order.lat}&lon=${order.lon}&appid=${process.env.OPENWEATHERMAP_API_KEY}&units=metric`);
        if (res.ok) {
          weatherData = await res.json();
          if (redisClient.isOpen) {
            // Cache in Redis for 10 minutes (600 seconds)
            await redisClient.setEx(cacheKey, 600, JSON.stringify(weatherData));
          }
        }
      }

      if (weatherData) {
        // OpenWeatherMap rain is in mm/hr, wind speed is in m/s (metric)
        const rain1h = weatherData.rain ? weatherData.rain['1h'] || 0 : 0;
        const windSpeedKmh = (weatherData.wind ? weatherData.wind.speed || 0 : 0) * 3.6;

        // If rain > 5mm/hr or wind > 50km/h AND supplier is far (> 30km)
        if ((rain1h > 5 || windSpeedKmh > 50) && distanceKm > 30) {
          weatherPenalty = 0.15;
        }
      }
    } catch (err) {
      console.error("Error fetching weather for scoring:", err);
    }
  }

  // 0–1: normalize distance against the pool's max distance for fair global scoring
  let distanceScore = Math.max(0, 1 - distanceKm / maxDistanceKm);
  
  // Apply Weather Penalty to distance score
  distanceScore = Math.max(0, distanceScore - weatherPenalty);
  
  // 0–1, full stock = 1
  const stockScore = Math.min(supplier.stock / order.qty, 1);
  
  // Rating score 0-1
  const ratingScore = Number(supplier.rating) / 5;
  
  // Reliability score fallback
  const reliabilityScore = supplier.fulfillmentRate || 0.9; 

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

  // Return a structured breakdown
  return {
    finalScore,
    weatherPenalty,
    distanceScore,
    stockScore,
    ratingScore,
    reliabilityScore
  };
}
