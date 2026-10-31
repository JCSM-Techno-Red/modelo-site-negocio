// Comportamento mínimo do site: menu móvel e aviso do botão de demonstração.
// Todo o conteúdo já vem pronto no HTML gerado por build.js.
(function () {
  "use strict";

  var toggle = document.querySelector(".menu-toggle");
  var menu = document.getElementById("menu");

  if (toggle && menu) {
    var definirMenu = function (aberto) {
      toggle.setAttribute("aria-expanded", String(aberto));
      toggle.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
      menu.classList.toggle("is-open", aberto);
    };

    toggle.addEventListener("click", function () {
      definirMenu(toggle.getAttribute("aria-expanded") !== "true");
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        definirMenu(false);
      });
    });

    document.addEventListener("keydown", function (evento) {
      if (evento.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        definirMenu(false);
        toggle.focus();
      }
    });
  }

  var botao = document.getElementById("btn-whatsapp");
  var aviso = document.getElementById("aviso-demo");

  if (botao && aviso) {
    botao.addEventListener("click", function () {
      aviso.hidden = false;
    });
  }
})();
