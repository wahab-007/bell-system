import mongoose, { Document, Schema } from 'mongoose';

export interface IBellEvent extends Document {
  organisation: mongoose.Types.ObjectId;
  name: string;
  active: boolean;
  isDefault: boolean;
}

const bellEventSchema = new Schema<IBellEvent>(
  {
    organisation: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true },
    name: { type: String, required: true },
    active: { type: Boolean, default: false },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

bellEventSchema.index({ organisation: 1, name: 1 }, { unique: true });

export const BellEventModel = mongoose.model<IBellEvent>('BellEvent', bellEventSchema);
