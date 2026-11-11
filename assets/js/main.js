const header = document.querySelector("[data-site-header]");
const menuButton = document.querySelector("[data-menu-button]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const menuLabel = document.querySelector("[data-menu-label]");
const navLinks = document.querySelectorAll("[data-nav-link]");
const currentYear = document.querySelector("[data-current-year]");

const syncHeaderState = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 12);
};

const setMenuState = (isOpen) => {
  if (!menuButton || !mobileMenu) return;

  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "Fechar menu principal" : "Abrir menu principal");
  mobileMenu.classList.toggle("hidden", !isOpen);

  if (menuLabel) {
    menuLabel.textContent = isOpen ? "Fechar menu" : "Abrir menu";
  }
};

const normalizePath = (path) => {
  if (!path) return "/";

  let normalizedPath = path.replace(/index\.html$/, "").replace(/\/+/g, "/");

  if (!normalizedPath.startsWith("/")) {
    normalizedPath = `/${normalizedPath}`;
  }

  if (normalizedPath.length > 1 && normalizedPath.endsWith("/")) {
    return normalizedPath;
  }

  return normalizedPath || "/";
};

const markActiveLinks = () => {
  const currentPath = normalizePath(window.location.pathname);

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    const targetPath = href ? normalizePath(new URL(href, window.location.href).pathname) : "";
    const isActive = currentPath === targetPath || (targetPath !== "/" && currentPath.startsWith(targetPath));

    link.classList.toggle("is-active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

if (menuButton) {
  menuButton.addEventListener("click", () => {
    const isExpanded = menuButton.getAttribute("aria-expanded") === "true";
    setMenuState(!isExpanded);
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    if (window.innerWidth < 768) {
      setMenuState(false);
    }
  });
});

window.addEventListener("resize", () => {
  if (window.innerWidth >= 768) {
    setMenuState(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setMenuState(false);
  }
});

window.addEventListener("scroll", syncHeaderState, { passive: true });

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

syncHeaderState();
setMenuState(false);
markActiveLinks();

const contactForm = document.querySelector("[data-contact-form]");

if (contactForm) {
  const errorBox = contactForm.querySelector("[data-contact-error]");

  const showError = (message) => {
    if (!errorBox) return;
    errorBox.textContent = message;
    errorBox.classList.toggle("hidden", !message);
  };

  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(contactForm);
    const value = (name) => String(data.get(name) || "").trim();

    const missing = [];
    if (!value("nome")) missing.push("nome");
    if (!value("email")) missing.push("e-mail");
    if (!value("mensagem")) missing.push("descrição da necessidade");

    if (missing.length) {
      showError(`Preencha: ${missing.join(", ")}.`);
      const firstInvalid = contactForm.querySelector(
        `[name="${!value("nome") ? "nome" : !value("email") ? "email" : "mensagem"}"]`
      );
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const emailField = contactForm.querySelector('[name="email"]');
    if (emailField && !emailField.checkValidity()) {
      showError("Informe um e-mail válido.");
      emailField.focus();
      return;
    }

    showError("");

    const lines = [
      "Olá! Vim pelo site da GSA e gostaria de um orçamento.",
      "",
      `Nome: ${value("nome")}`,
      value("empresa") ? `Empresa: ${value("empresa")}` : null,
      `E-mail: ${value("email")}`,
      value("telefone") ? `WhatsApp: ${value("telefone")}` : null,
      `Tipo de projeto: ${value("tipo-de-projeto")}`,
      "",
      value("mensagem"),
    ].filter((line) => line !== null);

    const phone = contactForm.dataset.whatsapp;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.location.href = url;
  });
}
