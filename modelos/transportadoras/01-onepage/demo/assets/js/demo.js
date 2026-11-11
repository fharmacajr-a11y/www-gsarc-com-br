(function () {
  var menuButton = document.querySelector("[data-menu-button]");
  var mobileMenu = document.querySelector("[data-mobile-menu]");
  var yearTarget = document.querySelector("[data-current-year]");
  var quoteForm = document.querySelector("[data-quote-form]");

  function setMenuState(isOpen) {
    if (!menuButton || !mobileMenu) {
      return;
    }

    menuButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
    menuButton.textContent = isOpen ? "Fechar menu" : "Abrir menu";
    mobileMenu.hidden = !isOpen;
  }

  if (menuButton && mobileMenu) {
    setMenuState(false);

    menuButton.addEventListener("click", function () {
      setMenuState(mobileMenu.hidden);
    });

    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMenuState(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        setMenuState(false);
      }
    });
  }

  if (quoteForm) {
    var errorBox = quoteForm.querySelector("[data-quote-error]");

    quoteForm.addEventListener("submit", function (event) {
      event.preventDefault();

      var data = new FormData(quoteForm);
      var value = function (name) {
        return String(data.get(name) || "").trim();
      };

      var required = [
        ["origem", "cidade de origem"],
        ["destino", "cidade de destino"],
        ["carga", "tipo de carga"],
      ];
      var missing = required.filter(function (item) {
        return !value(item[0]);
      });

      if (missing.length) {
        errorBox.textContent =
          "Preencha: " +
          missing
            .map(function (item) {
              return item[1];
            })
            .join(", ") +
          ".";
        errorBox.hidden = false;
        quoteForm.querySelector('[name="' + missing[0][0] + '"]').focus();
        return;
      }

      errorBox.hidden = true;

      var lines = [
        "Olá! Gostaria de uma cotação de frete.",
        "",
        "Origem: " + value("origem"),
        "Destino: " + value("destino"),
        "Tipo de carga: " + value("carga"),
      ];
      if (value("peso")) lines.push("Peso aproximado: " + value("peso"));
      if (value("volumes")) lines.push("Volumes: " + value("volumes"));
      if (value("observacoes")) lines.push("", value("observacoes"));

      var phone = quoteForm.getAttribute("data-whatsapp");
      window.location.href = "https://wa.me/" + phone + "?text=" + encodeURIComponent(lines.join("\n"));
    });
  }

  if (yearTarget) {
    yearTarget.textContent = new Date().getFullYear();
  }
})();
