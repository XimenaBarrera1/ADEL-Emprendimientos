/* frontend/assets/main.js
   CONTROL DE REGISTRO, LOGIN, SESIÓN PERSISTENTE Y MANEJO DE FORMULARIOS
   - Registro intenta /api/register y guarda id devuelto en localStorage (usuarioADEL).
   - Login intenta /api/login, guarda sessionStorage.usuarioActivo y localStorage.ultimoUsuario
     para persistencia entre cierres del navegador (no guarda contraseña).
   - Si no hay servidor disponible, mantiene comportamiento offline con localStorage.
   - Logout borra sesión activa; si se desea "cerrar completamente", borra ultimoUsuario también.
*/

/* ---------- Helpers ---------- */
function getLocalUser() {
  try { return JSON.parse(localStorage.getItem("usuarioADEL")); } catch { return null; }
}
function setLocalUser(obj) {
  try { localStorage.setItem("usuarioADEL", JSON.stringify(obj)); } catch {}
}
function setLastUser(obj) {
  try { localStorage.setItem("ultimoUsuario", JSON.stringify(obj)); } catch {}
}
function getLastUser() {
  try { return JSON.parse(localStorage.getItem("ultimoUsuario")); } catch { return null; }
}
function setSessionUser(obj) {
  try { sessionStorage.setItem("usuarioActivo", JSON.stringify(obj)); } catch {}
}
function getSessionUser() {
  try { return JSON.parse(sessionStorage.getItem("usuarioActivo")); } catch { return null; }
}

/* ---------- Auto-restore sesión (persistente) ----------
   Si no hay sessionStorage pero sí localStorage.ultimoUsuario, lo restauramos.
   Esto permite cerrar navegador y mantener sesión "activa" para propósitos de pruebas.
*/
(function restoreSessionIfNeeded() {
  const session = getSessionUser();
  if (!session) {
    const last = getLastUser();
    if (last && last.id) {
      setSessionUser(last); // restaurar sesión (sin contraseña)
      console.log("Sesión restaurada desde localStorage.ultimoUsuario:", last);
    }
  }
})();

/* ===========================================================
   REGISTRO DE USUARIO (registro.html)
   - intenta registrar en backend;
   - si backend responde OK guarda usuario con id en localStorage (sin contraseña);
   - si backend no disponible, guarda offline con contraseña (UX), pero marca sin id.
=========================================================== */
if (document.querySelector(".form") && window.location.pathname.includes("registro.html")) {
  document.querySelector(".form").addEventListener("submit", async function(e) {
    e.preventDefault();

    const nombre = document.querySelector('input[placeholder="Nombre"]').value.trim();
    const correo = document.querySelector('input[placeholder="Correo electrónico"]').value.trim();
    const contraseña = document.querySelector('input[placeholder="Contraseña"]').value.trim();

    if (!nombre || !correo || !contraseña) {
      alert("⚠️ Por favor completa todos los campos.");
      return;
    }

    // Guardado local inmediato (UX)
    const localObj = { nombre, correo, contraseña };
    setLocalUser(localObj);

    // Intento de registro en backend (no bloqueante; si falla, el usuario queda en localStorage)
    try {
      const resp = await fetch('/api/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ nombre, correo, contraseña })
      });

      const j = await resp.json().catch(()=>null);

      if (resp.ok && j && j.ok && j.userId) {
        // Guardar sin contraseña en localStorage (id real)
        const saved = { id: j.userId, nombre: j.nombre, correo: j.correo };
        setLocalUser(saved);
        setLastUser(saved);
        alert("✅ Registro completado en servidor y guardado localmente. Ahora inicia sesión.");
        window.location.href = "inicio.html";
        return;
      } else {
        // Si servidor respondió con error (ej. correo ya registrado), intentar informar
        if (j && j.error) {
          // Si correo ya registrado: sugerimos al usuario iniciar sesión
          if (resp.status === 409) {
            alert("⚠️ El correo ya está registrado. Intenta iniciar sesión.");
            window.location.href = "inicio.html";
            return;
          } else {
            alert("⚠️ Registro falló en servidor: " + j.error + ". Se guardó localmente.");
            window.location.href = "inicio.html";
            return;
          }
        }
      }
    } catch (err) {
      console.warn("Registro: no fue posible conectar con el servidor. Guardado localmente.", err);
      alert("⚠️ Registro guardado localmente (sin conexión al servidor). Cuando el servidor esté disponible, podrás sincronizar.");
      window.location.href = "inicio.html";
    }
  });
}

/* ===========================================================
   INICIO DE SESIÓN (inicio.html)
   - intenta /api/login (servidor)
   - si OK -> guarda sessionStorage + localStorage.ultimoUsuario (persistente)
   - si servidor no disponible -> fallback local (si hay contraseña local)
=========================================================== */
if (document.getElementById("loginForm") && window.location.pathname.includes("inicio.html")) {
  document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const alertBox = document.getElementById("alertMessage");

    // Intento en servidor
    try {
      const resp = await fetch('/api/login', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ correo: email, contraseña: password })
      });

      const j = await resp.json().catch(()=>null);

      if (resp.ok && j && j.ok && j.user) {
        try {
    sessionStorage.setItem("usuarioActivo", JSON.stringify(j.user));
  } catch (err) {
    // fallback: guardar nombre plano
    sessionStorage.setItem("usuarioActivo", j.user.nombre || j.user.correo || "");
  }
  // también guardar copia en localStorage bajo 'ultimoUsuario' para fallback en pages
  try {
    localStorage.setItem("ultimoUsuario", JSON.stringify(j.user));
  } catch (e) {
    localStorage.setItem("ultimoUsuario", j.user.nombre || j.user.correo || "");
  }

  // UX
  alertBox.className = "alert alert-success mt-3";
  alertBox.textContent = "✅ Inicio de sesión exitoso.";
  alertBox.classList.remove("d-none");
  setTimeout(() => { window.location.href = "negocio.html"; }, 900);
  return;
      } else {
        // Si servidor respondió 4xx con mensaje, mostramos y luego fallback
        if (j && j.error) {
          alertBox.className = "alert alert-danger mt-3";
          alertBox.textContent = `⚠️ ${j.error}`;
          alertBox.classList.remove("d-none");
        }
      }
    } catch (err) {
      console.warn("Login servidor no disponible, se intentará fallback local:", err);
    }

    // Fallback local (útil si registraste offline)
 
    const usuarioGuardado = JSON.parse(localStorage.getItem("usuarioADEL"));
if (email === usuarioGuardado.correo && password === usuarioGuardado.contraseña) {
  const userObj = { id: usuarioGuardado.id || null, nombre: usuarioGuardado.nombre, correo: usuarioGuardado.correo };
  sessionStorage.setItem("usuarioActivo", JSON.stringify(userObj));
  localStorage.setItem("ultimoUsuario", JSON.stringify(userObj));
  // ...
}

    // Si el usuario local tiene contraseña guardada (registro offline), se puede logear localmente
    if (usuarioGuardado.contraseña) {
      if (email === usuarioGuardado.correo && password === usuarioGuardado.contraseña) {
        const sessionObj = {
          id: usuarioGuardado.id || null,
          nombre: usuarioGuardado.nombre,
          correo: usuarioGuardado.correo
        };
        setSessionUser(sessionObj);
        if (sessionObj.id) setLastUser(sessionObj);

        alertBox.className = "alert alert-success mt-3";
        alertBox.textContent = "✅ Inicio de sesión local correcto.";
        alertBox.classList.remove("d-none");

        setTimeout(()=> window.location.href = "negocio.html", 700);
        return;
      } else {
        alertBox.className = "alert alert-danger mt-3";
        alertBox.textContent = "⚠️ Correo o contraseña incorrectos (local).";
        alertBox.classList.remove("d-none");
        return;
      }
    }

    // Si el usuario local no tiene contraseña (quizá vino del servidor) y no pudimos conectar al servidor:
    alertBox.className = "alert alert-warning mt-3";
    alertBox.textContent = "⚠️ No se pudo autenticar contra el servidor y no hay contraseña local. Conecta a internet para iniciar sesión.";
    alertBox.classList.remove("d-none");
  });
}

/* ===========================================================
   VALIDAR SESIÓN ACTIVA Y MOSTRAR NOMBRE
   - restauramos la sesión desde localStorage.ultimoUsuario si es necesario
   - mostramos nombre en id="nombreUsuario"
=========================================================== */
document.addEventListener("DOMContentLoaded", () => {
  // restauración: si no hay sessionStorage pero hay ultimoUsuario lo restauramos
  const sessionUser = getSessionUser() || getLastUser();
  if (sessionUser && !getSessionUser()) setSessionUser(sessionUser);

  const usuarioActivo = getSessionUser();
  const cerrarSesionBtn = document.getElementById("cerrarSesionBtn");
  const paginasProtegidas = ["negocio.html", "noticias.html", "registroNegocio.html", "perfil.html"];
  const estaEnPaginaProtegida = paginasProtegidas.some(p => window.location.pathname.includes(p));

  if (estaEnPaginaProtegida && !usuarioActivo) {
    alert("⚠️ Por favor inicia sesión primero.");
    window.location.href = "inicio.html";
    return;
  }

  const nombreSpan = document.getElementById("nombreUsuario");
  if (nombreSpan && usuarioActivo) {
    nombreSpan.textContent = usuarioActivo.nombre || usuarioActivo;
  }

  if (cerrarSesionBtn) {
    cerrarSesionBtn.addEventListener("click", () => {
      if (confirm("¿Deseas cerrar sesión?")) {
        // Si quieres destruir la sesión completamente (no persistente), borra ultimoUsuario también:
        // localStorage.removeItem("ultimoUsuario");
        sessionStorage.removeItem("usuarioActivo");
        window.location.href = "inicio.html";
      }
    });
  }
});

/* ===========================================================
   Manejo de formularios: registroIdea / registroNegocio (mantengo tu lógica local)
=========================================================== */
document.addEventListener("DOMContentLoaded", () => {
  // Registro de idea
  const formIdea = document.getElementById("formIdea");
  if (formIdea) {
    formIdea.addEventListener("submit", (e) => {
      e.preventDefault();
      const inputs = formIdea.querySelectorAll("input, select, textarea");
      const idea = {};
      inputs.forEach((input) => {
        const key = input.name || input.id || input.placeholder;
        idea[key] = input.value;
      });
      const ideas = JSON.parse(localStorage.getItem("ideasNegocio")) || [];
      ideas.push(idea);
      localStorage.setItem("ideasNegocio", JSON.stringify(ideas));
      alert("✅ Idea de negocio registrada correctamente.");
      formIdea.reset();
    });
  }

  // Registro de negocio
  const formNegocio = document.getElementById("formNegocio");
  if (formNegocio) {
    formNegocio.addEventListener("submit", (e) => {
      e.preventDefault();
      const inputs = formNegocio.querySelectorAll("input, select, textarea");
      const negocio = {};
      inputs.forEach((input) => {
        const key = input.name || input.id || input.placeholder;
        negocio[key] = input.value;
      });
      const negocios = JSON.parse(localStorage.getItem("negociosRegistrados")) || [];
      negocios.push(negocio);
      localStorage.setItem("negociosRegistrados", JSON.stringify(negocios));
      alert("✅ Negocio registrado correctamente.");
      formNegocio.reset();
    });
  }
});

/* ===========================================================
   Mostrar datos en perfil.html (mantengo comportamiento original)
=========================================================== */
document.addEventListener("DOMContentLoaded", () => {
  if (!window.location.pathname.includes("perfil.html")) return;

  const formProfile = document.querySelector(".form-profile");
  const formBusiness = document.querySelector(".form-business");

  const usuarioGuardado = getLocalUser() || JSON.parse(localStorage.getItem("usuario"));
  if (usuarioGuardado && formProfile) {
    const inputNombre = formProfile.querySelector('input[placeholder="Nombre"]');
    const inputCorreo = formProfile.querySelector('input[placeholder="Correo electrónico"]');
    if (inputNombre) inputNombre.value = usuarioGuardado.nombre || "";
    if (inputCorreo) inputCorreo.value = usuarioGuardado.correo || usuarioGuardado.email || "";
  }

  const negocios = JSON.parse(localStorage.getItem("negociosRegistrados")) || [];
  if (negocios.length > 0 && formBusiness) {
    const ultimo = negocios[negocios.length - 1];
    let i = 0;
    for (const key in ultimo) {
      if (formBusiness.elements[i]) formBusiness.elements[i].value = ultimo[key];
      i++;
    }
    return;
  }
  const ideas = JSON.parse(localStorage.getItem("ideasNegocio")) || [];
  if (ideas.length > 0 && formBusiness) {
    const ultima = ideas[ideas.length - 1];
    let i = 0;
    for (const key in ultima) {
      if (formBusiness.elements[i]) formBusiness.elements[i].value = ultima[key];
      i++;
    }
  }
});

/* ===========================================================
   Cerrar sesión (opcional: también podrías borrar ultimoUsuario aquí si
   quieres forzar re-login completo).
=========================================================== */
const cerrarSesionBtn = document.getElementById("cerrarSesionBtn");
if (cerrarSesionBtn) {
  cerrarSesionBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (confirm("¿Deseas cerrar sesión?")) {
      // Si quieres cerrar completamente: localStorage.removeItem("ultimoUsuario");
      sessionStorage.removeItem("usuarioActivo");
      window.location.href = "inicio.html";
    }
  });
}
