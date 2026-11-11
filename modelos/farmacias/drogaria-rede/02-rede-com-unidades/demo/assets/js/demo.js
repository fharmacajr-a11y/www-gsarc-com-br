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

  var filterButtons = document.querySelectorAll("[data-unit-filter]");
  var unitCards = document.querySelectorAll("[data-unit-city]");
  var unitsCount = document.querySelector("[data-units-count]");

  function applyFilter(city) {
    var visible = 0;

    unitCards.forEach(function (card) {
      var show = city === "todas" || card.getAttribute("data-unit-city") === city;
      card.hidden = !show;
      if (show) {
        visible += 1;
      }
    });

    filterButtons.forEach(function (button) {
      button.setAttribute("aria-pressed", button.getAttribute("data-unit-filter") === city ? "true" : "false");
    });

    if (unitsCount) {
      unitsCount.textContent = visible === 1 ? "1 unidade encontrada." : visible + " unidades encontradas.";
    }
  }

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      applyFilter(button.getAttribute("data-unit-filter"));
    });
  });

  if (filterButtons.length) {
    applyFilter("todas");
  }

  if (yearTarget) {
    yearTarget.textContent = new Date().getFullYear();
  }
})();
