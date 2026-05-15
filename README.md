# Backend - Fire Station Order Management System

Backend server built with Node.js, Express, and Supabase.

## Installation

```bash
npm install
```

## Environment Setup

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Client-side anonymous key
- `SUPABASE_SERVICE_KEY` - Server-side service role key
- `JWT_SECRET` - Secret key for JWT tokens
- `FRONTEND_URL` - Frontend URL for CORS

## Development

```bash
npm run dev
```

Server will run on `http://localhost:5000`

## Building

```bash
npm run build
npm start
```

## Database Setup

Execute the SQL schema in `DATABASE_SCHEMA.sql` using Supabase SQL Editor:

1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the contents of `DATABASE_SCHEMA.sql`
5. Execute the query

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token

### Ticket Endpoints

- `GET /api/tickets` - Get tickets (filtered by user role)
- `POST /api/tickets` - Create new ticket
- `GET /api/tickets/:id` - Get specific ticket
- `PATCH /api/tickets/:id` - Update ticket status/priority
- `POST /api/tickets/:id/comments` - Add comment to ticket
- `POST /api/tickets/reorder` - Reorder tickets

### User Endpoints

- `GET /api/users` - Get all users (admin only)
- `GET /api/users/me` - Get current user
- `PATCH /api/users/:id` - Update user (admin only)

### Budget Endpoints

- `GET /api/budget/current` - Get current year budget
- `POST /api/budget` - Create budget (admin only)
- `POST /api/budget/purchase` - Record purchase (admin only)
- `GET /api/budget/records` - Get purchase records

## Project Structure

```
src/
├── config/      # Supabase configuration
├── middleware/  # Auth middleware
├── routes/      # API routes
├── services/    # Business logic
├── types/       # TypeScript types
└── utils/       # Utility functions
```

## Development Tools

- **TypeScript** - Type safety
- **ESLint** - Code linting
- **Nodemon** - Auto-reload on file changes
- **tsx** - TypeScript execution

## License

MIT
