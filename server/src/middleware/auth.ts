import { ACCESS_EXPIRY_MESSAGE, ABSOLUTE_SESSION_MS, IDLE_MS } from '../config.js';
import { findUserById } from '../repositories/users.repository.js';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { isAccountAccessExpired } from '../utils/dates.js';

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.session?.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const now = Date.now();
    if (req.session.createdAt && now - req.session.createdAt > ABSOLUTE_SESSION_MS) {
      await new Promise<void>((resolve, reject) => {
        req.session.destroy((err) => (err ? reject(err) : resolve()));
      });
      res.clearCookie('sid');
      res.status(401).json({ error: 'Session expired' });
      return;
    }

    if (req.session.lastActivity && now - req.session.lastActivity > IDLE_MS) {
      await new Promise<void>((resolve, reject) => {
        req.session.destroy((err) => (err ? reject(err) : resolve()));
      });
      res.clearCookie('sid');
      res.status(401).json({ error: 'Idle timeout' });
      return;
    }

    const user = await findUserById(req.session.userId);
    if (!user || !user.isActive) {
      await new Promise<void>((resolve) => req.session.destroy(() => resolve()));
      res.clearCookie('sid');
      res.status(401).json({ error: 'Account unavailable' });
      return;
    }

    if (isAccountAccessExpired(user.createdAt)) {
      await new Promise<void>((resolve) => req.session.destroy(() => resolve()));
      res.clearCookie('sid');
      res.status(401).json({ error: ACCESS_EXPIRY_MESSAGE });
      return;
    }

    req.session.lastActivity = now;
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles: string[]): RequestHandler {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

export const staffRoles: string[] = ['superAdmin', 'admin'];
