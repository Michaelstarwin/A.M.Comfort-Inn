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
exports.createAdminUser = createAdminUser;
const db_1 = require("../../shared/lib/db");
function createAdminUser(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        const email = (payload.email || '').trim().toLowerCase();
        if (!email)
            throw new Error('email is required');
        // If a user with this email exists, ensure role is ADMIN
        const existing = yield db_1.db.user.findUnique({ where: { email } });
        if (existing) {
            if (existing.role === 'ADMIN')
                return existing;
            return db_1.db.user.update({ where: { email }, data: { role: 'ADMIN', name: payload.name || existing.name } });
        }
        // Create new user with ADMIN role
        const user = yield db_1.db.user.create({
            data: {
                email,
                name: payload.name || null,
                role: 'ADMIN',
            },
        });
        return user;
    });
}
//# sourceMappingURL=admin.service.js.map