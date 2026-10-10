import mongoose from 'mongoose';
import { DEFAULT_CURRENCY, MAX_AGENT_IMAGES } from '../config.js';

export interface AgentImageRecord {
  fileId: mongoose.Types.ObjectId;
  filename: string;
  contentType: string;
  size: number;
  order: number;
  isCover: boolean;
  uploadedAt: Date;
}

export interface AgentRecord {
  name: string;
  phone: string;
  address: string;
  badges: string[];
  pricing: { amount: number; currency: string };
  images: AgentImageRecord[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const imageMetaSchema = new mongoose.Schema<AgentImageRecord>(
  {
    fileId: { type: mongoose.Schema.Types.ObjectId, required: true },
    filename: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    order: { type: Number, required: true, min: 0, max: MAX_AGENT_IMAGES - 1 },
    isCover: { type: Boolean, default: false },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const agentSchema = new mongoose.Schema<AgentRecord>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, default: '', trim: true },
    badges: [{ type: String, trim: true }],
    pricing: {
      amount: { type: Number, required: true, min: 0 },
      currency: { type: String, default: DEFAULT_CURRENCY, uppercase: true, trim: true },
    },
    images: {
      type: [imageMetaSchema],
      validate: {
        validator(v: AgentImageRecord[]) {
          return v.length <= MAX_AGENT_IMAGES;
        },
        message: `Maximum ${MAX_AGENT_IMAGES} images allowed`,
      },
      default: [],
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

agentSchema.index({ isDeleted: 1, name: 1 });

agentSchema.set('toJSON', {
  transform(_doc, ret) {
    const json = ret as unknown as Record<string, unknown>;
    json.id = String(json._id);
    delete json._id;
    delete json.__v;
    return json;
  },
});

export const Agent = mongoose.model<AgentRecord>('Agent', agentSchema);
