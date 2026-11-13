/* ==========================================================================
   GSA - Gestor de Sites & Apps · main.js (todas as páginas)
   1. Cabeçalho: sombra ao rolar (.is-scrolled)
   2. Menu das telas estreitas: abrir/fechar, rótulo, Esc, clique em link,
      mudança de largura, foco preso no menu e rolagem travada
   3. Link ativo da navegação (aria-current="page", por prefixo de endereço)
   4. Ano atual no rodapé
   5. Formulário de contato [data-contact-form] -> mensagem pronta no WhatsApp
   Também funciona com a marcação antiga (data-site-header, data-menu-button,
   data-mobile-menu) nas páginas que ainda não receberam o novo cabeçalho.
   O filtro da galeria de modelos NÃO fica aqui (é script da página).
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");

  function $(selector, context) {
    return (context || document).querySelector(selector);
  }
  function $all(selector, context) {
    return Array.prototype.slice.call((context || document).querySelectorAll(selector));
  }

  /* ------------------------------------------------------------------------
     1. Cabeçalho com sombra ao rolar
     ------------------------------------------------------------------------ */
  var header = $("[data-header]") || $("[data-site-header]");

  function syncHeader() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", syncHeader, { passive: true });
  syncHeader();

  /* ------------------------------------------------------------------------
     2. Menu das telas estreitas
     ------------------------------------------------------------------------ */
  var toggle = $("[data-menu-toggle]") || $("[data-menu-button]");
  var panel = $("[data-menu]") || $("[data-mobile-menu]");
  var isLegacy = !!(toggle && toggle.hasAttribute("data-menu-button"));
  var label = toggle ? $("[data-menu-label]", toggle) || $("[data-menu-label]") : null;
  var labels = isLegacy
    ? { open: "Fechar menu", closed: "Abrir menu" }
    : { open: "Fechar", closed: "Menu" };
  /* largura em que a navegação completa aparece no cabeçalho */
  var desktop = window.matchMedia(isLegacy ? "(min-width: 1024px)" : "(min-width: 900px)");
  var inertTargets = [];

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function isOpen() {
    return !!toggle && toggle.getAttribute("aria-expanded") === "true";
  }

  function visible(el) {
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  }

  /* elementos que podem receber foco enquanto o menu está aberto: o botão + o painel */
  function trapItems() {
    var items = [toggle];
    if (panel) items = items.concat($all(FOCUSABLE, panel).filter(visible));
    return items;
  }

  /* com o menu aberto, o resto da página fica inerte (leitores de tela e Tab) */
  function setInert(on) {
    if (!("inert" in HTMLElement.prototype)) return;
    if (on) {
      inertTargets = Array.prototype.slice.call(document.body.children).filter(function (el) {
        if (el === panel || el === header) return false;
        if (el.contains(toggle) || (panel && el.contains(panel))) return false;
        if (el.tagName === "SCRIPT" || el.inert) return false;
        return true;
      });
      inertTargets.forEach(function (el) { el.inert = true; });
    } else {
      inertTargets.forEach(function (el) { el.inert = false; });
      inertTargets = [];
    }
  }

  function setMenu(open, options) {
    if (!toggle || !panel) return;
    options = options || {};
    toggle.setAttribute("aria-expanded", String(open));
    if (isLegacy) {
      toggle.setAttribute("aria-label", open ? "Fechar menu principal" : "Abrir menu principal");
      panel.classList.toggle("hidden", !open);
    } else {
      panel.hidden = !open;
      panel.classList.toggle("is-open", open);
      setInert(open);
    }
    if (label) label.textContent = open ? labels.open : labels.closed;
    root.classList.toggle("menu-open", open);

    if (open && !isLegacy) {
      var first = $all(FOCUSABLE, panel).filter(visible)[0];
      if (first) first.focus({ preventScroll: true });
    } else if (!open && options.returnFocus) {
      /* sem preventScroll o Chrome rola até a posição do cabeçalho fixo no fluxo
         (a página subia 400-600 px ao fechar o menu com Esc) */
      toggle.focus({ preventScroll: true });
    }
  }

  if (toggle && panel) {
    toggle.addEventListener("click", function () {
      setMenu(!isOpen());
    });

    /* clicar em um link do menu fecha o painel */
    panel.addEventListener("click", function (event) {
      if (event.target.closest && event.target.closest("a")) setMenu(false);
    });

    document.addEventListener("keydown", function (event) {
      if (!isOpen()) return;

      if (event.key === "Escape" || event.key === "Esc") {
        event.preventDefault();
        setMenu(false, { returnFocus: true });
        return;
      }

      if (event.key === "Tab" && !isLegacy) {
        var items = trapItems();
        var firstItem = items[0];
        var lastItem = items[items.length - 1];
        var active = document.activeElement;
        if (items.indexOf(active) === -1) {
          event.preventDefault();
          (event.shiftKey ? lastItem : firstItem).focus({ preventScroll: true });
        } else if (event.shiftKey && active === firstItem) {
          event.preventDefault();
          lastItem.focus({ preventScroll: true });
        } else if (!event.shiftKey && active === lastItem) {
          event.preventDefault();
          firstItem.focus({ preventScroll: true });
        }
      }
    });

    /* ao alargar a tela até a navegação completa, o painel fecha */
    var onBreakpoint = function (event) {
      if (event.matches) setMenu(false);
    };
    if (desktop.addEventListener) desktop.addEventListener("change", onBreakpoint);
    else if (desktop.addListener) desktop.addListener(onBreakpoint);
    window.addEventListener("resize", function () {
      if (desktop.matches && isOpen()) setMenu(false);
    });

    setMenu(false);
  }

  /* ------------------------------------------------------------------------
     3. Link ativo: o item cujo endereço é o atual, ou um prefixo dele
        (/modelos/<modelo>/ marca "Modelos"; /monte-seu-site/ marca o botão
        "Pedir orçamento" do cabeçalho e do menu)
     ------------------------------------------------------------------------ */
  function normalizePath(path) {
    if (!path) return "/";
    var normalized = path.replace(/index\.html$/, "").replace(/\/+/g, "/");
    if (normalized.charAt(0) !== "/") normalized = "/" + normalized;
    return normalized || "/";
  }

  function markActiveLinks() {
    var current = normalizePath(window.location.pathname);
    $all("[data-nav-link]").forEach(function (link) {
      var href = link.getAttribute("href");
      var target = href ? normalizePath(new URL(href, window.location.href).pathname) : "";
      var active = !!target && (current === target || (target !== "/" && current.indexOf(target) === 0));
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }
  markActiveLinks();

  /* ------------------------------------------------------------------------
     4. Ano atual no rodapé
     ------------------------------------------------------------------------ */
  var year = String(new Date().getFullYear());
  $all("[data-current-year]").forEach(function (el) {
    el.textContent = year;
  });

  /* ------------------------------------------------------------------------
     5. Formulário de contato: valida e abre a mensagem pronta no WhatsApp
        Campos: nome, empresa, email, telefone, tipo-de-projeto, mensagem
        O número vem de data-whatsapp no <form>.
     ------------------------------------------------------------------------ */
  var contactForm = $("[data-contact-form]");

  if (contactForm) {
    var errorBox = $("[data-contact-error]", contactForm);

    var showError = function (message) {
      if (!errorBox) return;
      errorBox.textContent = message;
      errorBox.hidden = !message;
      errorBox.classList.toggle("hidden", !message);
    };

    /* O aviso fica no topo do formulário e o campo, mais abaixo. Se os dois cabem
       juntos na tela, rola até o aviso (abaixo do cabeçalho fixo: scrollIntoView
       respeita o scroll-padding-top) e foca o campo sem rolar de novo; senão,
       foca o campo normalmente (o aviso é lido pelo role="alert"). */
    var focusField = function (field) {
      if (!field) return;
      if (errorBox && !errorBox.hidden && errorBox.scrollIntoView) {
        var pad = parseFloat(window.getComputedStyle(root).scrollPaddingTop) || 0;
        var boxTop = errorBox.getBoundingClientRect().top;
        var fieldBottom = field.getBoundingClientRect().bottom;
        var viewport = window.innerHeight || root.clientHeight;
        if (fieldBottom - boxTop + pad <= viewport) {
          if (boxTop < pad || fieldBottom > viewport) errorBox.scrollIntoView({ block: "start" });
          field.focus({ preventScroll: true });
          return;
        }
      }
      field.focus();
    };

    var markInvalid = function (names) {
      ["nome", "email", "mensagem"].forEach(function (name) {
        var field = contactForm.querySelector('[name="' + name + '"]');
        if (!field) return;
        if (names.indexOf(name) !== -1) field.setAttribute("aria-invalid", "true");
        else field.removeAttribute("aria-invalid");
      });
    };

    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();

      var data = new FormData(contactForm);
      var value = function (name) {
        return String(data.get(name) || "").trim();
      };

      var missing = [];
      var missingNames = [];
      if (!value("nome")) { missing.push("nome"); missingNames.push("nome"); }
      if (!value("email")) { missing.push("e-mail"); missingNames.push("email"); }
      if (!value("mensagem")) { missing.push("descrição da necessidade"); missingNames.push("mensagem"); }

      if (missing.length) {
        showError("Preencha: " + missing.join(", ") + ".");
        markInvalid(missingNames);
        focusField(contactForm.querySelector('[name="' + missingNames[0] + '"]'));
        return;
      }

      var emailField = contactForm.querySelector('[name="email"]');
      if (emailField && !emailField.checkValidity()) {
        showError("Informe um e-mail válido.");
        markInvalid(["email"]);
        focusField(emailField);
        return;
      }

      showError("");
      markInvalid([]);

      var lines = [
        "Olá! Vim pelo site da GSA e gostaria de um orçamento.",
        "",
        "Nome: " + value("nome"),
        value("empresa") ? "Empresa: " + value("empresa") : null,
        "E-mail: " + value("email"),
        value("telefone") ? "WhatsApp: " + value("telefone") : null,
        "Assunto: " + value("tipo-de-projeto"),
        "",
        value("mensagem")
      ].filter(function (line) {
        return line !== null;
      });

      var phone = contactForm.getAttribute("data-whatsapp");
      window.location.href = "https://wa.me/" + phone + "?text=" + encodeURIComponent(lines.join("\n"));
    });
  }
})();
