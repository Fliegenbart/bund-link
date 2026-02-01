import { Ollama } from "ollama";

// Configuration
const OLLAMA_HOST = process.env.OLLAMA_URL || "http://localhost:11434";
const MODEL = process.env.OLLAMA_MODEL || "llama3.2";

let ollamaClient: Ollama | null = null;
let ollamaAvailable = false;

/**
 * Initialize Ollama client and check availability
 */
export async function initAI(): Promise<boolean> {
  try {
    ollamaClient = new Ollama({ host: OLLAMA_HOST });

    // Test connection by listing models
    const models = await ollamaClient.list();
    const modelExists = models.models.some((m) => m.name.includes(MODEL.split(":")[0]));

    if (modelExists) {
      console.log(`[AI] Ollama connected. Model ${MODEL} available.`);
      ollamaAvailable = true;
      return true;
    } else {
      console.log(`[AI] Ollama connected, but model ${MODEL} not found.`);
      console.log(`[AI] Available models:`, models.models.map((m) => m.name).join(", "));
      console.log(`[AI] Run: ollama pull ${MODEL}`);
      ollamaAvailable = false;
      return false;
    }
  } catch (error) {
    console.log("[AI] Ollama not available. AI features disabled.");
    console.log("[AI] To enable, run Ollama: ollama serve");
    ollamaAvailable = false;
    return false;
  }
}

/**
 * Check if AI is available
 */
export function isAIAvailable(): boolean {
  return ollamaAvailable && ollamaClient !== null;
}

/**
 * Generate metadata (title, description) from a URL
 * Returns null if AI is not available
 */
export async function generateMetadataFromUrl(url: string): Promise<{
  title: string;
  description: string;
} | null> {
  if (!isAIAvailable() || !ollamaClient) {
    return null;
  }

  try {
    const prompt = `Analyze this URL and generate a short title (max 60 chars) and description (max 160 chars) in German.
URL: ${url}

Respond ONLY in this exact JSON format, no other text:
{"title": "...", "description": "..."}`;

    const response = await ollamaClient.generate({
      model: MODEL,
      prompt,
      stream: false,
      options: {
        temperature: 0.3, // Lower temperature for more consistent output
        num_predict: 200,
      },
    });

    // Parse JSON from response
    const jsonMatch = response.response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        title: parsed.title?.slice(0, 60) || "",
        description: parsed.description?.slice(0, 160) || "",
      };
    }

    return null;
  } catch (error) {
    console.error("[AI] Failed to generate metadata:", error);
    return null;
  }
}

/**
 * Analyze a URL for phishing indicators
 * Returns a risk score (0-100) and reasons
 */
export async function analyzeUrlForPhishing(url: string): Promise<{
  riskScore: number;
  isLikelySafe: boolean;
  reasons: string[];
} | null> {
  if (!isAIAvailable() || !ollamaClient) {
    return null;
  }

  try {
    const prompt = `Analyze this URL for phishing or fraud indicators:
URL: ${url}

Check for:
1. Suspicious domain patterns (typosquatting, lookalike domains)
2. Unusual URL structure or encoding
3. Keywords associated with phishing (login, verify, account, password)
4. Mismatch between apparent brand and domain

Respond ONLY in this exact JSON format, no other text:
{"riskScore": <0-100>, "reasons": ["reason1", "reason2"]}

riskScore: 0 = very safe, 100 = very suspicious`;

    const response = await ollamaClient.generate({
      model: MODEL,
      prompt,
      stream: false,
      options: {
        temperature: 0.2,
        num_predict: 300,
      },
    });

    const jsonMatch = response.response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const riskScore = Math.min(100, Math.max(0, parseInt(parsed.riskScore) || 0));
      return {
        riskScore,
        isLikelySafe: riskScore < 30,
        reasons: Array.isArray(parsed.reasons) ? parsed.reasons.slice(0, 5) : [],
      };
    }

    return null;
  } catch (error) {
    console.error("[AI] Failed to analyze URL:", error);
    return null;
  }
}

/**
 * Suggest routing rules based on URL content
 */
export async function suggestRoutingRules(url: string, currentRules: any[]): Promise<{
  suggestions: Array<{
    ruleType: "geographic" | "language" | "device";
    condition: any;
    reason: string;
  }>;
} | null> {
  if (!isAIAvailable() || !ollamaClient) {
    return null;
  }

  try {
    const prompt = `Suggest smart routing rules for this URL based on its content:
URL: ${url}
Existing rules: ${JSON.stringify(currentRules)}

Consider:
- Language-specific versions (de, en, fr, tr for German government sites)
- Mobile-optimized versions
- Geographic targeting (EU countries)

Respond ONLY in this exact JSON format, no other text:
{"suggestions": [{"ruleType": "language|geographic|device", "condition": {...}, "reason": "..."}]}`;

    const response = await ollamaClient.generate({
      model: MODEL,
      prompt,
      stream: false,
      options: {
        temperature: 0.4,
        num_predict: 400,
      },
    });

    const jsonMatch = response.response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return null;
  } catch (error) {
    console.error("[AI] Failed to suggest routing rules:", error);
    return null;
  }
}
