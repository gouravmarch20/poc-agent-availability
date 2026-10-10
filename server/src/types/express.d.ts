import type { HydratedDocument } from 'mongoose';
import type { UserRecord } from '../models/User.js';

declare global {
  namespace Express {
    interface Request {
      user: HydratedDocument<UserRecord>;
      requestId: string;
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    createdAt?: number;
    lastActivity?: number;
  }
}

export {};