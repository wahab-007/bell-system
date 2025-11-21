import mongoose, { Document, Schema } from 'mongoose';

export interface IOccasion extends Document {
  organisation: mongoose.Types.ObjectId;
  name: string;
  startDate: Date;
  endDate: Date;
  schedule: mongoose.Types.ObjectId;
  overrideSlots: {
    time: string;
    durationSec: number;
  }[];
}

const occasionSchema = new Schema<IOccasion>(
  {
    organisation: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true },
    name: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    schedule: { type: Schema.Types.ObjectId, ref: 'Schedule', required: true },
    overrideSlots: [
      {
        time: String,
        durationSec: Number,
      },
    ],
  },
  { timestamps: true },
);

export const OccasionModel = mongoose.model<IOccasion>('Occasion', occasionSchema);
