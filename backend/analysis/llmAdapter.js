// backend/analysis/llmAdapter.js
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY || process.env.GEN_API_KEY || null;
if (!API_KEY) console.warn("ATENCIÓN: GEMINI_API_KEY no configurada en .env");

const client = new GoogleGenAI({ apiKey: API_KEY });

/**
 * callLLM: envía prompt a Gemini usando SDK y devuelve { text, raw, tokens }.
 * @param {string} prompt
 * @param {object} opts
 */
export async function callLLM(prompt, { maxOutputTokens = 512, model = "gemini-2.5-flash" } = {}) {
  try {
    const resp = await client.models.generateContent({
      model,
      contents: prompt,
      maxOutputTokens
    });

    // Intentar extraer texto y tokens de la respuesta en varias formas (compatibilidad)
    let text = null;
    let tokens = null;
    // 1) resp.text
    if (typeof resp?.text === "string") {
      text = resp.text;
    }

    // 2) outputs -> content
    if (!text && Array.isArray(resp?.outputs) && resp.outputs.length) {
      const parts = [];
      for (const out of resp.outputs) {
        if (Array.isArray(out.content)) {
          for (const c of out.content) {
            if (typeof c === "string") parts.push(c);
            else if (c?.text) parts.push(c.text);
          }
        } else if (typeof out.content === "string") {
          parts.push(out.content);
        } else if (typeof out === "string") {
          parts.push(out);
        }
      }
      if (parts.length) text = parts.join("\n\n");
    }

    // 3) fallback: stringify
    if (!text) text = JSON.stringify(resp);

    // tratar tokens si vienen (según SDK)
    if (resp?.usage?.totalTokens) tokens = resp.usage.totalTokens;
    if (!tokens && resp?.usage?.total_tokens) tokens = resp.usage.total_tokens;
    if (!tokens && resp?.billing?.tokenCount) tokens = resp.billing.tokenCount;

    return { text, raw: resp, tokens: tokens ?? null };
  } catch (err) {
    console.error("callLLM error:", err);
    const msg = err?.message || String(err);
    // devolver objeto de error para que el llamador lo registre
    return { ok: false, error: msg, raw: err.response ? err.response.data : null };
  }
}
