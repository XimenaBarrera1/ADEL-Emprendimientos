// Configuración y datos
    const YOUTUBE_API_KEY = "AIzaSyAgCN7I-IL1cLydCWhEiWeDUteKIS_4R1Q";
    const YT_MAX_RESULTS = 4;

    const rutas = {
      marketing: [
        { title: "Introducción al Marketing Digital", desc: "Conceptos básicos y panorama actual", icon: "fas fa-bullhorn" },
        { title: "Embudo de ventas", desc: "Customer journey y proceso de conversión", icon: "fas fa-filter" },
        { title: "Redes sociales", desc: "Creación de contenido y estrategias", icon: "fas fa-share-alt" },
        { title: "Analítica y KPIs", desc: "Medición del rendimiento", icon: "fas fa-chart-bar" }
      ],
      finanzas: [
        { title: "Finanzas personales", desc: "Gestión de ingresos y gastos", icon: "fas fa-wallet" },
        { title: "Estados financieros", desc: "Balance, PyG y flujo de efectivo", icon: "fas fa-file-invoice" },
        { title: "Flujo de caja", desc: "Control del efectivo y rentabilidad", icon: "fas fa-money-bill-wave" },
        { title: "Presupuestos", desc: "Planificación y control de costos", icon: "fas fa-chart-pie" }
      ],
      contaduria: [
        { title: "Conceptos contables", desc: "Principios y terminología", icon: "fas fa-book" },
        { title: "Registro contable", desc: "Sistemas de documentación", icon: "fas fa-receipt" },
        { title: "Balances", desc: "Elaboración y conciliaciones", icon: "fas fa-balance-scale" },
        { title: "Contabilidad PYME", desc: "Aplicación práctica", icon: "fas fa-building" }
      ],
      negocios: [
        { title: "Emprendimiento", desc: "Conceptos para iniciar negocio", icon: "fas fa-lightbulb" },
        { title: "Modelos de negocio", desc: "Diseño y propuesta de valor", icon: "fas fa-chess-board" },
        { title: "Plan de negocio", desc: "Estructura básica efectiva", icon: "fas fa-map" },
        { title: "Marketing básico", desc: "Estrategias para startups", icon: "fas fa-bullseye" }
      ]
    };

    const areaIcons = {
      marketing: "fas fa-chart-line",
      finanzas: "fas fa-money-bill-wave",
      contaduria: "fas fa-calculator",
      negocios: "fas fa-briefcase"
    };

    const fallbackCursos = {
      "Introducción al Marketing Digital": [
        {title:"Fundamentos de Marketing Digital - Google Actívate", url:"https://learndigital.withgoogle.com/activate/course/digital-marketing"},
        {title:"Marketing Digital para Principiantes - Coursera", url:"https://www.coursera.org/search?query=marketing%20digital%20principiantes"}
      ],
      "Fundamentos de finanzas personales": [
        {title:"Finanzas personales - Khan Academy", url:"https://es.khanacademy.org/"},
        {title:"Curso de Finanzas Personales - YouTube", url:"https://www.youtube.com/results?search_query=finanzas+personales+curso"}
      ],
      "Conceptos básicos de contabilidad": [
        {title:"Contabilidad Básica - Khan Academy", url:"https://es.khanacademy.org/"},
        {title:"Contabilidad para principiantes - YouTube", url:"https://www.youtube.com/results?search_query=contabilidad+basica+curso"}
      ]
    };

    // Referencias a elementos del DOM
    const overlay = document.getElementById('overlay');
    const sidebar = document.getElementById('resources-sidebar');
    const sidebarTitle = document.getElementById('sidebar-title');
    const sidebarContent = document.getElementById('sidebar-content');
    const closeSidebarBtn = document.getElementById('close-sidebar');

    // Eventos del panel lateral
    closeSidebarBtn.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);

    function openSidebar() {
      sidebar.classList.add('active');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }

    // Mejoras en la interacción de las tarjetas de interés
    document.querySelectorAll('.interest-card').forEach(card => {
      const select = card.querySelector('select');
      
      select.addEventListener('change', function() {
        document.querySelectorAll('.interest-card').forEach(c => {
          c.classList.remove('selected');
        });
        
        if (this.value === 'bajo') {
          card.classList.add('selected');
        }
      });
    });

    // Evento del formulario
    document.getElementById('form').addEventListener('submit', (e) => {
      e.preventDefault();
      generarRecorrido(new FormData(e.target));
    });

    function generarRecorrido(form) {
      const nombre = form.get('nombre') || 'Amigo(a)';
      const objetivo = form.get('objetivo') || 'desarrollar tus habilidades';
      const contenedor = document.getElementById('recorrido');
      contenedor.style.display = 'block';
      
      // Animación de entrada
      contenedor.style.opacity = '0';
      contenedor.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        contenedor.style.opacity = '1';
        contenedor.style.transform = 'translateY(0)';
        contenedor.style.transition = 'all 0.5s ease';
      }, 100);
      
      // Crear estructura de ruta de carretera
      contenedor.innerHTML = `
        <div class="roadmap-header">
          <h2 class="roadmap-title">Tu Ruta de Aprendizaje</h2>
          <p class="roadmap-subtitle">Hola ${escapeHtml(nombre)}, hemos creado este camino personalizado para ayudarte a ${escapeHtml(objetivo)}</p>
        </div>
      `;

      const areas = ['marketing','finanzas','contaduria','negocios'];
      let hasLowAreas = false;

      areas.forEach(area => {
        const nivel = form.get(area);
        if (nivel === 'bajo') {
          hasLowAreas = true;
          contenedor.appendChild(crearRutaArea(area));
        }
      });

      if (!hasLowAreas) {
        const successMsg = document.createElement('div');
        successMsg.className = 'success-message';
        successMsg.innerHTML = `
          <i class="fas fa-check-circle"></i>
          <div>
            <strong>¡Excelente!</strong> Según tus respuestas, tienes buen nivel en las áreas evaluadas. 
            Si quieres profundizar en algo, marca el área como 'bajo' y genera la ruta.
          </div>
        `;
        contenedor.appendChild(successMsg);
      }
      
      // Desplazarse suavemente a la sección de resultados
      contenedor.scrollIntoView({ behavior: 'smooth' });
    }

    function crearRutaArea(area) {
      const areaDiv = document.createElement('div');
      areaDiv.className = 'road-container';
      
      areaDiv.innerHTML = `
        <div class="road"></div>
        <div class="road-line"></div>
        <div class="road-sign sign-start">Inicio</div>
        <div class="road-sign sign-end">Meta</div>
        <div class="milestones-container">
          ${rutas[area].map((paso, idx) => `
            <div class="milestone" data-area="${area}" data-step="${idx}">
              <div class="milestone-marker">
                <i class="${paso.icon}"></i>
              </div>
              <div class="milestone-content">
                <div class="milestone-title">${paso.title}</div>
                <div class="milestone-description">${paso.desc}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      
      // Añadir event listeners a los hitos
      areaDiv.querySelectorAll('.milestone').forEach(milestone => {
        milestone.addEventListener('click', function() {
          const area = this.getAttribute('data-area');
          const stepIndex = parseInt(this.getAttribute('data-step'));
          const paso = rutas[area][stepIndex].title;
          mostrarRecursosEnSidebar(paso);
        });
      });
      
      return areaDiv;
    }

    async function mostrarRecursosEnSidebar(tema) {
      // Actualizar título del sidebar
      sidebarTitle.textContent = tema;
      
      // Mostrar estado de carga
      sidebarContent.innerHTML = `
        <div style="display: flex; align-items: center; padding: 20px 0;">
          <span class="loader" aria-hidden="true"></span>
          <span>Buscando recursos para <strong>${escapeHtml(tema)}</strong>...</span>
        </div>
      `;
      
      // Abrir el sidebar
      openSidebar();
      
      // Buscar recursos
      const [videosResult, cursosResult] = await Promise.allSettled([
        buscarVideosYoutube(tema),
        buscarCursosDuckDuckGo(tema)
      ]);

      // Construir contenido del sidebar
      let contenidoHTML = '';

      // Añadir sección de videos
      if (videosResult.status === 'fulfilled' && Array.isArray(videosResult.value) && videosResult.value.length) {
        contenidoHTML += `
          <div class="video-resources">
            <div class="resource-section-title">
              <i class="fas fa-play-circle"></i> Videos Recomendados
            </div>
        `;
        
        videosResult.value.forEach(v => {
          contenidoHTML += `
            <div class="video-row">
              <img src="${v.thumbnail}" alt="${escapeHtml(v.title)}">
              <div class="video-info">
                <a href="${v.url}" target="_blank" rel="noopener">${escapeHtml(v.title)}</a>
                <div class="video-channel">Canal: ${escapeHtml(v.channel)}</div>
              </div>
            </div>
          `;
        });
        
        contenidoHTML += `</div>`;
      } else {
        contenidoHTML += `<div style="margin-bottom: 20px; color: var(--muted);">No se encontraron videos automáticamente. Puedes buscar manualmente en YouTube.</div>`;
      }

      // Añadir sección de cursos
      if (cursosResult.status === 'fulfilled' && Array.isArray(cursosResult.value) && cursosResult.value.length) {
        contenidoHTML += `
          <div class="course-resources">
            <div class="resource-section-title">
              <i class="fas fa-book"></i> Cursos y Recursos
            </div>
        `;
        
        cursosResult.value.forEach(c => {
          contenidoHTML += `
            <div class="course-item">
              <div><a href="${c.url}" target="_blank" rel="noopener">${escapeHtml(c.title)}</a></div>
              <div class="course-domain">${escapeHtml(c.domain)}</div>
            </div>
          `;
        });
        
        contenidoHTML += `</div>`;
      } else {
        contenidoHTML += `
          <div class="course-resources">
            <div class="resource-section-title">
              <i class="fas fa-book"></i> Cursos Sugeridos
            </div>
        `;
        
        const fallback = fallbackCursos[tema] || [{title:`Búsqueda sugerida: curso gratuito ${tema}`, url:`https://www.google.com/search?q=curso+gratuito+${encodeURIComponent(tema)}`}];
        fallback.forEach(f => {
          contenidoHTML += `
            <div class="course-item">
              <div><a href="${f.url}" target="_blank" rel="noopener">${escapeHtml(f.title)}</a></div>
            </div>
          `;
        });
        
        contenidoHTML += `</div>`;
      }

      // Actualizar contenido del sidebar
      sidebarContent.innerHTML = contenidoHTML;
    }

    // Funciones auxiliares
    function html(strings) {
      const template = document.createElement('template');
      template.innerHTML = strings;
      return template.content;
    }

    async function buscarVideosYoutube(tema) {
      if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'TU_API_KEY_YOUTUBE') {
        return [];
      }

      const q = encodeURIComponent(`curso gratuito ${tema}`);
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${YT_MAX_RESULTS}&q=${q}&key=${YOUTUBE_API_KEY}`;

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('YouTube API error');
        const data = await res.json();
        if (!data.items) return [];
        return data.items.map(it => ({
          title: it.snippet.title,
          url: `https://www.youtube.com/watch?v=${it.id.videoId}`,
          thumbnail: it.snippet.thumbnails?.medium?.url || it.snippet.thumbnails?.default?.url || '',
          channel: it.snippet.channelTitle
        }));
      } catch (err) {
        console.warn('YT search failed:', err);
        return [];
      }
    }

    async function buscarCursosDuckDuckGo(tema) {
      try {
        const query = encodeURIComponent(`${tema} curso gratuito site:coursera.org OR site:edx.org OR site:khanacademy.org OR site:learndigital.withgoogle.com OR site:alison.com`);
        const url = `https://api.duckduckgo.com/?q=${query}&format=json&no_redirect=1&no_html=1&skip_disambig=1`;

        const res = await fetch(url);
        if (!res.ok) throw new Error('DuckDuckGo API no disponible');
        const data = await res.json();

        const items = [];

        function extractFromRelated(rt) {
          if (rt.FirstURL) {
            items.push({ title: rt.Text || rt.FirstURL, url: rt.FirstURL, domain: extractDomain(rt.FirstURL) });
          } else if (Array.isArray(rt.Topics)) {
            rt.Topics.forEach(t => extractFromRelated(t));
          }
        }

        if (Array.isArray(data.RelatedTopics)) {
          data.RelatedTopics.forEach(rt => extractFromRelated(rt));
        }

        const unique = [];
        const seen = new Set();
        for (const it of items) {
          if (!seen.has(it.url)) {
            unique.push(it);
            seen.add(it.url);
            if (unique.length >= 4) break;
          }
        }
        return unique;
      } catch (err) {
        console.warn('DuckDuckGo search failed:', err);
        return [];
      }
    }

    function capitalize(s){ return s.charAt(0).toUpperCase()+s.slice(1); }
    function extractDomain(url){
      try{ return (new URL(url)).hostname.replace('www.',''); }catch(e){ return url; }
    }
    function escapeHtml(s){
      if(!s && s !== 0) return '';
      return String(s)
        .replaceAll('&','&amp;')
        .replaceAll('<','&lt;')
        .replaceAll('>','&gt;')
        .replaceAll('"','&quot;')
        .replaceAll("'",'&#39;');
    }