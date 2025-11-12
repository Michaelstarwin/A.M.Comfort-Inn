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
app.use(cors());
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
if (process.env.NODE_ENV !== 'production') {
  app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
}

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
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack); // Log the error stack for debugging

    // Handle known error types, e.g., validation errors
    if (err.name === 'ZodError') {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid input data',
            errors: JSON.parse(err.message)
        });
    }

    // Generic fallback error
    res.status(500).json({
        status: 'error',
        message: err.message || "An unexpected error occurred."
    });
});


// --- Server Activation (only when run locally) ---
if (require.main === module) {
  app.listen(port, host, () => {
    console.log(`Server running on http://${host}:${port}`);
  });
}

export default app;
