import bcrypt from 'bcryptjs';
import {
  SEED_ADMIN_EMAIL,
  SEED_ADMIN_PASSWORD,
  SEED_SUPER_ADMIN_EMAIL,
  SEED_SUPER_ADMIN_PASSWORD,
} from './config.js';
import { UserRole } from './models/User.js';
import { createUser, findUserByEmail } from './repositories/users.repository.js';

interface SeedUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

async function upsertUser({ name, email, password, role }: SeedUser) {
  const normalizedEmail = email.toLowerCase();
  const existing = await findUserByEmail(normalizedEmail);
  if (existing) return existing;
  const passwordHash = await bcrypt.hash(password, 12);
  return createUser({
    name,
    email: normalizedEmail,
    passwordHash,
    role,
    phone: '',
    dob: '',
    isActive: true,
  });
}

async function syncSeedUser({ name, email, password, role }: SeedUser) {
  const normalizedEmail = email.toLowerCase();
  const existing = await findUserByEmail(normalizedEmail);
  const passwordHash = await bcrypt.hash(password, 12);
  if (!existing) {
    return createUser({
      name,
      email: normalizedEmail,
      passwordHash,
      role,
      phone: '',
      dob: '',
      isActive: true,
    });
  }

  existing.name = name;
  existing.passwordHash = passwordHash;
  existing.role = role;
  existing.isActive = true;
  await existing.save();
  return existing;
}

export async function seedV2Accounts() {
  await syncSeedUser({
    name: 'Super Admin',
    email: SEED_SUPER_ADMIN_EMAIL,
    password: SEED_SUPER_ADMIN_PASSWORD,
    role: 'superAdmin',
  });
  await syncSeedUser({
    name: 'Admin',
    email: SEED_ADMIN_EMAIL,
    password: SEED_ADMIN_PASSWORD,
    role: 'admin',
  });
  await upsertUser({
    name: 'Demo Customer',
    email: 'customer@local.test',
    password: 'Customer@123',
    role: 'customer',
  });
}

export async function seedSuperAdmin() {
  await upsertUser({
    name: 'Super Admin',
    email: SEED_ADMIN_EMAIL,
    password: SEED_ADMIN_PASSWORD,
    role: 'superAdmin',
  });
  await upsertUser({
    name: 'Demo Customer',
    email: 'customer@local.test',
    password: 'Customer@123',
    role: 'customer',
  });
}
