import mongoose from 'mongoose';

const analyticsEventSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    path: { type: String, required: true },
    type: { type: String, enum: ['page_view', 'session_start'], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

analyticsEventSchema.index({ createdAt: 1 });
analyticsEventSchema.index({ type: 1, createdAt: 1 });

export const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);
