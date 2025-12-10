import mongoose, { Document, Schema } from 'mongoose';

export interface IBulb extends Document {
  organisation: mongoose.Types.ObjectId;
  block: mongoose.Types.ObjectId;
  channel: number; // 1-4
  label: string;
  state: boolean;
  lastToggledAt?: Date;
}

const bulbSchema = new Schema<IBulb>(
  {
    organisation: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true },
    block: { type: Schema.Types.ObjectId, ref: 'Block', required: true },
    channel: { type: Number, required: true },
    label: { type: String, required: true },
    state: { type: Boolean, default: false },
    lastToggledAt: Date,
  },
  { timestamps: true },
);

bulbSchema.index({ block: 1, channel: 1 }, { unique: true });

export const BulbModel = mongoose.model<IBulb>('Bulb', bulbSchema);
