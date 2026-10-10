import mongoose from 'mongoose';

const migrationSchema = new mongoose.Schema(
  {
    version: { type: String, unique: true, sparse: true },
    name: { type: String, required: true, unique: true },
    appliedAt: { type: Date, required: true, default: Date.now },
    batch: { type: Number, required: true },
  },
  { timestamps: true }
);

export const Migration = mongoose.model('Migration', migrationSchema);