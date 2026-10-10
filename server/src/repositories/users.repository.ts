import mongoose, { type FilterQuery, type HydratedDocument } from 'mongoose';
import { AnalyticsEvent } from '../models/AnalyticsEvent.js';
import { LoginHistory } from '../models/LoginHistory.js';
import { User, UserRecord } from '../models/User.js';

export type UserFilter = FilterQuery<UserRecord>;
export type NewUser = Pick<UserRecord, 'name' | 'email' | 'passwordHash' | 'role' | 'phone' | 'dob' | 'isActive'>;

export function findUserByEmail(email: string) {
  return User.findOne({ email });
}

export function findUserById(id: string) {
  return User.findById(id);
}

export function listUsers(filter: UserFilter) {
  return User.find(filter).sort({ createdAt: -1 }).limit(200);
}

export function countUsers(filter: UserFilter) {
  return User.countDocuments(filter);
}

export async function hardDeleteUser(id: string) {
  const userId = new mongoose.Types.ObjectId(id);
  await Promise.all([
    LoginHistory.deleteMany({ userId }),
    AnalyticsEvent.deleteMany({ userId }),
  ]);
  return User.deleteOne({ _id: userId });
}

export function createUser(user: NewUser) {
  return User.create(user);
}

export function saveUser(user: HydratedDocument<UserRecord>) {
  return user.save();
}