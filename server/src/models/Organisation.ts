import mongoose, { Document, Schema } from 'mongoose';

export interface IOrganisation extends Document {
  name: string;
  slug: string;
  timezone: string;
  contactEmail: string;
  contactPhone?: string;
  settings: {
    bellDurationSec: number;
  };
}

const organisationSchema = new Schema<IOrganisation>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    timezone: { type: String, default: 'UTC' },
    contactEmail: { type: String, required: true },
    contactPhone: String,
    settings: {
      bellDurationSec: { type: Number, default: 5 },
    },
  },
  { timestamps: true },
);

export const OrganisationModel = mongoose.model<IOrganisation>('Organisation', organisationSchema);
