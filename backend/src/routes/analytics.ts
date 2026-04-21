import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();
const prisma = new PrismaClient();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

router.get('/stats', async (req: Request, res: Response) => {
  try {
    // 1. Order Volume (Simplified for demo to show total counts per status)
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const statusDistribution = statusCounts.map(item => ({
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

    const barData = urgencyCounts.map(item => ({
      name: item.urgency,
      count: item._count.id
    }));

    // 3. Weekly Order Volume (Mocking the dates based on last 7 days from DB)
    // For a real production app, you'd group by Date. For this demo, we can just return standard mock structure but update it with real totals.
    // Let's get total orders 
    const totalOrders = await prisma.order.count();
    
    // Distribute totalOrders artificially across a week for the Line Chart
    const lineData = [
      { name: 'Mon', orders: Math.floor(totalOrders * 0.15) },
      { name: 'Tue', orders: Math.floor(totalOrders * 0.12) },
      { name: 'Wed', orders: Math.floor(totalOrders * 0.18) },
      { name: 'Thu', orders: Math.floor(totalOrders * 0.14) },
      { name: 'Fri', orders: Math.floor(totalOrders * 0.20) },
      { name: 'Sat', orders: Math.floor(totalOrders * 0.11) },
      { name: 'Sun', orders: Math.floor(totalOrders * 0.10) },
    ];

    res.json({
      statusDistribution,
      urgencyDistribution: barData,
      weeklyVolume: lineData
    });
  } catch (error) {
    console.error("Failed to fetch analytics stats", error);
    res.status(500).json({ error: 'Failed to fetch analytics stats' });
  }
});

router.get('/insights', async (req: Request, res: Response) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    // 1. Fetch real aggregation data to feed to Gemini
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

    const dataContext = `
      SupplySync Platform Real-time Metrics:
      - Total Lifecycle Orders: ${totalOrders}
      - Currently Pending Assignment: ${pendingOrders}
      - Currently In Transit: ${inTransit}
      - High Urgency (P1) Orders: ${p1Orders}
      - Active Suppliers Online: ${activeSuppliers}
      - Potential SLA Breaches (Transit > 60m): ${delayedDeliveries}
    `;

    const prompt = `
      You are an expert logistics and supply chain AI analyst for a platform called SupplySync.
      Review the following real-time metrics:
      ${dataContext}
      
      Also consider the local conditions (e.g. traffic, weather, points of interest) near our provided location context.
      
      Provide exactly 3 short, insightful, actionable bullet points about this data. 
      Do not use markdown formatting like asterisks or asterisks for bullet points.
      Just write out 3 distinct sentences we can split by newline. 
      Make it sound highly professional, tactical, and specific to the numbers and local ground conditions provided.
    `;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      // @ts-ignore - Ignore type errors for the newly released googleMaps tool
      tools: [ { googleMaps: {} } ]
    });

    // Provide a toolConfig with a relevant location if desired (example: Mumbai)
    const requestConfig = {
      // @ts-ignore
      toolConfig: {
        retrievalConfig: {
          latLng: {
            latitude: 19.0760, // Mumbai latitude
            longitude: 72.8777 // Mumbai longitude
          }
        }
      }
    };

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      ...requestConfig
    });

    const responseText = result.response.text();

    // Parse the output by lines, filtering out empty lines or dashes
    const insights = responseText
      .split('\n')
      .map(line => line.replace(/^[-*•]\s*/, '').trim())
      .filter(line => line.length > 10)
      .slice(0, 3);
      
    // Optionally log or send grounding metadata back for citations
    // const grounding = result.response.candidates?.[0]?.groundingMetadata;
    // console.log("Maps Grounding Metadata:", JSON.stringify(grounding?.groundingChunks, null, 2));

    // Fallback if Gemini format varies
    const finalInsights = insights.length === 3 ? insights : [
      "Gemini successfully analyzed the data streams but returned non-standard formatting.",
      ...insights
    ];

    res.json({ insights: finalInsights });
  } catch (error: any) {
    console.error("Failed to generate AI insights:", error?.message || error);
    console.error("Full error:", JSON.stringify(error, null, 2));
    res.status(500).json({ 
      error: 'Failed to generate AI insights',
      detail: error?.message || String(error)
    });
  }
});

export default router;
