import dotenv from 'dotenv';

dotenv.config();

export const APP_TZ = process.env.APP_TZ || 'Asia/Kolkata';
export const PORT = Number(process.env.PORT || 5050);
export const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agent_availability';
export const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-session-secret';
export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const SEED_SUPER_ADMIN_EMAIL = process.env.SEED_SUPER_ADMIN_EMAIL || 'superadmin@gmail.com';
export const SEED_SUPER_ADMIN_PASSWORD = process.env.SEED_SUPER_ADMIN_PASSWORD || 'supper@123';
export const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@local.test';
export const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';

export const IDLE_MS = 15 * 60 * 1000;
export const ABSOLUTE_SESSION_MS = 60 * 60 * 1000;
export const MAX_LOGINS_PER_DAY = 7;
export const ACCESS_VALIDITY_MONTHS = 6;
export const ACCESS_EXPIRY_MESSAGE = 'Access period ended. Contact us to renew your access.';
export const MAX_AGENT_IMAGES = 10;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const DEFAULT_CURRENCY = 'INR';
export const LOGIN_HISTORY_DAYS = 90;
export const AVAILABILITY_RETENTION_DAYS = 180;
export const ANALYTICS_CACHE_MS = 60 * 60 * 1000;
