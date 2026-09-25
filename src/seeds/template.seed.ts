import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { Template } from '../models/template.model';

export const templatesData = [
  {
    slug: 'victory-day',
    title: 'মহান বিজয় দিবস',
    occasionType: 'VICTORY_DAY',
    thumbnailUrl: 'https://images.unsplash.com/photo-1596464716127-f2a829822321?auto=format&fit=crop&w=600&q=80',
    isActive: true,
    layoutConfig: {
      theme: 'victory-red-green',
      primaryColor: '#006A4E',
      secondaryColor: '#F42A41',
      accentColor: '#FFD700',
      textColor: '#FFFFFF',
      defaultHeadline: '১৬ই ডিসেম্বর মহান বিজয় দিবস সফল হোক',
      subHeadline: 'বীর মুক্তিযোদ্ধাদের প্রতি বিনম্র শ্রদ্ধা',
      fontHeadline: 'Kalpurush',
      motifs: ['national_flag', 'monument_silhouette', 'golden_sun_rays', 'victory_laurel'],
      photoSlots: [
        { id: 'leader1', role: 'top_leader_1', shape: 'circle', position: 'top_left', label: 'প্রধান নেতা ১' },
        { id: 'leader2', role: 'top_leader_2', shape: 'circle', position: 'top_right', label: 'প্রধান নেতা ২' },
        { id: 'candidate', role: 'candidate', shape: 'arch_oval', position: 'center_bottom', label: 'প্রার্থী / শুভানুধ্যায়ী' },
      ],
      borderStyle: 'ornate_golden',
    },
  },
  {
    slug: 'election-campaign',
    title: 'নির্বাচনী প্রচার ও শুভেচ্ছা',
    occasionType: 'CAMPAIGN',
    thumbnailUrl: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=600&q=80',
    isActive: true,
    layoutConfig: {
      theme: 'dynamic-campaign-tricolor',
      primaryColor: '#0B3B60',
      secondaryColor: '#E02424',
      accentColor: '#F59E0B',
      textColor: '#FFFFFF',
      defaultHeadline: 'আসন্ন নির্বাচনে যোগ্য প্রার্থীকে জয়যুক্ত করুন',
      subHeadline: 'এলাকার সামগ্রিক উন্নয়ন ও জনগণের আস্থার প্রতীক',
      fontHeadline: 'Kalpurush',
      motifs: ['campaign_ribbon', 'ballot_stamp', 'dynamic_stripes', 'megaphone'],
      photoSlots: [
        { id: 'leader1', role: 'top_leader_1', shape: 'circle', position: 'top_center_left', label: 'দলীয় শীর্ষ নেতা' },
        { id: 'candidate', role: 'candidate', shape: 'framed_rectangle', position: 'main_prominent', label: 'মনোনীত প্রার্থী' },
      ],
      borderStyle: 'bold_stripe',
    },
  },
  {
    slug: 'memorial-tribute',
    title: 'শোক ও গভীর শ্রদ্ধাঞ্জলি',
    occasionType: 'MEMORIAL',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80',
    isActive: true,
    layoutConfig: {
      theme: 'somber-black-monochrome',
      primaryColor: '#1E1E1E',
      secondaryColor: '#374151',
      accentColor: '#E5E7EB',
      textColor: '#FFFFFF',
      defaultHeadline: 'মরহুম জননেতার রুহের মাগফিরাত ও শান্তি কামনা করি',
      subHeadline: 'আমরা আপনার আদর্শ ও অবদান চিরকাল শ্রদ্ধার সাথে স্মরণ করব',
      fontHeadline: 'Kalpurush',
      motifs: ['black_mourning_ribbon', 'white_lotus_wreath', 'peace_dove'],
      photoSlots: [
        { id: 'deceased', role: 'honored_deceased', shape: 'black_bordered_oval', position: 'center_stage', label: 'মরহুমের প্রতিকৃতি' },
        { id: 'requester', role: 'candidate', shape: 'footer_circle', position: 'bottom_right', label: 'শোকসন্তপ্ত' },
      ],
      borderStyle: 'mourning_black_frame',
    },
  },
];

export async function seedTemplates(): Promise<void> {
  try {
    await connectDB();
    console.log('Seeding templates into MongoDB...');

    for (const item of templatesData) {
      const template = await Template.findOneAndUpdate(
        { slug: item.slug },
        { $set: item },
        { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
      );
      console.log(`Seeded template: ${template.title} (${template.slug})`);
    }

    console.log('Templates seeding completed successfully!');
  } catch (error) {
    console.error('Failed to seed templates:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
}

// Allow direct CLI execution: tsx src/seeds/template.seed.ts
if (require.main === module) {
  seedTemplates();
}
