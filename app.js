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

  function asignarCarrera(coordinacionId, carreraId, asignado) {
    const estado = leer();
    const coordinacion = estado.coordinaciones.find((c) => c.id === coordinacionId);

    if (!coordinacion) {
      return;
    }

    const yaAsignada = coordinacion.carrerasIds.includes(carreraId);

    if (asignado && !yaAsignada) {
      coordinacion.carrerasIds.push(carreraId);
    }

    if (!asignado && yaAsignada) {
      coordinacion.carrerasIds = coordinacion.carrerasIds.filter((idCarrera) => idCarrera !== carreraId);
    }

    guardar(estado);
  }

  return {
    leer,
    agregarCoordinacion,
    agregarCarrera,
    asignarCarrera,
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

  contenedor.innerHTML = estado.coordinaciones
    .map(
      (coordinacion) => `
      <article class="coordinacion-item">
        <h3>${coordinacion.nombre}</h3>
        <div class="checklist-carreras">
          ${estado.carreras
            .map(
              (carrera) => `
              <label>
                <input
                  type="checkbox"
                  data-coordinacion-id="${coordinacion.id}"
                  data-carrera-id="${carrera.id}"
                  ${coordinacion.carrerasIds.includes(carrera.id) ? "checked" : ""}
                >
                ${carrera.nombre}
              </label>
            `
            )
            .join("")}
        </div>
      </article>
    `
    )
    .join("");

  contenedor.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener("change", (e) => {
      db.asignarCarrera(
        e.target.dataset.coordinacionId,
        e.target.dataset.carreraId,
        e.target.checked
      );
    });
  });
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
