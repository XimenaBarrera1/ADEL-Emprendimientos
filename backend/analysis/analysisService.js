// backend/analysis/analysisService.js
import dotenv from "dotenv";
dotenv.config();

import { callLLM } from "./llmAdapter.js";

/** intenta parsear JSON en un texto (extrae primera { ... }) */
function tryExtractJson(text) {
  if (!text || typeof text !== "string") return null;
  try { return JSON.parse(text); } catch (e) {}
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    const candidate = text.slice(start, end + 1);
    try { return JSON.parse(candidate); } catch (err) {}
  }
  return null;
}

export async function analyzeBusiness(payload) {
  const prompt = `
Eres un asesor breve y claro para pequeños negocios de COMIDA RÁPIDA.
Recibirás datos del dueño en formato JSON (solo datos). Con base en esos datos,
devuelve SOLO UN JSON con esta estructura EXACTA:
{
  "summary": "<resumen práctico 1-3 oraciones>",
  "risks": ["riesgo 1", "riesgo 2", "riesgo 3"],
  "recommendations": ["accion concreta 1", "accion 2", "accion 3"],
  "margin": <numero_entero_o_null>
}
Si puedes calcular el margen con avgCostPerProduct y avgPricePerProduct, inclúyelo como entero.
NO agregues texto antes ni después del JSON. Responde únicamente con el JSON.

Datos: ${JSON.stringify(payload)}
  `;

  const llmResp = await callLLM(prompt, { maxOutputTokens: 700, model: process.env.GEMINI_MODEL || "gemini-2.5-flash" });

  // Si callLLM devolvió error-en-volumen
  if (llmResp?.ok === false) {
    // devolver objeto con error para que el servidor lo registre
    throw new Error("LLM error: " + (llmResp.error || "error desconocido"));
  }

  const text = llmResp.text;
  const parsed = tryExtractJson(text);
  if (!parsed) {
    // devolver raw para que el servidor lo registre; lanzamos para que el endpoint capture
    const sample = typeof text === "string" ? text.slice(0, 1000) : JSON.stringify(text).slice(0,1000);
    throw new Error("LLM no devolvió JSON parseable. Respuesta cruda: " + sample);
  }

  const analysis = {
    source: "llm",
    summary: String(parsed.summary || ""),
    risks: Array.isArray(parsed.risks) ? parsed.risks : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    margin: (typeof parsed.margin === "number") ? parsed.margin : (parsed.margin ? Number(parsed.margin) : null)
  };

  return { analysis, raw: llmResp.raw, tokens: llmResp.tokens };
}

export async function analyzeIdea(payload) {
  const prompt = `
Eres un asesor práctico para IDEAS de negocio en COMIDA RÁPIDA.
Recibirás datos del emprendedor en JSON. Devuelve SOLO UN JSON EXACTO:
{
  "summary": "<viabilidad breve 1-3 oraciones>",
  "actions": ["accion 1 para empezar", "accion 2", "accion 3"],
  "recommendations": ["recomendacion 1", "recomendacion 2"]
}
RESPONDE SOLO CON EL JSON.

Datos: ${JSON.stringify(payload)}
  `;

  const llmResp = await callLLM(prompt, { maxOutputTokens: 600, model: process.env.GEMINI_MODEL || "gemini-2.5-flash" });

  if (llmResp?.ok === false) throw new Error("LLM error: " + (llmResp.error || "error desconocido"));

  const text = llmResp.text;
  const parsed = tryExtractJson(text);
  if (!parsed) {
    const sample = typeof text === "string" ? text.slice(0, 1000) : JSON.stringify(text).slice(0,1000);
    throw new Error("LLM no devolvió JSON parseable para idea. Respuesta cruda: " + sample);
  }

  const analysis = {
    source: "llm",
    summary: parsed.summary || "",
    actions: Array.isArray(parsed.actions) ? parsed.actions : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : []
  };

  return { analysis, raw: llmResp.raw, tokens: llmResp.tokens };
}
