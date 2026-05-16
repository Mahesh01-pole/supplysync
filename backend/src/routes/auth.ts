import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { supplier: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare password with bcrypt hash
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get JWT secret from environment
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET not set in environment');
      return res.status(500).json({ error: 'Internal server error' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, supplierId: user.supplier?.id },
      jwtSecret,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        supplierId: user.supplier?.id ?? null,
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role, company, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password with bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await prisma.user.create({
      data: {
        email,
        password_hash: passwordHash,
        name,
        role: role || 'BUYER',
        company,
        phone
      },
      include: { supplier: true }
    });

    // If registering as SUPPLIER, auto-create a Supplier profile
    let supplierId: string | undefined;
    if (role === 'SUPPLIER') {
      const supplier = await prisma.supplier.create({
        data: {
          user_id: user.id,
          company_name: company || `${name}'s Supply Co.`,
          address: 'Mumbai, India',
          latitude: 19.0760 + (Math.random() - 0.5) * 0.1,
          longitude: 72.8777 + (Math.random() - 0.5) * 0.1,
          rating: 4.5,
          active: true,
          avg_fulfillment_time_minutes: 45,
        }
      });
      supplierId = supplier.id;

      // Seed default inventory for the new supplier
      const products = await prisma.product.findMany();
      if (products.length > 0) {
        await prisma.inventory.createMany({
          data: products.map(p => ({
            supplier_id: supplier.id,
            product_id: p.id,
            quantity: 500,
            price_per_unit: 1000
          }))
        });
      }
    }

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        supplierId,
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// GET /api/auth/me - Get current user profile from JWT
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        company: true,
        phone: true,
        supplier: { select: { id: true, company_name: true, rating: true } },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      company: user.company,
      phone: user.phone,
      supplierId: user.supplier?.id ?? null,
      supplierName: user.supplier?.company_name ?? null,
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
