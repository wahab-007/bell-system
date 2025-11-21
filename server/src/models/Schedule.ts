import mongoose, { Document, Schema } from 'mongoose';

export type ScheduleType = 'regular' | 'occasion';

export interface ISchedule extends Document {
  organisation: mongoose.Types.ObjectId;
  bells: mongoose.Types.ObjectId[];
  name: string;
  time: string; // HH:mm
  durationSec: number;
  repeatPattern: {
    daysOfWeek: number[];
  };
  type: ScheduleType;
  startDate?: Date;
  endDate?: Date;
  active: boolean;
}

const scheduleSchema = new Schema<ISchedule>(
  {
    organisation: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true },
    bells: [{ type: Schema.Types.ObjectId, ref: 'Bell', required: true }],
    name: { type: String, required: true },
    time: { type: String, required: true },
    durationSec: { type: Number, default: 5 },
    repeatPattern: {
      daysOfWeek: { type: [Number], default: [1, 2, 3, 4, 5] },
    },
    type: { type: String, enum: ['regular', 'occasion'], default: 'regular' },
    startDate: Date,
    endDate: Date,
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const ScheduleModel = mongoose.model<ISchedule>('Schedule', scheduleSchema);
