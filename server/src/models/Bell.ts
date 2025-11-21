import mongoose, { Document, Schema } from 'mongoose';

export interface IBell extends Document {
  organisation: mongoose.Types.ObjectId;
  block: mongoose.Types.ObjectId;
  label: string;
  deviceId: string;
  deviceSecret: string;
  online: boolean;
  lastSeen?: Date;
  firmwareVersion?: string;
  capabilities: string[];
}

const bellSchema = new Schema<IBell>(
  {
    organisation: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true },
    block: { type: Schema.Types.ObjectId, ref: 'Block', required: true },
    label: { type: String, required: true },
    deviceId: { type: String, required: true, unique: true },
    deviceSecret: { type: String, required: true },
    online: { type: Boolean, default: false },
    lastSeen: Date,
    firmwareVersion: String,
    capabilities: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const BellModel = mongoose.model<IBell>('Bell', bellSchema);
