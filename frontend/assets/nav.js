// frontend/assets/nav.js
document.addEventListener("DOMContentLoaded", () => {
  // Elementos de la navbar
  const navLogin = document.getElementById("navLogin");
  const navRegister = document.getElementById("navRegister");
  const navUserDropdown = document.getElementById("navUserDropdown");
  const navUserName = document.getElementById("navUserName");
  const navCerrar = document.getElementById("navCerrar");

  // Util: obtener usuario de sessionStorage/localStorage (maneja varios formatos)
  function getStoredUser() {
    // sessionStorage.item puede ser: nombre (string) o JSON string con objeto user
    try {
      const s = sessionStorage.getItem("usuarioActivo");
      if (!s) {
        // fallback localStorage (tu UX offline)
        const l = localStorage.getItem("usuarioADEL") || localStorage.getItem("ultimoUsuario");
        if (!l) return null;
        try { return JSON.parse(l); } catch { return { nombre: l, correo: null, id: null }; }
      }
      // si s parece JSON
      try {
        const parsed = JSON.parse(s);
        // parsed puede ser string (si antiguamente guardaste nombre con JSON.stringify(nombre)), manejarlo
        if (typeof parsed === "string") return { nombre: parsed };
        return parsed;
      } catch {
        // s no es JSON -> asumimos es un nombre simple
        return { nombre: s };
      }
    } catch (err) {
      console.warn("Error leyendo usuario desde storage:", err);
      return null;
    }
  }

  function applyNavForUser(user) {
    if (user) {
      // ocultar login/register
      if (navLogin) navLogin.classList.add("d-none");
      if (navRegister) navRegister.classList.add("d-none");

      // mostrar dropdown con nombre
      if (navUserDropdown) navUserDropdown.classList.remove("d-none");
      if (navUserName) navUserName.textContent = user.nombre || user.name || user.correo || "Usuario";
    } else {
      // mostrar login/register
      if (navLogin) navLogin.classList.remove("d-none");
      if (navRegister) navRegister.classList.remove("d-none");

      // ocultar dropdown
      if (navUserDropdown) navUserDropdown.classList.add("d-none");
    }
  }

  // logout handler
  if (navCerrar) {
    navCerrar.addEventListener("click", (e) => {
      e.preventDefault();
      if (!confirm("¿Deseas cerrar sesión?")) return;
      // mantener otras cosas si quieres, pero eliminar usuario
      sessionStorage.removeItem("usuarioActivo");
      // no borramos localStorage.usuarioADEL (puedes decidir) - aquí borramos localStorage 'ultimoUsuario' que usaríamos para re-login
      localStorage.removeItem("ultimoUsuario");
      // redirigir a inicio
      window.location.href = "./inicio.html";
    });
  }

  // inicializar vista
  const user = getStoredUser();
  applyNavForUser(user);
});
