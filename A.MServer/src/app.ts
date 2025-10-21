import express, { Express, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";

// Import routes
import bookingRoutes from './modules/booking/booking.route';
import transactionRoutes from './modules/transaction/transaction.route';

// For async error handling
import "express-async-errors";

dotenv.config();

const app: Express = express();
const host = process.env.APP_HOST || 'localhost';
const port = process.env.APP_PORT ? parseInt(process.env.APP_PORT) : 7700;

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


// --- API Routes ---
app.use('/api/bookings', bookingRoutes);
app.use('/api/transactions', transactionRoutes);


// --- Static Assets ---
// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));


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


// --- Server Activation ---
app.listen(port, host, () => {
  console.log(
    `✅ Server is running at http://${host}:${port}`
  );
});

export default app;
