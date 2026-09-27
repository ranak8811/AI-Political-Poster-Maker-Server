import path from 'path';
import { createCanvas, registerFont, loadImage } from 'canvas';
import cloudinary from '../config/cloudinary';
import { PosterLayoutConfig, getDefaultLayoutConfig } from './gemini.service';

import fs from 'fs';

// Register the TrueType Bengali font (Kalpurush)
// Check both relative to __dirname and process.cwd() for dev & prod compatibility
let fontPath = path.join(__dirname, '../assets/fonts/Kalpurush.ttf');
if (!fs.existsSync(fontPath)) {
  fontPath = path.join(process.cwd(), 'src/assets/fonts/Kalpurush.ttf');
}

try {
  registerFont(fontPath, { family: 'Kalpurush' });
  console.log('Registered Kalpurush font successfully from:', fontPath);
} catch (err) {
  console.error('Failed to register Kalpurush font:', err);
}

// Interface for form data submitted by user
export interface PosterFormData {
  name: string;
  designation: string;
  party: string;
  locality?: string;
  headline: string;
  creditLine?: string;
}

export interface RenderPosterParams {
  formData: PosterFormData;
  photoUrls: string[];
  layout?: PosterLayoutConfig;
}

/**
 * Draws a leader photo in a circular frame with a golden ring border.
 */
async function drawCircularLeader(
  ctx: any,
  imageUrl: string,
  centerX: number,
  centerY: number,
  radius: number,
  ringColor: string
) {
  try {
    const img = await loadImage(imageUrl);

    // Save canvas state before clipping
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    // Draw the image inside circular clipping area
    const diameter = radius * 2;
    ctx.drawImage(img, centerX - radius, centerY - radius, diameter, diameter);
    ctx.restore();

    // Draw outer golden ring border
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
    ctx.lineWidth = 8;
    ctx.strokeStyle = ringColor;
    ctx.stroke();
  } catch (error) {
    console.warn(`Could not draw circular leader at (${centerX}, ${centerY}):`, error);

    // Draw fallback circle placeholder if image fails to load
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = ringColor;
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Main server-side 2D canvas poster generator.
 * Creates a 1200x1600 high-resolution poster and uploads it to Cloudinary.
 */
export async function renderPoliticalPoster(params: RenderPosterParams): Promise<string> {
  const { formData, photoUrls, layout } = params;

  // Poster dimensions: standard 3:4 print poster size
  const width = 1200;
  const height = 1600;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fallback to default theme if layout is missing
  const defaultLayout = getDefaultLayoutConfig();
  const theme = layout?.theme || defaultLayout.theme;
  const typography = layout?.typography || defaultLayout.typography;

  // -------------------------------------------------------------
  // 1. Draw Background Gradient
  // -------------------------------------------------------------
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, theme.backgroundColorStart);
  bgGradient.addColorStop(1, theme.backgroundColorEnd);
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Subtle decorative border around poster
  ctx.strokeStyle = theme.goldRingColor || '#FFD700';
  ctx.lineWidth = 12;
  ctx.strokeRect(16, 16, width - 32, height - 32);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(26, 26, width - 52, height - 52);

  // -------------------------------------------------------------
  // 2. Draw Top Leaders (Circular Vignettes)
  // photoUrls[1] is Leader 1, photoUrls[2] is Leader 2
  // -------------------------------------------------------------
  const leader1Url = photoUrls[1];
  const leader2Url = photoUrls[2];

  if (leader1Url) {
    await drawCircularLeader(ctx, leader1Url, 250, 180, 95, theme.goldRingColor);
  }

  if (leader2Url) {
    await drawCircularLeader(ctx, leader2Url, 950, 180, 95, theme.goldRingColor);
  }

  // -------------------------------------------------------------
  // 3. Draw Bengali Headline
  // -------------------------------------------------------------
  const headlineFontSize = typography.headlineFontSize || 56;
  ctx.font = `bold ${headlineFontSize}px Kalpurush`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Add subtle dark text drop shadow for legibility
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;

  ctx.fillStyle = theme.headlineColor || '#FFFFFF';
  ctx.fillText(formData.headline, width / 2, 380);

  // Reset shadow for next drawings
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // -------------------------------------------------------------
  // 4. Draw Main Candidate Portrait
  // photoUrls[0] is the Candidate Photo
  // -------------------------------------------------------------
  const candidateUrl = photoUrls[0];
  if (candidateUrl) {
    try {
      const candidateImg = await loadImage(candidateUrl);

      // Save canvas state
      ctx.save();

      // Rounded rectangular clip area for candidate portrait
      const imgX = 250;
      const imgY = 460;
      const imgW = 700;
      const imgH = 820;

      // Draw portrait
      ctx.drawImage(candidateImg, imgX, imgY, imgW, imgH);

      // Gold frame around candidate portrait
      ctx.strokeStyle = theme.goldRingColor || '#FFD700';
      ctx.lineWidth = 6;
      ctx.strokeRect(imgX, imgY, imgW, imgH);

      ctx.restore();
    } catch (err) {
      console.warn('Failed to draw candidate portrait:', err);
    }
  }

  // -------------------------------------------------------------
  // 5. Draw Candidate Name & Designation Banner
  // -------------------------------------------------------------
  const bannerY = 1320;
  const bannerHeight = 150;

  // Semi-transparent dark overlay for high text contrast
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.fillRect(0, bannerY, width, bannerHeight);

  // Accent divider line on top of banner
  ctx.fillStyle = theme.accentColor || '#F42A41';
  ctx.fillRect(0, bannerY, width, 6);

  // Candidate Name
  const nameFontSize = typography.candidateNameFontSize || 50;
  ctx.font = `bold ${nameFontSize}px Kalpurush`;
  ctx.textAlign = 'center';
  ctx.fillStyle = theme.candidateNameColor || '#FFD700';
  ctx.fillText(formData.name, width / 2, bannerY + 60);

  // Candidate Designation & Political Party
  const designationFontSize = typography.designationFontSize || 30;
  ctx.font = `${designationFontSize}px Kalpurush`;
  ctx.fillStyle = '#FFFFFF';

  let subText = formData.designation;
  if (formData.locality) {
    subText += `, ${formData.locality}`;
  }
  if (formData.party) {
    subText += ` · ${formData.party}`;
  }
  ctx.fillText(subText, width / 2, bannerY + 115);

  // -------------------------------------------------------------
  // 6. Draw Footer Credit Bar
  // -------------------------------------------------------------
  const footerY = 1470;
  const footerHeight = 130;

  ctx.fillStyle = theme.footerBarColor || theme.backgroundColorEnd;
  ctx.fillRect(0, footerY, width, footerHeight);

  // Gold top border line on footer
  ctx.fillStyle = theme.goldRingColor || '#FFD700';
  ctx.fillRect(0, footerY, width, 4);

  // Footer Credit Line text
  const creditFontSize = typography.footerCreditFontSize || 26;
  ctx.font = `${creditFontSize}px Kalpurush`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#CBD5E0';

  const defaultCredit = 'প্রচারে: এলাকাবাসী ও দলীয় নেতাকর্মীবৃন্দ';
  ctx.fillText(formData.creditLine || defaultCredit, width / 2, footerY + 68);

  // -------------------------------------------------------------
  // 7. Stream PNG Buffer to Cloudinary
  // -------------------------------------------------------------
  const pngBuffer = canvas.toBuffer('image/png');

  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'political_posters/generated',
        format: 'png',
      },
      (error, result) => {
        if (error || !result) {
          console.error('Cloudinary poster upload failed:', error);
          return reject(error || new Error('Upload to Cloudinary returned no result'));
        }
        console.log('Poster uploaded to Cloudinary successfully:', result.secure_url);
        resolve(result.secure_url);
      }
    );

    uploadStream.end(pngBuffer);
  });
}
