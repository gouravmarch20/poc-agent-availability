import bcrypt from 'bcryptjs';
import type { Request } from 'express';
import { ACCESS_EXPIRY_MESSAGE, LOGIN_HISTORY_DAYS, MAX_LOGINS_PER_DAY } from '../config.js';
import { createAnalyticsEvent } from '../repositories/analytics.repository.js';
import { recordSuccessfulLogin } from '../repositories/auth.repository.js';
import { findUserByEmail, saveUser } from '../repositories/users.repository.js';
import { isAccountAccessExpired, todayYmd } from '../utils/dates.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function regenerateSession(request: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    request.session.regenerate((error) => (error ? reject(error) : resolve()));
  });
}

function saveSession(request: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    request.session.save((error) => (error ? reject(error) : resolve()));
  });
}

export const login = asyncHandler(async (request, response) => {
  const email = request.body.email.toLowerCase();
  const user = await findUserByEmail(email);
  if (!user || !user.isActive || !(await bcrypt.compare(request.body.password, user.passwordHash))) {
    response.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  if (isAccountAccessExpired(user.createdAt)) {
    response.status(403).json({ error: ACCESS_EXPIRY_MESSAGE });
    return;
  }

  const expiresAt = new Date(Date.now() + LOGIN_HISTORY_DAYS * 24 * 60 * 60 * 1000);
  const enforceLoginLimit = user.role !== 'admin' && user.role !== 'superAdmin';
  const loginAllowed = await recordSuccessfulLogin(user._id, todayYmd(), expiresAt, enforceLoginLimit);
  if (!loginAllowed) {
    response.status(403).json({ error: `Login limit reached (${MAX_LOGINS_PER_DAY} per day)` });
    return;
  }

  await regenerateSession(request);
  const now = Date.now();
  request.session.userId = String(user._id);
  request.session.createdAt = now;
  request.session.lastActivity = now;
  await saveSession(request);

  void createAnalyticsEvent({ userId: String(user._id), path: '/login', type: 'session_start' })
    .catch((error: unknown) => console.error('Failed to record login analytics', error));

  response.json({ user: user.toJSON() });
});

export const logout = asyncHandler(async (request, response) => {
  await new Promise<void>((resolve, reject) => {
    request.session.destroy((error) => (error ? reject(error) : resolve()));
  });
  response.clearCookie('sid');
  response.json({ ok: true });
});

export const getCurrentUser = asyncHandler(async (request, response) => {
  response.json({ user: request.user.toJSON() });
});

export const changePassword = asyncHandler(async (request, response) => {
  const isCurrentPasswordValid = await bcrypt.compare(request.body.currentPassword, request.user.passwordHash);
  if (!isCurrentPasswordValid) {
    response.status(400).json({ error: 'Current password is incorrect' });
    return;
  }

  request.user.passwordHash = await bcrypt.hash(request.body.newPassword, 12);
  await saveUser(request.user);
  response.json({ ok: true });
});