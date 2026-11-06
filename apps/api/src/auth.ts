import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import argon2 from 'argon2';
import { z } from 'zod';
import { db, wrap, audit } from './core';
import { AppError } from './middleware/errorHandler';

const COOKIE = 'ha_session';
const days = 7 * 24 * 60 * 60 * 1000;
const tokenHash = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

export interface StaffIdentity {
  id: string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      staff?: StaffIdentity;
      sessionId?: string;
    }
  }
}

export const authRouter = Router();

authRouter.post('/login', wrap(async (req, res) => {
  const input = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
  const user = await db.adminUser.findUnique({ where: { email: input.email.toLowerCase() }, include: {
    roles: { include: { permissions: true } },
  } });
  const valid = !!user && user.status === 'active' && await argon2.verify(user.passwordHash, input.password);
  if (!valid || !user) throw new AppError(401, 'Invalid email or password');
  const token = crypto.randomBytes(32).toString('hex');
  await db.session.create({ data: {
    userId: user.id, tokenHash: tokenHash(token), expiresAt: new Date(Date.now() + days),
    deviceInfo: req.get('user-agent')?.slice(0, 255), ipAddress: req.ip,
  } });
  await db.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  res.cookie(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: days, path: '/' });
  await audit(user.id, 'login', 'admin_user', user.id);
  res.json({ data: staffDto(user) });
}));

type UserWithRoles = { id: string; name: string; email: string; roles: Array<{
  key: string; permissions: Array<{ key: string }>;
}> };

function staffDto(user: UserWithRoles): StaffIdentity {
  return {
    id: user.id, name: user.name, email: user.email,
    roles: user.roles.map((x) => x.key),
    permissions: [...new Set(user.roles.flatMap((x) => x.permissions.map((p) => p.key)))],
  };
}

export const requireStaff = (req: Request, _res: Response, next: NextFunction) => {
  Promise.resolve().then(async () => {
  const raw = req.cookies?.[COOKIE];
  if (typeof raw !== 'string' || !/^[0-9a-f]{64}$/.test(raw)) throw new AppError(401, 'Sign in required');
  const session = await db.session.findUnique({ where: { tokenHash: tokenHash(raw) }, include: {
    user: { include: { roles: { include: { permissions: true } } } },
  } });
  if (!session || session.revokedAt || session.expiresAt < new Date() || session.user.status !== 'active') {
    throw new AppError(401, 'Session expired');
  }
  req.staff = staffDto(session.user);
  req.sessionId = session.id;
  }).then(() => next()).catch(next);
};

export function permit(permission: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.staff) return next(new AppError(401, 'Sign in required'));
    if (!req.staff.roles.includes('super_admin') && !req.staff.permissions.includes(permission))
      return next(new AppError(403, 'Permission denied'));
    next();
  };
}

authRouter.get('/me', requireStaff, (req, res) => res.json({ data: req.staff }));
authRouter.post('/logout', requireStaff, wrap(async (req, res) => {
  await db.session.update({ where: { id: req.sessionId! }, data: { revokedAt: new Date() } });
  res.clearCookie(COOKIE, { path: '/' });
  res.json({ data: { success: true } });
}));
