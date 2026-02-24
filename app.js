const tabs = document.querySelectorAll('.tab');
const principalView = document.getElementById('principal-view');
const configView = document.getElementById('config-view');
const body = document.body;

const switchView = (tabName) => {
  const showConfig = tabName === 'config';
  principalView.classList.toggle('active', !showConfig);
  configView.classList.toggle('active', showConfig);
};

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((item) => item.classList.remove('active'));
    tab.classList.add('active');
    switchView(tab.dataset.tab);
  });
});

const coordinaciones = {
  Arquitectura: ['Arquitectura', 'Diseño Gráfico'],
};

const state = {
  clases: [
    { coordinacion: 'Arquitectura', carrera: 'Arquitectura', clase: 'Taller de Diseño', caracteristicas: ['diurno', 'taller'], docente: 'Ing. José Pérez', area: 'Tecnología' },
    { coordinacion: 'Arquitectura', carrera: 'Diseño Gráfico', clase: 'Identidad Nacional', caracteristicas: ['diurno', 'aula'], docente: 'MSc. María López', area: 'Ciencias Básicas' },
  ],
  docentes: [
    { nombre: 'MSc. María López', area: 'Ciencias Básicas' },
    { nombre: 'Ing. José Pérez', area: 'Tecnología' },
  ],
  areas: ['Ciencias Básicas', 'Tecnología'],
  turnoConfig: {
    Diurno: { duracion: 45, creditos: 1, maxTurnos: 4, dias: 'Lunes,Martes,Miércoles,Jueves,Viernes' },
    Nocturno: { duracion: 45, creditos: 1, maxTurnos: 4, dias: 'Lunes,Martes,Miércoles,Jueves,Viernes' },
    Dominical: { duracion: 45, creditos: 1, maxTurnos: 4, dias: 'Domingo' },
  },
  matricula: {},
};

const getAllCarreras = () => Object.values(coordinaciones).flat();

const fillSelect = (select, options, selectedValue) => {
  select.innerHTML = '';
  options.forEach((optionValue) => {
    const option = document.createElement('option');
    option.value = optionValue;
    option.textContent = optionValue;
    if (optionValue === selectedValue) option.selected = true;
    select.appendChild(option);
  });
};

const syncCoordinacionSelects = (selected = 'Arquitectura') => {
  const values = Object.keys(coordinaciones);
  document.querySelectorAll('.js-coordinacion').forEach((select) => {
    const keepValue = values.includes(select.value) ? select.value : selected;
    fillSelect(select, values, keepValue);
  });
};

const syncCarreraSelects = () => {
  const values = getAllCarreras();
  document.querySelectorAll('.js-carrera').forEach((select) => {
    const keepValue = values.includes(select.value) ? select.value : values[0];
    fillSelect(select, values, keepValue);
  });
};

const setHint = (id, message, ok = true) => {
  const hint = document.getElementById(id);
  if (!hint) return;
  hint.textContent = message;
  hint.style.color = ok ? '#3257ff' : '#b00020';
};

const renderCatalogoTabla = () => {
  const tbody = document.getElementById('clases-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  state.clases.forEach((item) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${item.coordinacion}</td><td>${item.carrera}</td><td>${item.clase}</td><td>${item.caracteristicas.map((tag) => `<span class="tag">${tag}</span>`).join(' ')}</td><td>${item.docente}</td><td>${item.area}</td>`;
    tbody.appendChild(tr);
  });
};

const renderDocentes = () => {
  const tbody = document.getElementById('docentes-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  state.docentes.forEach((docente) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${docente.nombre}</td><td>${docente.area}</td>`;
    tbody.appendChild(tr);
  });
};

const menuBtn = document.getElementById('btn-menu');
menuBtn?.addEventListener('click', () => {
  body.classList.toggle('sidebar-hidden');
});

const importBtn = document.getElementById('btn-importar-csv');
const csvInput = document.getElementById('csv-input');
importBtn?.addEventListener('click', () => {
  const file = csvInput?.files?.[0];
  if (!file) {
    setHint('carga-hint', 'Selecciona un archivo CSV antes de importar.', false);
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const text = String(reader.result || '').trim();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) {
      setHint('carga-hint', 'El CSV no contiene datos válidos.', false);
      return;
    }

    const headers = lines[0].split(',').map((item) => item.trim().toLowerCase());
    const required = ['clase', 'creditos', 'compartida', 'anio', 'categoria', 'tipo'];
    const missing = required.filter((field) => !headers.includes(field));
    if (missing.length) {
      setHint('carga-hint', `Faltan columnas: ${missing.join(', ')}`, false);
      return;
    }

    const coordinacion = document.getElementById('carga-coordinacion')?.value || 'Arquitectura';
    const carrera = document.getElementById('carga-carrera')?.value || 'Arquitectura';
    const claseIdx = headers.indexOf('clase');
    const tipoIdx = headers.indexOf('tipo');

    const imported = lines.slice(1).map((line) => {
      const cols = line.split(',').map((item) => item.trim());
      return {
        coordinacion,
        carrera,
        clase: cols[claseIdx] || 'Clase sin nombre',
        caracteristicas: ['csv', cols[tipoIdx] || 'aula'],
        docente: 'Por asignar',
        area: 'Por asignar',
      };
    });

    state.clases.push(...imported);
    renderCatalogoTabla();
    setHint('carga-hint', `Se importaron ${imported.length} clases desde CSV.`);
  };
  reader.readAsText(file);
});

const addManualBtn = document.getElementById('btn-agregar-manual');
addManualBtn?.addEventListener('click', () => {
  const clase = window.prompt('Nombre de la clase a agregar:');
  if (!clase) {
    setHint('asignacion-hint', 'Acción cancelada.', false);
    return;
  }

  state.clases.push({
    coordinacion: document.getElementById('asignacion-coordinacion')?.value || 'Arquitectura',
    carrera: state.clases[0]?.carrera || 'Arquitectura',
    clase,
    caracteristicas: ['manual'],
    docente: 'Por asignar',
    area: 'Por asignar',
  });
  renderCatalogoTabla();
  setHint('asignacion-hint', `Clase "${clase}" agregada correctamente.`);
});

const editClassBtn = document.getElementById('btn-cambiar-clase');
editClassBtn?.addEventListener('click', () => {
  const nombre = window.prompt('Clase que quieres renombrar:');
  if (!nombre) {
    setHint('asignacion-hint', 'Acción cancelada.', false);
    return;
  }
  const found = state.clases.find((item) => item.clase.toLowerCase() === nombre.toLowerCase());
  if (!found) {
    setHint('asignacion-hint', 'No se encontró la clase indicada.', false);
    return;
  }
  const nuevoNombre = window.prompt('Nuevo nombre:', found.clase);
  if (!nuevoNombre) {
    setHint('asignacion-hint', 'Renombrado cancelado.', false);
    return;
  }
  found.clase = nuevoNombre;
  renderCatalogoTabla();
  setHint('asignacion-hint', 'Clase actualizada correctamente.');
});

const consola = document.getElementById('generacion-console');
const vistaRows = document.querySelectorAll('#vista tbody tr td:last-child');

const generateBtn = document.getElementById('btn-generar-auto');
generateBtn?.addEventListener('click', () => {
  const carrera = document.getElementById('generacion-carrera')?.value;
  const clasesCarrera = state.clases.filter((item) => item.carrera === carrera);
  if (!clasesCarrera.length) {
    consola.textContent = 'No hay clases para esa carrera. Carga CSV o agrega clases manualmente.';
    return;
  }
  vistaRows.forEach((cell, index) => {
    cell.textContent = clasesCarrera[index]?.clase || '-';
  });
  consola.textContent = `Horario generado para ${carrera} con ${Math.min(clasesCarrera.length, vistaRows.length)} bloques llenos.`;
});

const resetBtn = document.getElementById('btn-reiniciar-demo');
resetBtn?.addEventListener('click', () => {
  vistaRows.forEach((cell) => {
    cell.textContent = '-';
  });
  consola.textContent = 'Demo reiniciada. Puedes generar nuevamente.';
});

const turnoSelect = document.getElementById('turno-config-select');
const duracionInput = document.getElementById('turno-duracion');
const creditosInput = document.getElementById('turno-creditos');
const maxTurnosInput = document.getElementById('turno-max-turnos');
const diasInput = document.getElementById('turno-dias');

const loadTurno = () => {
  const turno = turnoSelect?.value;
  if (!turno || !state.turnoConfig[turno]) return;
  const cfg = state.turnoConfig[turno];
  duracionInput.value = cfg.duracion;
  creditosInput.value = cfg.creditos;
  maxTurnosInput.value = cfg.maxTurnos;
  diasInput.value = cfg.dias;
};

turnoSelect?.addEventListener('change', loadTurno);

document.getElementById('btn-guardar-turno')?.addEventListener('click', () => {
  const turno = turnoSelect.value;
  state.turnoConfig[turno] = {
    duracion: Number(duracionInput.value || 45),
    creditos: Number(creditosInput.value || 1),
    maxTurnos: Number(maxTurnosInput.value || 4),
    dias: diasInput.value.trim(),
  };
  setHint('turno-hint', `Configuración de ${turno} guardada.`);
});

document.getElementById('btn-restablecer-turno')?.addEventListener('click', () => {
  state.turnoConfig[turnoSelect.value] = { duracion: 45, creditos: 1, maxTurnos: 4, dias: 'Lunes,Martes,Miércoles,Jueves,Viernes' };
  if (turnoSelect.value === 'Dominical') {
    state.turnoConfig.Dominical.dias = 'Domingo';
  }
  loadTurno();
  setHint('turno-hint', 'Valores restablecidos por defecto.');
});

document.getElementById('btn-nueva-area')?.addEventListener('click', () => {
  const area = window.prompt('Nombre de la nueva área:');
  if (!area) return;
  if (state.areas.includes(area)) {
    setHint('docentes-hint', 'Esa área ya existe.', false);
    return;
  }
  state.areas.push(area);
  setHint('docentes-hint', `Área "${area}" creada.`);
});

document.getElementById('btn-nuevo-docente')?.addEventListener('click', () => {
  const nombre = window.prompt('Nombre del docente:');
  if (!nombre) return;
  const area = window.prompt(`Área del docente (${state.areas.join(', ')}):`) || 'Sin área';
  state.docentes.push({ nombre, area });
  renderDocentes();
  setHint('docentes-hint', `Docente "${nombre}" agregado.`);
});

document.getElementById('btn-asignar-docente')?.addEventListener('click', () => {
  const clase = window.prompt('Clase a asignar:');
  if (!clase) return;
  const docente = window.prompt('Nombre del docente:');
  if (!docente) return;
  const target = state.clases.find((item) => item.clase.toLowerCase() === clase.toLowerCase());
  if (!target) {
    setHint('docentes-hint', 'No se encontró la clase indicada.', false);
    return;
  }
  target.docente = docente;
  renderCatalogoTabla();
  setHint('docentes-hint', `Docente asignado a "${target.clase}".`);
});

const btnAgregarCoordinacion = document.getElementById('btn-agregar-coordinacion');
const btnAgregarCarrera = document.getElementById('btn-agregar-carrera');
const nuevaCoordinacionInput = document.getElementById('nueva-coordinacion');
const nuevaCarreraInput = document.getElementById('nueva-carrera');
const coordinacionConfigSelect = document.getElementById('coordinacion-config');

btnAgregarCoordinacion?.addEventListener('click', () => {
  const nombre = nuevaCoordinacionInput.value.trim();

  if (!nombre) {
    setHint('catalogo-hint', 'Escribe el nombre de la coordinación.', false);
    return;
  }

  if (coordinaciones[nombre]) {
    setHint('catalogo-hint', 'Esa coordinación ya existe.', false);
    return;
  }

  coordinaciones[nombre] = [];
  syncCoordinacionSelects(nombre);
  syncCarreraSelects();
  nuevaCoordinacionInput.value = '';
  setHint('catalogo-hint', `Coordinación "${nombre}" agregada correctamente.`);
});

btnAgregarCarrera?.addEventListener('click', () => {
  const coordinacion = coordinacionConfigSelect.value;
  const carrera = nuevaCarreraInput.value.trim();

  if (!carrera) {
    setHint('catalogo-hint', 'Escribe el nombre de la carrera.', false);
    return;
  }

  if (!coordinaciones[coordinacion]) {
    setHint('catalogo-hint', 'Primero selecciona una coordinación válida.', false);
    return;
  }

  if (coordinaciones[coordinacion].includes(carrera)) {
    setHint('catalogo-hint', 'Esa carrera ya está registrada en la coordinación.', false);
    return;
  }

  coordinaciones[coordinacion].push(carrera);
  syncCarreraSelects();
  nuevaCarreraInput.value = '';
  setHint('catalogo-hint', `Carrera "${carrera}" agregada a ${coordinacion}.`);
});

document.getElementById('btn-guardar-matricula')?.addEventListener('click', () => {
  const carrera = document.getElementById('matricula-carrera').value;
  const estudiantes = Number(document.getElementById('matricula-estudiantes').value || 0);
  state.matricula[carrera] = estudiantes;
  setHint('matricula-hint', `Matrícula guardada para ${carrera}: ${estudiantes} estudiantes.`);
});

syncCoordinacionSelects();
syncCarreraSelects();
renderCatalogoTabla();
renderDocentes();
loadTurno();
