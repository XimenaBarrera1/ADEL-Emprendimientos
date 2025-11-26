// backend/tests/auth.test.js
import request from "supertest";
import app from "../server.js";
import mysql from "mysql2/promise";

let pool;

beforeAll(async () => {
  pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "root",
    database: process.env.DB_NAME || "adel",
    connectionLimit: 5
  });

  // Limpiamos tabla usuario antes de tests (asegúrate que tu BD existe)
  await pool.execute("DELETE FROM usuario");
});

afterAll(async () => {
  await pool.end();
});

describe("Auth endpoints", () => {
  test("POST /api/register - registra usuario nuevo", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({
        nombre: "Prueba",
        correo: "test@example.com",
        contraseña: "123456"
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.userId).toBeDefined();
  });

  test("POST /api/register - correo ya registrado devuelve 409", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({
        nombre: "Prueba2",
        correo: "test@example.com",
        contraseña: "123456"
      });
    expect(res.status).toBe(409);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe("Correo ya registrado");
  });

  test("POST /api/login - inicia sesión correctamente", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({
        correo: "test@example.com",
        contraseña: "123456"
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.user).toHaveProperty("id");
  });

  test("POST /api/login - correo no existe -> 404", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({
        correo: "noexiste@example.com",
        contraseña: "123456"
      });

    expect(res.status).toBe(404);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe("Usuario no encontrado");
  });

  test("POST /api/login - contraseña incorrecta -> 401", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({
        correo: "test@example.com",
        contraseña: "malaclave"
      });

    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe("Credenciales inválidas");
  });
});
