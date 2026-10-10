import express from 'express';
import type { ErrorRequestHandler } from 'express';
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import {
  CLIENT_ORIGIN,
  IDLE_MS,
  MONGODB_URI,
  NODE_ENV,
  PORT,
  SESSION_SECRET,
} from './config.js';
import { runMigrations } from './migrations/migrator.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import agentRoutes from './routes/agents.js';
import availabilityRoutes from './routes/availability.js';
import analyticsRoutes from './routes/analytics.js';
import { mapErrorToResponse } from './utils/errors.js';

const app = express();

app.use((req, res, next) => {
  req.requestId = randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

app.set('trust proxy', 1);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(
  session({
    name: 'sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: NODE_ENV === 'production',
      maxAge: IDLE_MS,
    },
    store: MongoStore.create({
      mongoUrl: MONGODB_URI,
      ttl: 60 * 60,
    }),
  })
);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'The requested endpoint was not found.' });
});

const errorHandler: ErrorRequestHandler = (err: unknown, req, res, _next) => {
  const mapped = mapErrorToResponse(err);
  if (mapped.status >= 500) {
    console.error({ requestId: req.requestId, method: req.method, path: req.path, error: err });
    mapped.body.requestId = req.requestId;
  }
  res.status(mapped.status).json(mapped.body);
};
app.use(errorHandler);

async function start() {
  await mongoose.connect(MONGODB_URI);
  await runMigrations();
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
