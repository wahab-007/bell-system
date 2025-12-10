import mongoose, { Document, Schema } from 'mongoose';

export interface IBulbSchedule extends Document {
  organisation: mongoose.Types.ObjectId;
  block: mongoose.Types.ObjectId;
  bulb: mongoose.Types.ObjectId;
  channel: number;
  onTime: string; // HH:mm
  offTime: string; // HH:mm
  repeatPattern: {
    daysOfWeek: number[];
  };
  active: boolean;
}

const bulbScheduleSchema = new Schema<IBulbSchedule>(
  {
    organisation: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true },
    block: { type: Schema.Types.ObjectId, ref: 'Block', required: true },
    bulb: { type: Schema.Types.ObjectId, ref: 'Bulb', required: true },
    channel: { type: Number, required: true },
    onTime: { type: String, required: true },
    offTime: { type: String, required: true },
    repeatPattern: {
      daysOfWeek: { type: [Number], default: [1, 2, 3, 4, 5] },
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

bulbScheduleSchema.index({ bulb: 1, onTime: 1, offTime: 1 });

export const BulbScheduleModel = mongoose.model<IBulbSchedule>('BulbSchedule', bulbScheduleSchema);
