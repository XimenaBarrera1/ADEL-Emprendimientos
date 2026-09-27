# ADEL — Asistente Digital para Emprendimientos Locales

## Descripción

ADEL es un asistente digital que utiliza inteligencia artificial generativa para brindar recomendaciones a pequeños emprendedores. A partir de la información que el usuario ingresa, el sistema identifica si se trata de una idea de negocio o de un negocio ya en marcha, y adapta la experiencia según ese caso.

Esta es la primera versión (MVP v1) del proyecto, desarrollada para poner a prueba el concepto central: usar IA generativa para acompañar a un emprendedor en decisiones clave de su negocio.

## ¿Cómo funciona?

1. **Identificación del caso:** el sistema determina si el usuario tiene una idea de negocio o un negocio ya establecido.
2. **Formulario simple:** según el caso identificado, se muestra un formulario sencillo para recopilar la información relevante del emprendimiento.
3. **Análisis con IA:** la información ingresada se envía a la API de Gemini (Google Generative AI), que la analiza y genera recomendaciones personalizadas.
4. **Recomendaciones:** el usuario recibe sugerencias sobre aspectos como márgenes financieros, nombres convenientes para su negocio o producto, y otras orientaciones prácticas.

## Tecnologías utilizadas

**Backend:**
- Node.js + Express
- MySQL (mysql2)
- Google Generative AI / Gemini API (@google/genai, @google/generative-ai)
- bcrypt (autenticación)
- dotenv, cors, node-fetch

**Frontend:**
- HTML, CSS y JavaScript

**Testing:**
- Jest, Supertest

## Estado del proyecto

Esta primera versión fue desarrollada para validar el concepto con una implementación funcional. El alcance y las funcionalidades del proyecto siguen en evolución a medida que se define mejor la dirección del producto.
