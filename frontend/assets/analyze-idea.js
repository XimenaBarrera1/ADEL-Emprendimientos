// frontend/assets/analyze-idea.js
// Envía formulario idea a /api/analyze-idea, manda userEmail / userId si existen

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formIdea");
  const sendBtn = document.getElementById("sendBtn");
  const resetBtn = document.getElementById("resetBtn");
  const resultBox = document.getElementById("resultBox");

  resetBtn?.addEventListener("click", () => form.reset());

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    sendBtn.disabled = true;
    sendBtn.innerText = "Analizando...";

    const payload = {
      ideaName: document.getElementById("ideaName").value.trim(),
      productType: document.getElementById("productType").value.trim() || null,
      targetAudience: document.getElementById("targetAudience").value.trim() || null,
      channel: document.getElementById("channel").value.trim() || null,
      initialCapital: Number(document.getElementById("initialCapital").value) || null,
      description: document.getElementById("description").value.trim() || null
    };

    // Añadir userEmail / userId desde sessionStorage o localStorage
    try {
      const s = JSON.parse(sessionStorage.getItem("usuarioActivo")) || null;
      const l = JSON.parse(localStorage.getItem("usuarioADEL")) || JSON.parse(localStorage.getItem("ultimoUsuario")) || null;
      if (s && s.correo) payload.userEmail = s.correo;
      if (s && s.id) payload.userId = s.id;
      if (!payload.userEmail && l && l.correo) payload.userEmail = l.correo;
      if (!payload.userId && l && l.id) payload.userId = l.id;
    } catch (err) {
      console.warn("No se pudo leer usuarioADEL desde storage:", err);
    }

    resultBox.style.display = "";
    resultBox.innerHTML = `<div class="alert alert-info">Analizando la idea, por favor espere...</div>`;

    try {
      const res = await fetch("/api/analyze-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Respuesta inesperada del servidor");

      const data = json.analysis || json.result || {};
      if (data.text && !data.summary) {
        resultBox.innerHTML = `
          <div class="card p-3">
            <h5>Asesoría</h5>
            <pre style="white-space:pre-wrap;">${escapeHtml(data.text)}</pre>
            <small class="text-muted">Fuente: ${escapeHtml(data.source || "llm")}</small>
          </div>`;
        return;
      }

      const summary = data.summary || "No hay resumen disponible.";
      const actions = Array.isArray(data.actions) ? data.actions : (Array.isArray(data.recommendations) ? data.recommendations : []);
      const recs = Array.isArray(data.recommendations) ? data.recommendations : (Array.isArray(data.advice) ? data.advice : []);

      resultBox.innerHTML = `
        <div class="card p-3">
          <div class="d-flex justify-content-between">
            <div>
              <h5>Resumen</h5>
              <p>${escapeHtml(summary)}</p>
            </div>
            <div class="text-muted">Fuente: ${escapeHtml(data.source || "llm")}</div>
          </div>

          <div class="mt-3">
            <h6>Acciones iniciales recomendadas</h6>
            <ul>${(actions.length ? actions : ["Definir un prototipo mínimo (vender a conocidos)"]).map(a => `<li>${escapeHtml(a)}</li>`).join("")}</ul>
          </div>

          <div class="mt-2">
            <h6>Otras recomendaciones</h6>
            <ul>${(recs.length ? recs : ["Definir canal y público objetivo claramente"]).map(r => `<li>${escapeHtml(r)}</li>`).join("")}</ul>
          </div>
        </div>
      `;
    } catch (err) {
      console.error(err);
      resultBox.innerHTML = `<div class="alert alert-danger">Error: ${escapeHtml(err.message)}</div>`;
    } finally {
      sendBtn.disabled = false;
      sendBtn.innerText = "Registrar y analizar";
    }
  });

  function escapeHtml(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }
});
