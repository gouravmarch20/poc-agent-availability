import bcrypt from 'bcryptjs';
import type { FilterQuery } from 'mongoose';
import { UserRecord, UserRole } from '../models/User.js';
import { createUser, findUserById, listUsers, saveUser } from '../repositories/users.repository.js';
import { hasErrorCode } from '../utils/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function managementError(actorRole: UserRole, targetRole: UserRole, targetUserRole?: UserRole): string | null {
  if (actorRole !== 'admin') return null;
  if (targetRole === 'superAdmin') return 'Admins cannot manage superAdmin accounts';
  if (targetUserRole === 'superAdmin') return 'Admins cannot modify superAdmin accounts';
  return null;
}

export const list = asyncHandler(async (request, response) => {
  const queryText = typeof request.query.q === 'string' ? request.query.q : '';
  const requestedRole = typeof request.query.role === 'string' ? request.query.role : undefined;
  const filter: FilterQuery<UserRecord> = {};
  if (queryText) {
    filter.$or = [
      { name: { $regex: queryText, $options: 'i' } },
      { email: { $regex: queryText, $options: 'i' } },
      { phone: { $regex: queryText, $options: 'i' } },
    ];
  }
  if (requestedRole) filter.role = requestedRole;
  if (request.user.role === 'admin') {
    filter.role = requestedRole && requestedRole !== 'superAdmin' ? requestedRole : { $ne: 'superAdmin' };
  }

  const users = await listUsers(filter);
  response.json({ users: users.map((user) => user.toJSON()) });
});

export const create = asyncHandler(async (request, response) => {
  const payload = request.body;
  const blocked = managementError(request.user.role, payload.role);
  if (blocked) {
    response.status(403).json({ error: blocked });
    return;
  }

  try {
    const user = await createUser({
      name: payload.name,
      email: payload.email.toLowerCase(),
      passwordHash: await bcrypt.hash(payload.password, 12),
      role: payload.role,
      phone: payload.phone,
      dob: payload.dob,
      isActive: payload.isActive,
    });
    response.status(201).json({ user: user.toJSON() });
  } catch (error) {
    if (!hasErrorCode(error, 11000)) throw error;
    response.status(409).json({ error: 'Email already exists' });
  }
});

export const update = asyncHandler(async (request, response) => {
  const user = await findUserById(request.params.id);
  if (!user) {
    response.status(404).json({ error: 'User not found' });
    return;
  }

  const payload = request.body;
  const nextRole: UserRole = payload.role ?? user.role;
  const blocked = managementError(request.user.role, nextRole, user.role);
  if (blocked) {
    response.status(403).json({ error: blocked });
    return;
  }

  if (payload.name !== undefined) user.name = payload.name;
  if (payload.email !== undefined) user.email = payload.email.toLowerCase();
  if (payload.role !== undefined) user.role = payload.role;
  if (payload.phone !== undefined) user.phone = payload.phone;
  if (payload.dob !== undefined) user.dob = payload.dob;
  if (payload.isActive !== undefined) user.isActive = payload.isActive;
  if (payload.password) user.passwordHash = await bcrypt.hash(payload.password, 12);

  try {
    await saveUser(user);
    response.json({ user: user.toJSON() });
  } catch (error) {
    if (!hasErrorCode(error, 11000)) throw error;
    response.status(409).json({ error: 'Email already exists' });
  }
});