"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
const isAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.headers['x-user-id'];
    if (!userId) {
        return res.status(401).json({
            status: 'error',
            message: 'Unauthorized: User ID is missing.'
        });
    }
    try {
        const user = yield db_1.db.user.findUnique({
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
});
exports.isAdmin = isAdmin;
