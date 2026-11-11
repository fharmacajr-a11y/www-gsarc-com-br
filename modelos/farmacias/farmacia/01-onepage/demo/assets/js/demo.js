(function () {
  var menuButton = document.querySelector("[data-menu-button]");
  var mobileMenu = document.querySelector("[data-mobile-menu]");
  var yearTarget = document.querySelector("[data-current-year]");

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

  if (yearTarget) {
    yearTarget.textContent = new Date().getFullYear();
  }
})();