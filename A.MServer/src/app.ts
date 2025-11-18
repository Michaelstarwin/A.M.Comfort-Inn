import express, { Express, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";

// Import routes
import bookingRoutes from "./modules/booking/booking.route";
import transactionRoutes from "./modules/transaction/transaction.route";
import adminRoutes from "./modules/admin/admin.route";

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
  "http://localhost:3000",
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow server-to-server, curl, Postman
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  credentials: true,
  // include your custom header here:
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'X-User-Id'         // <--- add this
  ],
  // optionally expose specific response headers to browser (if you need)
  exposedHeaders: ['Content-Length', 'X-Response-Time'],
  maxAge: 600
}));

// Pre-flight
app.options("*", (req, res) => res.sendStatus(204));

// Body parsers (MUST be before routes)
app.use(express.json());
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
