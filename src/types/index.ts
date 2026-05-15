export type UserRole = 'admin_general' | 'admin_intermedio' | 'usuario_general';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  area?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface AuthToken {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface Ticket {
  id: string;
  user_id: string;
  area: string;
  title: string;
  description: string;
  suggested_priority: Priority;
  assigned_priority?: Priority;
  status: TicketStatus;
  products: Product[];
  suggested_providers?: string;
  signature: string;
  comments: Comment[];
  created_at: string;
  updated_at: string;
  order: number;
}

export type Priority = 'URGENTE' | 'Alta' | 'Media' | 'Baja' | 'Sin Prioridad';
export type TicketStatus = 'pendiente' | 'aceptado' | 'denegado' | 'comprado';

export interface Product {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  suggested_brand?: string;
}

export interface Comment {
  id: string;
  user_id: string;
  user_name: string;
  text: string;
  created_at: string;
}

export interface Budget {
  id: string;
  year: number;
  total_amount: number;
  spent_amount: number;
  remaining_amount: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseRecord {
  id: string;
  ticket_id: string;
  amount_spent: number;
  date_purchased: string;
  notes?: string;
  created_at: string;
}
