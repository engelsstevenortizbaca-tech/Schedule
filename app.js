const tabs = document.querySelectorAll('.tab');
const principalView = document.getElementById('principal-view');
const configView = document.getElementById('config-view');

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

const getAllCarreras = () => Object.values(coordinaciones).flat();

const fillSelect = (select, options, selectedValue) => {
  select.innerHTML = '';
  options.forEach((optionValue) => {
    const option = document.createElement('option');
    option.value = optionValue;
    option.textContent = optionValue;
    if (optionValue === selectedValue) {
      option.selected = true;
    }
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

const setHint = (message, ok = true) => {
  const hint = document.getElementById('catalogo-hint');
  if (!hint) return;
  hint.textContent = message;
  hint.style.color = ok ? '#3257ff' : '#b00020';
};

const btnAgregarCoordinacion = document.getElementById('btn-agregar-coordinacion');
const btnAgregarCarrera = document.getElementById('btn-agregar-carrera');
const nuevaCoordinacionInput = document.getElementById('nueva-coordinacion');
const nuevaCarreraInput = document.getElementById('nueva-carrera');
const coordinacionConfigSelect = document.getElementById('coordinacion-config');

btnAgregarCoordinacion?.addEventListener('click', () => {
  const nombre = nuevaCoordinacionInput.value.trim();

  if (!nombre) {
    setHint('Escribe el nombre de la coordinación.', false);
    return;
  }

  if (coordinaciones[nombre]) {
    setHint('Esa coordinación ya existe.', false);
    return;
  }

  coordinaciones[nombre] = [];
  syncCoordinacionSelects(nombre);
  syncCarreraSelects();
  nuevaCoordinacionInput.value = '';
  setHint(`Coordinación "${nombre}" agregada correctamente.`);
});

btnAgregarCarrera?.addEventListener('click', () => {
  const coordinacion = coordinacionConfigSelect.value;
  const carrera = nuevaCarreraInput.value.trim();

  if (!carrera) {
    setHint('Escribe el nombre de la carrera.', false);
    return;
  }

  if (!coordinaciones[coordinacion]) {
    setHint('Primero selecciona una coordinación válida.', false);
    return;
  }

  if (coordinaciones[coordinacion].includes(carrera)) {
    setHint('Esa carrera ya está registrada en la coordinación.', false);
    return;
  }

  coordinaciones[coordinacion].push(carrera);
  syncCarreraSelects();
  nuevaCarreraInput.value = '';
  setHint(`Carrera "${carrera}" agregada a ${coordinacion}.`);
});

syncCoordinacionSelects();
syncCarreraSelects();
