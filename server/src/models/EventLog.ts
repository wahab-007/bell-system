import mongoose, { Document, Schema } from 'mongoose';

export type EventType = 'bell_trigger' | 'emergency' | 'device_online' | 'device_offline' | 'error';

export interface IEventLog extends Document {
  organisation: mongoose.Types.ObjectId;
  bell?: mongoose.Types.ObjectId;
  type: EventType;
  payload?: Record<string, unknown>;
  timestamp: Date;
}

const eventLogSchema = new Schema<IEventLog>(
  {
    organisation: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true },
    bell: { type: Schema.Types.ObjectId, ref: 'Bell' },
    type: { type: String, required: true },
    payload: Object,
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

export const EventLogModel = mongoose.model<IEventLog>('EventLog', eventLogSchema);
