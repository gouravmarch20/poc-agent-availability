import mongoose from 'mongoose';
import { MAX_LOGINS_PER_DAY } from '../config.js';
import { LoginHistory } from '../models/LoginHistory.js';
import { hasErrorCode } from '../utils/errors.js';

export async function recordSuccessfulLogin(userId: mongoose.Types.ObjectId, date: string, expiresAt: Date) {
  try {
    await LoginHistory.updateOne(
      { userId, date },
      { $setOnInsert: { successCount: 0, expiresAt } },
      { upsert: true }
    );
  } catch (error) {
    if (!hasErrorCode(error, 11000)) throw error;
  }

  const updated = await LoginHistory.findOneAndUpdate(
    { userId, date, successCount: { $lt: MAX_LOGINS_PER_DAY } },
    { $inc: { successCount: 1 } },
    { new: true }
  );
  return updated !== null;
}