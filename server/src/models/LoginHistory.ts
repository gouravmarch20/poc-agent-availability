import mongoose from 'mongoose';
import { LOGIN_HISTORY_DAYS } from '../config.js';

const loginHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  successCount: { type: Number, default: 0 },
  expiresAt: {
    type: Date,
    required: true,
    default() {
      return new Date(Date.now() + LOGIN_HISTORY_DAYS * 24 * 60 * 60 * 1000);
    },
  },
});

loginHistorySchema.index({ userId: 1, date: 1 }, { unique: true });
loginHistorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const LoginHistory = mongoose.model('LoginHistory', loginHistorySchema);
