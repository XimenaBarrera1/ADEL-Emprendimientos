// frontend/assets/analyze-business.js
// Envía formulario negocio a /api/analyze-business
// Siempre incluye userEmail y userId (si están disponibles) para que backend pueda asociar usuario_id

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formBiz');
  const resultBox = document.getElementById('resultBox');

  function escapeHtml(s = '') {
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  }

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    resultBox.style.display = 'block';
    resultBox.innerHTML = `<div class="alert alert-info">Analizando... por favor espere.</div>`;

    const payload = {
      businessName: document.getElementById('businessName').value.trim(),
      productType: document.getElementById('productType').value.trim() || null,
      channel: document.getElementById('channel').value.trim() || null,
      avgPricePerProduct: Number(document.getElementById('avgPrice').value) || null,
      avgCostPerProduct: Number(document.getElementById('avgCost').value) || null,
      initialInvestment: Number(document.getElementById('initialInvestment').value) || null,
      description: document.getElementById('description').value.trim() || null
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
      console.warn("Error obteniendo usuario desde storage:", err);
    }

    try {
      const resp = await fetch('/api/analyze-business', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      const j = await resp.json();
      if (!j.ok) throw new Error(j.error || 'Error en servidor');

      const analysis = j.analysis;
      if (analysis && analysis.source === 'llm') {
        const s = escapeHtml(analysis.summary || '');
        const risks = (analysis.risks || []).map(r=>`<li>${escapeHtml(r)}</li>`).join('');
        const recs  = (analysis.recommendations || []).map(r=>`<li>${escapeHtml(r)}</li>`).join('');
        const margin = (analysis.margin || analysis.margin === 0) ? `<p><strong>Margen estimado:</strong> ${escapeHtml(String(analysis.margin))}%</p>` : '';

        resultBox.innerHTML = `
          <div class="card p-3">
            <h5>Resumen</h5>
            <p>${s}</p>
            ${margin}
            <h6>Riesgos principales</h6>
            <ul>${risks || '<li>No se detectaron riesgos con la información dada</li>'}</ul>
            <h6>Recomendaciones prácticas</h6>
            <ul>${recs || '<li>No hay recomendaciones específicas</li>'}</ul>
            <p style="font-size:12px;color:#666;margin-top:8px"><em>Fuente: IA (Gemini) / fallback</em></p>
          </div>
        `;
      } else {
        const summary = (analysis && (analysis.summary || analysis.text)) || 'No hay resumen disponible';
        const adviceList = (analysis && (analysis.recommendations || analysis.advice || [])).map(x=>`<li>${escapeHtml(x)}</li>`).join('');
        resultBox.innerHTML = `
          <div class="card p-3">
            <h5>Resumen</h5>
            <p>${escapeHtml(summary)}</p>
            <h6>Recomendaciones</h6>
            <ul>${adviceList || '<li>No hay recomendaciones específicas</li>'}</ul>
            <p style="font-size:12px;color:#666;margin-top:8px"><em>Fuente: motor de reglas</em></p>
          </div>
        `;
      }
    } catch (err) {
      resultBox.innerHTML = `<div class="alert alert-danger">Error: ${escapeHtml(err.message)}</div>`;
      console.error(err);
    }
  });
});
