const $id = (id) => document.getElementById(id);

const safeArray = (value) => (Array.isArray(value) ? value : []);
const safeString = (value, fallback = '') => (value == null ? fallback : String(value));
const normalizeText = (value) => safeString(value).trim().toLowerCase();
const toPositiveNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const DEFAULT_MAX_ESTUDIANTES_POR_GRUPO = 35;
const TURNO_CONFIG_STORAGE_KEY = 'schedule.turnoConfig.v1';

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
  prioridadDias: safeString(diasPorTurno[turno] || diasPorTurno.Diurno).split(',').map((dia) => dia.trim()).filter(Boolean),
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
  maxEstudiantesPorGrupo: DEFAULT_MAX_ESTUDIANTES_POR_GRUPO,
  seleccionActual: { coordinacion: 'Arquitectura', carrera: 'Arquitectura', turno: 'Diurno', grupo: 'G1' },
  schedules: {},
  activeSlotSelection: null,
};

const normalizeDiasInput = (diasValue) => safeString(diasValue)
  .split(',')
  .map((dia) => dia.trim())
  .filter(Boolean);

const sanitizeTurnoConfigForStorage = (turno, rawConfig = {}) => {
  const turnoName = resolveTurnoName(turno);
  const defaults = getDefaultTurnoConfig(turnoName);
  const diasList = normalizeDiasInput(rawConfig.dias || defaults.dias);
  const diasString = diasList.join(',') || defaults.dias;
  const prioridadBase = Array.isArray(rawConfig.prioridadDias)
    ? rawConfig.prioridadDias
    : normalizeDiasInput(rawConfig.prioridadDias);

  const prioridadDias = prioridadBase
    .map((dia) => safeString(dia).trim())
    .filter((dia, index, arr) => dia && arr.findIndex((item) => normalizeText(item) === normalizeText(dia)) === index);

  const prioridadFinal = prioridadDias.length ? prioridadDias : normalizeDiasInput(diasString);

  return {
    turno: turnoName,
    dias: diasString,
    duracion: toPositiveNumber(rawConfig.duracion, defaults.duracion),
    maxTurnos: toPositiveNumber(rawConfig.maxTurnos, defaults.maxTurnos),
    prioridadDias: prioridadFinal,
  };
};

const saveTurnoConfigToLocalStorage = () => {
  const payload = turnosDisponibles.reduce((acc, turno) => {
    acc[turno] = sanitizeTurnoConfigForStorage(turno, state.turnoConfig[turno]);
    return acc;
  }, {});

  try {
    window.localStorage.setItem(TURNO_CONFIG_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('No se pudo guardar la configuración de turno en localStorage.', error);
  }
};

const loadTurnoConfigFromLocalStorage = () => {
  try {
    const raw = window.localStorage.getItem(TURNO_CONFIG_STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return;

    turnosDisponibles.forEach((turno) => {
      if (!parsed[turno]) return;
      const saved = sanitizeTurnoConfigForStorage(turno, parsed[turno]);
      state.turnoConfig[turno] = {
        ...getDefaultTurnoConfig(turno),
        ...(state.turnoConfig[turno] || {}),
        dias: saved.dias,
        duracion: saved.duracion,
        maxTurnos: saved.maxTurnos,
        prioridadDias: saved.prioridadDias,
      };
    });
  } catch (error) {
    console.warn('No se pudo cargar la configuración de turno desde localStorage.', error);
  }
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
  state.seleccionActual = { ...state.seleccionActual, coordinacion, carrera, turno: resolveTurnoName(turno) };
};

const getDiasPorTurno = (turno) => getTurnoConfig(turno).dias || diasPorTurno[resolveTurnoName(turno)] || diasPorTurno.Diurno;


const getSelectionKey = ({ coordinacion, carrera, turno, grupo }) => `${safeString(coordinacion)}::${safeString(carrera)}::${resolveTurnoName(turno)}::${safeString(grupo || 'G1')}`;

const createSlotsForTurno = (turno) => {
  const bloques = getBloquesVista(turno);
  const dias = getDiasArray(turno);
  const diasCount = Math.max(dias.length, 1);
  return bloques.flatMap((bloque) => Array.from({ length: diasCount }, () => ({
    clase: bloque.restriccion || '-',
    aula: '-',
    docente: '',
    restriccion: bloque.restriccion || '',
  })));
};

const getOrCreateSchedule = (selection) => {
  const key = getSelectionKey(selection);
  if (!state.schedules[key]) state.schedules[key] = createSlotsForTurno(selection.turno);
  return state.schedules[key];
};

const getCurrentVistaSelection = () => ({
  coordinacion: ($id('vista')?.querySelector('.js-coordinacion')?.value) || state.seleccionActual.coordinacion,
  carrera: ($id('vista')?.querySelector('.js-carrera')?.value) || state.seleccionActual.carrera,
  turno: resolveTurnoName(getSelectValue('vista-turno', state.seleccionActual.turno)),
  grupo: state.seleccionActual.grupo || 'G1',
});

const getDiasArray = (turno) => safeString(getDiasPorTurno(turno), 'Día')
  .split(',')
  .map((dia) => dia.trim())
  .filter(Boolean);

const getPrioridadDias = (turno, dias = []) => {
  const safeDias = safeArray(dias).map((dia) => safeString(dia).trim()).filter(Boolean);
  const cfg = getTurnoConfig(turno);

  const prioridadRaw = Array.isArray(cfg.prioridadDias)
    ? cfg.prioridadDias
    : safeString(cfg.prioridadDias).split(',');

  const prioridadFiltrada = prioridadRaw
    .map((dia) => safeString(dia).trim())
    .filter((dia) => dia && safeDias.some((item) => normalizeText(item) === normalizeText(dia)));

  const prioridadUnica = [];
  prioridadFiltrada.forEach((dia) => {
    const existente = prioridadUnica.some((item) => normalizeText(item) === normalizeText(dia));
    if (!existente) prioridadUnica.push(dia);
  });

  safeDias.forEach((dia) => {
    const yaIncluido = prioridadUnica.some((item) => normalizeText(item) === normalizeText(dia));
    if (!yaIncluido) prioridadUnica.push(dia);
  });

  return prioridadUnica;
};

const getDayPriorityIndexes = (turno, dias = []) => {
  const safeDias = safeArray(dias);
  const prioridadDias = getPrioridadDias(turno, safeDias);
  const indexes = prioridadDias
    .map((dia) => safeDias.findIndex((item) => normalizeText(item) === normalizeText(dia)))
    .filter((index) => Number.isInteger(index) && index >= 0);

  safeDias.forEach((_, index) => {
    if (!indexes.includes(index)) indexes.push(index);
  });

  return indexes;
};

const getSlotIterationOrder = ({ totalSlots, diasCount, bloquesCount, dayPriorityIndexes }) => {
  if (!Number.isInteger(totalSlots) || totalSlots <= 0) return [];

  const safeDiasCount = Number.isInteger(diasCount) && diasCount > 0 ? diasCount : 1;
  const safeBloquesCount = Number.isInteger(bloquesCount) && bloquesCount > 0
    ? bloquesCount
    : Math.ceil(totalSlots / safeDiasCount);

  const safeDayPriorityIndexes = safeArray(dayPriorityIndexes).filter((index) => Number.isInteger(index) && index >= 0 && index < safeDiasCount);
  const dayOrder = safeDayPriorityIndexes.length
    ? safeDayPriorityIndexes
    : Array.from({ length: safeDiasCount }, (_, index) => index);

  const orderedSlots = [];
  for (let blockIndex = 0; blockIndex < safeBloquesCount; blockIndex += 1) {
    dayOrder.forEach((dayIndex) => {
      const slotIndex = (blockIndex * safeDiasCount) + dayIndex;
      if (slotIndex < totalSlots) orderedSlots.push(slotIndex);
    });
  }

  return orderedSlots;
};

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


const getSlotFromDayAndBlock = ({ dayIndex, blockIndex, diasCount }) => (blockIndex * diasCount) + dayIndex;

const getSlotConflictMessage = ({ slots, slotIndex, aula, docente }) => {
  const target = slots[slotIndex];
  if (!target || target.restriccion) return '';

  const alreadyHasClass = safeString(target.clase).trim() && target.clase !== '-';
  if (!alreadyHasClass) return '';

  const aulaConflict = normalizeResourceKey(aula) && normalizeResourceKey(target.aula) === normalizeResourceKey(aula);
  const docenteConflict = normalizeResourceKey(docente) && normalizeResourceKey(target.docente) === normalizeResourceKey(docente);

  if (aulaConflict || docenteConflict) return 'Conflicto detectado: aula o docente ya ocupados en ese bloque.';
  return 'El slot seleccionado ya tiene una clase asignada.';
};

const openSlotModal = ({ slotIndex }) => {
  const modal = $id('slot-modal');
  if (!modal) return;

  const selection = getCurrentVistaSelection();
  const dias = getDiasArray(selection.turno);
  const bloques = getBloquesVista(selection.turno);
  const schedule = getOrCreateSchedule(selection);

  const dayIndex = getDayIndexFromSlot(slotIndex, dias.length);
  const blockIndex = getBlockIndexFromSlot(slotIndex, dias.length);
  const slot = schedule[slotIndex] || { clase: '-', aula: '-', docente: '' };

  fillSelect($id('slot-dia'), dias, dias[dayIndex] || dias[0]);
  fillSelect($id('slot-bloque'), bloques.map((b, idx) => `${idx + 1} · ${b.hora}`), `${(blockIndex + 1)} · ${(bloques[blockIndex] || bloques[0]).hora}`);

  const clases = filtrarClasesPorSeleccion(selection);
  const classNames = clases.map((item) => item.clase).filter(Boolean);
  fillSelect($id('slot-clase'), classNames, slot.clase && slot.clase !== '-' ? slot.clase : classNames[0]);

  const aulas = Array.from(new Set([
    ...clases.map((item) => item.aula),
    ...safeArray(state.clases).map((item) => item.aula),
    getTurnoConfig(selection.turno).aula,
  ].filter(Boolean)));
  fillSelect($id('slot-aula'), aulas, slot.aula && slot.aula !== '-' ? slot.aula : aulas[0]);

  const docentes = Array.from(new Set([
    ...safeArray(state.docentes).map((item) => item.nombre),
    ...clases.map((item) => item.docente),
  ].filter(Boolean)));
  fillSelect($id('slot-docente'), docentes, slot.docente || docentes[0]);

  const context = $id('slot-modal-context');
  if (context) context.textContent = `Asignación para ${selection.coordinacion} / ${selection.carrera} / ${selection.turno} / ${selection.grupo || 'G1'}.`;

  state.activeSlotSelection = { selection, dias, bloques };
  modal.classList.remove('hidden');
};

const closeSlotModal = () => {
  const modal = $id('slot-modal');
  if (modal) modal.classList.add('hidden');
  state.activeSlotSelection = null;
};

const assignSlotFromModal = () => {
  const active = state.activeSlotSelection;
  if (!active) return;

  const { selection, dias, bloques } = active;
  const dayValue = getSelectValue('slot-dia');
  const blockValue = getSelectValue('slot-bloque');
  const clase = safeString(getSelectValue('slot-clase')).trim();
  const aula = safeString(getSelectValue('slot-aula')).trim();
  const docente = safeString(getSelectValue('slot-docente')).trim();

  const dayIndex = dias.findIndex((dia) => normalizeText(dia) === normalizeText(dayValue));
  const blockIndex = Number(safeString(blockValue).split('·')[0].trim()) - 1;

  if (dayIndex < 0 || blockIndex < 0 || blockIndex >= bloques.length) {
    setHint('asignacion-hint', 'Día o bloque inválidos para la asignación manual.', false);
    return;
  }

  if (!clase || !aula || !docente) {
    setHint('asignacion-hint', 'Debes seleccionar clase, aula y docente.', false);
    return;
  }

  const slots = getOrCreateSchedule(selection);
  const targetSlot = getSlotFromDayAndBlock({ dayIndex, blockIndex, diasCount: dias.length });

  if (slots[targetSlot]?.restriccion) {
    setHint('asignacion-hint', `No puedes asignar en este bloque: ${slots[targetSlot].restriccion}.`, false);
    return;
  }

  const conflict = getSlotConflictMessage({ slots, slotIndex: targetSlot, aula, docente });
  if (conflict) {
    setHint('asignacion-hint', conflict, false);
    return;
  }

  slots[targetSlot] = { clase, aula, docente, restriccion: '' };
  pintarClasesEnVista(slots);
  setHint('asignacion-hint', `Clase "${clase}" asignada a ${dias[dayIndex]}, bloque ${blockIndex + 1}.`);
  closeSlotModal();
};

const renderCurrentSelectionSchedule = () => {
  const selection = getCurrentVistaSelection();
  const slots = getOrCreateSchedule(selection);
  pintarClasesEnVista(slots);
};

const filtrarClasesPorSeleccion = ({ coordinacion, carrera, turno }) => safeArray(state.clases).filter((item) => {
  const matchCoord = normalizeText(item.coordinacion) === normalizeText(coordinacion);
  const matchCarrera = normalizeText(item.carrera) === normalizeText(carrera);
  const matchTurno = resolveTurnoName(item.turno || 'Diurno') === resolveTurnoName(turno);
  return matchCoord && matchCarrera && matchTurno;
});

const getPrimeraSeleccionConClases = () => {
  const first = safeArray(state.clases).find((item) => item && item.coordinacion && item.carrera);
  if (!first) return null;

  return {
    coordinacion: first.coordinacion,
    carrera: first.carrera,
    turno: resolveTurnoName(first.turno || state.seleccionActual.turno || 'Diurno'),
    grupo: state.seleccionActual.grupo || 'G1',
  };
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

const validateFutureAssignmentRules = ({
  clase,
  slot,
  diasCount,
  maxClasesPorDia,
  clasesPorDia,
  slots,
  slotsDisponiblesPorDia = [],
}) => {
  const dayIndex = getDayIndexFromSlot(slot, diasCount);
  if (dayIndex < 0) return { valid: false, reason: 'Día inválido.' };

  const currentDayCount = clasesPorDia[dayIndex] || 0;
  const maxDiarioPorCapacidad = Math.min(maxClasesPorDia, slotsDisponiblesPorDia[dayIndex] || 0);
  if (currentDayCount >= maxDiarioPorCapacidad) {
    return { valid: false, reason: 'Se alcanzó el máximo de clases por día para la carrera.' };
  }

  const minCargaActual = Math.min(...clasesPorDia);
  const projectedDayCount = currentDayCount + 1;
  const existeDiaMenosCargadoConCapacidad = clasesPorDia.some((dayCount, index) => {
    if (index === dayIndex) return false;
    const capacidadDia = Math.min(maxClasesPorDia, slotsDisponiblesPorDia[index] || 0);
    return dayCount === minCargaActual && dayCount < capacidadDia;
  });

  if (existeDiaMenosCargadoConCapacidad && projectedDayCount > (minCargaActual + 1)) {
    return { valid: false, reason: 'Regla de equilibrio diaria: existen días con menor carga y cupo disponible.' };
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

const getConflictosRecurso = (clase, slot, ocupacionPorSlot) => {
  const conflictos = [];
  if (!clase) return conflictos;

  const ocupacion = getOcupacionSlot(ocupacionPorSlot, slot);
  if (!ocupacion) return conflictos;

  const aula = normalizeResourceKey(clase.aula);
  if (aula && ocupacion.aulas.has(aula)) conflictos.push('aula');

  const docente = normalizeResourceKey(clase.docente);
  if (docente && ocupacion.docentes.has(docente)) conflictos.push('docente');

  return conflictos;
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

const getClaseDisplayName = (clase, index = 0) => {
  const nombre = safeString(clase?.clase).trim();
  return nombre || `Clase ${index + 1}`;
};

const getClaseConflictMessage = ({ clase, conflictos = [], ultimoMotivo = '' }) => {
  const nombreClase = getClaseDisplayName(clase);
  const motivos = [];
  if (conflictos.includes('aula')) motivos.push('aula ocupada en el mismo slot');
  if (conflictos.includes('docente')) motivos.push('docente ocupado en el mismo slot');
  if (ultimoMotivo) motivos.push(ultimoMotivo);
  if (!motivos.length) motivos.push('sin slots disponibles');
  return `${nombreClase}: ${motivos.join(', ')}`;
};

const getClaseCreditos = (clase, turno) => toPositiveNumber(clase?.creditos, getTurnoConfig(turno).creditos || 1);

const bloquesNecesariosPorClase = (clase, turno = 'Diurno') => {
  const creditos = getClaseCreditos(clase, turno);
  return Math.max(Math.ceil(creditos), 1);
};

const esDiurno = (turno) => resolveTurnoName(turno) === 'Diurno';

const esTurnoFinDeSemana = (turno) => {
  const turnoNormalizado = resolveTurnoName(turno);
  return turnoNormalizado === 'Sabatino' || turnoNormalizado === 'Dominical';
};

const parseHoraRange = (horaRange = '') => {
  const [inicioRaw = '', finRaw = ''] = safeString(horaRange).split('-');
  return {
    inicio: parseTimeToMinutes(inicioRaw.trim()),
    fin: parseTimeToMinutes(finRaw.trim()),
  };
};

const obtenerTramosContiguos = (slotsDisponibles = [], bloquesNecesarios = 1) => {
  const requeridos = Math.max(Number(bloquesNecesarios) || 1, 1);
  const disponibles = safeArray(slotsDisponibles)
    .filter((item) => item && Number.isInteger(item.blockIndex) && Number.isInteger(item.slotIndex))
    .sort((a, b) => a.blockIndex - b.blockIndex);

  if (disponibles.length < requeridos) return [];

  const tramos = [];
  for (let start = 0; start <= (disponibles.length - requeridos); start += 1) {
    const tramo = disponibles.slice(start, start + requeridos);
    const consecutivos = tramo.every((item, index) => index === 0 || item.blockIndex === (tramo[index - 1].blockIndex + 1));
    if (consecutivos) tramos.push(tramo);
  }

  return tramos;
};

const seleccionarSlotsParaClase = (turno, slotsDisponibles, bloquesNecesarios) => {
  const tramosContiguos = obtenerTramosContiguos(slotsDisponibles, bloquesNecesarios);
  if (!tramosContiguos.length) return [];

  if (esTurnoFinDeSemana(turno)) {
    return tramosContiguos[0];
  }

  if (esDiurno(turno)) {
    const bloquesDia = safeArray(slotsDisponibles)
      .map((item) => item.blockIndex)
      .filter((item) => Number.isInteger(item));
    const minBlock = bloquesDia.length ? Math.min(...bloquesDia) : 0;
    const maxBlock = bloquesDia.length ? Math.max(...bloquesDia) : 0;
    const centroDia = (minBlock + maxBlock) / 2;

    return tramosContiguos
      .slice()
      .sort((a, b) => {
        const centroA = (a[0].blockIndex + a[a.length - 1].blockIndex) / 2;
        const centroB = (b[0].blockIndex + b[b.length - 1].blockIndex) / 2;
        const distanciaA = Math.abs(centroA - centroDia);
        const distanciaB = Math.abs(centroB - centroDia);
        if (distanciaA !== distanciaB) return distanciaB - distanciaA;
        return a[0].blockIndex - b[0].blockIndex;
      })[0];
  }

  return tramosContiguos[0];
};

const asignarClase = (clase, slots = []) => {
  const nombreClase = safeString(clase?.clase).trim() || '-';
  const aula = safeString(clase?.aula).trim() || '-';
  const docente = safeString(clase?.docente).trim() || 'Por asignar';

  safeArray(slots).forEach((slot) => {
    if (!slot) return;
    slot.clase = nombreClase;
    slot.aula = aula;
    slot.docente = docente;
    slot.restriccion = '';
  });
};

const getClasePreferredDayIndexes = (clase, dias = [], turno = 'Diurno') => {
  const safeDias = safeArray(dias);
  const rawPrioridad = [
    ...(Array.isArray(clase?.prioridadDias) ? clase.prioridadDias : []),
    safeString(clase?.prioridadDia).trim(),
    safeString(clase?.diaPrioritario).trim(),
  ].filter(Boolean);

  const prioridadClase = rawPrioridad
    .flatMap((value) => safeString(value).split(','))
    .map((dia) => dia.trim())
    .filter(Boolean);

  const prioridadBase = prioridadClase.length
    ? prioridadClase
    : getPrioridadDias(turno, safeDias);

  return prioridadBase
    .map((dia) => safeDias.findIndex((item) => normalizeText(item) === normalizeText(dia)))
    .filter((index) => Number.isInteger(index) && index >= 0);
};

const orderClasesParaAsignacion = ({ clases, turno, dias }) => {
  const safeDias = safeArray(dias);
  const fallbackPrioridad = getDayPriorityIndexes(turno, safeDias);

  return safeArray(clases)
    .map((clase, index) => {
      const preferencias = getClasePreferredDayIndexes(clase, safeDias, turno);
      const primerDiaPreferido = preferencias.length ? preferencias[0] : (fallbackPrioridad[0] || 0);
      return {
        clase,
        originalIndex: index,
        creditos: getClaseCreditos(clase, turno),
        primerDiaPreferido,
      };
    })
    .sort((a, b) => {
      if (b.creditos !== a.creditos) return b.creditos - a.creditos;
      if (a.primerDiaPreferido !== b.primerDiaPreferido) return a.primerDiaPreferido - b.primerDiaPreferido;
      return a.originalIndex - b.originalIndex;
    })
    .map((entry) => entry.clase);
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
  const dayPriorityIndexes = getDayPriorityIndexes(turno, dias);
  const clasesEnOrden = orderClasesParaAsignacion({ clases, turno, dias });
  const clasesEnConflicto = [];
  const clasesNoAsignadas = [];
  let bloquesRestringidos = 0;
  const slots = Array.from({ length: totalSlots }, () => ({ clase: '-', aula: '-', docente: '', restriccion: '' }));
  const slotsDisponiblesPorDia = Array.from({ length: diasCount }, () => 0);

  for (let blockIndex = 0; blockIndex < bloques.length; blockIndex += 1) {
    for (let dayIndex = 0; dayIndex < diasCount; dayIndex += 1) {
      const slotIndex = getSlotFromDayAndBlock({ dayIndex, blockIndex, diasCount });
      const bloque = bloques[blockIndex];
      const { inicio, fin } = parseHoraRange(bloque.hora);
      const fueraDeRangoDiurno = esDiurno(turno) && (inicio < (8 * 60) || fin > (16 * 60));
      const restriccionDiurno = fueraDeRangoDiurno ? 'FUERA DE RANGO DIURNO' : '';
      const restriccionActiva = bloque.restriccion || restriccionDiurno;

      if (restriccionActiva) {
        slots[slotIndex] = { clase: restriccionActiva, aula: '-', docente: '', restriccion: restriccionActiva };
        bloquesRestringidos += 1;
        continue;
      }
      slotsDisponiblesPorDia[dayIndex] = (slotsDisponiblesPorDia[dayIndex] || 0) + 1;
    }
  }

  clasesEnOrden.forEach((candidate, classIndex) => {
    const bloquesNecesarios = bloquesNecesariosPorClase(candidate, turno);
    const preferredDays = getClasePreferredDayIndexes(candidate, dias, turno);
    const dayOrder = preferredDays.length ? preferredDays : dayPriorityIndexes;
    const conflictosDetectados = new Set();
    let ultimoMotivoRegla = '';
    let slotsAsignables = [];
    let diaAsignado = -1;

    for (let orderIndex = 0; orderIndex < dayOrder.length; orderIndex += 1) {
      const dayIndex = dayOrder[orderIndex];
      if (!Number.isInteger(dayIndex) || dayIndex < 0 || dayIndex >= diasCount) continue;

      const capacidadDia = Math.min(maxClasesPorDia, slotsDisponiblesPorDia[dayIndex] || 0);
      if ((clasesPorDia[dayIndex] || 0) >= capacidadDia) {
        ultimoMotivoRegla = 'Se alcanzó el máximo de clases por día para la carrera.';
        continue;
      }

      const slotsDia = [];
      for (let blockIndex = 0; blockIndex < bloques.length; blockIndex += 1) {
        const slotIndex = getSlotFromDayAndBlock({ dayIndex, blockIndex, diasCount });
        if (slots[slotIndex]?.restriccion) continue;
        if (slots[slotIndex]?.clase !== '-') continue;

        const conflictosRecurso = getConflictosRecurso(candidate, slotIndex, ocupacionPorSlot);
        if (conflictosRecurso.length) {
          conflictosRecurso.forEach((conflicto) => conflictosDetectados.add(conflicto));
          continue;
        }

        slotsDia.push({ slotIndex, blockIndex });
      }

      const huecoContiguo = seleccionarSlotsParaClase(turno, slotsDia, bloquesNecesarios);
      if (!huecoContiguo.length) {
        ultimoMotivoRegla = `No hay ${bloquesNecesarios} bloques contiguos disponibles en el mismo día.`;
        continue;
      }

      const primerSlot = huecoContiguo[0].slotIndex;
      const rules = validateFutureAssignmentRules({
        clase: candidate,
        slot: primerSlot,
        diasCount,
        maxClasesPorDia,
        clasesPorDia,
        slots,
        slotsDisponiblesPorDia,
      });

      if (!rules.valid) {
        ultimoMotivoRegla = rules.reason;
        continue;
      }

      slotsAsignables = huecoContiguo.map((item) => item.slotIndex);
      diaAsignado = dayIndex;
      break;
    }

    if (!slotsAsignables.length) {
      const claseNoAsignada = {
        clase: getClaseDisplayName(candidate, classIndex),
        aula: safeString(candidate?.aula).trim() || defaultAula,
        docente: safeString(candidate?.docente).trim() || 'Por asignar',
        motivo: getClaseConflictMessage({
          clase: candidate,
          conflictos: Array.from(conflictosDetectados),
          ultimoMotivo: ultimoMotivoRegla,
        }),
      };
      clasesEnConflicto.push(claseNoAsignada);
      clasesNoAsignadas.push(claseNoAsignada);
      return;
    }

    const slotsObjetivo = slotsAsignables.map((slotIndex) => slots[slotIndex]);
    candidate.aula = candidate.aula || defaultAula;
    asignarClase(candidate, slotsObjetivo);
    slotsAsignables.forEach((slotIndex) => marcarOcupacion(candidate, slotIndex, ocupacionPorSlot));

    if (diaAsignado >= 0) clasesPorDia[diaAsignado] = (clasesPorDia[diaAsignado] || 0) + 1;
  });

  if (clasesNoAsignadas.length) {
    console.warn('Clases no asignadas para el turno', turno, clasesNoAsignadas);
  }

  const clasesAsignadas = clasesEnOrden.length - clasesEnConflicto.length;
  return { slots, clasesAsignadas, bloquesRestringidos, clasesEnConflicto, clasesNoAsignadas };
};

const renderPlanGenerado = (plan, selection) => {
  const slots = safeArray(plan?.slots);
  if (selection) {
    const key = getSelectionKey(selection);
    state.schedules[key] = slots.map((slot) => ({ ...slot, docente: slot.docente || '' }));
  }
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
  renderCurrentSelectionSchedule();
};

const parseCsvRows = (text) => {
  const lines = safeString(text).trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { ok: false, message: 'El CSV no contiene datos válidos.' };

  const headers = lines[0].split(',').map((item) => item.trim().toLowerCase());
  const required = ['clase', 'creditos', 'compartida', 'anio', 'categoria', 'tipo', 'aula', 'docente'];
  const allowed = [...required, 'prioridad_dia', 'prioridad_dias'];
  const missing = required.filter((field) => !headers.includes(field));
  if (missing.length) return { ok: false, message: `Faltan columnas: ${missing.join(', ')}` };

  const invalidColumns = headers.filter((field) => !allowed.includes(field));
  if (invalidColumns.length) {
    return { ok: false, message: `Columnas incorrectas detectadas: ${invalidColumns.join(', ')}` };
  }

  return { ok: true, headers, rows: lines.slice(1) };
};

const getClassIdentityKey = (item = {}) => [
  normalizeText(item.coordinacion),
  normalizeText(item.carrera),
  normalizeText(resolveTurnoName(item.turno || 'Diurno')),
  normalizeText(item.clase),
].join('::');

const isAssignedValue = (value) => {
  const normalized = normalizeText(value);
  return normalized && normalized !== 'por asignar' && normalized !== '-';
};

const createClassFromCsvRow = (row, headers, context) => {
  const cols = safeString(row).split(',').map((item) => item.trim());
  const claseIdx = headers.indexOf('clase');
  const tipoIdx = headers.indexOf('tipo');
  const aulaIdx = headers.indexOf('aula');
  const docenteIdx = headers.indexOf('docente');
  const creditosIdx = headers.indexOf('creditos');
  const prioridadDiaIdx = headers.indexOf('prioridad_dia');
  const prioridadDiasIdx = headers.indexOf('prioridad_dias');

  const aula = safeString(cols[aulaIdx]).trim();
  const docente = safeString(cols[docenteIdx]).trim();

  if (!aula || !docente) {
    return {
      ok: false,
      reason: 'Aula y docente son obligatorios.',
    };
  }

  const prioridadRaw = cols[prioridadDiasIdx] || cols[prioridadDiaIdx] || '';
  const prioridadDias = safeString(prioridadRaw)
    .split('|')
    .flatMap((value) => value.split('/'))
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  const tipoClase = safeString(cols[tipoIdx]).trim() || 'aula';
  const creditosRaw = Number(cols[creditosIdx]);

  if (!Number.isFinite(creditosRaw) || creditosRaw < 1) {
    return {
      ok: false,
      reason: 'Créditos inválidos. Deben ser numéricos y mayores o iguales a 1.',
    };
  }

  return {
    ok: true,
    item: {
      coordinacion: context.coordinacion,
      carrera: context.carrera,
      turno: context.turno,
      clase: cols[claseIdx] || 'Clase sin nombre',
      creditos: Math.max(Math.ceil(creditosRaw), 1),
      tipoClase,
      prioridadDias,
      caracteristicas: ['csv', tipoClase],
      docente,
      area: 'Por asignar',
      aula,
    },
  };
};

const askImportMode = (existingCount, incomingCount) => {
  const answer = window.prompt(
    `Se importarán ${incomingCount} clases y ya existen ${existingCount} para esta selección. Escribe "sobreescribir" para reemplazar, "fusionar" para combinar o "cancelar".`,
    'fusionar',
  );

  const mode = normalizeText(answer);
  if (!mode || mode === 'cancelar') return null;
  if (mode === 'sobreescribir') return 'overwrite';
  if (mode === 'fusionar') return 'merge';

  window.alert('Opción no válida. Importación cancelada.');
  return null;
};

const applyImportedClasses = (importedClasses, context, mode) => {
  if (mode === 'overwrite') {
    state.clases = safeArray(state.clases).filter((item) => !(
      normalizeText(item.coordinacion) === normalizeText(context.coordinacion)
      && normalizeText(item.carrera) === normalizeText(context.carrera)
      && normalizeText(resolveTurnoName(item.turno || 'Diurno')) === normalizeText(context.turno)
    ));
    state.clases.push(...importedClasses);
    return { importedCount: importedClasses.length, updatedCount: 0 };
  }

  let importedCount = 0;
  let updatedCount = 0;

  importedClasses.forEach((incoming) => {
    const existing = safeArray(state.clases).find((item) => getClassIdentityKey(item) === getClassIdentityKey(incoming));
    if (!existing) {
      state.clases.push(incoming);
      importedCount += 1;
      return;
    }

    if (isAssignedValue(existing.aula) && normalizeText(existing.aula) !== normalizeText(incoming.aula)) {
      const ok = window.confirm(`La clase "${existing.clase}" ya tiene aula asignada (${existing.aula}). ¿Deseas cambiarla por "${incoming.aula}"?`);
      if (!ok) incoming.aula = existing.aula;
    }

    if (isAssignedValue(existing.docente) && normalizeText(existing.docente) !== normalizeText(incoming.docente)) {
      const ok = window.confirm(`La clase "${existing.clase}" ya tiene docente asignado (${existing.docente}). ¿Deseas cambiarlo por "${incoming.docente}"?`);
      if (!ok) incoming.docente = existing.docente;
    }

    Object.assign(existing, incoming, {
      aula: incoming.aula,
      docente: incoming.docente,
    });
    updatedCount += 1;
  });

  return { importedCount, updatedCount };
};

const upsertManualClass = (incoming) => {
  const existing = safeArray(state.clases).find((item) => getClassIdentityKey(item) === getClassIdentityKey(incoming));
  if (!existing) {
    state.clases.push(incoming);
    return { created: true, updated: false };
  }

  const replaceExisting = window.confirm(`La clase "${existing.clase}" ya existe para esta coordinación/carrera/turno. ¿Deseas reemplazar sus datos?`);
  if (!replaceExisting) return { created: false, updated: false, cancelled: true };

  let nextAula = incoming.aula;
  let nextDocente = incoming.docente;

  if (isAssignedValue(existing.aula) && normalizeText(existing.aula) !== normalizeText(incoming.aula)) {
    const confirmAula = window.confirm(`La clase "${existing.clase}" ya tiene aula asignada (${existing.aula}). ¿Deseas cambiarla por "${incoming.aula}"?`);
    if (!confirmAula) nextAula = existing.aula;
  }

  if (isAssignedValue(existing.docente) && normalizeText(existing.docente) !== normalizeText(incoming.docente)) {
    const confirmDocente = window.confirm(`La clase "${existing.clase}" ya tiene docente asignado (${existing.docente}). ¿Deseas cambiarlo por "${incoming.docente}"?`);
    if (!confirmDocente) nextDocente = existing.docente;
  }

  Object.assign(existing, incoming, {
    aula: nextAula,
    docente: nextDocente,
  });
  return { created: false, updated: true };
};

const processCsvImport = (file, context) => {
  const reader = new FileReader();
  reader.onload = () => {
    const parsed = parseCsvRows(reader.result);
    if (!parsed.ok) {
      setHint('carga-hint', parsed.message, false);
      return;
    }

    const parsedRows = parsed.rows
      .map((line, index) => ({ ...createClassFromCsvRow(line, parsed.headers, context), rowNumber: index + 2 }));

    const invalidRows = parsedRows.filter((item) => !item.ok);
    const importedValid = parsedRows
      .filter((item) => item.ok)
      .map((item) => item.item);

    if (!importedValid.length) {
      setHint('carga-hint', 'No se importó ninguna clase. Verifica que cada fila tenga aula y docente.', false);
      return;
    }

    if (invalidRows.length) {
      const rowsText = invalidRows.map((item) => item.rowNumber).join(', ');
      const shouldContinue = window.confirm(`Se detectaron filas inválidas (${rowsText}) por aula/docente vacío. ¿Deseas continuar importando las filas válidas?`);
      if (!shouldContinue) {
        setHint('carga-hint', 'Importación cancelada por filas inválidas.', false);
        return;
      }
    }

    const existingForContext = safeArray(state.clases).filter((item) => (
      normalizeText(item.coordinacion) === normalizeText(context.coordinacion)
      && normalizeText(item.carrera) === normalizeText(context.carrera)
      && normalizeText(resolveTurnoName(item.turno || 'Diurno')) === normalizeText(context.turno)
    ));

    let mode = 'merge';
    if (existingForContext.length) {
      mode = askImportMode(existingForContext.length, importedValid.length);
      if (!mode) {
        setHint('carga-hint', 'Importación cancelada por el usuario.', false);
        return;
      }
    }

    const result = applyImportedClasses(importedValid, context, mode);
    updateSeleccionActual();
    renderCatalogoTabla();
    setHint('carga-hint', `CSV importado. Nuevas: ${result.importedCount}. Actualizadas: ${result.updatedCount}.`);
  };

  reader.readAsText(file);
};

const getGenerationSelection = () => {
  const generacionPanel = $id('generacion');
  const coordinacion = generacionPanel?.querySelector('.js-coordinacion')?.value
    || getSelectValue('carga-coordinacion', state.seleccionActual.coordinacion);
  const carrera = getSelectValue('generacion-carrera', state.seleccionActual.carrera);
  const turno = resolveTurnoName(getSelectValue('generacion-turno', state.seleccionActual.turno || 'Diurno'));
  return { coordinacion, carrera, turno, grupo: state.seleccionActual.grupo || 'G1' };
};

const getMaxEstudiantesPorGrupo = () => Math.max(toPositiveNumber(state.maxEstudiantesPorGrupo, DEFAULT_MAX_ESTUDIANTES_POR_GRUPO), 1);

const getCantidadGruposPorMatricula = (carrera) => {
  const matriculaCarrera = Math.max(Number(state.matricula[carrera]) || 0, 0);
  const maxPorGrupo = getMaxEstudiantesPorGrupo();
  if (matriculaCarrera <= 0) return 1;
  return Math.max(Math.ceil(matriculaCarrera / maxPorGrupo), 1);
};

const crearNombreGrupo = (index) => `G${index + 1}`;

const generarHorarioAutomatico = () => {
  const consola = $id('generacion-console');
  let seleccion = getGenerationSelection();
  let clasesSeleccion = filtrarClasesPorSeleccion(seleccion);

  if (!clasesSeleccion.length) {
    const fallback = getPrimeraSeleccionConClases();
    if (fallback) {
      seleccion = { ...seleccion, ...fallback };
      clasesSeleccion = filtrarClasesPorSeleccion(seleccion);
      state.seleccionActual = { ...state.seleccionActual, ...seleccion };
      syncAppFromSeleccionActual();
      if (consola) {
        consola.textContent = `No había clases para la selección elegida. Se generó con datos del CSV para ${seleccion.coordinacion} / ${seleccion.carrera} / ${seleccion.turno}.`;
      }
    }
  }

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

  const cantidadGrupos = getCantidadGruposPorMatricula(seleccion.carrera);
  const gruposGenerados = Array.from({ length: cantidadGrupos }, (_, index) => {
    const grupo = crearNombreGrupo(index);
    const plan = generarPlanHorario({ turno: seleccion.turno, clases: clasesSeleccion });
    renderPlanGenerado(plan, { ...seleccion, grupo });
    return { grupo, plan };
  });

  const grupoPrincipal = gruposGenerados[0]?.grupo || 'G1';
  state.seleccionActual = { ...state.seleccionActual, ...seleccion, grupo: grupoPrincipal };
  const keyGrupoPrincipal = getSelectionKey({ ...seleccion, grupo: grupoPrincipal });
  pintarClasesEnVista(state.schedules[keyGrupoPrincipal] || []);

  const resumenPorGrupo = gruposGenerados
    .map(({ grupo, plan }) => `${grupo}: ${plan.clasesAsignadas} clases, ${plan.bloquesRestringidos} bloques restringidos, ${safeArray(plan.clasesNoAsignadas).length} no asignadas`)
    .join(' | ');

  const resumenConflictos = gruposGenerados
    .flatMap(({ grupo, plan }) => safeArray(plan.clasesEnConflicto).map((item) => `[${grupo}] ${item.motivo}`));

  if (consola) {
    const matriculaCarrera = Math.max(Number(state.matricula[seleccion.carrera]) || 0, 0);
    const encabezado = `Horario generado para ${seleccion.coordinacion} / ${seleccion.carrera} / ${seleccion.turno}. Matrícula: ${matriculaCarrera}. Máx por grupo: ${getMaxEstudiantesPorGrupo()}. Grupos creados: ${cantidadGrupos}. ${resumenPorGrupo}`;
    if (resumenConflictos.length) {
      consola.textContent = `${encabezado}
Lista de conflicto:
- ${resumenConflictos.join('\n- ')}`;
    } else {
      consola.textContent = `${encabezado}
Lista de conflicto: sin pendientes.`;
    }
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

  const diasCalculados = getDiasPorTurno(turno);
  const prioridadActual = safeArray(state.turnoConfig[turno]?.prioridadDias).length
    ? [...state.turnoConfig[turno].prioridadDias]
    : normalizeDiasInput(diasCalculados);

  const persistable = sanitizeTurnoConfigForStorage(turno, {
    dias: diasCalculados,
    duracion: toPositiveNumber(duracionInput?.value, 45),
    maxTurnos: toPositiveNumber(maxTurnosInput?.value, 4),
    prioridadDias: prioridadActual,
  });

  state.turnoConfig[turno] = {
    ...getDefaultTurnoConfig(turno),
    horaInicio: horaInicioInput?.value || getDefaultTurnoConfig(turno).horaInicio,
    duracion: persistable.duracion,
    creditos: toPositiveNumber(creditosInput?.value, 1),
    maxTurnos: persistable.maxTurnos,
    dias: persistable.dias,
    prioridadDias: persistable.prioridadDias,
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
  saveTurnoConfigToLocalStorage();
  renderCatalogoTabla();
  applyDiasByTurnoToView(state.seleccionActual.turno);
  setHint('turno-hint', `Configuración de ${turno} guardada. Se respetan receso/almuerzo y bloques desde ${state.turnoConfig[turno].horaInicio}.`);
};

const resetTurnoConfig = () => {
  const turno = resolveTurnoName(getSelectValue('turno-config-select', 'Diurno'));
  if (!turno) return;

  state.turnoConfig[turno] = getDefaultTurnoConfig(turno);
  saveTurnoConfigToLocalStorage();
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

    const docente = window.prompt('Docente de la clase:');
    if (!docente || !docente.trim()) {
      setHint('asignacion-hint', 'Debes indicar el docente de la clase.', false);
      return;
    }

    const creditosInput = window.prompt('Créditos de la clase:', '1');
    const tipoClase = safeString(window.prompt('Tipo de clase (ejemplo: aula, laboratorio, taller):', 'aula')).trim() || 'aula';

    const item = {
      coordinacion: getSelectValue('asignacion-coordinacion', 'Arquitectura'),
      carrera: getSelectValue('carga-carrera', getAllCarreras()[0] || 'Arquitectura'),
      turno: resolveTurnoName(getSelectValue('asignacion-turno', 'Diurno')),
      clase: clase.trim(),
      creditos: toPositiveNumber(creditosInput, 1),
      tipoClase,
      caracteristicas: ['manual', tipoClase],
      docente: docente.trim(),
      area: 'Por asignar',
      aula: aula.trim(),
    };

    const result = upsertManualClass(item);
    if (result.cancelled) {
      setHint('asignacion-hint', 'No se realizaron cambios en la clase existente.', false);
      return;
    }

    updateSeleccionActual();
    renderCatalogoTabla();
    if (result.updated) {
      setHint('asignacion-hint', `Clase "${item.clase}" actualizada correctamente.`);
      return;
    }
    setHint('asignacion-hint', `Clase "${item.clase}" agregada correctamente.`);
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


  $id('vista-table')?.addEventListener('click', (event) => {
    const cell = event.target?.closest?.('.vista-clase, .vista-aula');
    if (!cell) return;

    const slot = Number(cell.dataset?.slot);
    if (!Number.isInteger(slot) || slot < 0) return;
    openSlotModal({ slotIndex: slot });
  });

  $id('btn-slot-cancelar')?.addEventListener('click', closeSlotModal);
  $id('btn-slot-guardar')?.addEventListener('click', assignSlotFromModal);

  $id('btn-reiniciar-demo')?.addEventListener('click', () => {
    const prefijo = `${safeString(state.seleccionActual.coordinacion)}::${safeString(state.seleccionActual.carrera)}::${resolveTurnoName(state.seleccionActual.turno)}::`;
    Object.keys(state.schedules).forEach((key) => {
      if (key.startsWith(prefijo)) delete state.schedules[key];
    });
    state.seleccionActual.grupo = 'G1';
    renderCurrentSelectionSchedule();
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

    const estudiantes = Math.max(Number(getSelectValue('matricula-estudiantes', 0)) || 0, 0);
    state.matricula[carrera] = estudiantes;

    const maxActual = getMaxEstudiantesPorGrupo();
    const entradaMax = window.prompt('Máximo de estudiantes por grupo (deja vacío para conservar el valor actual):', String(maxActual));
    if (entradaMax != null && safeString(entradaMax).trim()) {
      state.maxEstudiantesPorGrupo = Math.max(toPositiveNumber(entradaMax, maxActual), 1);
    }

    const grupos = getCantidadGruposPorMatricula(carrera);
    setHint('matricula-hint', `Matrícula guardada para ${carrera}: ${state.matricula[carrera]} estudiantes. Máx por grupo: ${getMaxEstudiantesPorGrupo()}. Grupos estimados: ${grupos}.`);
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
  loadTurnoConfigFromLocalStorage();
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
