import mongoose, { Schema, Document } from 'mongoose';

export interface ITemplate extends Document {
  slug: string;
  title: string;
  occasionType: 'VICTORY_DAY' | 'CAMPAIGN' | 'MEMORIAL' | 'GREETINGS';
  thumbnailUrl: string;
  layoutConfig: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
}

export const TemplateSchema = new Schema<ITemplate>({
  slug: { type: String, required: true, unique: true, trim: true },
  title: { type: String, required: true },
  occasionType: { 
    type: String, 
    enum: ['VICTORY_DAY', 'CAMPAIGN', 'MEMORIAL', 'GREETINGS'], 
    required: true 
  },
  thumbnailUrl: { type: String, required: true },
  layoutConfig: { type: Schema.Types.Mixed, default: {} },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export const Template = mongoose.model<ITemplate>('Template', TemplateSchema);
export default Template;
