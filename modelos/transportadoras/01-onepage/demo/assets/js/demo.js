(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    menu.addEventListener("click", function (event) {
      if (event.target.closest("a")) setMenu(false);
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

  /* ---------------------------------------------------------- active nav */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav a[href^='#']"));
  if ("IntersectionObserver" in window && navLinks.length) {
    var byId = {};
    navLinks.forEach(function (link) {
      byId[link.getAttribute("href").slice(1)] = link;
    });
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          navLinks.forEach(function (l) {
            l.classList.remove("is-active");
          });
          var link = byId[entry.target.id];
          if (link) link.classList.add("is-active");
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    Object.keys(byId).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    // seções fora do menu (início, cotação) limpam o destaque
    ["inicio", "cotacao"].forEach(function (id) {
      var section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  /* ---------------------------------------------------------- forms */
  var quoteForm = document.querySelector("[data-quote-form]");

  function field(form, name) {
    return form ? form.querySelector('[name="' + name + '"]') : null;
  }

  function goToQuote(focusName) {
    if (!quoteForm) return;
    var section = document.getElementById("cotacao");
    section.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    quoteForm.classList.remove("is-highlight");
    void quoteForm.offsetWidth;
    quoteForm.classList.add("is-highlight");
    var target = field(quoteForm, focusName || "nome");
    if (target) {
      window.setTimeout(function () {
        target.focus({ preventScroll: true });
      }, reduceMotion ? 0 : 450);
    }
  }

  var quick = document.querySelector("[data-quick-quote]");
  if (quick && quoteForm) {
    quick.addEventListener("submit", function (event) {
      event.preventDefault();
      ["origem", "destino", "carga"].forEach(function (name) {
        var from = field(quick, name);
        var to = field(quoteForm, name);
        if (from && to && from.value) to.value = from.value;
      });
      goToQuote("nome");
    });
  }

  document.querySelectorAll("[data-service]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      var select = field(quoteForm, "carga");
      if (!select) return;
      event.preventDefault();
      select.value = link.getAttribute("data-service");
      goToQuote("nome");
    });
  });

  if (quoteForm) {
    var errorBox = quoteForm.querySelector("[data-quote-error]");
    quoteForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = new FormData(quoteForm);
      var value = function (name) {
        return String(data.get(name) || "").trim();
      };
      var required = [
        ["nome", "nome"],
        ["origem", "cidade de origem"],
        ["destino", "cidade de destino"],
        ["carga", "tipo de carga"]
      ];
      var missing = required.filter(function (item) {
        return !value(item[0]);
      });
      quoteForm.querySelectorAll("[aria-invalid]").forEach(function (el) {
        el.removeAttribute("aria-invalid");
      });
      if (missing.length) {
        missing.forEach(function (item) {
          field(quoteForm, item[0]).setAttribute("aria-invalid", "true");
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
        field(quoteForm, missing[0][0]).focus();
        return;
      }
      errorBox.hidden = true;

      var lines = ["Olá! Gostaria de uma cotação de frete.", ""];
      lines.push("Nome: " + value("nome"));
      if (value("empresa")) lines.push("Empresa: " + value("empresa"));
      lines.push("Origem: " + value("origem"));
      lines.push("Destino: " + value("destino"));
      lines.push("Tipo de carga: " + value("carga"));
      if (value("peso")) lines.push("Peso aproximado: " + value("peso"));
      if (value("volumes")) lines.push("Volumes: " + value("volumes"));
      if (value("valor")) lines.push("Valor da nota fiscal: " + value("valor"));
      if (value("observacoes")) lines.push("", value("observacoes"));

      var phone = quoteForm.getAttribute("data-whatsapp");
      window.location.href = "https://wa.me/" + phone + "?text=" + encodeURIComponent(lines.join("\n"));
    });
  }

  /* ---------------------------------------------------------- acompanhar carga */
  var trackForm = document.querySelector("[data-track-form]");
  var trackError = document.querySelector("[data-track-error]");

  if (trackForm) {
    trackForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var input = trackForm.querySelector("input");
      var code = input.value.trim();
      if (!code) {
        trackError.textContent = "Digite o número da nota fiscal.";
        trackError.hidden = false;
        input.setAttribute("aria-invalid", "true");
        input.focus();
        return;
      }
      trackError.hidden = true;
      input.removeAttribute("aria-invalid");
      var text = "Olá! Quero saber onde está a minha carga. Nota fiscal: " + code;
      window.location.href =
        "https://wa.me/" + trackForm.getAttribute("data-whatsapp") + "?text=" + encodeURIComponent(text);
    });
  }

  /* ---------------------------------------------------------- numbers */
  var counters = document.querySelectorAll("[data-count]");
  if (!reduceMotion && "IntersectionObserver" in window && counters.length) {
    var format = function (n, decimals) {
      return n.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    };
    var countObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          countObserver.unobserve(el);
          var end = parseFloat(el.getAttribute("data-count"));
          var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
          var start = null;
          var step = function (ts) {
            if (start === null) start = ts;
            var p = Math.min((ts - start) / 1200, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = format(end * eased, decimals);
            if (p < 1) window.requestAnimationFrame(step);
          };
          window.requestAnimationFrame(step);
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (el) {
      countObserver.observe(el);
    });
  }

  /* ---------------------------------------------------------- year */
  var year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
})();
