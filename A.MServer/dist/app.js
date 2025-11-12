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
// For async error handling
require("express-async-errors");
dotenv_1.default.config();
const app = (0, express_1.default)();
const host = "0.0.0.0";
const port = Number(process.env.PORT) || 7700;
// --- Core Middleware ---
// Enable CORS with default options
app.use((0, cors_1.default)());
// Parse JSON bodies
app.use(express_1.default.json());
// Parse URL-encoded bodies
app.use(express_1.default.urlencoded({ extended: true }));
// Express configuration
app.set("host", host);
app.set("port", port);
app.get('/api/admin/test', (req, res) => {
    res.json({ message: 'Direct route works!' });
});
// --- API Routes ---
app.use('/api/bookings', booking_route_1.default);
app.use('/api/transactions', transaction_route_1.default);
app.use('/api/admin', admin_route_1.default);
// Add this RIGHT AFTER your other routes
console.log('Admin routes mounted:', admin_route_1.default.stack?.length || 'Router check');
// --- Static Assets ---
// Serve uploaded files
if (process.env.NODE_ENV !== 'production') {
    app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../uploads")));
}
app.get('/_routes', (req, res) => {
    const routes = [];
    app._router.stack.forEach((layer) => {
        if (layer.route && layer.route.path) {
            routes.push({ path: layer.route.path, methods: Object.keys(layer.route.methods) });
        }
        else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
            layer.handle.stack.forEach((l) => { if (l.route)
                routes.push({ path: l.route.path, methods: Object.keys(l.route.methods) }); });
        }
    });
    res.json(routes);
});
// --- Health Check Endpoint ---
app.get("/", (req, res) => {
    res.status(200).json({
        status: "success",
        message: "Welcome to A.M. Comfort Inn API"
    });
});
// --- Global Error Handler ---
// Must be the last middleware
app.use((err, req, res, next) => {
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
exports.default = app;
//# sourceMappingURL=app.js.map