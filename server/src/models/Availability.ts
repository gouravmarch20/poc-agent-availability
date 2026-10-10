import mongoose from 'mongoose';

export interface AvailabilityRecord {
  date: string;
  agentId: mongoose.Types.ObjectId;
  startTime: string;
  endTime: string;
  purgeAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const availabilitySchema = new mongoose.Schema<AvailabilityRecord>(
  {
    date: { type: String, required: true },
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    purgeAt: { type: Date, required: true },
  },
  { timestamps: true }
);

availabilitySchema.index({ agentId: 1, date: 1 }, { unique: true });
availabilitySchema.index({ date: 1 });
availabilitySchema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 });

availabilitySchema.set('toJSON', {
  transform(_doc, ret) {
    const json = ret as unknown as Record<string, unknown>;
    json.id = String(json._id);
    delete json._id;
    delete json.__v;
    return json;
  },
});

export const Availability = mongoose.model<AvailabilityRecord>('Availability', availabilitySchema);
