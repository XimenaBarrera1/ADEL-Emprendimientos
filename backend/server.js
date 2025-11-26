// backend/server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cors from "cors";
import crypto from "crypto";
import bcrypt from "bcrypt";
import mysql from "mysql2/promise";
import { analyzeBusiness, analyzeIdea } from "./analysis/analysisService.js";

dotenv.config();

const PORT = process.env.PORT || 4000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// MySQL pool (ajusta .env si usas variables)
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "adel",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Servir frontend estático (si lo necesitas)
app.use("/", express.static(path.join(__dirname, "..", "frontend")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

/* ---------- Helpers ---------- */
function sha256Hex(obj) {
  const normalize = (o) => {
    if (o === null || typeof o !== "object") return o;
    if (Array.isArray(o)) return o.map(normalize);
    const keys = Object.keys(o).sort();
    const res = {};
    for (const k of keys) res[k] = normalize(o[k]);
    return res;
  };
  const json = JSON.stringify(normalize(obj));
  return crypto.createHash("sha256").update(json).digest("hex");
}

async function findUserByEmail(email) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(
      "SELECT id, nombre, correo, contraseña_hash, acepto_uso_ia FROM usuario WHERE correo = ?",
      [email]
    );
    return rows && rows.length ? rows[0] : null;
  } finally {
    conn.release();
  }
}

async function insertAnalisisRequest(usuarioId, tipo, inputHash, promptTemplate, modelo) {
  const conn = await pool.getConnection();
  try {
    const [res] = await conn.execute(
      `INSERT INTO analisis_request (usuario_id, tipo, input_hash, prompt_template, modelo_usado)
       VALUES (?, ?, ?, ?, ?)`,
      [usuarioId, tipo, inputHash, promptTemplate, modelo]
    );
    return res.insertId;
  } finally {
    conn.release();
  }
}

// Nota: aquí no se inserta tokens_consumidos (ajusta tu BD en consecuencia)
async function insertAnalisisResponse(requestId, texto, raw) {
  const conn = await pool.getConnection();
  try {
    const [res] = await conn.execute(
      `INSERT INTO analisis_response (request_id, texto_resultado, raw_response)
       VALUES (?, ?, ?)`,
      [requestId, texto, typeof raw === "string" ? raw : JSON.stringify(raw)]
    );
    return res.insertId;
  } finally {
    conn.release();
  }
}

/* ---------- Endpoints: registro / login ---------- */

// POST /api/register
app.post("/api/register", async (req, res) => {
  try {
    const { nombre, correo, contraseña } = req.body;
    if (!nombre || !correo || !contraseña) return res.status(400).json({ ok: false, error: "Faltan campos" });

    const conn = await pool.getConnection();
    try {
      const [exists] = await conn.execute("SELECT id FROM usuario WHERE correo = ?", [correo]);
      if (exists.length) return res.status(409).json({ ok: false, error: "Correo ya registrado" });

      const hash = await bcrypt.hash(contraseña, 10);
      const [r] = await conn.execute(
        `INSERT INTO usuario (nombre, correo, contraseña_hash, acepto_uso_ia)
         VALUES (?, ?, ?, ?)`,
        [nombre, correo, hash, 1]
      );
      return res.json({ ok: true, userId: r.insertId, nombre, correo });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Error /api/register:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/login
app.post("/api/login", async (req, res) => {
  try {
    const { correo, contraseña } = req.body;
    if (!correo || !contraseña) return res.status(400).json({ ok: false, error: "Faltan campos" });

    const user = await findUserByEmail(correo);
    if (!user) return res.status(404).json({ ok: false, error: "Usuario no encontrado" });

    const match = await bcrypt.compare(contraseña, user.contraseña_hash);
    if (!match) return res.status(401).json({ ok: false, error: "Credenciales inválidas" });

    // Devolver datos mínimos
    return res.json({ ok: true, user: { id: user.id, nombre: user.nombre, correo: user.correo, acepto_uso_ia: user.acepto_uso_ia } });
  } catch (err) {
    console.error("Error /api/login:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

/* ---------- Endpoints de análisis (guardado en DB) ---------- */

app.post("/api/analyze-business", async (req, res) => {
  try {
    const payload = req.body || {};
    const userEmail = payload.userEmail || null;

    const formData = {
      businessName: payload.businessName ?? null,
      productType: payload.productType ?? null,
      channel: payload.channel ?? null,
      avgPricePerProduct: payload.avgPricePerProduct ?? null,
      avgCostPerProduct: payload.avgCostPerProduct ?? null,
      initialInvestment: payload.initialInvestment ?? null,
      description: payload.description ?? null
    };

    // resolver usuarioId por userId directo o por email
    let usuarioId = null;
    if (payload.userId) usuarioId = payload.userId;
    else if (userEmail) {
      const u = await findUserByEmail(userEmail);
      if (u) usuarioId = u.id;
    }

    const inputHash = sha256Hex(formData);
    const promptTemplate = "Analiza negocio de comida rápida: campos {businessName, productType, channel, avgPricePerProduct, avgCostPerProduct, initialInvestment, description}. No almacenar datos personales.";

    const requestId = await insertAnalisisRequest(usuarioId, "negocio", inputHash, promptTemplate, process.env.GEMINI_MODEL || "gemini-2.5-flash");

    const { analysis, raw } = await analyzeBusiness(formData);

    const responseId = await insertAnalisisResponse(requestId, JSON.stringify(analysis), raw);

    return res.json({ ok: true, analysis, requestId, responseId });
  } catch (err) {
    console.error("Error /api/analyze-business:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/api/analyze-idea", async (req, res) => {
  try {
    const payload = req.body || {};
    const userEmail = payload.userEmail || null;

    const formData = {
      ideaName: payload.ideaName ?? null,
      productType: payload.productType ?? null,
      targetAudience: payload.targetAudience ?? null,
      channel: payload.channel ?? null,
      initialCapital: payload.initialCapital ?? null,
      description: payload.description ?? null
    };

    let usuarioId = null;
    if (payload.userId) usuarioId = payload.userId;
    else if (userEmail) {
      const u = await findUserByEmail(userEmail);
      if (u) usuarioId = u.id;
    }

    const inputHash = sha256Hex(formData);
    const promptTemplate = "Analiza idea de negocio (comida rápida): campos {ideaName, productType, targetAudience, channel, initialCapital, description}. No almacenar datos personales.";

    const requestId = await insertAnalisisRequest(usuarioId, "idea", inputHash, promptTemplate, process.env.GEMINI_MODEL || "gemini-2.5-flash");

    const { analysis, raw } = await analyzeIdea(formData);

    const responseId = await insertAnalisisResponse(requestId, JSON.stringify(analysis), raw);

    return res.json({ ok: true, analysis, requestId, responseId });
  } catch (err) {
    console.error("Error /api/analyze-idea:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

// EXPORT ESM (muy importante)
export default app;
