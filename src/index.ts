import express, { Express } from 'express';
import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { authRoutes } from './routes/auth.routes';
import { ticketsRoutes } from './routes/tickets.routes';
import { usersRoutes } from './routes/users.routes';
import { budgetRoutes } from './routes/budget.routes';
import { authMiddleware } from './middleware/auth.middleware';
import { ensureBootstrapAdmin } from './services/bootstrap-admin.service';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app: Express = express();
const PORT = process.env.PORT || 5000;

const parseAllowedOrigins = (): string[] => {
  const singleOrigin = process.env.FRONTEND_URL;
  const multiOrigins = process.env.FRONTEND_URLS;

  const fromList = (multiOrigins || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const merged = [...fromList, singleOrigin || 'http://localhost:5173'];
  return Array.from(new Set(merged));
};

const allowedOrigins = parseAllowedOrigins();

const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    // Allow requests from tools like Postman/cURL or same-origin server calls.
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', authMiddleware, ticketsRoutes);
app.use('/api/users', authMiddleware, usersRoutes);
app.use('/api/budget', authMiddleware, budgetRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
  });
});

const startServer = async () => {
  try {
    await ensureBootstrapAdmin();

    app.listen(PORT, () => {
      console.log(`🔥 Backend server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Startup error:', error);
    process.exit(1);
  }
};

void startServer();
