const btnMenu = document.getElementById("btnMenu");
const sidebar = document.getElementById("sidebar");
const contenido = document.getElementById("contenido");
const links = document.querySelectorAll(".sidebar a");

const db = (() => {
  const STORAGE_KEY = "schedule_db_v1";

  const estadoInicial = {
    coordinaciones: [],
    carreras: [],
  };

  function leer() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      guardar(estadoInicial);
      return structuredClone(estadoInicial);
    }

    try {
      const parsed = JSON.parse(data);
      return {
        coordinaciones: Array.isArray(parsed.coordinaciones) ? parsed.coordinaciones : [],
        carreras: Array.isArray(parsed.carreras) ? parsed.carreras : [],
      };
    } catch {
      guardar(estadoInicial);
      return structuredClone(estadoInicial);
    }
  }

  function guardar(estado) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
  }

  function id() {
    return crypto.randomUUID();
  }

  function agregarCoordinacion(nombre) {
    const estado = leer();
    const limpio = nombre.trim();

    if (!limpio) {
      return { ok: false, mensaje: "El nombre de la coordinación es obligatorio." };
    }

    const existe = estado.coordinaciones.some((c) => c.nombre.toLowerCase() === limpio.toLowerCase());
    if (existe) {
      return { ok: false, mensaje: "Ya existe una coordinación con ese nombre." };
    }

    estado.coordinaciones.push({
      id: id(),
      nombre: limpio,
      carrerasIds: [],
    });

    guardar(estado);
    return { ok: true };
  }

  function agregarCarrera(nombre) {
    const estado = leer();
    const limpio = nombre.trim();

    if (!limpio) {
      return { ok: false, mensaje: "El nombre de la carrera es obligatorio." };
    }

    const existe = estado.carreras.some((c) => c.nombre.toLowerCase() === limpio.toLowerCase());
    if (existe) {
      return { ok: false, mensaje: "Ya existe una carrera con ese nombre." };
    }

    estado.carreras.push({
      id: id(),
      nombre: limpio,
    });

    guardar(estado);
    return { ok: true };
  }

  function guardarAsignaciones(coordinacionId, carrerasIds) {
    const estado = leer();
    const coordinacion = estado.coordinaciones.find((c) => c.id === coordinacionId);

    if (!coordinacion) {
      return { ok: false, mensaje: "La coordinación seleccionada no existe." };
    }

    const carrerasValidas = new Set(estado.carreras.map((c) => c.id));
    const idsUnicos = [...new Set(carrerasIds)].filter((idCarrera) => carrerasValidas.has(idCarrera));

    estado.coordinaciones.forEach((itemCoordinacion) => {
      if (itemCoordinacion.id === coordinacionId) {
        return;
      }

      itemCoordinacion.carrerasIds = itemCoordinacion.carrerasIds.filter(
        (idCarrera) => !idsUnicos.includes(idCarrera)
      );
    });

    coordinacion.carrerasIds = idsUnicos;
    guardar(estado);

    return { ok: true };
  }

  return {
    leer,
    agregarCoordinacion,
    agregarCarrera,
    guardarAsignaciones,
  };
})();

function renderInicio() {
  contenido.innerHTML = `
    <h1>Inicio</h1>
    <p>Esta es la página principal de tu sistema.</p>
  `;
}

function renderConfiguracion() {
  contenido.innerHTML = `
    <h1>Configuraciones</h1>
    <p>Gestión temporal con LocalStorage (simulando base de datos).</p>

    <section class="panel-config">
      <div class="card-config">
        <h2>Registrar coordinación</h2>
        <form id="formCoordinacion" class="form-config">
          <input type="text" id="nombreCoordinacion" placeholder="Ej. Coordinación de Ingeniería" required>
          <button type="submit">Guardar coordinación</button>
        </form>
      </div>

      <div class="card-config">
        <h2>Registrar carrera</h2>
        <form id="formCarrera" class="form-config">
          <input type="text" id="nombreCarrera" placeholder="Ej. Ingeniería de Sistemas" required>
          <button type="submit">Guardar carrera</button>
        </form>
      </div>
    </section>

    <section class="card-config listado-asignacion">
      <h2>Asignar carreras por coordinación</h2>
      <div id="asignaciones"></div>
    </section>
  `;

  const formCoordinacion = document.getElementById("formCoordinacion");
  const formCarrera = document.getElementById("formCarrera");

  formCoordinacion.addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = document.getElementById("nombreCoordinacion").value;
    const resultado = db.agregarCoordinacion(nombre);

    if (!resultado.ok) {
      alert(resultado.mensaje);
      return;
    }

    renderConfiguracion();
  });

  formCarrera.addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = document.getElementById("nombreCarrera").value;
    const resultado = db.agregarCarrera(nombre);

    if (!resultado.ok) {
      alert(resultado.mensaje);
      return;
    }

    renderConfiguracion();
  });

  renderAsignaciones();
}

function renderAsignaciones() {
  const estado = db.leer();
  const contenedor = document.getElementById("asignaciones");

  if (!contenedor) {
    return;
  }

  if (estado.coordinaciones.length === 0) {
    contenedor.innerHTML = "<p>Primero registra al menos una coordinación.</p>";
    return;
  }

  if (estado.carreras.length === 0) {
    contenedor.innerHTML = "<p>Primero registra al menos una carrera.</p>";
    return;
  }

  contenedor.innerHTML = `
    <form id="formAsignaciones" class="form-asignacion">
      <label for="coordinacionSelect">Coordinación</label>
      <select id="coordinacionSelect" required>
        ${estado.coordinaciones
          .map(
            (coordinacion) =>
              `<option value="${coordinacion.id}">${coordinacion.nombre}</option>`
          )
          .join("")}
      </select>

      <label for="carrerasSelect">Carreras (selección múltiple)</label>
      <select id="carrerasSelect" multiple size="8" required>
        ${estado.carreras
          .map((carrera) => `<option value="${carrera.id}">${carrera.nombre}</option>`)
          .join("")}
      </select>

      <button type="submit">Guardar asignación</button>
      <p class="ayuda-multiselect">Usa Ctrl (o Cmd en Mac) para seleccionar varias carreras.</p>
    </form>
    <div id="resumenAsignaciones"></div>
  `;

  const coordinacionSelect = document.getElementById("coordinacionSelect");
  const carrerasSelect = document.getElementById("carrerasSelect");
  const formAsignaciones = document.getElementById("formAsignaciones");
  const resumenAsignaciones = document.getElementById("resumenAsignaciones");

  function crearMapaAsignaciones() {
    const mapa = new Map();

    estado.coordinaciones.forEach((coordinacion) => {
      coordinacion.carrerasIds.forEach((idCarrera) => {
        mapa.set(idCarrera, coordinacion.id);
      });
    });

    return mapa;
  }

  function renderResumenAsignaciones() {
    const lista = estado.coordinaciones
      .map((coordinacion) => {
        const nombresCarreras = coordinacion.carrerasIds
          .map((idCarrera) => estado.carreras.find((carrera) => carrera.id === idCarrera)?.nombre)
          .filter(Boolean);

        const detalle = nombresCarreras.length > 0 ? nombresCarreras.join(", ") : "Sin carreras asignadas.";
        return `<li><strong>${coordinacion.nombre}:</strong> ${detalle}</li>`;
      })
      .join("");

    resumenAsignaciones.innerHTML = `
      <h3>Distribución actual de carreras</h3>
      <ul>${lista}</ul>
    `;
  }

  function sincronizarCarrerasSeleccionadas() {
    const coordinacion = estado.coordinaciones.find((c) => c.id === coordinacionSelect.value);
    const carrerasAsignadas = new Set(coordinacion?.carrerasIds || []);
    const mapaAsignaciones = crearMapaAsignaciones();

    [...carrerasSelect.options].forEach((option) => {
      const coordinacionActual = mapaAsignaciones.get(option.value);
      option.disabled = Boolean(coordinacionActual && coordinacionActual !== coordinacionSelect.value);
      option.selected = carrerasAsignadas.has(option.value);
    });
  }

  coordinacionSelect.addEventListener("change", sincronizarCarrerasSeleccionadas);

  formAsignaciones.addEventListener("submit", (e) => {
    e.preventDefault();

    const carrerasIds = [...carrerasSelect.selectedOptions].map((option) => option.value);
    const resultado = db.guardarAsignaciones(coordinacionSelect.value, carrerasIds);

    if (!resultado.ok) {
      alert(resultado.mensaje);
      return;
    }

    alert("Asignación guardada correctamente.");
    renderAsignaciones();
  });

  sincronizarCarrerasSeleccionadas();
  renderResumenAsignaciones();
}

btnMenu.addEventListener("click", () => {
  sidebar.classList.toggle("active");
});

links.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();

    const seccion = link.getAttribute("data-seccion");

    if (seccion === "inicio") {
      renderInicio();
    }

    if (seccion === "config") {
      renderConfiguracion();
    }

    sidebar.classList.remove("active");
  });
});
