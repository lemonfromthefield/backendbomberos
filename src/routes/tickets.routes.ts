import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabaseServiceClient } from '../config/supabase';
import { roleMiddleware } from '../middleware/auth.middleware';
import { Ticket, Priority, TicketStatus } from '../types/index';

export const ticketsRoutes = Router();

// Create ticket (usuario_general)
ticketsRoutes.post('/', roleMiddleware(['usuario_general']), async (req: Request, res: Response) => {
  try {
    const { title, description, suggested_priority, products, suggested_providers, signature, area } = req.body;
    const userId = req.user?.id;

    if (!title || !description || !suggested_priority || !products || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const ticketId = uuidv4();
    const now = new Date().toISOString();

    const { data: ticket, error } = await supabaseServiceClient
      .from('tickets')
      .insert({
        id: ticketId,
        user_id: userId,
        area: area || 'Sin especificar',
        title,
        description,
        suggested_priority,
        status: 'pendiente',
        products,
        suggested_providers,
        signature,
        order: 0,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// Get all tickets (all users)
ticketsRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const { status, priority, role } = req.query;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    let query = supabaseServiceClient.from('tickets').select('*');

    // Filter based on user role
    if (userRole === 'usuario_general') {
      query = query.eq('user_id', userId);
    }

    if (status) {
      query = query.eq('status', status as TicketStatus);
    }

    if (priority) {
      query = query.eq('assigned_priority', priority as Priority);
    }

    const { data: tickets, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json(tickets);
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Get ticket by ID
ticketsRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    let query = supabaseServiceClient.from('tickets').select('*').eq('id', id);

    // Restrict access for general users
    if (userRole === 'usuario_general') {
      query = query.eq('user_id', userId);
    }

    const { data: ticket, error } = await query.single();

    if (error) {
      throw error;
    }

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// Update ticket status and priority (admin_intermedio, admin_general)
ticketsRoutes.patch('/:id', roleMiddleware(['admin_intermedio', 'admin_general']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, assigned_priority, comment } = req.body;
    const userId = req.user?.id;

    const updateData: any = { updated_at: new Date().toISOString() };

    if (status) updateData.status = status;
    if (assigned_priority) updateData.assigned_priority = assigned_priority;

    const { data: ticket, error } = await supabaseServiceClient
      .from('tickets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Add comment if provided
    if (comment) {
      const { data: user } = await supabaseServiceClient
        .from('users')
        .select('name')
        .eq('id', userId)
        .single();

      await supabaseServiceClient
        .from('ticket_comments')
        .insert({
          id: uuidv4(),
          ticket_id: id,
          user_id: userId,
          user_name: user?.name || 'Unknown',
          text: comment,
          created_at: new Date().toISOString(),
        });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// Reorder tickets (admin_intermedio, admin_general)
ticketsRoutes.post('/reorder', roleMiddleware(['admin_intermedio', 'admin_general']), async (req: Request, res: Response) => {
  try {
    const { ticketId, newPriority, newOrder } = req.body;

    const { error } = await supabaseServiceClient
      .from('tickets')
      .update({
        assigned_priority: newPriority,
        order: newOrder,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId);

    if (error) {
      throw error;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Reorder error:', error);
    res.status(500).json({ error: 'Failed to reorder tickets' });
  }
});

// Add comment to ticket
ticketsRoutes.post('/:id/comments', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user?.id;

    if (!text) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const { data: user } = await supabaseServiceClient
      .from('users')
      .select('name')
      .eq('id', userId)
      .single();

    const { data: comment, error } = await supabaseServiceClient
      .from('ticket_comments')
      .insert({
        id: uuidv4(),
        ticket_id: id,
        user_id: userId,
        user_name: user?.name || 'Unknown',
        text,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json(comment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});
