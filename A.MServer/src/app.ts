import express, { Express, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import 'dotenv/config';

// Import routes
import bookingRoutes from "./modules/booking/booking.route";
import transactionRoutes from "./modules/transaction/transaction.route";
import adminRoutes from "./modules/admin/admin.route";
import paymentRoutes from "./modules/payment/payment.route"
// For async error handling
import "express-async-errors";

dotenv.config();

const app: Express = express();
const host = "0.0.0.0";
const port = Number(process.env.PORT) || 7700;

// --- Core Middleware ---
// CORS
const allowedOrigins = [
  "https://www.amcinn.in",
  "https://amcinn.in",
  "http://localhost:5173",  // Vite dev server
  "http://127.0.0.1:5173",  // Alternative localhost
  "http://localhost:3000",  // Create React App default
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
    if (!origin) {
      console.log('[CORS] Request with no origin - allowing');
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      console.log(`[CORS] Allowed origin: ${origin}`);
      return callback(null, true);
    }

    // Check if it's a variation of allowed origins (http vs https, with/without www)
    const originUrl = new URL(origin);
    const isAllowedDomain = allowedOrigins.some(allowed => {
      try {
        const allowedUrl = new URL(allowed);
        return originUrl.hostname === allowedUrl.hostname ||
          originUrl.hostname === `www.${allowedUrl.hostname}` ||
          `www.${originUrl.hostname}` === allowedUrl.hostname;
      } catch {
        return false;
      }
    });

    if (isAllowedDomain) {
      console.log(`[CORS] Allowed domain variation: ${origin}`);
      return callback(null, true);
    }

    console.warn(`[CORS] BLOCKED origin: ${origin}`);
    console.warn(`[CORS] Allowed origins are: ${allowedOrigins.join(', ')}`);
    return callback(new Error(`CORS policy: Origin ${origin} is not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'X-User-Id',
    'x-rtb-fingerprint-id'  // Allow browser fingerprinting headers
  ],
  exposedHeaders: ['Content-Length', 'X-Response-Time', 'x-rtb-fingerprint-id'],
  maxAge: 600
}));

// Pre-flight
app.options("*", (req, res) => res.sendStatus(204));

// Body parsers (MUST be before routes)
// Body parsers (MUST be before routes)
app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));

// Express configuration
app.set("host", host);
app.set("port", port);

// --- Static Assets ---
const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, "../uploads");
app.use("/uploads", express.static(uploadsDir));

// --- Simple test route ---
app.get("/api/admin/test", (req, res) => {
  res.json({ message: "Direct route works!" });
});

// --- API Routes ---
app.use("/api/bookings", bookingRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/payment', paymentRoutes);

console.log("Admin routes mounted:", (adminRoutes as any).stack?.length || "Router check");

// --- Routes debugger ---
app.get("/_routes", (req, res) => {
  const routes: any[] = [];
  (app as any)._router.stack.forEach((layer: any) => {
    if (layer.route && layer.route.path) {
      routes.push({ path: layer.route.path, methods: Object.keys(layer.route.methods) });
    } else if (layer.name === "router" && layer.handle && layer.handle.stack) {
      layer.handle.stack.forEach((l: any) => {
        if (l.route) {
          routes.push({ path: l.route.path, methods: Object.keys(l.route.methods) });
        }
      });
    }
  });
  res.json(routes);
});

// --- Health Check Endpoint ---
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to A.M. Comfort Inn API",
  });
});

// --- 404 Handler (MUST be after all routes) ---
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

// --- Global Error Handler (last middleware) ---
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled error:", err && (err.stack || err));

  // Validation errors (e.g. Zod)
  if (err.name === "ZodError" || err.type === "validation") {
    return res.status(400).json({
      status: "error",
      message: "Invalid input data",
      errors: err.errors || err.message,
    });
  }

  const status = err.status || err.statusCode || 500;
  return res.status(status).json({
    status: "error",
    message: err.message || "An unexpected error occurred",
  });
});

// --- Process-level handlers ---
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection at:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  // In prod you'd typically exit after this
});

// --- Server Activation (only when run locally) ---
if (require.main === module) {
  app.listen(port, host, () => {
    console.log(`Server running on http://${host}:${port}`);
  });
}

export default app;
