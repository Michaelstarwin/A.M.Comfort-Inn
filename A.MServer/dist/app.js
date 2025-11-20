"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
// Import routes
const booking_route_1 = __importDefault(require("./modules/booking/booking.route"));
const transaction_route_1 = __importDefault(require("./modules/transaction/transaction.route"));
const admin_route_1 = __importDefault(require("./modules/admin/admin.route"));
const payment_route_1 = __importDefault(require("./modules/payment/payment.route"));
// For async error handling
require("express-async-errors");
dotenv_1.default.config();
const app = (0, express_1.default)();
const host = "0.0.0.0";
const port = Number(process.env.PORT) || 7700;
// --- Core Middleware ---
// CORS
const allowedOrigins = [
    "https://www.amcinn.in",
    "http://localhost:5173", // Vite dev server
    "http://127.0.0.1:5173", // Alternative localhost
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true); // allow server-to-server, curl, Postman
        if (allowedOrigins.includes(origin))
            return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    // include your custom header here:
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'X-User-Id' // <--- add this
    ],
    // optionally expose specific response headers to browser (if you need)
    exposedHeaders: ['Content-Length', 'X-Response-Time'],
    maxAge: 600
}));
// Pre-flight
app.options("*", (req, res) => res.sendStatus(204));
// Body parsers (MUST be before routes)
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Express configuration
app.set("host", host);
app.set("port", port);
// --- Static Assets ---
const uploadsDir = process.env.UPLOADS_DIR || path_1.default.join(__dirname, "../uploads");
app.use("/uploads", express_1.default.static(uploadsDir));
// --- Simple test route ---
app.get("/api/admin/test", (req, res) => {
    res.json({ message: "Direct route works!" });
});
// --- API Routes ---
app.use("/api/bookings", booking_route_1.default);
app.use("/api/transactions", transaction_route_1.default);
app.use("/api/admin", admin_route_1.default);
app.use('/api/payment', payment_route_1.default);
console.log("Admin routes mounted:", admin_route_1.default.stack?.length || "Router check");
// --- Routes debugger ---
app.get("/_routes", (req, res) => {
    const routes = [];
    app._router.stack.forEach((layer) => {
        if (layer.route && layer.route.path) {
            routes.push({ path: layer.route.path, methods: Object.keys(layer.route.methods) });
        }
        else if (layer.name === "router" && layer.handle && layer.handle.stack) {
            layer.handle.stack.forEach((l) => {
                if (l.route) {
                    routes.push({ path: l.route.path, methods: Object.keys(l.route.methods) });
                }
            });
        }
    });
    res.json(routes);
});
// --- Health Check Endpoint ---
app.get("/", (req, res) => {
    res.status(200).json({
        status: "success",
        message: "Welcome to A.M. Comfort Inn API",
    });
});
// --- 404 Handler (MUST be after all routes) ---
app.use((req, res) => {
    res.status(404).json({
        status: "error",
        message: "Route not found",
    });
});
// --- Global Error Handler (last middleware) ---
app.use((err, req, res, next) => {
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
exports.default = app;
//# sourceMappingURL=app.js.map