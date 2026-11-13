/* ==========================================================================
   GSA · /modelos/ · filtro da galeria (script só desta página, depois do main.js)

   - Chips <button data-filter aria-pressed>: "Todos" ou um grupo.
   - O estado fica em <html data-filtro="grupo"> (sem o atributo = todos);
     modelos.css esconde os outros grupos e arruma a grade.
   - Endereço: #farmacias, #redes, #distribuidoras, #transportadoras,
     #outras-empresas (ou #todos) é lido ao carregar e no hashchange; o
     clique no chip grava o endereço com history.replaceState.
   - Linha de resultado (aria-live="polite") com o texto do chip ativo.
   - Celular: fileira de chips com rolagem lateral; as bordas esmaecem quando
     há mais chips daquele lado e o chip ativo é trazido para a vista.
   - Barra fixa: .is-fixa quando gruda sob o cabeçalho; ao trocar o filtro
     com a barra grudada, a página volta ao começo da galeria. A altura dela
     vai para --filtro-h (a âncora #grupo para logo abaixo da barra).
   Sem JavaScript: todos os grupos aparecem e os chips ficam escondidos.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var galeria = document.querySelector("[data-galeria]");
  if (!galeria) return;

  var chips = Array.prototype.slice.call(galeria.querySelectorAll("[data-filter]"));
  var row = galeria.querySelector("[data-filtro-chips]");
  var bar = galeria.querySelector("[data-filtro-barra]");
  var top = galeria.querySelector(".filtro__topo");
  var result = galeria.querySelector("[data-filtro-resultado]");
  var header = document.querySelector("[data-header]");
  if (!chips.length || !row || !bar || !top) return;

  var ALL = "todos";
  var values = chips.map(function (chip) {
    return chip.getAttribute("data-filter");
  });
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function motion(smooth) {
    return smooth && !reduceMotion.matches ? "smooth" : "auto";
  }

  /* valor do filtro no endereço, ou null se o # não for de um grupo (#conteudo, #topo...) */
  function valueFromHash() {
    var hash = window.location.hash.replace(/^#/, "");
    try {
      hash = decodeURIComponent(hash);
    } catch (error) {
      return null;
    }
    hash = hash.toLowerCase();
    return values.indexOf(hash) !== -1 ? hash : null;
  }

  function chipFor(value) {
    return chips[values.indexOf(value)] || chips[0];
  }

  /* ------------------------------------------------------------------------
     Fileira de chips com rolagem (celular)
     ------------------------------------------------------------------------ */
  function scrollable() {
    return row.scrollWidth > row.clientWidth + 1;
  }

  function syncEdges() {
    var can = scrollable();
    var max = row.scrollWidth - row.clientWidth;
    row.classList.toggle("tem-mais-esq", can && row.scrollLeft > 2);
    row.classList.toggle("tem-mais-dir", can && row.scrollLeft < max - 2);
  }

  /* traz o chip para a vista quando ele está escondido ou sob o esmaecimento */
  function revealChip(chip, smooth) {
    if (!scrollable()) return;
    var box = row.getBoundingClientRect();
    var rect = chip.getBoundingClientRect();
    var margin = 56;
    if (rect.left >= box.left + margin && rect.right <= box.right - margin) return;
    var max = row.scrollWidth - row.clientWidth;
    var left = row.scrollLeft + (rect.left + rect.width / 2) - (box.left + box.width / 2);
    left = Math.max(0, Math.min(max, left));
    if (row.scrollTo) row.scrollTo({ left: left, behavior: motion(smooth) });
    else row.scrollLeft = left;
  }

  /* ------------------------------------------------------------------------
     Barra fixa
     ------------------------------------------------------------------------ */
  function headerBottom() {
    return header ? header.getBoundingClientRect().bottom : 0;
  }

  /* a barra está abaixo do lugar dela no fluxo: está grudada sob o cabeçalho */
  function isStuck() {
    return top.getBoundingClientRect().bottom < bar.getBoundingClientRect().top - 0.5;
  }

  /* altura real da barra (uma ou duas fileiras de chips, zoom, fonte do
     sistema): o scroll-margin dos grupos usa --filtro-h */
  var barHeight = 0;
  function syncBarHeight() {
    var height = Math.round(bar.getBoundingClientRect().height);
    if (!height || height === barHeight) return;
    barHeight = height;
    root.style.setProperty("--filtro-h", height + "px");
  }

  var ticking = false;
  function syncStuck() {
    ticking = false;
    var stuck = isStuck();
    bar.classList.toggle("is-fixa", stuck);
    root.classList.toggle("filtro-fixo", stuck);
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(syncStuck);
  }

  /* rola até o começo da galeria (a barra no lugar dela, logo abaixo do cabeçalho) */
  function scrollToGallery(smooth, force) {
    var target = window.pageYOffset + top.getBoundingClientRect().bottom - headerBottom();
    if (force || window.pageYOffset > target + 1) {
      window.scrollTo({ top: Math.max(0, target), behavior: motion(smooth) });
    }
  }

  /* ------------------------------------------------------------------------
     Filtro
     ------------------------------------------------------------------------ */
  function apply(value, smooth) {
    if (values.indexOf(value) === -1) value = ALL;
    if (value === ALL) root.removeAttribute("data-filtro");
    else root.setAttribute("data-filtro", value);

    chips.forEach(function (chip) {
      chip.setAttribute("aria-pressed", String(chip.getAttribute("data-filter") === value));
    });

    var chip = chipFor(value);
    var text = chip.getAttribute("data-result");
    if (result && text && result.textContent !== text) result.textContent = text;

    syncEdges();
    revealChip(chip, smooth);
  }

  function writeUrl(value) {
    if (!window.history || !window.history.replaceState) return;
    var url = window.location.pathname + window.location.search + (value === ALL ? "" : "#" + value);
    try {
      window.history.replaceState(window.history.state, "", url);
    } catch (error) {
      /* endereço não pôde ser gravado (ex.: arquivo local): o filtro funciona mesmo assim */
    }
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var value = chip.getAttribute("data-filter");
      var stuck = isStuck();
      apply(value, true);
      writeUrl(value);
      /* com a barra grudada, a lista nova começa logo abaixo dela */
      if (stuck) scrollToGallery(true, false);
    });
  });

  /* links para /modelos/#grupo dentro da própria página (rodapé, voltar/avançar) */
  window.addEventListener("hashchange", function () {
    var value = valueFromHash();
    if (!value) return;
    apply(value, false);
    var section = value === ALL ? null : document.getElementById(value);
    if (section && section.scrollIntoView) section.scrollIntoView({ block: "start" });
    else scrollToGallery(false, true);
  });

  /* Tab até um chip escondido na fileira: ele vem para a vista */
  row.addEventListener("focusin", function (event) {
    var chip = event.target.closest ? event.target.closest("[data-filter]") : null;
    if (chip) revealChip(chip, true);
  });

  row.addEventListener("scroll", syncEdges, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () {
    syncEdges();
    syncBarHeight();
    onScroll();
  });
  if (window.ResizeObserver) {
    var observer = new ResizeObserver(function () {
      syncEdges();
      syncBarHeight();
    });
    observer.observe(row);
    observer.observe(bar);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      syncEdges();
      syncBarHeight();
      revealChip(chipFor(root.getAttribute("data-filtro") || ALL), false);
    });
  }

  /* estado inicial: o endereço manda; sem # de grupo, vale o que o <head> já marcou (ou todos) */
  apply(valueFromHash() || root.getAttribute("data-filtro") || ALL, false);
  syncBarHeight();
  syncStuck();
})();
