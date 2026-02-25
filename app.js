const $id = (id) => document.getElementById(id);

const tabs = document.querySelectorAll('.tab');
const principalView = $id('principal-view');
const configView = $id('config-view');
const body = document.body;

const coordinaciones = {
  Arquitectura: ['Arquitectura', 'Diseño Gráfico'],
};

const turnosDisponibles = ['Diurno', 'Sabatino', 'Nocturno', 'Dominical'];

const diasPorTurno = {
  Diurno: 'Lunes,Martes,Miércoles,Jueves,Viernes',
  Sabatino: 'Sábado',
  Nocturno: 'Lunes,Martes,Miércoles,Jueves,Viernes',
  Dominical: 'Domingo',
};

const state = {
  clases: [
    { coordinacion: 'Arquitectura', carrera: 'Arquitectura', clase: 'Taller de Diseño', aula: 'A-101', caracteristicas: ['diurno', 'taller'], docente: 'Ing. José Pérez', area: 'Tecnología' },
    { coordinacion: 'Arquitectura', carrera: 'Diseño Gráfico', clase: 'Identidad Nacional', aula: 'B-204', caracteristicas: ['diurno', 'aula'], docente: 'MSc. María López', area: 'Ciencias Básicas' },
  ],
  docentes: [
    { nombre: 'MSc. María López', area: 'Ciencias Básicas' },
    { nombre: 'Ing. José Pérez', area: 'Tecnología' },
  ],
  areas: ['Ciencias Básicas', 'Tecnología'],
  turnoConfig: {
    Diurno: { horaInicio: '08:00', duracion: 45, creditos: 1, maxTurnos: 4, dias: 'Lunes,Martes,Miércoles,Jueves,Viernes', aula: '', recesoInicio: '', recesoFin: '', almuerzoInicio: '', almuerzoFin: '' },
    Sabatino: { horaInicio: '08:00', duracion: 45, creditos: 1, maxTurnos: 4, dias: 'Sábado', aula: '', recesoInicio: '', recesoFin: '', almuerzoInicio: '', almuerzoFin: '' },
    Nocturno: { horaInicio: '18:00', duracion: 45, creditos: 1, maxTurnos: 4, dias: 'Lunes,Martes,Miércoles,Jueves,Viernes', aula: '', recesoInicio: '', recesoFin: '', almuerzoInicio: '', almuerzoFin: '' },
    Dominical: { horaInicio: '08:00', duracion: 45, creditos: 1, maxTurnos: 4, dias: 'Domingo', aula: '', recesoInicio: '', recesoFin: '', almuerzoInicio: '', almuerzoFin: '' },
  },
  matricula: {},
  seleccionActual: { coordinacion: 'Arquitectura', carrera: 'Arquitectura', turno: 'Diurno' },
};

const switchView = (tabName) => {
  const showConfig = tabName === 'config';
  principalView?.classList.toggle('active', !showConfig);
  configView?.classList.toggle('active', showConfig);
};

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((item) => item.classList.remove('active'));
    tab.classList.add('active');
    switchView(tab.dataset.tab);
  });
});

const getCarrerasByCoordinacion = (coordinacion) => coordinaciones[coordinacion] || [];
const getAllCarreras = () => Object.values(coordinaciones).flat();
const normalizeTurno = (turno = '') => turno.toString().trim().toLowerCase();

const getDiasPorTurno = (turno) => {
  const turnoMatch = turnosDisponibles.find((item) => normalizeTurno(item) === normalizeTurno(turno)) || 'Diurno';
  return state.turnoConfig[turnoMatch]?.dias || diasPorTurno[turnoMatch] || diasPorTurno.Diurno;
};

const setHint = (id, message, ok = true) => {
  const hint = $id(id);
  if (!hint) return;
  hint.textContent = message;
  hint.style.color = ok ? '#3257ff' : '#b00020';
};

const fillSelect = (select, options, selectedValue) => {
  if (!select) return;
  const safeOptions = Array.isArray(options) ? options.filter(Boolean) : [];
  if (!safeOptions.length) {
    select.innerHTML = '';
    return;
  }

  select.innerHTML = '';
  safeOptions.forEach((optionValue) => {
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

const getCoordinacionFromContext = (select) => {
  const panel = select?.closest('section') || select?.closest('.view') || document;
  const coordinacionSelect = panel.querySelector('.js-coordinacion');
  return coordinacionSelect?.value || state.seleccionActual.coordinacion || Object.keys(coordinaciones)[0] || 'Arquitectura';
};

const syncCarreraSelects = () => {
  const fallback = getAllCarreras();
  document.querySelectorAll('.js-carrera').forEach((select) => {
    const coord = getCoordinacionFromContext(select);
    const values = getCarrerasByCoordinacion(coord);
    const options = values.length ? values : fallback;
    const keepValue = options.includes(select.value) ? select.value : options[0];
    fillSelect(select, options, keepValue);
  });
};

const syncTurnoSelects = (selected = 'Diurno') => {
  document.querySelectorAll('.js-turno').forEach((select) => {
    const keepValue = turnosDisponibles.includes(select.value) ? select.value : selected;
    fillSelect(select, turnosDisponibles, keepValue);
  });
};

const syncSelectValue = (selector, value) => {
  document.querySelectorAll(selector).forEach((select) => {
    if ([...select.options].some((option) => option.value === value)) {
      select.value = value;
    }
  });
};

const updateSeleccionActual = () => {
  const defaultCarrera = getAllCarreras()[0] || 'Arquitectura';
  const coordinacion = $id('carga-coordinacion')?.value || state.seleccionActual.coordinacion || 'Arquitectura';
  const carrera = $id('carga-carrera')?.value || state.seleccionActual.carrera || defaultCarrera;
  const turno = $id('carga-turno')?.value || state.seleccionActual.turno || 'Diurno';
  state.seleccionActual = { coordinacion, carrera, turno };
};

const formatTimeFromMinutes = (minutes) => {
  const normalized = ((Number(minutes) || 0) % (24 * 60) + (24 * 60)) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const parseTimeToMinutes = (time = '08:00') => {
  const match = String(time).match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return 8 * 60;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 8 * 60;
  return (hours * 60) + minutes;
};

const rangesOverlap = (startA, endA, startB, endB) => startA < endB && startB < endA;

const getBloqueRestriction = (start, end, cfg) => {
  const recesoInicio = parseTimeToMinutes(cfg?.recesoInicio || '');
  const recesoFin = parseTimeToMinutes(cfg?.recesoFin || '');
  const almuerzoInicio = parseTimeToMinutes(cfg?.almuerzoInicio || '');
  const almuerzoFin = parseTimeToMinutes(cfg?.almuerzoFin || '');

  const hasReceso = Boolean(cfg?.recesoInicio && cfg?.recesoFin) && recesoInicio < recesoFin;
  if (hasReceso && rangesOverlap(start, end, recesoInicio, recesoFin)) return 'RECESO';

  const hasAlmuerzo = Boolean(cfg?.almuerzoInicio && cfg?.almuerzoFin) && almuerzoInicio < almuerzoFin;
  if (hasAlmuerzo && rangesOverlap(start, end, almuerzoInicio, almuerzoFin)) return 'ALMUERZO';

  return '';
};

const getBloquesVista = (turno) => {
  const cfg = state.turnoConfig[turno] || state.turnoConfig.Diurno;
  const totalBloques = Math.max(Number(cfg?.maxTurnos || 4), 1);
  const duracion = Math.max(Number(cfg?.duracion || 45), 1);
  const inicio = parseTimeToMinutes(cfg?.horaInicio || '08:00');

  return Array.from({ length: totalBloques }, (_, index) => {
    const start = inicio + (index * duracion);
    const end = start + duracion;
    return {
      codigo: String(index + 1).padStart(2, '0'),
      hora: `${formatTimeFromMinutes(start)}-${formatTimeFromMinutes(end)}`,
      restriccion: getBloqueRestriction(start, end, cfg),
    };
  });
};

const getDiasArray = (turno) => (getDiasPorTurno(turno) || 'Día')
  .split(',')
  .map((dia) => dia.trim())
  .filter(Boolean);

const renderVistaTable = (turno) => {
  const bloquesVista = getBloquesVista(turno);
  const thead = $id('vista-thead');
  const tbody = $id('vista-tbody');
  if (!thead || !tbody) return;

  const dias = getDiasArray(turno);
  const safeDias = dias.length ? dias : ['Día'];

  let headerHtml = '<tr><th>Bloque</th>';
  safeDias.forEach((dia) => {
    headerHtml += `<th class="vista-dia-header">${dia}</th><th class="vista-aula-header">Aula</th>`;
  });
  headerHtml += '</tr>';
  thead.innerHTML = headerHtml;

  tbody.innerHTML = bloquesVista.map((bloque, bloqueIndex) => {
    let cells = `<td>${bloque.codigo}<br><small>${bloque.hora}</small></td>`;
    safeDias.forEach((_, diaIndex) => {
      const slot = (bloqueIndex * safeDias.length) + diaIndex;
      cells += `<td class="vista-clase" data-slot="${slot}" data-restriccion="${bloque.restriccion}">-</td><td class="vista-aula" data-slot="${slot}" data-restriccion="${bloque.restriccion}">-</td>`;
    });
    return `<tr>${cells}</tr>`;
  }).join('');
};

const applyDiasByTurnoToView = (turno) => {
  renderVistaTable(turno);
};

const renderCatalogoTabla = () => {
  const tbody = $id('clases-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  state.clases.forEach((item) => {
    const tr = document.createElement('tr');
    const tags = Array.isArray(item.caracteristicas) ? item.caracteristicas : [];
    tr.innerHTML = `<td>${item.coordinacion || ''}</td><td>${item.carrera || ''}</td><td>${item.clase || ''}</td><td>${item.aula || ''}</td><td>${tags.map((tag) => `<span class="tag">${tag}</span>`).join(' ')}</td><td>${item.docente || ''}</td><td>${item.area || ''}</td>`;
    tbody.appendChild(tr);
  });
};

const renderDocentes = () => {
  const tbody = $id('docentes-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  state.docentes.forEach((docente) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${docente.nombre}</td><td>${docente.area}</td>`;
    tbody.appendChild(tr);
  });
};

const getVistaCells = () => ({
  claseCells: document.querySelectorAll('#vista-tbody .vista-clase'),
  aulaCells: document.querySelectorAll('#vista-tbody .vista-aula'),
});

const paintClaseCell = (cell, value) => {
  if (!cell) return;
  cell.textContent = value || '-';
};

const paintAulaCell = (cell, value) => {
  if (!cell) return;
  cell.textContent = value || '-';
};

const resetScheduleGrid = () => {
  const { claseCells, aulaCells } = getVistaCells();
  claseCells.forEach((cell) => paintClaseCell(cell, '-'));
  aulaCells.forEach((cell) => paintAulaCell(cell, '-'));
};

const validateSelectedConfig = ({ coordinacion, carrera, turno }) => {
  const same = state.seleccionActual.coordinacion === coordinacion
    && state.seleccionActual.carrera === carrera
    && state.seleccionActual.turno === turno;

  if (same) return { ok: true };

  return {
    ok: false,
    message: `La selección actual es ${state.seleccionActual.coordinacion} / ${state.seleccionActual.carrera} / ${state.seleccionActual.turno}. Ajusta la generación o vuelve a cargar clases para esta combinación.`,
  };
};

const getClasesForSelection = ({ coordinacion, carrera, turno }) => state.clases.filter((item) => {
  const matchCoord = item.coordinacion === coordinacion;
  const matchCarrera = item.carrera === carrera;
  const matchTurno = (item.turno || 'Diurno') === turno;
  return matchCoord && matchCarrera && matchTurno;
});

// Punto de extensión para validaciones futuras de motor (choque de aulas, máximos por día, etc.).
const validateFutureAssignmentRules = () => ({ valid: true, reason: '' });

const buildSchedulePlan = ({ turno, clases }) => {
  const bloques = getBloquesVista(turno);
  const dias = getDiasArray(turno);
  const diasCount = Math.max(dias.length, 1);
  const totalSlots = bloques.length * diasCount;
  const defaultAula = state.turnoConfig[turno]?.aula || '-';

  let claseIndex = 0;
  let bloquesRestringidos = 0;
  const slots = [];

  for (let slot = 0; slot < totalSlots; slot += 1) {
    const blockIndex = Math.floor(slot / diasCount);
    const bloque = bloques[blockIndex];

    if (!bloque) {
      slots.push({ clase: '-', aula: '-', restriccion: '' });
      continue;
    }

    const restriccion = bloque.restriccion;
    if (restriccion) {
      slots.push({ clase: restriccion, aula: '-', restriccion });
      bloquesRestringidos += 1;
      continue;
    }

    const clase = clases[claseIndex] || null;

    if (clase) {
      const futureRules = validateFutureAssignmentRules({ clase, slot, bloque, turno, clases });
      if (!futureRules.valid) {
        slots.push({ clase: futureRules.reason || '-', aula: '-', restriccion: 'VALIDACION' });
        continue;
      }
    }

    slots.push({
      clase: clase?.clase || '-',
      aula: clase?.aula || defaultAula,
      restriccion: '',
    });

    if (clase) claseIndex += 1;
  }

  return {
    slots,
    clasesAsignadas: claseIndex,
    bloquesRestringidos,
  };
};

const renderSchedulePlan = (plan) => {
  const { claseCells, aulaCells } = getVistaCells();
  const limit = Math.min(claseCells.length, aulaCells.length, plan.slots.length);

  for (let i = 0; i < limit; i += 1) {
    const slot = plan.slots[i];
    paintClaseCell(claseCells[i], slot.clase);
    paintAulaCell(aulaCells[i], slot.aula);
  }

  for (let i = limit; i < claseCells.length; i += 1) paintClaseCell(claseCells[i], '-');
  for (let i = limit; i < aulaCells.length; i += 1) paintAulaCell(aulaCells[i], '-');
};

const syncAppFromSeleccionActual = () => {
  syncCoordinacionSelects(state.seleccionActual.coordinacion);
  syncTurnoSelects(state.seleccionActual.turno);
  syncCarreraSelects();
  syncSelectValue('.js-coordinacion', state.seleccionActual.coordinacion);
  syncSelectValue('.js-turno', state.seleccionActual.turno);
  syncSelectValue('.js-carrera', state.seleccionActual.carrera);
  applyDiasByTurnoToView(state.seleccionActual.turno);
};

const menuBtn = $id('btn-menu');
menuBtn?.addEventListener('click', () => {
  body.classList.toggle('sidebar-hidden');
});

const parseCsvRows = (text) => {
  const lines = String(text || '').trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { ok: false, message: 'El CSV no contiene datos válidos.' };

  const headers = lines[0].split(',').map((item) => item.trim().toLowerCase());
  const required = ['clase', 'creditos', 'compartida', 'anio', 'categoria', 'tipo', 'aula'];
  const missing = required.filter((field) => !headers.includes(field));
  if (missing.length) return { ok: false, message: `Faltan columnas: ${missing.join(', ')}` };

  return { ok: true, headers, rows: lines.slice(1) };
};

const createClassFromCsvRow = (row, headers, context) => {
  const cols = row.split(',').map((item) => item.trim());
  const claseIdx = headers.indexOf('clase');
  const tipoIdx = headers.indexOf('tipo');
  const aulaIdx = headers.indexOf('aula');

  const aula = cols[aulaIdx];
  if (!aula) return null;

  return {
    coordinacion: context.coordinacion,
    carrera: context.carrera,
    turno: context.turno,
    clase: cols[claseIdx] || 'Clase sin nombre',
    caracteristicas: ['csv', cols[tipoIdx] || 'aula'],
    docente: 'Por asignar',
    area: 'Por asignar',
    aula,
  };
};

const importBtn = $id('btn-importar-csv');
const csvInput = $id('csv-input');

importBtn?.addEventListener('click', () => {
  const file = csvInput?.files?.[0];
  if (!file) {
    setHint('carga-hint', 'Selecciona un archivo CSV antes de importar.', false);
    return;
  }

  const context = {
    coordinacion: $id('carga-coordinacion')?.value || 'Arquitectura',
    carrera: $id('carga-carrera')?.value || getAllCarreras()[0] || 'Arquitectura',
    turno: $id('carga-turno')?.value || 'Diurno',
  };

  const reader = new FileReader();
  reader.onload = () => {
    const parsed = parseCsvRows(reader.result);
    if (!parsed.ok) {
      setHint('carga-hint', parsed.message, false);
      return;
    }

    const importedValid = parsed.rows
      .map((line) => createClassFromCsvRow(line, parsed.headers, context))
      .filter(Boolean);

    if (!importedValid.length) {
      setHint('carga-hint', 'No se importó ninguna clase porque falta el aula en las filas del CSV.', false);
      return;
    }

    state.clases.push(...importedValid);
    updateSeleccionActual();
    renderCatalogoTabla();
    setHint('carga-hint', `Se importaron ${importedValid.length} clases desde CSV.`);
  };

  reader.readAsText(file);
});

const addManualBtn = $id('btn-agregar-manual');
addManualBtn?.addEventListener('click', () => {
  const clase = window.prompt('Nombre de la clase a agregar:');
  if (!clase) {
    setHint('asignacion-hint', 'Acción cancelada.', false);
    return;
  }

  const aula = window.prompt('Aula donde se impartirá la clase:');
  if (!aula || !aula.trim()) {
    setHint('asignacion-hint', 'Debes indicar el aula de la clase.', false);
    return;
  }

  const coordinacion = $id('asignacion-coordinacion')?.value || 'Arquitectura';
  const carrera = $id('carga-carrera')?.value || getAllCarreras()[0] || 'Arquitectura';
  const turno = $id('asignacion-turno')?.value || 'Diurno';

  state.clases.push({
    coordinacion,
    carrera,
    turno,
    clase,
    caracteristicas: ['manual'],
    docente: 'Por asignar',
    area: 'Por asignar',
    aula: aula.trim(),
  });
  updateSeleccionActual();
  renderCatalogoTabla();
  setHint('asignacion-hint', `Clase "${clase}" agregada correctamente.`);
});

const editClassBtn = $id('btn-cambiar-clase');
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

const consola = $id('generacion-console');

const generateBtn = $id('btn-generar-auto');
generateBtn?.addEventListener('click', () => {
  const coordinacion = document.querySelector('#generacion .js-coordinacion')?.value || $id('carga-coordinacion')?.value || state.seleccionActual.coordinacion;
  const carrera = $id('generacion-carrera')?.value || state.seleccionActual.carrera;
  const turno = $id('generacion-turno')?.value || state.seleccionActual.turno || 'Diurno';

  const clasesSeleccion = getClasesForSelection({ coordinacion, carrera, turno });
  if (!clasesSeleccion.length) {
    if (consola) consola.textContent = 'No hay clases para la configuración seleccionada. Carga CSV o agrega clases con la misma coordinación/carrera/turno.';
    return;
  }

  const configValidation = validateSelectedConfig({ coordinacion, carrera, turno });
  if (!configValidation.ok) {
    if (consola) consola.textContent = configValidation.message;
    return;
  }

  applyDiasByTurnoToView(turno);

  const plan = buildSchedulePlan({ turno, clases: clasesSeleccion });
  renderSchedulePlan(plan);

  if (consola) {
    consola.textContent = `Horario generado para ${coordinacion} / ${carrera} / ${turno}. Clases asignadas: ${plan.clasesAsignadas}. Bloques reservados por receso/almuerzo: ${plan.bloquesRestringidos}.`;
  }
});

const resetBtn = $id('btn-reiniciar-demo');
resetBtn?.addEventListener('click', () => {
  resetScheduleGrid();
  if (consola) consola.textContent = 'Demo reiniciada. Puedes generar nuevamente.';
});

const turnoSelect = $id('turno-config-select');
const horaInicioInput = $id('turno-hora-inicio');
const duracionInput = $id('turno-duracion');
const creditosInput = $id('turno-creditos');
const maxTurnosInput = $id('turno-max-turnos');
const diasInput = $id('turno-dias');
const aulaInput = $id('turno-aula');
const recesoInicioInput = $id('turno-receso-inicio');
const recesoFinInput = $id('turno-receso-fin');
const almuerzoInicioInput = $id('turno-almuerzo-inicio');
const almuerzoFinInput = $id('turno-almuerzo-fin');

const loadTurno = () => {
  const turno = turnoSelect?.value;
  if (!turno || !state.turnoConfig[turno]) return;
  const cfg = state.turnoConfig[turno];

  if (horaInicioInput) horaInicioInput.value = cfg.horaInicio || '08:00';
  if (duracionInput) duracionInput.value = cfg.duracion;
  if (creditosInput) creditosInput.value = cfg.creditos;
  if (maxTurnosInput) maxTurnosInput.value = cfg.maxTurnos;
  if (diasInput) diasInput.value = cfg.dias || getDiasPorTurno(turno);
  if (aulaInput) aulaInput.value = cfg.aula || '';
  if (recesoInicioInput) recesoInicioInput.value = cfg.recesoInicio || '';
  if (recesoFinInput) recesoFinInput.value = cfg.recesoFin || '';
  if (almuerzoInicioInput) almuerzoInicioInput.value = cfg.almuerzoInicio || '';
  if (almuerzoFinInput) almuerzoFinInput.value = cfg.almuerzoFin || '';
};

turnoSelect?.addEventListener('change', () => {
  loadTurno();
  if (diasInput && turnoSelect?.value) diasInput.value = getDiasPorTurno(turnoSelect.value);
});

$id('btn-guardar-turno')?.addEventListener('click', () => {
  const turno = turnoSelect?.value;
  if (!turno) return;

  const aula = aulaInput?.value.trim() || '';
  if (!aula) {
    setHint('turno-hint', 'Debes escribir el aula antes de guardar.', false);
    return;
  }

  if (recesoInicioInput?.value && recesoFinInput?.value && recesoInicioInput.value >= recesoFinInput.value) {
    setHint('turno-hint', 'El receso debe tener una hora de fin mayor a la de inicio.', false);
    return;
  }

  if (almuerzoInicioInput?.value && almuerzoFinInput?.value && almuerzoInicioInput.value >= almuerzoFinInput.value) {
    setHint('turno-hint', 'El almuerzo debe tener una hora de fin mayor a la de inicio.', false);
    return;
  }

  state.turnoConfig[turno] = {
    horaInicio: horaInicioInput?.value || '08:00',
    duracion: Number(duracionInput?.value || 45),
    creditos: Number(creditosInput?.value || 1),
    maxTurnos: Number(maxTurnosInput?.value || 4),
    dias: getDiasPorTurno(turno),
    aula,
    recesoInicio: recesoInicioInput?.value || '',
    recesoFin: recesoFinInput?.value || '',
    almuerzoInicio: almuerzoInicioInput?.value || '',
    almuerzoFin: almuerzoFinInput?.value || '',
  };

  state.clases = state.clases.map((item) => {
    if ((item.turno || 'Diurno') !== turno || item.aula) return item;
    return { ...item, aula };
  });

  if (diasInput) diasInput.value = getDiasPorTurno(turno);
  renderCatalogoTabla();
  applyDiasByTurnoToView(state.seleccionActual.turno);
  setHint('turno-hint', `Configuración de ${turno} guardada. Se respetan receso/almuerzo y bloques desde ${state.turnoConfig[turno].horaInicio}.`);
});

$id('btn-restablecer-turno')?.addEventListener('click', () => {
  const turno = turnoSelect?.value;
  if (!turno) return;

  state.turnoConfig[turno] = {
    horaInicio: turno === 'Nocturno' ? '18:00' : '08:00',
    duracion: 45,
    creditos: 1,
    maxTurnos: 4,
    dias: getDiasPorTurno(turno),
    aula: '',
    recesoInicio: '',
    recesoFin: '',
    almuerzoInicio: '',
    almuerzoFin: '',
  };

  loadTurno();
  applyDiasByTurnoToView(state.seleccionActual.turno);
  setHint('turno-hint', 'Valores restablecidos por defecto.');
});

$id('btn-nueva-area')?.addEventListener('click', () => {
  const area = window.prompt('Nombre de la nueva área:');
  if (!area) return;
  if (state.areas.includes(area)) {
    setHint('docentes-hint', 'Esa área ya existe.', false);
    return;
  }
  state.areas.push(area);
  setHint('docentes-hint', `Área "${area}" creada.`);
});

$id('btn-nuevo-docente')?.addEventListener('click', () => {
  const nombre = window.prompt('Nombre del docente:');
  if (!nombre) return;
  const area = window.prompt(`Área del docente (${state.areas.join(', ')}):`) || 'Sin área';
  state.docentes.push({ nombre, area });
  renderDocentes();
  setHint('docentes-hint', `Docente "${nombre}" agregado.`);
});

$id('btn-asignar-docente')?.addEventListener('click', () => {
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

const btnAgregarCoordinacion = $id('btn-agregar-coordinacion');
const btnAgregarCarrera = $id('btn-agregar-carrera');
const nuevaCoordinacionInput = $id('nueva-coordinacion');
const nuevaCarreraInput = $id('nueva-carrera');
const coordinacionConfigSelect = $id('coordinacion-config');

btnAgregarCoordinacion?.addEventListener('click', () => {
  const nombre = nuevaCoordinacionInput?.value.trim() || '';
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
  if (nuevaCoordinacionInput) nuevaCoordinacionInput.value = '';
  setHint('catalogo-hint', `Coordinación "${nombre}" agregada correctamente.`);
});

btnAgregarCarrera?.addEventListener('click', () => {
  const coordinacion = coordinacionConfigSelect?.value;
  const carrera = nuevaCarreraInput?.value.trim() || '';

  if (!carrera) {
    setHint('catalogo-hint', 'Escribe el nombre de la carrera.', false);
    return;
  }

  if (!coordinacion || !coordinaciones[coordinacion]) {
    setHint('catalogo-hint', 'Primero selecciona una coordinación válida.', false);
    return;
  }

  if (coordinaciones[coordinacion].includes(carrera)) {
    setHint('catalogo-hint', 'Esa carrera ya está registrada en la coordinación.', false);
    return;
  }

  coordinaciones[coordinacion].push(carrera);
  syncCarreraSelects();
  if (nuevaCarreraInput) nuevaCarreraInput.value = '';
  setHint('catalogo-hint', `Carrera "${carrera}" agregada a ${coordinacion}.`);
});

$id('btn-guardar-matricula')?.addEventListener('click', () => {
  const carrera = $id('matricula-carrera')?.value;
  if (!carrera) return;

  const estudiantes = Number($id('matricula-estudiantes')?.value || 0);
  state.matricula[carrera] = estudiantes;
  setHint('matricula-hint', `Matrícula guardada para ${carrera}: ${estudiantes} estudiantes.`);
});

const linkVistaFiltersToSeleccion = () => {
  const vistaPanel = $id('vista');
  const vistaCoord = vistaPanel?.querySelector('.js-coordinacion');
  const vistaCarrera = vistaPanel?.querySelector('.js-carrera');
  const vistaTurno = $id('vista-turno');

  vistaCoord?.addEventListener('change', (event) => {
    const coordinacion = event.target.value;
    state.seleccionActual.coordinacion = coordinacion;
    const carreras = getCarrerasByCoordinacion(coordinacion);
    if (carreras.length && !carreras.includes(state.seleccionActual.carrera)) {
      state.seleccionActual.carrera = carreras[0];
    }
    syncAppFromSeleccionActual();
  });

  vistaCarrera?.addEventListener('change', (event) => {
    state.seleccionActual.carrera = event.target.value;
    syncAppFromSeleccionActual();
  });

  vistaTurno?.addEventListener('change', (event) => {
    state.seleccionActual.turno = event.target.value;
    syncAppFromSeleccionActual();
  });
};

const linkSelectToConfig = (id, key) => {
  const select = $id(id);
  select?.addEventListener('change', () => {
    state.seleccionActual[key] = select.value;

    if (key === 'coordinacion') {
      const carreras = getCarrerasByCoordinacion(select.value);
      if (carreras.length && !carreras.includes(state.seleccionActual.carrera)) {
        state.seleccionActual.carrera = carreras[0];
      }
    }

    syncAppFromSeleccionActual();
  });
};

linkSelectToConfig('carga-coordinacion', 'coordinacion');
linkSelectToConfig('carga-carrera', 'carrera');
linkSelectToConfig('carga-turno', 'turno');

linkVistaFiltersToSeleccion();

$id('coordinacion-config')?.addEventListener('change', (event) => {
  const value = event.target.value;
  state.seleccionActual.coordinacion = value;
  const carreras = getCarrerasByCoordinacion(value);
  if (carreras.length) state.seleccionActual.carrera = carreras[0];
  syncAppFromSeleccionActual();
});

$id('turno-config-select')?.addEventListener('change', (event) => {
  state.seleccionActual.turno = event.target.value;
  syncAppFromSeleccionActual();
});

$id('matricula-carrera')?.addEventListener('change', (event) => {
  state.seleccionActual.carrera = event.target.value;
  syncAppFromSeleccionActual();
});

syncCoordinacionSelects();
syncCarreraSelects();
syncTurnoSelects();
updateSeleccionActual();
syncAppFromSeleccionActual();
renderCatalogoTabla();
renderDocentes();
loadTurno();
