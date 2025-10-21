import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { db } from '../db';

const prisma = new PrismaClient();

/**
 * Middleware to protect routes that require ADMIN role.
 * It checks for a 'x-user-id' header, fetches the user,
 * and verifies their role.
 */
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
        return res.status(401).json({
            status: 'error',
            message: 'Unauthorized: User ID is missing.'
        });
    }

    try {
        const user = await db.user.findUnique({
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
    } catch (error) {
        console.error("Admin auth error:", error);
        return res.status(500).json({
            status: 'error',
            message: 'An internal error occurred during authentication.'
        });
    }
};
