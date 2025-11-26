import { db } from '../../shared/lib/db';

export async function createAdminUser(payload: { email: string; name?: string }) {
  const email = (payload.email || '').trim().toLowerCase();
  if (!email) throw new Error('email is required');

  // If a user with this email exists, ensure role is ADMIN
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role === 'ADMIN') return existing;
    return db.user.update({ where: { email }, data: { role: 'ADMIN', name: payload.name || existing.name } });
  }

  // Create new user with ADMIN role
  const user = await db.user.create({
    data: {
      email,
      name: payload.name || null,
      role: 'ADMIN',
    },
  });


  return user;
}  
 export async function getAllUsers() {
  const users = await db.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  return users;
}