import { Router, Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { supabaseServiceClient } from '../config/supabase';
import { AuthToken, User } from '../types/index';

export const authRoutes = Router();

const jwtSecret: Secret = process.env.JWT_SECRET || 'secret';
const accessTokenExpiry = (process.env.JWT_EXPIRY || '7d') as SignOptions['expiresIn'];
const refreshTokenExpiry = '30d' as SignOptions['expiresIn'];

// Register
authRoutes.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, area } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseServiceClient
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create user
    const userId = uuidv4();
    const { error: insertError } = await supabaseServiceClient
      .from('users')
      .insert({
        id: userId,
        email,
        password_hash: hashedPassword,
        name,
        role,
        area,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (insertError) {
      throw insertError;
    }

    // Generate JWT tokens
    const accessToken = jwt.sign(
      { id: userId, email, role },
      jwtSecret,
      { expiresIn: accessTokenExpiry }
    );

    const refreshToken = jwt.sign(
      { id: userId },
      jwtSecret,
      { expiresIn: refreshTokenExpiry }
    );

    const user: User = {
      id: userId,
      email,
      name,
      role: role as any,
      area,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
    };

    const response: AuthToken = {
      access_token: accessToken,
      refresh_token: refreshToken,
      user,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
authRoutes.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    // Find user
    const { data: user, error: queryError } = await supabaseServiceClient
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (queryError || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const passwordMatch = await bcryptjs.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT tokens
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: accessTokenExpiry }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      jwtSecret,
      { expiresIn: refreshTokenExpiry }
    );

    const response: AuthToken = {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        area: user.area,
        created_at: user.created_at,
        updated_at: user.updated_at,
        is_active: user.is_active,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Refresh token
authRoutes.post('/refresh', (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Missing refresh token' });
    }

    const decoded = jwt.verify(refresh_token, jwtSecret) as any;

    const accessToken = jwt.sign(
      { id: decoded.id },
      jwtSecret,
      { expiresIn: accessTokenExpiry }
    );

    res.json({ access_token: accessToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});
