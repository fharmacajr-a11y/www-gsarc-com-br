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
    $("[data-sum-pages]").textContent = pages.join(", ");
    $("[data-sum-features]").textContent = features.length ? features.join(", ") : "Nenhuma escolhida";

    var key = seg ? match(seg.value, format && format.value, pages, features) : null;
    var box = $("[data-match]");
    if (key && MODELS[key]) {
      var model = MODELS[key];
      box.hidden = false;
      $("[data-match-name]").textContent = model[0];
      $("[data-match-link]").setAttribute("href", "../modelos/" + model[1] + "demo/");
      var img = $("[data-match-img]");
      img.setAttribute("src", "../modelos/" + model[1] + "preview.webp");
      img.setAttribute("alt", "Tela da demonstração do modelo " + model[0]);
      form.setAttribute("data-chosen-model", model[0]);
    } else {
      box.hidden = true;
      form.removeAttribute("data-chosen-model");
    }
  }

  form.addEventListener("change", update);
  form.addEventListener("input", function (event) {
    if (event.target.matches("input[type='text'], textarea")) {
      $("[data-builder-error]").hidden = true;
    }
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var seg = radio("segmento");
    var missing = [];
    if (!seg) missing.push("o segmento");
    ["nome", "empresa", "cidade"].forEach(function (name) {
      var input = form.elements[name];
      if (!input.value.trim()) {
        missing.push({ nome: "seu nome", empresa: "o nome da empresa", cidade: "a cidade" }[name]);
      }
    });
    var error = $("[data-builder-error]");
    if (missing.length) {
      error.textContent = "Falta preencher: " + missing.join(", ") + ".";
      error.hidden = false;
      return;
    }
    error.hidden = true;

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

  update();
})();
