
import { GoogleGenAI, Type } from "@google/genai";
import { Hotspot } from "../types";
import { withRetry } from "./retryService";

const apiKey = process.env.API_KEY;
// Initialize safely - if no key, ai will be null but app won't crash
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Fetches real-time demand hotspots from Gemini.
 * Contextualized by user location and their platforms.
 */
export const getDemandHotspots = async (
  location: { lat: number, lng: number } | string,
  platforms: string[]
): Promise<Hotspot[]> => {
  return withRetry(async () => {
    if (!ai) {
      console.warn("Gemini API key missing, returning empty hotspots");
      return [];
    }

    const locationStr = typeof location === 'string'
      ? location
      : `${location.lat}, ${location.lng}`;

    const platformContext = platforms.length > 0
      ? `${platforms.join(', ')}`
      : "gig worker";

    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `List 5 high-demand ${platformContext} hotspots within a 35km radius of ${locationStr}. 
        Focus strictly on the selected city and its immediate surrounding districts/states within this 100km range.
        Return JSON format.
        area: name of locality,
        intensity: number 1 to 10,
        demandReason: short reason (e.g., 'Office exit'),
        expectedIncentive: price string (e.g. '₹50'),
        distance: distance string (e.g. '1.2 km'),
        coordinates: {lat: number, lng: number} (Exact latitude and longitude).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                area: { type: Type.STRING },
                intensity: { type: Type.NUMBER },
                demandReason: { type: Type.STRING },
                expectedIncentive: { type: Type.STRING },
                distance: { type: Type.STRING },
                coordinates: {
                  type: Type.OBJECT,
                  properties: {
                    lat: { type: Type.NUMBER },
                    lng: { type: Type.NUMBER }
                  }
                }
              }
            }
          }
        }
      });

      return JSON.parse(response.text.trim());
    } catch (error) {
      console.error("Gemini hotspots failed:", error);
      throw error;
    }
  }, 3, 1000);
};

/**
 * Gets a demand forecast for the next few hours.
 * Optimized for speed and corrected coordinates.
 */
export const getDemandForecast = async (
  location: { lat: number, lng: number } | string,
  platforms: string[]
): Promise<Hotspot[]> => {
  return withRetry(async () => {
    if (!ai) return [];

    const locationStr = typeof location === 'string' ? location : `${location.lat}, ${location.lng}`;
    const context = platforms.length > 0 ? `Platforms: ${platforms.join(', ')}.` : "";

    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `Predict 5 demand hotspots for the next 4 hours within 100km radius of ${locationStr}.
        ${context}
        Consider weather, time of day, and events.
        Return JSON format.
        area: name of locality,
        intensity: number 1 to 10,
        demandReason: short reason (e.g. 'Rain expected'),
        expectedIncentive: price string,
        distance: estimated distance,
        coordinates: {lat: number, lng: number}.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                area: { type: Type.STRING },
                intensity: { type: Type.NUMBER },
                demandReason: { type: Type.STRING },
                expectedIncentive: { type: Type.STRING },
                distance: { type: Type.STRING },
                coordinates: {
                  type: Type.OBJECT,
                  properties: {
                    lat: { type: Type.NUMBER },
                    lng: { type: Type.NUMBER }
                  }
                }
              }
            }
          }
        }
      });
      return JSON.parse(response.text.trim());
    } catch (error) {
      console.error("Gemini forecast failed:", error);
      throw error;
    }
  }, 2, 1000);
};

/**
 * Expert financial assistant.
 */
export const getFinancialAdvice = async (query: string, context: string) => {
  return withRetry(async () => {
    if (!ai) {
      return { text: "AI features are disabled (no API key configured).", sources: [] };
    }
    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `User Query: ${query}\nWorker Financial Context: ${context}\n
        You are an expert financial advisor for Indian gig workers. Provide actionable advice in simple terms.
        Include information on GST, Income Tax (Section 44ADA/44AD), and insurance.`,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      return {
        text: response.text,
        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web).filter(Boolean) || []
      };
    } catch (error) {
      console.error("Gemini advice failed:", error);
      throw error;
    }
  });
};
