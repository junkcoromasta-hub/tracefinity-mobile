import * as FileSystem from 'expo-file-system';
import { Mask } from './types';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY;

if (!GEMINI_API_KEY) {
  console.warn('EXPO_PUBLIC_GEMINI_KEY not set. Tracing will not work.');
}

export async function traceToolsFromPhoto(photoUri: string): Promise<Mask> {
  if (!GEMINI_API_KEY) {
    throw new Error(
      'GEMINI_API_KEY not configured. Set EXPO_PUBLIC_GEMINI_KEY in .env.local'
    );
  }

  try {
    // Read photo as base64
    const photoBase64 = await FileSystem.readAsStringAsync(photoUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log('Sending photo to Gemini for tracing...');

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: photoBase64,
                  },
                },
                {
                  text: `You are an expert at detecting tool outlines. Analyze this photograph of tools placed on paper.
                  
Generate a binary mask image where:
- BLACK (0,0,0) = tools/objects
- WHITE (255,255,255) = background/paper
- High contrast, sharp edges
- No gray areas
- Tools must be completely solid black
- No text, no guides, just the mask

Return ONLY the binary mask image as PNG. No explanation, no other content.`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();

    // Extract image from response
    const candidate = data.candidates?.[0];
    if (!candidate) {
      throw new Error('No candidates in Gemini response');
    }

    const imagePart = candidate.content?.parts?.find((p: any) => p.inline_data);
    if (!imagePart?.inline_data?.data) {
      throw new Error('No image data in Gemini response. Response: ' + JSON.stringify(data));
    }

    const maskBase64 = imagePart.inline_data.data;

    return {
      base64: maskBase64,
      width: 0, // Will be calculated from image
      height: 0,
    };
  } catch (error) {
    console.error('Tracing error:', error);
    throw error;
  }
}

// Decode base64 image and get pixel data
export async function decodeImageToPixels(
  base64: string
): Promise<{ pixels: Uint8Array; width: number; height: number }> {
  try {
    // For now, save as file and use Image to get dimensions
    // In production, you'd use a proper image decoder
    const tempUri = `${FileSystem.cacheDirectory}temp_mask.png`;
    await FileSystem.writeAsStringAsync(tempUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Return dummy values—actual implementation would decode PNG
    // For MVP, we'll extract contours from the saved file
    return {
      pixels: new Uint8Array(0),
      width: 0,
      height: 0,
    };
  } catch (error) {
    console.error('Image decode error:', error);
    throw error;
  }
}
