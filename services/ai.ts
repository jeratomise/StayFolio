import { GoogleGenAI } from "@google/genai";
import { Stay, ChatMessage } from "../types";

const createPrompt = (stays: Stay[]) => {
  // Take the last 5 stays or interesting summary stats to keep context small
  const recentStays = stays.slice(0, 10).map(s => `${s.hotelName} (${s.brand}) in ${s.checkInDate}`).join(', ');
  const total = stays.length;
  const brands = new Set(stays.map(s => s.brand)).size;
  
  return `
    I am a travel enthusiast tracking my hotel stays.
    Here is a summary of my portfolio:
    Total Stays: ${total}
    Unique Brands: ${brands}
    Recent Stays: ${recentStays}

    Write a short, engaging, emoji-rich Instagram caption (under 50 words) that celebrates my travel journey and brand loyalty. 
    Focus on the joy of exploring new hotels. 
    Do not include hashtags.
  `;
};

export const generateSocialCaption = async (stays: Stay[]): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Please configure your API_KEY to generate AI captions.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: createPrompt(stays),
    });
    
    return response.text || "Could not generate caption.";
  } catch (error) {
    console.error("AI Generation Error:", error);
    return "Oops! Had a little trouble connecting to the travel muse. Try again later.";
  }
};

const determineVibe = (stays: Stay[]): string => {
  // Simple heuristic to determine the luxury level/vibe based on brand names
  // This helps personalize the AI image generation
  const brands = stays.map(s => s.brand.toLowerCase());
  const hotelNames = stays.map(s => s.hotelName.toLowerCase());
  
  const luxuryKeywords = ['ritz', 'st. regis', 'park hyatt', 'waldorf', 'intercontinental', 'raffles', 'fourseasons', 'mandarin', 'w hotel', 'andaz', 'jw marriott'];
  const premiumKeywords = ['marriott', 'hyatt', 'hilton', 'sheraton', 'westin', 'renaissance', 'kimpton', 'sofitel'];
  
  let luxuryCount = 0;
  let premiumCount = 0;

  stays.forEach(s => {
    const combined = (s.brand + ' ' + s.hotelName).toLowerCase();
    if (luxuryKeywords.some(k => combined.includes(k))) luxuryCount++;
    else if (premiumKeywords.some(k => combined.includes(k))) premiumCount++;
  });

  if (luxuryCount > stays.length * 0.3) return "ultra-luxury, high-end, sophisticated, golden hour, 5-star hotel interior, elegant, architectural marvel";
  if (premiumCount > stays.length * 0.5) return "upscale, modern business travel, sleek, city skyline view, executive lounge, premium comfort";
  return "cozy, adventurous, boutique hotel, travel wanderlust, roadmap, comfortable, welcoming";
};

export const generateTravelImage = async (stays: Stay[]): Promise<string | null> => {
  if (!process.env.API_KEY) return null;

  const vibe = determineVibe(stays);
  const prompt = `Generate a photorealistic, high-quality, aesthetic travel background image. 
  The vibe is: ${vibe}. 
  It should be visually stunning, suitable for an Instagram Story background. 
  No text in the image. 
  Cinematic lighting. 
  8k resolution style.`;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        // gemini-2.5-flash-image does not use responseMimeType for images, it returns raw inline data
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    return null;
  }
};

export const getConciergeAdvice = async (history: ChatMessage[], stays: Stay[], query: string): Promise<string> => {
    if (!process.env.API_KEY) return "Please configure your API_KEY.";

    const stayContext = stays.map(s => 
        `- ${s.hotelName} (${s.brand}) in ${s.country}, Rating: ${s.rating || 'N/A'}, Cost: $${s.cost || 'N/A'}`
    ).join('\n');

    const systemInstruction = `
    You are the "StayFolio Concierge", an elite travel assistant for a frequent traveler.
    
    User's Travel History Summary:
    ${stayContext}

    Your goal is to help the user optimize their elite status, find hotels that match their taste based on history, and answer travel logistics questions.
    
    Guidelines:
    1. Be concise, professional, but witty.
    2. Use the user's history to make personalized recommendations (e.g. "Since you liked the Park Hyatt...").
    3. If they ask about status, analyze their brand loyalty.
    4. Use emojis sparingly.
    `;

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const chat = ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: {
                systemInstruction: systemInstruction,
            },
            history: history.map(h => ({
                role: h.role,
                parts: [{ text: h.text }]
            }))
        });

        const result = await chat.sendMessage({ message: query });
        return result.text || "I'm having trouble connecting to the concierge desk right now.";
    } catch (error) {
        console.error("Concierge Error:", error);
        return "The concierge is currently busy. Please try again later.";
    }
};