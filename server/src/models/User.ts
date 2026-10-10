import mongoose from 'mongoose';

export const ROLES = ['superAdmin', 'admin', 'agent', 'customer'] as const;
export type UserRole = (typeof ROLES)[number];

export interface UserRecord {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone: string;
  dob: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<UserRecord>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, required: true },
    phone: { type: String, trim: true, default: '' },
    dob: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.set('toJSON', {
  transform(_doc, ret) {
    const json = ret as unknown as Record<string, unknown>;
    json.id = String(json._id);
    delete json._id;
    delete json.__v;
    delete json.passwordHash;
    return json;
  },
});

export const User = mongoose.model<UserRecord>('User', userSchema);
