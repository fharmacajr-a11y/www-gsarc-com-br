// GSA - barra de demonstração
//
// Incluída como primeiro filho do <body> de cada página de demonstração
// (as pastas demo/ dentro de /modelos/) com:
//   <script src="/assets/js/demo-bar.js"></script>
//
// Roda de forma síncrona: injeta um <style> e coloca a barra como primeiro
// elemento do <body> antes da primeira pintura, sem deslocar o layout.
// Não depende do site.css nem carrega fontes. Todas as classes usam o
// prefixo "gsa-demobar" para não colidir com os estilos das demonstrações.
//
// Textos e destinos: plano de conteúdo, seções 2.5, 2.6 e 2.7.
(function () {
  "use strict";

  if (window.__gsaDemoBar) {
    return;
  }
  window.__gsaDemoBar = true;

  var WHATSAPP = "5519996275900";

  // [pasta dentro de /modelos/, nome do modelo, grupo da galeria /modelos/#grupo]
  var MODELS = [
    ["farmacias/farmacia/01-onepage", "Farmácia OnePage", "farmacias"],
    ["farmacias/farmacia/02-institucional", "Farmácia Institucional", "farmacias"],
    ["farmacias/farmacia/03-ofertas", "Farmácia com Ofertas", "farmacias"],
    ["farmacias/farmacia/04-catalogo", "Farmácia com Catálogo", "farmacias"],
    ["farmacias/farmacia/05-delivery-assistido", "Delivery Assistido", "farmacias"],
    ["farmacias/farmacia/06-manipulacao", "Farmácia de Manipulação", "farmacias"],
    ["farmacias/drogaria-rede/01-institucional-rede", "Rede Institucional", "redes"],
    ["farmacias/drogaria-rede/02-rede-com-unidades", "Rede com Unidades", "redes"],
    ["farmacias/drogaria-rede/03-rede-com-ofertas", "Rede com Ofertas", "redes"],
    ["farmacias/distribuidora/01-institucional-b2b", "Distribuidora B2B Institucional", "distribuidoras"],
    ["farmacias/distribuidora/02-catalogo-b2b-sem-precos", "Catálogo B2B sem Preços", "distribuidoras"],
    ["distribuidoras/01-onepage", "Distribuidora OnePage", "distribuidoras"],
    ["distribuidoras/02-catalogo-b2b", "Catálogo B2B", "distribuidoras"],
    ["transportadoras/01-onepage", "Transportadora OnePage", "transportadoras"],
    ["transportadoras/02-institucional", "Transportadora Institucional", "transportadoras"],
    ["outras-empresas/01-onepage", "Serviços OnePage", "outras-empresas"]
  ];

  function findModel(pathname) {
    var path = pathname || "";
    try {
      path = decodeURI(path);
    } catch (error) {
      /* mantém o caminho como veio */
    }
    for (var i = 0; i < MODELS.length; i += 1) {
      var key = "/modelos/" + MODELS[i][0] + "/demo";
      var at = path.indexOf(key);
      if (at !== -1) {
        var next = path.charAt(at + key.length);
        if (next === "" || next === "/") {
          return { name: MODELS[i][1], group: MODELS[i][2] };
        }
      }
    }
    return null;
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function groupSize(group) {
    var count = 0;
    for (var i = 0; i < MODELS.length; i += 1) {
      if (MODELS[i][2] === group) {
        count += 1;
      }
    }
    return count;
  }

  var model = findModel(window.location.pathname);
  var name = model ? model.name : "";
  // "Ver outros modelos": a galeria filtrada pelo grupo do modelo. Num grupo de um
  // modelo só (outras-empresas), a galeria inteira, para o link mostrar outros modelos
  // (mesma regra do shell.group_href() nas páginas dos modelos).
  var backHref = "/modelos/" + (model && groupSize(model.group) > 1 ? "#" + model.group : "");
  var message = model
    ? "Olá! Vi o modelo " + name + " no site da GSA e quero um site assim."
    : "Olá! Vim pelo site da GSA e quero um orçamento.";
  var whatsappHref = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(message);
  var spoken = model ? "Demonstração GSA: " + name + ", empresa fictícia." : "Demonstração GSA, empresa fictícia.";

  var P = ".gsa-demobar";
  var css = [
    P + "{position:relative;display:block;box-sizing:border-box;width:100%;max-width:none;margin:0;padding:0;border:0;overflow:hidden;" +
      "background:#0a1f44;color:#fff;font-family:Inter,system-ui,sans-serif;font-size:13px;font-weight:600;font-style:normal;" +
      "line-height:1.25;letter-spacing:normal;word-spacing:normal;text-align:left;text-indent:0;text-transform:none;text-shadow:none;" +
      "white-space:nowrap;visibility:visible;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;-webkit-text-size-adjust:100%;text-size-adjust:100%}",
    P + "::after{content:\"\";position:absolute;left:0;right:0;bottom:0;height:1px;background:rgba(121,203,255,.5);pointer-events:none}",
    P + " *," + P + " *::before," + P + " *::after{box-sizing:border-box}",
    P + "__in{display:flex;flex-wrap:wrap;align-items:center;gap:0 8px;width:min(1160px,calc(100% - 24px));min-height:44px;margin:0 auto;padding:0}",
    P + "__sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}",

    /* links de volta */
    P + "__back{flex:none;display:inline-flex;align-items:center;min-width:44px;min-height:44px;margin:0;padding:0;border:0;background:none;" +
      "color:#fff;font:inherit;text-decoration:none;cursor:pointer;-webkit-tap-highlight-color:rgba(121,203,255,.2)}",
    P + "__back:hover," + P + "__back:focus{color:#fff}",
    P + "__t{display:inline-flex;align-items:center;gap:4px;padding:2px 0;border-radius:3px;" +
      "text-decoration:underline;text-decoration-color:rgba(255,255,255,.35);text-decoration-thickness:1px;text-underline-offset:4px}",
    P + "__back:hover " + P + "__t{text-decoration-color:currentColor}",
    P + "__back--short " + P + "__t{text-decoration:none}",
    P + "__back--short:hover " + P + "__t{text-decoration:underline;text-decoration-color:currentColor}",
    P + "__chev{display:inline-block;font-size:18px;font-weight:500;line-height:1;transform:translateY(-1px)}",
    P + "__back--long{display:none}",

    /* texto da demonstração (decorativo; o leitor de tela usa o __sr) */
    P + "__label{flex:1 1 0%;min-width:0;display:flex;flex-wrap:wrap;align-items:center;height:44px;overflow:hidden;color:#fff}",
    P + "__label::before{content:\"\";flex:none;width:0;height:44px}",
    P + "__kp{flex:none;padding-left:8px;border-left:1px solid rgba(255,255,255,.22);color:#79cbff;font-weight:500}",
    P + "__kw," + P + "__sep," + P + "__m," + P + "__f{display:none}",
    P + "__kw{color:#79cbff}",
    P + "__sep{flex:none;color:rgba(255,255,255,.4);font-weight:400}",
    P + "__m{color:#fff}",
    P + "__f{flex:none;color:#9fb0cc;font-weight:400}",

    /* botão do WhatsApp */
    P + "__cta{flex:none;display:inline-flex;align-items:center;max-width:100%;min-height:44px;margin:0;padding:0;border:0;background:none;" +
      "color:#fff;font:inherit;text-decoration:none;cursor:pointer;-webkit-tap-highlight-color:transparent}",
    P + "__cta:hover," + P + "__cta:focus{color:#fff;text-decoration:none}",
    P + "__pill{display:inline-flex;align-items:center;min-height:32px;padding:4px 10px;border-radius:6px;white-space:normal;text-align:center;background:#1464ff;color:#fff;" +
      "box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}",
    P + "__cta:hover " + P + "__pill{background:#0b52e0}",
    P + "__cta:active " + P + "__pill{background:#0a47c4}",

    /* foco visível */
    P + "__back:focus-visible," + P + "__cta:focus-visible{outline:none}",
    P + "__back:focus-visible " + P + "__t{outline:2px solid #79cbff;outline-offset:3px}",
    P + "__cta:focus-visible " + P + "__pill{outline:2px solid #79cbff;outline-offset:2px}",

    /* tablet: 640 a 1023 px */
    "@media (min-width:640px){" +
      P + "__in{gap:0 16px;width:min(1160px,calc(100% - 32px))}" +
      P + "__back--short{display:none}" +
      P + "__back--long{display:inline-flex}" +
      P + "__label{flex-wrap:nowrap;gap:7px;height:auto}" +
      P + "__label::before{content:none}" +
      P + "__kp{display:none}" +
      P + "__kw," + P + "__sep," + P + "__m{display:block}" +
      P + "__sep--f{display:none}" +
      P + "__kw{flex:none}" +
      P + "__m{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis}" +
      P + "__pill{padding:4px 14px}" +
    "}",

    /* desktop: 1024 px ou mais */
    "@media (min-width:1024px){" +
      P + "__sep--f," + P + "__f{display:block}" +
    "}",

    "@media (prefers-reduced-motion:no-preference){" +
      P + "__pill{transition:background-color .15s ease}" +
      P + "__t{transition:text-decoration-color .15s ease}" +
    "}",
    /* as demonstrações rolam suave pelos links internos (CSS delas); quem pediu
       menos movimento no sistema rola direto, como no resto do site */
    "@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto!important}}",
    "@media (forced-colors:active){" + P + "__pill{border:1px solid ButtonText}" + P + "::after{background:CanvasText}}",
    "@media print{" + P + "{display:none!important}}"
  ].join("\n");

  var label = model
    ? '<span class="gsa-demobar__kp">Demonstração</span>' +
      '<span class="gsa-demobar__kw">Demonstração GSA</span>' +
      '<span class="gsa-demobar__sep">·</span>' +
      '<span class="gsa-demobar__m">' + escapeHtml(name) + "</span>" +
      '<span class="gsa-demobar__sep gsa-demobar__sep--f">·</span>' +
      '<span class="gsa-demobar__f">empresa fictícia</span>'
    : '<span class="gsa-demobar__kp">Demonstração</span>' +
      '<span class="gsa-demobar__kw">Demonstração GSA</span>' +
      '<span class="gsa-demobar__sep gsa-demobar__sep--f">·</span>' +
      '<span class="gsa-demobar__f">empresa fictícia</span>';

  var html =
    '<div class="gsa-demobar__in">' +
    '<span class="gsa-demobar__sr">' + escapeHtml(spoken) + "</span>" +
    '<a class="gsa-demobar__back gsa-demobar__back--short" href="' + escapeHtml(backHref) + '" aria-label="Ver outros modelos">' +
    '<span class="gsa-demobar__t"><span class="gsa-demobar__chev" aria-hidden="true">‹</span> Modelos</span></a>' +
    '<span class="gsa-demobar__label" aria-hidden="true">' + label + "</span>" +
    '<a class="gsa-demobar__back gsa-demobar__back--long" href="' + escapeHtml(backHref) + '" aria-label="Ver outros modelos">' +
    '<span class="gsa-demobar__t">Ver outros modelos</span></a>' +
    '<a class="gsa-demobar__cta" href="' + escapeHtml(whatsappHref) + '" target="_blank" rel="noopener"' +
    ' aria-label="Quero um site assim: falar no WhatsApp da GSA">' +
    '<span class="gsa-demobar__pill">Quero um site assim</span></a>' +
    "</div>";

  function mount() {
    if (document.querySelector(".gsa-demobar")) {
      return;
    }
    if (!document.getElementById("gsa-demobar-style")) {
      var style = document.createElement("style");
      style.id = "gsa-demobar-style";
      style.textContent = css;
      (document.head || document.documentElement).appendChild(style);
    }
    var nav = document.createElement("nav");
    nav.className = "gsa-demobar";
    nav.setAttribute("aria-label", "Demonstração da GSA");
    nav.innerHTML = html;
    document.body.insertBefore(nav, document.body.firstChild);
  }

  if (document.body) {
    mount();
  } else {
    document.addEventListener("DOMContentLoaded", mount);
  }
})();
