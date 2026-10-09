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
      const id = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout
      
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
            console.error("Gemini invalid JSON:", text);
          }
        }
      } else {
        console.error("Gemini failed:", res.status, await res.text());
      }
    } catch (e) {
      console.error("Gemini network error/timeout:", e);
    }
  }

  // 2. Try Groq
  if (env.GROQ_API_KEY) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout
      
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
            { role: 'system', content: system + '\nEnsure output is strictly JSON.' },
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
            console.error("Groq invalid JSON:", text);
          }
        }
      } else {
        console.error("Groq failed:", res.status, await res.text());
      }
    } catch (e) {
      console.error("Groq network error/timeout:", e);
    }
  }

  return { ok: false, code: "AI_UNAVAILABLE" };
}

