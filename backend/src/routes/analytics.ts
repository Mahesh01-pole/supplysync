import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Groq from 'groq-sdk';

const router = Router();
const prisma = new PrismaClient();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

router.get('/stats', async (req: Request, res: Response) => {
  try {
    // 1. Order Volume (Simplified for demo to show total counts per status)
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const statusDistribution = statusCounts.map((item: any) => ({
      name: item.status,
      value: item._count.id
    }));

    // 2. Order Urgency Distribution
    const urgencyCounts = await prisma.order.groupBy({
      by: ['urgency'],
      _count: {
        id: true,
      },
    });

    const barData = urgencyCounts.map((item: any) => ({
      name: item.urgency,
      count: item._count.id
    }));

    // 3. Weekly Order Volume (Real Data for last 7 days)
    const lineData = await prisma.$queryRaw`
      SELECT 
        TO_CHAR(created_at, 'Dy') as name,
        COUNT(id)::int as orders,
        COALESCE(AVG(match_score), 0)::float as avg_match_score
      FROM "Order"
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY TO_CHAR(created_at, 'Dy'), DATE(created_at)
      ORDER BY DATE(created_at) ASC;
    `;

    // 4. Top 3 Products by Order Volume
    const topProducts = await prisma.$queryRaw`
      SELECT 
        p.name,
        COUNT(o.id)::int as volume
      FROM "Product" p
      JOIN "Order" o ON p.id = o.product_id
      GROUP BY p.id, p.name
      ORDER BY volume DESC
      LIMIT 3;
    `;

    // 5. Supplier Fulfillment Leaderboard
    const supplierLeaderboard = await prisma.$queryRaw`
      SELECT 
        s.company_name,
        COUNT(o.id)::int as total_orders,
        SUM(CASE WHEN o.status = 'DELIVERED' THEN 1 ELSE 0 END)::int as delivered_orders,
        ROUND((SUM(CASE WHEN o.status = 'DELIVERED' THEN 1.0 ELSE 0.0 END) / NULLIF(COUNT(o.id), 0)) * 100, 1)::float as fulfillment_rate
      FROM "Supplier" s
      JOIN "Order" o ON s.id = o.matched_supplier_id
      GROUP BY s.id, s.company_name
      HAVING COUNT(o.id) > 0
      ORDER BY fulfillment_rate DESC, total_orders DESC
      LIMIT 5;
    `;

    res.json({
      statusDistribution,
      urgencyDistribution: barData,
      weeklyVolume: lineData,
      topProducts,
      supplierLeaderboard
    });
  } catch (error) {
    console.error("Failed to fetch analytics stats", error);
    res.status(500).json({ error: 'Failed to fetch analytics stats' });
  }
});

router.get('/insights', async (req: Request, res: Response) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'GROQ_API_KEY is not configured on the server.' });
    }

    // 1. Fetch real aggregation data to feed to Groq
    const totalOrders = await prisma.order.count();
    const pendingOrders = await prisma.order.count({ where: { status: 'PENDING' } });
    const inTransit = await prisma.order.count({ where: { status: 'IN_TRANSIT' } });
    const activeSuppliers = await prisma.supplier.count({ where: { active: true } });
    const p1Orders = await prisma.order.count({ where: { urgency: 'P1' } });
    const delayedDeliveries = await prisma.order.count({
      where: {
        status: 'IN_TRANSIT',
        estimated_delivery_minutes: { gt: 60 } // simplified SLA logic
      }
    });

    // 2. Fetch weather context
    let weatherContext = "Unknown weather";
    if (process.env.OPENWEATHERMAP_API_KEY) {
      try {
        const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=19.0760&lon=72.8777&appid=${process.env.OPENWEATHERMAP_API_KEY}&units=metric`);
        const weatherData = await weatherRes.json();
        weatherContext = JSON.stringify(weatherData);
      } catch (e) {
        weatherContext = "Failed to fetch weather";
      }
    }

    const dataContext = `
      SupplySync Platform Real-time Metrics:
      - Total Lifecycle Orders: ${totalOrders}
      - Currently Pending Assignment: ${pendingOrders}
      - Currently In Transit: ${inTransit}
      - High Urgency (P1) Orders: ${p1Orders}
      - Active Suppliers Online: ${activeSuppliers}
      - Potential SLA Breaches (Transit > 60m): ${delayedDeliveries}
      - Current Weather in Mumbai: ${weatherContext}
    `;

    const prompt = `
      You are an expert logistics and supply chain AI analyst for a platform called SupplySync.
      Review the following real-time metrics and weather data:
      ${dataContext}
      
      You must return exactly a raw JSON object with 3 fields (and absolutely no markdown formatting, no \`\`\`json blocks):
      1. "insights": an array of 3 distinct string sentences based on the metrics and weather.
      2. "weather_context": a short string summarizing the weather condition.
      3. "risk_level": string, exactly one of "low", "medium", or "high".
    `;

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You are a highly efficient JSON API. Only return valid JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
    });
    
    const responseText = response.choices[0]?.message?.content || "{}";
    
    // Attempt to parse JSON safely
    let parsedJson;
    try {
      parsedJson = JSON.parse(responseText.trim().replace(/```json/gi, '').replace(/```/g, ''));
    } catch (e) {
      console.error("Failed to parse Groq JSON response:", responseText);
      parsedJson = {
        insights: ["Failed to generate insights format.", "Raw response was invalid JSON."],
        weather_context: "Unknown",
        risk_level: "high"
      };
    }

    res.json(parsedJson);
  } catch (error: any) {
    console.error("Failed to generate AI insights:", error?.message || error);
    res.status(500).json({ 
      error: 'Failed to generate AI insights',
      detail: error?.message || String(error)
    });
  }
});

export default router;
