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
