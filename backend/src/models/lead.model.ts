import { Document, Model, Schema, model, models } from 'mongoose'

export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Converted'

export interface LeadDocument extends Document {
  name: string
  email: string
  phone: string
  status: LeadStatus
  createdAt: Date
  updatedAt: Date
}

const leadSchema = new Schema<LeadDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Qualified', 'Converted'],
      default: 'New',
    },
  },
  { timestamps: true },
)

export const Lead: Model<LeadDocument> =
  models.Lead ?? model<LeadDocument>('Lead', leadSchema)

export default Lead
