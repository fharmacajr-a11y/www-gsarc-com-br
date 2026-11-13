/* Monte o seu site: resumo ao vivo, modelo mais parecido e pedido pelo WhatsApp */
(function () {
  var form = document.querySelector("[data-builder]");
  if (!form) {
    return;
  }

  var $ = function (sel) {
    return form.querySelector(sel);
  };

  var MODELS = {
    "farmacia-onepage": ["Farmácia OnePage", "farmacias/farmacia/01-onepage/"],
    "farmacia-institucional": ["Farmácia Institucional", "farmacias/farmacia/02-institucional/"],
    "farmacia-ofertas": ["Farmácia com Ofertas", "farmacias/farmacia/03-ofertas/"],
    "farmacia-catalogo": ["Farmácia com Catálogo", "farmacias/farmacia/04-catalogo/"],
    "farmacia-delivery": ["Delivery Assistido", "farmacias/farmacia/05-delivery-assistido/"],
    manipulacao: ["Farmácia de Manipulação", "farmacias/farmacia/06-manipulacao/"],
    "rede-institucional": ["Rede Institucional", "farmacias/drogaria-rede/01-institucional-rede/"],
    "rede-unidades": ["Rede com Unidades", "farmacias/drogaria-rede/02-rede-com-unidades/"],
    "rede-ofertas": ["Rede com Ofertas", "farmacias/drogaria-rede/03-rede-com-ofertas/"],
    "distmed-institucional": ["Distribuidora B2B Institucional", "farmacias/distribuidora/01-institucional-b2b/"],
    "distmed-catalogo": ["Catálogo B2B sem Preços", "farmacias/distribuidora/02-catalogo-b2b-sem-precos/"],
    "dist-onepage": ["Distribuidora OnePage", "distribuidoras/01-onepage/"],
    "dist-catalogo": ["Catálogo B2B", "distribuidoras/02-catalogo-b2b/"],
    "transp-onepage": ["Transportadora OnePage", "transportadoras/01-onepage/"],
    "transp-institucional": ["Transportadora Institucional", "transportadoras/02-institucional/"],
    outra: ["Serviços OnePage", "outras-empresas/01-onepage/"]
  };

  function checked(name) {
    return Array.prototype.slice
      .call(form.querySelectorAll('input[name="' + name + '"]:checked'))
      .map(function (input) {
        return input.value;
      });
  }

  function radio(name) {
    var input = form.querySelector('input[name="' + name + '"]:checked');
    return input ? { value: input.value, label: input.getAttribute("data-label") } : null;
  }

  function has(list, value) {
    return list.indexOf(value) !== -1;
  }

  /* Só na tela: prende "a", "e", "o" à palavra seguinte e não deixa "e-mail" quebrar
     no hífen, como no resto da página. A mensagem do WhatsApp usa os valores originais. */
  function nb(text) {
    return text.replace(/(^|\s)([aeoàé]) /gi, "$1$2\u00a0").replace(/e-mail/g, "e-\u2060mail");
  }

  /* ?modelo=<chave de MODELS>: marca o segmento e as opções que levam a esse modelo */
  var PRESETS = {
    "farmacia-onepage": { segmento: "farmacia" },
    "farmacia-institucional": { segmento: "farmacia", formato: "varias" },
    "farmacia-ofertas": { segmento: "farmacia", funcoes: ["Ofertas da semana"] },
    "farmacia-catalogo": { segmento: "farmacia", funcoes: ["Catálogo com lista pelo WhatsApp"] },
    "farmacia-delivery": { segmento: "farmacia", funcoes: ["Carrinho com entrega"] },
    manipulacao: { segmento: "manipulacao" },
    "rede-institucional": { segmento: "rede", formato: "varias" },
    "rede-unidades": { segmento: "rede", funcoes: ["Busca de lojas por cidade"] },
    "rede-ofertas": { segmento: "rede", funcoes: ["Ofertas da semana"] },
    "distmed-institucional": { segmento: "distmed", formato: "varias" },
    "distmed-catalogo": { segmento: "distmed", funcoes: ["Catálogo com lista pelo WhatsApp"] },
    "dist-onepage": { segmento: "dist" },
    "dist-catalogo": { segmento: "dist", funcoes: ["Catálogo com lista pelo WhatsApp"] },
    "transp-onepage": { segmento: "transp" },
    "transp-institucional": { segmento: "transp", formato: "varias" },
    outra: { segmento: "outra" }
  };

  function tick(name, value) {
    var input = form.querySelector('input[name="' + name + '"][value="' + value + '"]');
    if (input && !input.disabled) input.checked = true;
  }

  function preselect() {
    var found = /[?&]modelo=([^&#]*)/.exec(window.location.search);
    var key;
    if (!found) return;
    try {
      key = decodeURIComponent(found[1].replace(/\+/g, " ")).trim();
    } catch (e) {
      return;
    }
    var preset = Object.prototype.hasOwnProperty.call(PRESETS, key) ? PRESETS[key] : null;
    /* não desfaz escolhas que o navegador já restaurou (voltar/recarregar) */
    if (!preset || form.querySelector('input[name="segmento"]:checked')) return;
    tick("segmento", preset.segmento);
    if (preset.formato) tick("formato", preset.formato);
    (preset.funcoes || []).forEach(function (value) {
      tick("funcoes", value);
    });
  }

  function match(seg, format, pages, features) {
    var many = format === "varias";
    var catalog = has(features, "Catálogo com lista pelo WhatsApp") || has(pages, "Produtos ou catálogo");
    var offers = has(features, "Ofertas da semana") || has(pages, "Ofertas e promoções");
    switch (seg) {
      case "farmacia":
        if (has(features, "Carrinho com entrega")) return "farmacia-delivery";
        if (catalog) return "farmacia-catalogo";
        if (offers) return "farmacia-ofertas";
        return many ? "farmacia-institucional" : "farmacia-onepage";
      case "manipulacao":
        return "manipulacao";
      case "rede":
        if (has(features, "Busca de lojas por cidade") || has(pages, "Lojas ou unidades")) {
          return offers ? "rede-ofertas" : "rede-unidades";
        }
        return offers ? "rede-ofertas" : "rede-institucional";
      case "distmed":
        return catalog ? "distmed-catalogo" : "distmed-institucional";
      case "dist":
        return catalog ? "dist-catalogo" : "dist-onepage";
      case "transp":
        return many ? "transp-institucional" : "transp-onepage";
      case "outra":
        return "outra";
      default:
        return null;
    }
  }

  var shownKey = null;

  function update() {
    var seg = radio("segmento");
    var format = radio("formato");
    var pages = checked("paginas");
    var features = checked("funcoes");
    var many = format && format.value === "varias";

    $("[data-sum-seg]").textContent = seg ? seg.label : "Escolha no passo 1";
    $("[data-sum-format]").textContent = format ? format.label : "-";
    $("[data-sum-pages-label]").textContent = many ? "Páginas (" + pages.length + ")" : "Seções";
    $("[data-pages-title]").textContent = many ? "Quais páginas você quer?" : "Quais seções você quer?";
    $("[data-sum-pages]").textContent = nb(pages.join(", "));
    $("[data-sum-features]").textContent = features.length ? nb(features.join(", ")) : "Nenhuma escolhida";

    var key = seg ? match(seg.value, format && format.value, pages, features) : null;
    var box = $("[data-match]");
    if (key && MODELS[key]) {
      var model = MODELS[key];
      /* só reescreve quando o modelo muda (a caixa fica numa região aria-live) */
      if (key !== shownKey) {
        $("[data-match-name]").textContent = model[0];
        $("[data-match-link]").setAttribute("href", "/modelos/" + model[1] + "demo/");
        var img = $("[data-match-img]");
        img.setAttribute("src", "/modelos/" + model[1] + "preview.webp");
        img.setAttribute("alt", "Tela da demonstração do modelo " + model[0]);
        shownKey = key;
      }
      box.hidden = false;
      form.setAttribute("data-chosen-model", model[0]);
    } else {
      box.hidden = true;
      shownKey = null;
      form.removeAttribute("data-chosen-model");
    }
  }

  var error = $("[data-builder-error]");
  var REQUIRED = { nome: "seu nome", empresa: "o nome da empresa", cidade: "a cidade" };

  /* Mostra o que falta (ou esconde a caixa) e marca os campos vazios.
     Devolve true quando está tudo preenchido. */
  function checkMissing() {
    var missing = [];
    if (!radio("segmento")) missing.push("o segmento");
    Object.keys(REQUIRED).forEach(function (name) {
      var input = form.elements[name];
      if (input.value.trim()) {
        input.removeAttribute("aria-invalid");
      } else {
        input.setAttribute("aria-invalid", "true");
        missing.push(REQUIRED[name]);
      }
    });
    if (!missing.length) {
      error.hidden = true;
      return true;
    }
    var text = nb("Falta preencher: " + missing.join(", ") + ".");
    if (error.textContent !== text) error.textContent = text;
    error.hidden = false;
    return false;
  }

  form.addEventListener("change", update);
  /* com o aviso à vista, cada escolha ou campo preenchido atualiza a lista do que falta */
  form.addEventListener("input", function () {
    if (!error.hidden) checkMissing();
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!checkMissing()) {
      /* o aviso aparece acima do botão: mantém os dois à vista */
      form.querySelector("[type='submit']").scrollIntoView({ block: "nearest" });
      return;
    }
    var seg = radio("segmento");
    var format = radio("formato");
    var lines = [
      "Olá! Montei o meu site na página da GSA e quero um orçamento.",
      "",
      "Empresa: " + form.elements.empresa.value.trim(),
      "Nome: " + form.elements.nome.value.trim(),
      "Cidade: " + form.elements.cidade.value.trim(),
      "Segmento: " + seg.label,
      "Formato: " + format.label,
      (format.value === "varias" ? "Páginas: " : "Seções: ") + checked("paginas").join(", "),
      "Funções: " + (checked("funcoes").join(", ") || "nenhuma"),
      "Logo: " + form.elements.logo.value,
      "Prazo: " + form.elements.prazo.value
    ];
    if (form.getAttribute("data-chosen-model")) {
      lines.push("Modelo mais parecido: " + form.getAttribute("data-chosen-model"));
    }
    var obs = form.elements.obs.value.trim();
    if (obs) {
      lines.push("Observações: " + obs);
    }
    var url = "https://wa.me/" + form.getAttribute("data-whatsapp") + "?text=" + encodeURIComponent(lines.join("\n"));
    window.open(url, "_blank", "noopener");
  });

  preselect();
  update();
  /* ao voltar de uma demonstração o navegador restaura as escolhas: refaz o resumo */
  window.addEventListener("pageshow", update);

  /* A lista do resumo só rola no painel lateral, em tela baixa. O HTML traz tabindex="0"
     (sem JS ela também pode rolar); aqui a parada no Tab fica só enquanto há o que rolar. */
  var corpo = $(".resumo__corpo");
  if (corpo && window.ResizeObserver) {
    var syncScrollStop = function () {
      if (corpo.scrollHeight > corpo.clientHeight + 1) {
        corpo.setAttribute("tabindex", "0");
      } else if (document.activeElement !== corpo) {
        corpo.removeAttribute("tabindex");
      }
    };
    var watcher = new ResizeObserver(syncScrollStop);
    watcher.observe(corpo);
    watcher.observe(corpo.firstElementChild);
    corpo.addEventListener("blur", syncScrollStop);
  }
})();
