import { generateJson } from './src/server/ai';
import { getEnv } from './src/lib/env';

async function test() {
  const system = `You are an AI assistant that converts natural language event search queries into structured JSON filters.
Available categories: programming, robotics, math, science, business, arts, gaming, other.
Available states: open, closing_soon, closed, full, waitlist, ended, not_open.
You must return a JSON object with any of these fields (omit if not requested):
- q: a specific keyword or name mentioned (string)
- category: comma-separated list of matched categories (string)
- state: comma-separated list of matched states (string)
- dateFrom: ISO date string if user mentions a start date
- dateTo: ISO date string if user mentions an end date
- summary: a brief natural language summary of what you understood from the user's query, written in English.
Example input: "Are there any open programming contests next week?"
Example output: {"category": "programming", "state": "open", "summary": "Open programming events"}
`;

  const user = "Are there any open programming contests next week";
  
  // Expose error logging inside generateJson temporarily or just mock fetch
  
  const env = getEnv();
  
  console.log("Testing Gemini...");
  const model = env.GEMINI_MODEL || 'gemini-1.5-flash';
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
    })
  });
  
  if (!res.ok) {
    console.log("Gemini failed", res.status, await res.text());
  } else {
    console.log("Gemini success", await res.json());
  }
  
  console.log("Testing Groq...");
  const groqModel = env.GROQ_MODEL || 'llama3-8b-8192';
  const groqUrl = `https://api.groq.com/openai/v1/chat/completions`;
  
  const groqRes = await fetch(groqUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: groqModel,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      response_format: { type: 'json_object' }
    })
  });
  
  if (!groqRes.ok) {
    console.log("Groq failed", groqRes.status, await groqRes.text());
  } else {
    console.log("Groq success", await groqRes.json());
  }
}

test().catch(console.error);

