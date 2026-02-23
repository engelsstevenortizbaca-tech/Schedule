const btnMenu = document.getElementById("btnMenu");
const sidebar = document.getElementById("sidebar");
const contenido = document.getElementById("contenido");
const links = document.querySelectorAll(".sidebar a");

btnMenu.addEventListener("click", () => {
  sidebar.classList.toggle("active");
});

links.forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();

    const seccion = link.getAttribute("data-seccion");

    if (seccion === "inicio") {
      contenido.innerHTML = `
        <h1>Inicio</h1>
        <p>Esta es la página principal de tu sistema.</p>
      `;
    }

    if (seccion === "config") {
      contenido.innerHTML = `
        <h1>Configuraciones</h1>
        <p>Aquí puedes modificar la configuración del sistema.</p>
      `;
    }

    // Cerrar menú en móvil
    sidebar.classList.remove("active");
  });
});