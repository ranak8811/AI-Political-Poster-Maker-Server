import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAI } from '@google/generative-ai';

// Interface for layout color theme
export interface PosterTheme {
  backgroundColorStart: string;
  backgroundColorEnd: string;
  accentColor: string;
  goldRingColor: string;
  headlineColor: string;
  candidateNameColor: string;
  footerBarColor: string;
}

// Interface for font sizes in 1200x1600 canvas
export interface PosterTypography {
  headlineFontSize: number;
  candidateNameFontSize: number;
  designationFontSize: number;
  footerCreditFontSize: number;
}

// Interface for decorative visual elements
export interface PosterDecorations {
  showSunburst?: boolean;
  showFlagBadge?: boolean;
  borderStyle?: string;
}

// Complete poster layout configuration returned by AI or fallback
export interface PosterLayoutConfig {
  theme: PosterTheme;
  typography: PosterTypography;
  decorations?: PosterDecorations;
}

// Input parameters sent to the Gemini layout service
export interface GenerateLayoutParams {
  occasionType: string;
  headline: string;
  candidateName?: string;
  party?: string;
  photoCount: number;
}

// Default fallback layouts when Gemini is offline or rate-limited
export function getDefaultLayoutConfig(occasionType?: string): PosterLayoutConfig {
  const occasion = (occasionType || '').toUpperCase();

  if (occasion === 'MEMORIAL') {
    return {
      theme: {
        backgroundColorStart: '#1E1E1E',
        backgroundColorEnd: '#111827',
        accentColor: '#4B5563',
        goldRingColor: '#E5E7EB',
        headlineColor: '#FFFFFF',
        candidateNameColor: '#E5E7EB',
        footerBarColor: '#111827',
      },
      typography: {
        headlineFontSize: 54,
        candidateNameFontSize: 48,
        designationFontSize: 30,
        footerCreditFontSize: 24,
      },
      decorations: {
        showSunburst: false,
        showFlagBadge: false,
        borderStyle: 'MOURNING_FRAME',
      },
    };
  }

  if (occasion === 'CAMPAIGN') {
    return {
      theme: {
        backgroundColorStart: '#0B3B60',
        backgroundColorEnd: '#061D30',
        accentColor: '#E02424',
        goldRingColor: '#F59E0B',
        headlineColor: '#FFFFFF',
        candidateNameColor: '#F59E0B',
        footerBarColor: '#061D30',
      },
      typography: {
        headlineFontSize: 56,
        candidateNameFontSize: 50,
        designationFontSize: 32,
        footerCreditFontSize: 26,
      },
      decorations: {
        showSunburst: false,
        showFlagBadge: false,
        borderStyle: 'BOLD_STRIPE',
      },
    };
  }

  // Default to VICTORY_DAY / patriotic theme
  return {
    theme: {
      backgroundColorStart: '#006A4E',
      backgroundColorEnd: '#003A2B',
      accentColor: '#F42A41',
      goldRingColor: '#FFD700',
      headlineColor: '#FFFFFF',
      candidateNameColor: '#FFD700',
      footerBarColor: '#003A2B',
    },
    typography: {
      headlineFontSize: 56,
      candidateNameFontSize: 50,
      designationFontSize: 32,
      footerCreditFontSize: 26,
    },
    decorations: {
      showSunburst: true,
      showFlagBadge: true,
      borderStyle: 'DOUBLE_GOLD',
    },
  };
}

/**
 * Calls Google Gemini (Option B) to suggest layout colors and typography
 * for rendering a 1200x1600 Bangladeshi political poster.
 */
export async function generatePosterLayoutConfig(
  params: GenerateLayoutParams
): Promise<PosterLayoutConfig> {
  const apiKey = process.env.GEMINI_API_KEY;

  // If no API key is provided, gracefully return default preset
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not configured. Falling back to default layout config.');
    return getDefaultLayoutConfig(params.occasionType);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const prompt = `
You are an expert Bangladeshi political graphic design consultant.
Analyze this Bangladeshi political poster occasion and content:
- Occasion Type: "${params.occasionType}"
- Main Bengali Headline: "${params.headline}"
- Candidate Name: "${params.candidateName || 'N/A'}"
- Political Party: "${params.party || 'N/A'}"
- Number of top leader photos: ${Math.max(0, params.photoCount - 1)}

Generate a structured JSON specification for rendering a 1200x1600 political poster.
Follow traditional Bangladeshi political color rules:
- VICTORY_DAY / National events: Patriotic bottle green (#006A4E), deep flag red (#F42A41), golden yellow highlights (#FFD700), clean white text.
- CAMPAIGN / Election: Deep royal navy blue (#0B3B60), vibrant red accents (#E02424), warm golden amber (#F59E0B), high-contrast white text.
- MEMORIAL / Tribute: Somber charcoal black (#1E1E1E), deep slate (#111827), silver/white text and accents.

Return ONLY a valid JSON object matching this schema:
{
  "theme": {
    "backgroundColorStart": "#HEX",
    "backgroundColorEnd": "#HEX",
    "accentColor": "#HEX",
    "goldRingColor": "#HEX",
    "headlineColor": "#HEX",
    "candidateNameColor": "#HEX",
    "footerBarColor": "#HEX"
  },
  "typography": {
    "headlineFontSize": 56,
    "candidateNameFontSize": 50,
    "designationFontSize": 32,
    "footerCreditFontSize": 26
  },
  "decorations": {
    "showSunburst": true,
    "showFlagBadge": true,
    "borderStyle": "DOUBLE_GOLD"
  }
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    if (!responseText) {
      throw new Error('Empty response received from Gemini API');
    }

    const parsedConfig = JSON.parse(responseText) as PosterLayoutConfig;

    // Basic sanity check on the returned JSON structure
    if (!parsedConfig.theme || !parsedConfig.typography) {
      throw new Error('Gemini response missing required theme or typography fields');
    }

    return parsedConfig;
  } catch (error: any) {
    console.warn(
      'Gemini API call failed or timed out. Falling back to default layout config:',
      error?.message || error
    );
    return getDefaultLayoutConfig(params.occasionType);
  }
}
