"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = void 0;
const client_1 = require("@prisma/client");
const db_1 = require("../db");
const prisma = new client_1.PrismaClient();
/**
 * Middleware to protect routes that require ADMIN role.
 * It checks for a 'x-user-id' header, fetches the user,
 * and verifies their role.
 */
const isAdmin = async (req, res, next) => {
    const userId = req.headers['x-user-id'];
    if (!userId) {
        return res.status(401).json({
            status: 'error',
            message: 'Unauthorized: User ID is missing.'
        });
    }
    try {
        const user = await db_1.db.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(403).json({
                status: 'error',
                message: 'Forbidden: User not found.'
            });
        }
        if (user.role !== 'ADMIN') {
            return res.status(403).json({
                status: 'error',
                message: 'Forbidden: Access is restricted to administrators.'
            });
        }
        // If user is an admin, proceed to the next middleware/controller
        next();
    }
    catch (error) {
        console.error("Admin auth error:", error);
        return res.status(500).json({
            status: 'error',
            message: 'An internal error occurred during authentication.'
        });
    }
};
exports.isAdmin = isAdmin;
