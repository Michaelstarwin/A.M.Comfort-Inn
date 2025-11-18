import express, { Express, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";

// Import routes
import bookingRoutes from './modules/booking/booking.route';
import transactionRoutes from './modules/transaction/transaction.route';
import adminRoutes from './modules/admin/admin.route';

// For async error handling
import "express-async-errors";

dotenv.config();

const app: Express = express();
const host = "0.0.0.0";
const port = Number(process.env.PORT) || 7700;

// --- Core Middleware ---
// Enable CORS with default options
const allowedOrigins = [
  'https://www.amcinn.in',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (e.g., server-to-server, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  maxAge: 600
}));

app.options('*', (req, res) => res.sendStatus(204));
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});
// Parse JSON bodies
app.use(express.json());
// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Express configuration
app.set("host", host);
app.set("port", port);

app.get('/api/admin/test', (req, res) => {
  res.json({ message: 'Direct route works!' });
});
// --- API Routes ---
app.use('/api/bookings', bookingRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);
// Add this RIGHT AFTER your other routes

console.log('Admin routes mounted:', adminRoutes.stack?.length || 'Router check');

// --- Static Assets ---
// Serve uploaded files
const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, "../uploads");
app.use("/uploads", express.static(uploadsDir));

app.get('/_routes', (req,res) => {
  const routes:any[] = [];
  (app as any)._router.stack.forEach((layer:any) => {
    if (layer.route && layer.route.path) {
      routes.push({ path: layer.route.path, methods: Object.keys(layer.route.methods) });
    } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
      layer.handle.stack.forEach((l:any) => { if (l.route) routes.push({ path: l.route.path, methods: Object.keys(l.route.methods) }); });
    }
  });
  res.json(routes);
});



// --- Health Check Endpoint ---
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to A.M. Comfort Inn API"
  });
});

// --- Global Error Handler ---
// Must be the last middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err && (err.stack || err));

  // If the error explicitly set a status, use it
  const status = err.status || err.statusCode || 500;
  const response = {
    status: 'error',
    message: err.message || 'An unexpected error occurred',
  };

  // include validation details if present (optional)
  if (err.name === 'ZodError' || err.type === 'validation') {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid input data',
      errors: err.errors || err.message
    });
  }

  return res.status(status).json(response);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection at:', reason);
  // Recommendation: consider exiting process after graceful shutdown in production
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Recommendation: exit and restart the process in production (Graceful restart pattern).
  // For debugging/development, we log and keep process alive to inspect.
});


// --- Server Activation (only when run locally) ---
if (require.main === module) {
  app.listen(port, host, () => {
    console.log(`Server running on http://${host}:${port}`);
  });
}

export default app;
