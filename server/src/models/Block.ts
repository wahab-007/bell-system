import mongoose, { Document, Schema } from 'mongoose';

export interface IBlock extends Document {
  organisation: mongoose.Types.ObjectId;
  name: string;
  description?: string;
}

const blockSchema = new Schema<IBlock>(
  {
    organisation: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true },
    name: { type: String, required: true },
    description: String,
  },
  { timestamps: true },
);

blockSchema.index({ organisation: 1, name: 1 }, { unique: true });

export const BlockModel = mongoose.model<IBlock>('Block', blockSchema);
