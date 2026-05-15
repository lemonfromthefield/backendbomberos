import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabaseServiceClient } from '../config/supabase';
import { roleMiddleware } from '../middleware/auth.middleware';

export const budgetRoutes = Router();

// Create budget (admin_general only)
budgetRoutes.post('/', roleMiddleware(['admin_general']), async (req: Request, res: Response) => {
  try {
    const { year, total_amount } = req.body;
    const userId = req.user?.id;

    if (!year || !total_amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: budget, error } = await supabaseServiceClient
      .from('budgets')
      .insert({
        id: uuidv4(),
        year,
        total_amount,
        spent_amount: 0,
        remaining_amount: total_amount,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json(budget);
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({ error: 'Failed to create budget' });
  }
});

// Get current year budget
budgetRoutes.get('/current', async (req: Request, res: Response) => {
  try {
    const currentYear = new Date().getFullYear();

    const { data: budget, error } = await supabaseServiceClient
      .from('budgets')
      .select('*')
      .eq('year', currentYear)
      .single();

    if (error && error.code === 'PGRST116') {
      return res.status(404).json({ error: 'No budget found for current year' });
    }

    if (error) {
      throw error;
    }

    res.json(budget);
  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({ error: 'Failed to fetch budget' });
  }
});

// Record purchase
budgetRoutes.post('/purchase', roleMiddleware(['admin_general']), async (req: Request, res: Response) => {
  try {
    const { ticket_id, amount_spent, notes } = req.body;

    if (!ticket_id || !amount_spent) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: record, error } = await supabaseServiceClient
      .from('purchase_records')
      .insert({
        id: uuidv4(),
        ticket_id,
        amount_spent,
        notes,
        date_purchased: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json(record);
  } catch (error) {
    console.error('Record purchase error:', error);
    res.status(500).json({ error: 'Failed to record purchase' });
  }
});

// Get all purchase records
budgetRoutes.get('/records', async (req: Request, res: Response) => {
  try {
    const { data: records, error } = await supabaseServiceClient
      .from('purchase_records')
      .select('*')
      .order('date_purchased', { ascending: false });

    if (error) {
      throw error;
    }

    res.json(records);
  } catch (error) {
    console.error('Get records error:', error);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});
