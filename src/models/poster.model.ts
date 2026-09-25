import mongoose, { Schema, Document } from 'mongoose';

export interface IPoster extends Document {
  userId: mongoose.Types.ObjectId;
  templateId: mongoose.Types.ObjectId;
  formData: {
    name: string;
    designation: string;
    party: string;
    locality?: string;
    headline: string;
    creditLine?: string;
  };
  uploadedPhotoUrls: string[];
  generatedImageUrl?: string;
  status: 'draft' | 'generating' | 'completed' | 'failed';
  regenerationCount: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const PosterSchema = new Schema<IPoster>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'Template', required: true },
    formData: {
      name: { type: String, required: true },
      designation: { type: String, required: true },
      party: { type: String, required: true },
      locality: { type: String },
      headline: { type: String, required: true },
      creditLine: { type: String, default: 'প্রচারে: এলাকাবাসী ও দলীয় নেতাকর্মীবৃন্দ' },
    },
    uploadedPhotoUrls: [{ type: String }],
    generatedImageUrl: { type: String },
    status: {
      type: String,
      enum: ['draft', 'generating', 'completed', 'failed'],
      default: 'draft',
    },
    regenerationCount: { type: Number, default: 0 },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

export const Poster = mongoose.model<IPoster>('Poster', PosterSchema);
export default Poster;
