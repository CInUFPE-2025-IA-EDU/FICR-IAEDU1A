// Identifica a página atual
const paginaAtual = window.location.pathname.split("/").pop() || "home.html";

// Localiza os links do menu
const linksMenu = document.querySelectorAll("nav a, .menu a");

linksMenu.forEach((link) => {
    const destino = link.getAttribute("href");

    if (destino === paginaAtual) {
        link.classList.add("ativo");
    } else {
        link.classList.remove("ativo");
        link.classList.remove("active");
    }
});