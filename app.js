const $id = (id) => document.getElementById(id);

const safeArray = (value) => (Array.isArray(value) ? value : []);
const safeString = (value, fallback = '') => (value == null ? fallback : String(value));
const toPositiveNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

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

const getDefaultTurnoConfig = (turno) => ({
  horaInicio: turno === 'Nocturno' ? '18:00' : '08:00',
  duracion: 45,
  creditos: 1,
  maxTurnos: 4,
  dias: diasPorTurno[turno] || diasPorTurno.Diurno,
  aula: '',
  recesoInicio: '',
  recesoFin: '',
  almuerzoInicio: '',
  almuerzoFin: '',
});

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
    Diurno: getDefaultTurnoConfig('Diurno'),
    Sabatino: getDefaultTurnoConfig('Sabatino'),
    Nocturno: getDefaultTurnoConfig('Nocturno'),
    Dominical: getDefaultTurnoConfig('Dominical'),
  },
  matricula: {},
  seleccionActual: { coordinacion: 'Arquitectura', carrera: 'Arquitectura', turno: 'Diurno' },
};

const normalizeTurno = (turno = '') => safeString(turno).trim().toLowerCase();

const resolveTurnoName = (turno) => {
  const found = turnosDisponibles.find((item) => normalizeTurno(item) === normalizeTurno(turno));
  return found || 'Diurno';
};

const getTurnoConfig = (turno) => {
  const turnoName = resolveTurnoName(turno);
  const defaults = getDefaultTurnoConfig(turnoName);
  return { ...defaults, ...(state.turnoConfig[turnoName] || {}) };
};

const getCarrerasByCoordinacion = (coordinacion) => safeArray(coordinaciones[coordinacion]);
const getAllCarreras = () => Object.values(coordinaciones).flat();

const setHint = (id, message, ok = true) => {
  const hint = $id(id);
  if (!hint) return;
  hint.textContent = message;
  hint.style.color = ok ? '#3257ff' : '#b00020';
};

const getSelectValue = (id, fallback = '') => {
  const node = $id(id);
  return node?.value || fallback;
};

const fillSelect = (select, options, selectedValue) => {
  if (!select) return;
  const safeOptions = safeArray(options).filter(Boolean);
  select.innerHTML = '';
  safeOptions.forEach((optionValue) => {
    const option = document.createElement('option');
    option.value = optionValue;
    option.textContent = optionValue;
    if (optionValue === selectedValue) option.selected = true;
    select.appendChild(option);
  });
};

const syncSelectValue = (selector, value) => {
  document.querySelectorAll(selector).forEach((select) => {
    if ([...select.options].some((option) => option.value === value)) select.value = value;
  });
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
    switchView(tab.dataset?.tab);
  });
});

const getCoordinacionFromContext = (select) => {
  const panel = select?.closest('section') || select?.closest('.view') || document;
  const coordinacionSelect = panel.querySelector('.js-coordinacion');
  return coordinacionSelect?.value || state.seleccionActual.coordinacion || Object.keys(coordinaciones)[0] || 'Arquitectura';
};

const syncCoordinacionSelects = (selected = 'Arquitectura') => {
  const values = Object.keys(coordinaciones);
  document.querySelectorAll('.js-coordinacion').forEach((select) => {
    const keepValue = values.includes(select.value) ? select.value : selected;
    fillSelect(select, values, keepValue);
  });
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

const updateSeleccionActual = () => {
  const defaultCarrera = getAllCarreras()[0] || 'Arquitectura';
  const coordinacion = getSelectValue('carga-coordinacion', state.seleccionActual.coordinacion || 'Arquitectura');
  const carrera = getSelectValue('carga-carrera', state.seleccionActual.carrera || defaultCarrera);
  const turno = getSelectValue('carga-turno', state.seleccionActual.turno || 'Diurno');
  state.seleccionActual = { coordinacion, carrera, turno: resolveTurnoName(turno) };
};

const getDiasPorTurno = (turno) => getTurnoConfig(turno).dias || diasPorTurno[resolveTurnoName(turno)] || diasPorTurno.Diurno;

const getDiasArray = (turno) => safeString(getDiasPorTurno(turno), 'Día')
  .split(',')
  .map((dia) => dia.trim())
  .filter(Boolean);

const formatTimeFromMinutes = (minutes) => {
  const normalized = ((Number(minutes) || 0) % (24 * 60) + (24 * 60)) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const parseTimeToMinutes = (time = '08:00') => {
  const match = safeString(time).match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return 8 * 60;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 8 * 60;
  return (hours * 60) + minutes;
};

const rangesOverlap = (startA, endA, startB, endB) => startA < endB && startB < endA;

const getBloqueRestriction = (start, end, cfg) => {
  const recesoInicio = parseTimeToMinutes(cfg.recesoInicio || '');
  const recesoFin = parseTimeToMinutes(cfg.recesoFin || '');
  const almuerzoInicio = parseTimeToMinutes(cfg.almuerzoInicio || '');
  const almuerzoFin = parseTimeToMinutes(cfg.almuerzoFin || '');

  const hasReceso = Boolean(cfg.recesoInicio && cfg.recesoFin) && recesoInicio < recesoFin;
  if (hasReceso && rangesOverlap(start, end, recesoInicio, recesoFin)) return 'RECESO';

  const hasAlmuerzo = Boolean(cfg.almuerzoInicio && cfg.almuerzoFin) && almuerzoInicio < almuerzoFin;
  if (hasAlmuerzo && rangesOverlap(start, end, almuerzoInicio, almuerzoFin)) return 'ALMUERZO';

  return '';
};

const getBloquesVista = (turno) => {
  const cfg = getTurnoConfig(turno);
  const totalBloques = Math.max(toPositiveNumber(cfg.maxTurnos, 4), 1);
  const duracion = Math.max(toPositiveNumber(cfg.duracion, 45), 1);
  const inicio = parseTimeToMinutes(cfg.horaInicio || '08:00');

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

const renderVistaTable = (turno) => {
  const thead = $id('vista-thead');
  const tbody = $id('vista-tbody');
  if (!thead || !tbody) return;

  const bloquesVista = getBloquesVista(turno);
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

const applyDiasByTurnoToView = (turno) => renderVistaTable(turno);

const renderCatalogoTabla = () => {
  const tbody = $id('clases-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  safeArray(state.clases).forEach((item) => {
    const tr = document.createElement('tr');
    const tags = safeArray(item.caracteristicas);
    tr.innerHTML = `<td>${item.coordinacion || ''}</td><td>${item.carrera || ''}</td><td>${item.clase || ''}</td><td>${item.aula || ''}</td><td>${tags.map((tag) => `<span class="tag">${tag}</span>`).join(' ')}</td><td>${item.docente || ''}</td><td>${item.area || ''}</td>`;
    tbody.appendChild(tr);
  });
};

const renderDocentes = () => {
  const tbody = $id('docentes-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  safeArray(state.docentes).forEach((docente) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${docente.nombre || ''}</td><td>${docente.area || ''}</td>`;
    tbody.appendChild(tr);
  });
};

const getVistaCells = () => {
  const claseCells = [...document.querySelectorAll('#vista-tbody .vista-clase')];
  const aulaCells = [...document.querySelectorAll('#vista-tbody .vista-aula')];
  return { claseCells, aulaCells };
};

const paintClaseCell = (cell, value) => {
  if (cell) cell.textContent = value || '-';
};

const paintAulaCell = (cell, value) => {
  if (cell) cell.textContent = value || '-';
};

const limpiarVista = () => {
  const { claseCells, aulaCells } = getVistaCells();
  claseCells.forEach((cell) => paintClaseCell(cell, '-'));
  aulaCells.forEach((cell) => paintAulaCell(cell, '-'));
};

const getSlotFromCell = (cell, fallbackIndex) => {
  const slotRaw = cell?.dataset?.slot;
  const slot = Number(slotRaw);
  if (Number.isInteger(slot) && slot >= 0) return slot;
  return fallbackIndex;
};

const pintarClasesEnVista = (slots = []) => {
  const { claseCells, aulaCells } = getVistaCells();
  const maxLength = Math.max(claseCells.length, aulaCells.length);

  for (let index = 0; index < maxLength; index += 1) {
    const claseCell = claseCells[index];
    const aulaCell = aulaCells[index];
    const slotIndex = getSlotFromCell(claseCell || aulaCell, index);
    const slot = slots[slotIndex] || { clase: '-', aula: '-' };
    paintClaseCell(claseCell, slot.clase);
    paintAulaCell(aulaCell, slot.aula);
  }
};

const filtrarClasesPorSeleccion = ({ coordinacion, carrera, turno }) => safeArray(state.clases).filter((item) => {
  const matchCoord = item.coordinacion === coordinacion;
  const matchCarrera = item.carrera === carrera;
  const matchTurno = resolveTurnoName(item.turno || 'Diurno') === resolveTurnoName(turno);
  return matchCoord && matchCarrera && matchTurno;
});

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

const getDayIndexFromSlot = (slot, diasCount) => {
  if (!Number.isInteger(slot) || slot < 0) return -1;
  const safeDiasCount = Number.isInteger(diasCount) && diasCount > 0 ? diasCount : 1;
  return slot % safeDiasCount;
};

const getBlockIndexFromSlot = (slot, diasCount) => {
  if (!Number.isInteger(slot) || slot < 0) return -1;
  const safeDiasCount = Number.isInteger(diasCount) && diasCount > 0 ? diasCount : 1;
  return Math.floor(slot / safeDiasCount);
};

const getConsecutiveMateriaCount = ({ slots, slot, diasCount, materia }) => {
  if (!materia) return 0;

  const dayIndex = getDayIndexFromSlot(slot, diasCount);
  const currentBlock = getBlockIndexFromSlot(slot, diasCount);
  if (dayIndex < 0 || currentBlock <= 0) return 0;

  let consecutive = 0;
  for (let blockIndex = currentBlock - 1; blockIndex >= 0; blockIndex -= 1) {
    const previousSlot = (blockIndex * diasCount) + dayIndex;
    const assigned = slots[previousSlot];
    if (!assigned || assigned.restriccion || assigned.clase !== materia) break;
    consecutive += 1;
  }

  return consecutive;
};

const validateFutureAssignmentRules = ({ clase, slot, diasCount, maxClasesPorDia, clasesPorDia, slots }) => {
  const dayIndex = getDayIndexFromSlot(slot, diasCount);
  if (dayIndex < 0) return { valid: false, reason: 'Día inválido.' };

  const currentDayCount = clasesPorDia[dayIndex] || 0;
  if (currentDayCount >= maxClasesPorDia) {
    return { valid: false, reason: 'Se alcanzó el máximo de clases por día para la carrera.' };
  }

  const materia = safeString(clase?.clase).trim();
  const consecutiveMateria = getConsecutiveMateriaCount({ slots, slot, diasCount, materia });
  if (consecutiveMateria >= 2) {
    return { valid: false, reason: 'No se permiten más de 2 clases consecutivas de la misma materia.' };
  }

  return { valid: true, reason: '' };
};

const buildOcupacionPorSlot = (totalSlots) => {
  const safeTotalSlots = Number.isInteger(totalSlots) && totalSlots > 0 ? totalSlots : 0;
  return Array.from({ length: safeTotalSlots }, () => ({ aulas: new Set(), docentes: new Set() }));
};

const normalizeResourceKey = (value) => safeString(value).trim().toLowerCase();

const getOcupacionSlot = (ocupacionPorSlot, slot) => {
  if (!Number.isInteger(slot) || slot < 0) return null;
  if (!Array.isArray(ocupacionPorSlot) || slot >= ocupacionPorSlot.length) return null;
  return ocupacionPorSlot[slot] || null;
};

const puedeAsignarse = (clase, slot, ocupacionPorSlot) => {
  if (!clase) return false;

  const ocupacion = getOcupacionSlot(ocupacionPorSlot, slot);
  if (!ocupacion) return false;

  const aula = normalizeResourceKey(clase.aula);
  if (aula && ocupacion.aulas.has(aula)) return false;

  const docente = normalizeResourceKey(clase.docente);
  if (docente && ocupacion.docentes.has(docente)) return false;

  return true;
};

const marcarOcupacion = (clase, slot, ocupacionPorSlot) => {
  if (!clase) return;

  const ocupacion = getOcupacionSlot(ocupacionPorSlot, slot);
  if (!ocupacion) return;

  const aula = normalizeResourceKey(clase.aula);
  if (aula) ocupacion.aulas.add(aula);

  const docente = normalizeResourceKey(clase.docente);
  if (docente) ocupacion.docentes.add(docente);
};

const generarPlanHorario = ({ turno, clases = [] }) => {
  const bloques = getBloquesVista(turno);
  const dias = getDiasArray(turno);
  const diasCount = Math.max(dias.length, 1);
  const totalSlots = bloques.length * diasCount;
  const defaultAula = getTurnoConfig(turno).aula || '-';
  const maxClasesPorDia = Math.max(toPositiveNumber(getTurnoConfig(turno).maxTurnos, 4), 1);
  const ocupacionPorSlot = buildOcupacionPorSlot(totalSlots);
  const clasesPorDia = Array.from({ length: diasCount }, () => 0);

  const clasesPendientes = safeArray(clases).map((_, index) => index);
  let bloquesRestringidos = 0;
  const slots = [];

  for (let slotIndex = 0; slotIndex < totalSlots; slotIndex += 1) {
    const blockIndex = Math.floor(slotIndex / diasCount);
    if (blockIndex < 0 || blockIndex >= bloques.length) {
      slots.push({ clase: '-', aula: '-', restriccion: '' });
      continue;
    }

    const bloque = bloques[blockIndex];
    if (bloque.restriccion) {
      slots.push({ clase: bloque.restriccion, aula: '-', restriccion: bloque.restriccion });
      bloquesRestringidos += 1;
      continue;
    }

    let claseSeleccionada = null;
    let indicePendienteSeleccionado = -1;

    for (let pendingIndex = 0; pendingIndex < clasesPendientes.length; pendingIndex += 1) {
      const classIndex = clasesPendientes[pendingIndex];
      if (!Number.isInteger(classIndex) || classIndex < 0 || classIndex >= clases.length) continue;

      const candidate = clases[classIndex];
      if (!puedeAsignarse(candidate, slotIndex, ocupacionPorSlot)) continue;

      const futureRules = validateFutureAssignmentRules({
        clase: candidate,
        slot: slotIndex,
        diasCount,
        maxClasesPorDia,
        clasesPorDia,
        slots,
      });
      if (!futureRules.valid) continue;

      claseSeleccionada = candidate;
      indicePendienteSeleccionado = pendingIndex;
      break;
    }

    if (!claseSeleccionada) {
      slots.push({
        clase: '-',
        aula: '-',
        restriccion: '',
      });
      continue;
    }

    slots.push({
      clase: claseSeleccionada.clase || '-',
      aula: claseSeleccionada.aula || defaultAula,
      restriccion: '',
    });

    marcarOcupacion(claseSeleccionada, slotIndex, ocupacionPorSlot);

    const dayIndex = getDayIndexFromSlot(slotIndex, diasCount);
    if (dayIndex >= 0) clasesPorDia[dayIndex] = (clasesPorDia[dayIndex] || 0) + 1;

    if (indicePendienteSeleccionado >= 0 && indicePendienteSeleccionado < clasesPendientes.length) {
      clasesPendientes.splice(indicePendienteSeleccionado, 1);
    }
  }

  const clasesAsignadas = safeArray(clases).length - clasesPendientes.length;
  return { slots, clasesAsignadas, bloquesRestringidos };
};

const renderPlanGenerado = (plan) => {
  const slots = safeArray(plan?.slots);
  pintarClasesEnVista(slots);
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

const parseCsvRows = (text) => {
  const lines = safeString(text).trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { ok: false, message: 'El CSV no contiene datos válidos.' };

  const headers = lines[0].split(',').map((item) => item.trim().toLowerCase());
  const required = ['clase', 'creditos', 'compartida', 'anio', 'categoria', 'tipo', 'aula'];
  const missing = required.filter((field) => !headers.includes(field));
  if (missing.length) return { ok: false, message: `Faltan columnas: ${missing.join(', ')}` };

  return { ok: true, headers, rows: lines.slice(1) };
};

const createClassFromCsvRow = (row, headers, context) => {
  const cols = safeString(row).split(',').map((item) => item.trim());
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

const processCsvImport = (file, context) => {
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
};

const getGenerationSelection = () => {
  const generacionPanel = $id('generacion');
  const coordinacion = generacionPanel?.querySelector('.js-coordinacion')?.value
    || getSelectValue('carga-coordinacion', state.seleccionActual.coordinacion);
  const carrera = getSelectValue('generacion-carrera', state.seleccionActual.carrera);
  const turno = resolveTurnoName(getSelectValue('generacion-turno', state.seleccionActual.turno || 'Diurno'));
  return { coordinacion, carrera, turno };
};

const generarHorarioAutomatico = () => {
  const consola = $id('generacion-console');
  const seleccion = getGenerationSelection();
  const clasesSeleccion = filtrarClasesPorSeleccion(seleccion);

  if (!clasesSeleccion.length) {
    if (consola) consola.textContent = 'No hay clases para la configuración seleccionada. Carga CSV o agrega clases con la misma coordinación/carrera/turno.';
    limpiarVista();
    return;
  }

  const configValidation = validateSelectedConfig(seleccion);
  if (!configValidation.ok) {
    if (consola) consola.textContent = configValidation.message;
    return;
  }

  applyDiasByTurnoToView(seleccion.turno);
  const plan = generarPlanHorario({ turno: seleccion.turno, clases: clasesSeleccion });
  renderPlanGenerado(plan);

  if (consola) {
    consola.textContent = `Horario generado para ${seleccion.coordinacion} / ${seleccion.carrera} / ${seleccion.turno}. Clases asignadas: ${plan.clasesAsignadas}. Bloques reservados por receso/almuerzo: ${plan.bloquesRestringidos}.`;
  }
};

const loadTurno = () => {
  const turno = resolveTurnoName(getSelectValue('turno-config-select', 'Diurno'));
  const cfg = getTurnoConfig(turno);

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

  if (horaInicioInput) horaInicioInput.value = cfg.horaInicio;
  if (duracionInput) duracionInput.value = cfg.duracion;
  if (creditosInput) creditosInput.value = cfg.creditos;
  if (maxTurnosInput) maxTurnosInput.value = cfg.maxTurnos;
  if (diasInput) diasInput.value = cfg.dias;
  if (aulaInput) aulaInput.value = cfg.aula;
  if (recesoInicioInput) recesoInicioInput.value = cfg.recesoInicio;
  if (recesoFinInput) recesoFinInput.value = cfg.recesoFin;
  if (almuerzoInicioInput) almuerzoInicioInput.value = cfg.almuerzoInicio;
  if (almuerzoFinInput) almuerzoFinInput.value = cfg.almuerzoFin;
};

const saveTurnoConfig = () => {
  const turno = resolveTurnoName(getSelectValue('turno-config-select', 'Diurno'));
  if (!turno) return;

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

  const aula = safeString(aulaInput?.value).trim();
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
    ...getDefaultTurnoConfig(turno),
    horaInicio: horaInicioInput?.value || getDefaultTurnoConfig(turno).horaInicio,
    duracion: toPositiveNumber(duracionInput?.value, 45),
    creditos: toPositiveNumber(creditosInput?.value, 1),
    maxTurnos: toPositiveNumber(maxTurnosInput?.value, 4),
    dias: getDiasPorTurno(turno),
    aula,
    recesoInicio: recesoInicioInput?.value || '',
    recesoFin: recesoFinInput?.value || '',
    almuerzoInicio: almuerzoInicioInput?.value || '',
    almuerzoFin: almuerzoFinInput?.value || '',
  };

  state.clases = safeArray(state.clases).map((item) => {
    if (resolveTurnoName(item.turno || 'Diurno') !== turno || item.aula) return item;
    return { ...item, aula };
  });

  if (diasInput) diasInput.value = getDiasPorTurno(turno);
  renderCatalogoTabla();
  applyDiasByTurnoToView(state.seleccionActual.turno);
  setHint('turno-hint', `Configuración de ${turno} guardada. Se respetan receso/almuerzo y bloques desde ${state.turnoConfig[turno].horaInicio}.`);
};

const resetTurnoConfig = () => {
  const turno = resolveTurnoName(getSelectValue('turno-config-select', 'Diurno'));
  if (!turno) return;

  state.turnoConfig[turno] = getDefaultTurnoConfig(turno);
  loadTurno();
  applyDiasByTurnoToView(state.seleccionActual.turno);
  setHint('turno-hint', 'Valores restablecidos por defecto.');
};

const linkVistaFiltersToSeleccion = () => {
  const vistaPanel = $id('vista');
  const vistaCoord = vistaPanel?.querySelector('.js-coordinacion');
  const vistaCarrera = vistaPanel?.querySelector('.js-carrera');
  const vistaTurno = $id('vista-turno');

  vistaCoord?.addEventListener('change', (event) => {
    const coordinacion = event.target?.value || state.seleccionActual.coordinacion;
    state.seleccionActual.coordinacion = coordinacion;
    const carreras = getCarrerasByCoordinacion(coordinacion);
    if (carreras.length && !carreras.includes(state.seleccionActual.carrera)) state.seleccionActual.carrera = carreras[0];
    syncAppFromSeleccionActual();
  });

  vistaCarrera?.addEventListener('change', (event) => {
    state.seleccionActual.carrera = event.target?.value || state.seleccionActual.carrera;
    syncAppFromSeleccionActual();
  });

  vistaTurno?.addEventListener('change', (event) => {
    state.seleccionActual.turno = resolveTurnoName(event.target?.value || state.seleccionActual.turno);
    syncAppFromSeleccionActual();
  });
};

const linkSelectToConfig = (id, key) => {
  const select = $id(id);
  select?.addEventListener('change', () => {
    state.seleccionActual[key] = key === 'turno' ? resolveTurnoName(select.value) : select.value;

    if (key === 'coordinacion') {
      const carreras = getCarrerasByCoordinacion(select.value);
      if (carreras.length && !carreras.includes(state.seleccionActual.carrera)) state.seleccionActual.carrera = carreras[0];
    }

    syncAppFromSeleccionActual();
  });
};

const bindEvents = () => {
  $id('btn-menu')?.addEventListener('click', () => body.classList.toggle('sidebar-hidden'));

  $id('btn-importar-csv')?.addEventListener('click', () => {
    const file = $id('csv-input')?.files?.[0];
    if (!file) {
      setHint('carga-hint', 'Selecciona un archivo CSV antes de importar.', false);
      return;
    }

    const context = {
      coordinacion: getSelectValue('carga-coordinacion', 'Arquitectura'),
      carrera: getSelectValue('carga-carrera', getAllCarreras()[0] || 'Arquitectura'),
      turno: resolveTurnoName(getSelectValue('carga-turno', 'Diurno')),
    };

    processCsvImport(file, context);
  });

  $id('btn-agregar-manual')?.addEventListener('click', () => {
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

    state.clases.push({
      coordinacion: getSelectValue('asignacion-coordinacion', 'Arquitectura'),
      carrera: getSelectValue('carga-carrera', getAllCarreras()[0] || 'Arquitectura'),
      turno: resolveTurnoName(getSelectValue('asignacion-turno', 'Diurno')),
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

  $id('btn-cambiar-clase')?.addEventListener('click', () => {
    const nombre = window.prompt('Clase que quieres renombrar:');
    if (!nombre) {
      setHint('asignacion-hint', 'Acción cancelada.', false);
      return;
    }

    const found = safeArray(state.clases).find((item) => safeString(item.clase).toLowerCase() === safeString(nombre).toLowerCase());
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

  $id('btn-generar-auto')?.addEventListener('click', generarHorarioAutomatico);

  $id('btn-reiniciar-demo')?.addEventListener('click', () => {
    limpiarVista();
    const consola = $id('generacion-console');
    if (consola) consola.textContent = 'Demo reiniciada. Puedes generar nuevamente.';
  });

  $id('turno-config-select')?.addEventListener('change', () => {
    loadTurno();
    const diasInput = $id('turno-dias');
    const turnoValue = getSelectValue('turno-config-select', 'Diurno');
    if (diasInput) diasInput.value = getDiasPorTurno(turnoValue);
  });

  $id('btn-guardar-turno')?.addEventListener('click', saveTurnoConfig);
  $id('btn-restablecer-turno')?.addEventListener('click', resetTurnoConfig);

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

    const target = safeArray(state.clases).find((item) => safeString(item.clase).toLowerCase() === safeString(clase).toLowerCase());
    if (!target) {
      setHint('docentes-hint', 'No se encontró la clase indicada.', false);
      return;
    }

    target.docente = docente;
    renderCatalogoTabla();
    setHint('docentes-hint', `Docente asignado a "${target.clase}".`);
  });

  $id('btn-agregar-coordinacion')?.addEventListener('click', () => {
    const nombre = safeString($id('nueva-coordinacion')?.value).trim();
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
    if ($id('nueva-coordinacion')) $id('nueva-coordinacion').value = '';
    setHint('catalogo-hint', `Coordinación "${nombre}" agregada correctamente.`);
  });

  $id('btn-agregar-carrera')?.addEventListener('click', () => {
    const coordinacion = getSelectValue('coordinacion-config');
    const carrera = safeString($id('nueva-carrera')?.value).trim();

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
    if ($id('nueva-carrera')) $id('nueva-carrera').value = '';
    setHint('catalogo-hint', `Carrera "${carrera}" agregada a ${coordinacion}.`);
  });

  $id('btn-guardar-matricula')?.addEventListener('click', () => {
    const carrera = getSelectValue('matricula-carrera');
    if (!carrera) return;

    const estudiantes = Number(getSelectValue('matricula-estudiantes', 0));
    state.matricula[carrera] = Number.isFinite(estudiantes) ? estudiantes : 0;
    setHint('matricula-hint', `Matrícula guardada para ${carrera}: ${state.matricula[carrera]} estudiantes.`);
  });

  linkSelectToConfig('carga-coordinacion', 'coordinacion');
  linkSelectToConfig('carga-carrera', 'carrera');
  linkSelectToConfig('carga-turno', 'turno');
  linkVistaFiltersToSeleccion();

  $id('coordinacion-config')?.addEventListener('change', (event) => {
    const value = event.target?.value;
    if (!value) return;
    state.seleccionActual.coordinacion = value;
    const carreras = getCarrerasByCoordinacion(value);
    if (carreras.length) state.seleccionActual.carrera = carreras[0];
    syncAppFromSeleccionActual();
  });

  $id('turno-config-select')?.addEventListener('change', (event) => {
    state.seleccionActual.turno = resolveTurnoName(event.target?.value || state.seleccionActual.turno);
    syncAppFromSeleccionActual();
  });

  $id('matricula-carrera')?.addEventListener('change', (event) => {
    state.seleccionActual.carrera = event.target?.value || state.seleccionActual.carrera;
    syncAppFromSeleccionActual();
  });
};

const init = () => {
  syncCoordinacionSelects();
  syncCarreraSelects();
  syncTurnoSelects();
  updateSeleccionActual();
  syncAppFromSeleccionActual();
  renderCatalogoTabla();
  renderDocentes();
  loadTurno();
  bindEvents();
};

init();
