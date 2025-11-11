"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminUser = createAdminUser;
const db_1 = require("../../shared/lib/db");
async function createAdminUser(payload) {
    const email = (payload.email || '').trim().toLowerCase();
    if (!email)
        throw new Error('email is required');
    // If a user with this email exists, ensure role is ADMIN
    const existing = await db_1.db.user.findUnique({ where: { email } });
    if (existing) {
        if (existing.role === 'ADMIN')
            return existing;
        return db_1.db.user.update({ where: { email }, data: { role: 'ADMIN', name: payload.name || existing.name } });
    }
    // Create new user with ADMIN role
    const user = await db_1.db.user.create({
        data: {
            email,
            name: payload.name || null,
            role: 'ADMIN',
        },
    });
    return user;
}
//# sourceMappingURL=admin.service.js.map