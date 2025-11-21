import mongoose, { Document, Schema } from 'mongoose';

export interface IEmergencyState extends Document {
  organisation: mongoose.Types.ObjectId;
  active: boolean;
  activatedBy?: mongoose.Types.ObjectId;
  startedAt?: Date;
}

const emergencyStateSchema = new Schema<IEmergencyState>(
  {
    organisation: { type: Schema.Types.ObjectId, ref: 'Organisation', unique: true, required: true },
    active: { type: Boolean, default: false },
    activatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    startedAt: Date,
  },
  { timestamps: true },
);

export const EmergencyStateModel = mongoose.model<IEmergencyState>('EmergencyState', emergencyStateSchema);
