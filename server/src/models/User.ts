import mongoose, { Document, Schema } from 'mongoose';
import { OrgRole } from '../types';

export interface IUser extends Document {
  organisation: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: OrgRole;
  mfaSecret?: string;
}

const userSchema = new Schema<IUser>(
  {
    organisation: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: String,
    password: { type: String, required: true },
    role: { type: String, enum: ['owner', 'admin', 'viewer', 'superadmin'], default: 'admin' },
    mfaSecret: String,
  },
  { timestamps: true },
);

export const UserModel = mongoose.model<IUser>('User', userSchema);
