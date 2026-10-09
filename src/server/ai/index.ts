import { getEnv } from '@/lib/env';

type AIRequest = {
  system: string;
  user: string;
  schema?: any;
};

type AIResponse = {
  ok: true;
  data: any;
} | {
  ok: false;
  code: string;
};

export async function generateJson({ system, user, schema }: AIRequest): Promise<AIResponse> {
  const env = getEnv();
  
  if (!env.GEMINI_API_KEY && !env.GROQ_API_KEY) {
    return { ok: false, code: "AI_UNAVAILABLE" };
  }

  // 1. Try Gemini
  if (env.GEMINI_API_KEY) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 6000); // 6 seconds timeout
      
      const model = env.GEMINI_MODEL || 'gemini-flash-latest';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: { text: system } },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: {
            responseMimeType: 'application/json',
          }
        }),
        signal: controller.signal
      });
      clearTimeout(id);

      if (res.ok) {
        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          try {
            return { ok: true, data: JSON.parse(text) };
          } catch (e) {
            // Invalid JSON
          }
        }
      } else if (res.status !== 429 && res.status < 500) {
        // Not a transient error (e.g., 400 Bad Request, 401 Unauthorized), we might want to fail fast or just let it fallback
        // The prompt says: "If Gemini returns 429, 5xx, or times out, catch the error and execute the exact same prompt against the Groq REST API".
        // It implies other errors might not fallback, but for simplicity let's just fallback on any error.
      }
    } catch (e) {
      // Timeout or network error
    }
  }

  // 2. Try Groq
  if (env.GROQ_API_KEY) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 6000);
      
      const model = env.GROQ_MODEL || 'llama3-8b-8192';
      const url = `https://api.groq.com/openai/v1/chat/completions`;
      
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user }
          ],
          response_format: { type: 'json_object' }
        }),
        signal: controller.signal
      });
      clearTimeout(id);

      if (res.ok) {
        const json = await res.json();
        const text = json.choices?.[0]?.message?.content;
        if (text) {
          try {
            return { ok: true, data: JSON.parse(text) };
          } catch (e) {
            // Invalid JSON
          }
        }
      }
    } catch (e) {
      // Timeout or network error
    }
  }

  return { ok: false, code: "AI_UNAVAILABLE" };
}

