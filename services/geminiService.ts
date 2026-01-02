
import { GoogleGenAI, Type } from "@google/genai";
import { Hotspot } from "../types";
import { withRetry } from "./retryService";

const apiKey = process.env.API_KEY;
// Initialize safely - if no key, ai will be null but app won't crash
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Fetches real-time demand hotspots from Gemini.
 * Uses withRetry to handle potential network hiccups.
 */
export const getDemandHotspots = async (city: string): Promise<Hotspot[]> => {
  return withRetry(async () => {
    if (!ai) {
      console.warn("Gemini API key missing, returning empty hotspots");
      return [];
    }
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `List the top 5 food delivery or ride-sharing demand hotspots in ${city}, India right now. 
        Return JSON format. 
        area: name of locality, 
        intensity: number 1 to 10 based on expected volume, 
        demandReason: short reason like 'Office lunch hour' or 'Mall peak', 
        coordinates: mock screen percentage {x: 0-100, y: 0-100}.`,
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
                coordinates: {
                  type: Type.OBJECT,
                  properties: {
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER }
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
  }, 3, 1500);
};

/**
 * Expert financial assistant with Google Search grounding.
 */
export const getFinancialAdvice = async (query: string, context: string) => {
  return withRetry(async () => {
    if (!ai) {
      return { text: "AI features are disabled (no API key configured).", sources: [] };
    }
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
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
