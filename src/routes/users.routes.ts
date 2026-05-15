import { Router, Request, Response } from 'express';
import { supabaseServiceClient } from '../config/supabase';
import { roleMiddleware } from '../middleware/auth.middleware';

export const usersRoutes = Router();

// Get all users (admin only)
usersRoutes.get('/', roleMiddleware(['admin_general', 'admin_intermedio']), async (req: Request, res: Response) => {
  try {
    const { data: users, error } = await supabaseServiceClient
      .from('users')
      .select('id, email, name, role, area, is_active, created_at');

    if (error) {
      throw error;
    }

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get current user
usersRoutes.get('/me', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const { data: user, error } = await supabaseServiceClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user (admin_general only)
usersRoutes.patch('/:id', roleMiddleware(['admin_general']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role, is_active } = req.body;

    const updateData: any = { updated_at: new Date().toISOString() };

    if (role) updateData.role = role;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: user, error } = await supabaseServiceClient
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});
