(function () {
  "use strict";

  /* ---------------------------------------------------------- menu */
  var menuBtn = document.querySelector("[data-menu-btn]");
  var menu = document.querySelector("[data-menu]");

  function setMenu(open) {
    if (!menuBtn || !menu) return;
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    menuBtn.querySelector(".menu-btn__label").textContent = open ? "Fechar" : "Menu";
    menu.hidden = !open;
  }

  if (menuBtn && menu) {
    menuBtn.addEventListener("click", function () {
      setMenu(menu.hidden);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !menu.hidden) {
        setMenu(false);
        menuBtn.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1100) setMenu(false);
    });
  }

  /* ---------------------------------------------------------- header shadow */
  var header = document.querySelector("[data-header]");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------------------------------------------------------- cotação */
  var form = document.querySelector("[data-quote-form]");

  if (form) {
    var field = function (name) {
      return form.querySelector('[name="' + name + '"]');
    };

    // ?servico=Carga+dedicada vindo da página de serviços
    try {
      var wanted = new URLSearchParams(window.location.search).get("servico");
      var select = field("servico");
      if (wanted && select) {
        Array.prototype.forEach.call(select.options, function (opt) {
          if (opt.value === wanted || opt.text === wanted) select.value = opt.value || opt.text;
        });
      }
    } catch (error) {
      /* navegador sem URLSearchParams: segue sem pré-seleção */
    }

    var errorBox = form.querySelector("[data-quote-error]");
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = new FormData(form);
      var value = function (name) {
        return String(data.get(name) || "").trim();
      };
      var required = [
        ["nome", "nome"],
        ["telefone", "telefone ou WhatsApp"],
        ["origem", "cidade de coleta"],
        ["destino", "cidade de entrega"],
        ["servico", "serviço"]
      ];
      form.querySelectorAll("[aria-invalid]").forEach(function (el) {
        el.removeAttribute("aria-invalid");
      });
      var missing = required.filter(function (item) {
        return !value(item[0]);
      });
      if (missing.length) {
        missing.forEach(function (item) {
          field(item[0]).setAttribute("aria-invalid", "true");
        });
        errorBox.textContent =
          "Preencha: " +
          missing
            .map(function (item) {
              return item[1];
            })
            .join(", ") +
          ".";
        errorBox.hidden = false;
        field(missing[0][0]).focus();
        return;
      }
      errorBox.hidden = true;

      var lines = ["Olá! Gostaria de uma cotação de frete.", ""];
      var add = function (label, name) {
        if (value(name)) lines.push(label + ": " + value(name));
      };
      add("Nome", "nome");
      add("Empresa", "empresa");
      add("Telefone", "telefone");
      add("E-mail", "email");
      lines.push("");
      add("Coleta", "origem");
      add("Entrega", "destino");
      add("Serviço", "servico");
      add("Mercadoria", "mercadoria");
      add("Peso", "peso");
      add("Volumes", "volumes");
      add("Medidas", "medidas");
      add("Valor da nota fiscal", "valor");
      if (value("observacoes")) lines.push("", value("observacoes"));

      window.location.href =
        "https://wa.me/" + form.getAttribute("data-whatsapp") + "?text=" + encodeURIComponent(lines.join("\n"));
    });
  }

  /* ---------------------------------------------------------- year */
  var year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
})();
