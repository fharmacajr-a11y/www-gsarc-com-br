(function () {
  var menuButton = document.querySelector("[data-menu-button]");
  var mobileMenu = document.querySelector("[data-mobile-menu]");

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

  document.querySelectorAll("[data-current-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  function money(value) {
    return "R$ " + value.toFixed(2).replace(".", ",");
  }

  function labelOf(field) {
    var label = field.closest("label");
    if (!label) {
      return field.name;
    }
    return label.childNodes[0].textContent.trim();
  }

  /* Filtro por categoria e busca */
  document.querySelectorAll("[data-filter-scope]").forEach(function (scope) {
    var buttons = scope.querySelectorAll("[data-filter]");
    var search = scope.querySelector("[data-search]");
    var items = scope.querySelectorAll("[data-item]");
    var counter = scope.querySelector("[data-filter-count]");
    var words = (scope.getAttribute("data-count-label") || "item|itens").split("|");
    var current = "todas";

    function normalize(text) {
      return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    }

    function apply() {
      var term = search ? normalize(search.value.trim()) : "";
      var visible = 0;
      items.forEach(function (item) {
        var tags = (item.getAttribute("data-tags") || "").split(" ");
        var okTag = current === "todas" || tags.indexOf(current) !== -1;
        var okTerm = !term || normalize(item.textContent).indexOf(term) !== -1;
        item.hidden = !(okTag && okTerm);
        if (!item.hidden) {
          visible += 1;
        }
      });
      buttons.forEach(function (button) {
        button.setAttribute("aria-pressed", button.getAttribute("data-filter") === current ? "true" : "false");
      });
      if (counter) {
        counter.textContent =
          visible + " " + (visible === 1 ? words[0] : words[1]) + " " + (visible === 1 ? words[2] || "encontrado" : words[3] || "encontrados") + ".";
      }
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        current = button.getAttribute("data-filter");
        apply();
      });
    });
    if (search) {
      search.addEventListener("input", apply);
    }
    apply();
  });

  /* Carrinho ou lista de pedido */
  var cartList = document.querySelector("[data-cart-list]");
  var cart = [];

  function cartSubtotal() {
    return cart.reduce(function (sum, line) {
      return sum + (line.price || 0) * line.qty;
    }, 0);
  }

  function selectedFee() {
    var select = document.querySelector("[data-fee-select]");
    if (!select || !select.value) {
      return null;
    }
    return parseFloat(select.options[select.selectedIndex].getAttribute("data-fee") || "0");
  }

  function renderCart() {
    if (!cartList) {
      return;
    }
    cartList.innerHTML = "";
    cart.forEach(function (line, index) {
      var li = document.createElement("li");
      li.className = "cart-line";
      var name = document.createElement("strong");
      name.textContent = line.name;
      var price = document.createElement("span");
      price.textContent = line.price ? money(line.price * line.qty) : "";
      var qty = document.createElement("span");
      qty.className = "qty";
      var minus = document.createElement("button");
      minus.type = "button";
      minus.textContent = "−";
      minus.setAttribute("aria-label", "Diminuir " + line.name);
      var count = document.createElement("span");
      count.textContent = line.qty + (line.unit ? " " + line.unit : "");
      var plus = document.createElement("button");
      plus.type = "button";
      plus.textContent = "+";
      plus.setAttribute("aria-label", "Aumentar " + line.name);
      minus.addEventListener("click", function () {
        line.qty -= 1;
        if (line.qty <= 0) {
          cart.splice(index, 1);
        }
        renderCart();
      });
      plus.addEventListener("click", function () {
        line.qty += 1;
        renderCart();
      });
      qty.appendChild(minus);
      qty.appendChild(count);
      qty.appendChild(plus);
      li.appendChild(name);
      li.appendChild(price);
      li.appendChild(qty);
      cartList.appendChild(li);
    });

    var empty = document.querySelector("[data-cart-empty]");
    if (empty) {
      empty.hidden = cart.length > 0;
    }
    var totalItems = cart.reduce(function (sum, line) {
      return sum + line.qty;
    }, 0);
    document.querySelectorAll("[data-cart-count]").forEach(function (el) {
      el.textContent = totalItems;
    });
    var sub = cartSubtotal();
    var fee = selectedFee();
    var subEl = document.querySelector("[data-cart-subtotal]");
    var feeEl = document.querySelector("[data-cart-fee]");
    var totalEl = document.querySelector("[data-cart-total]");
    if (subEl) {
      subEl.textContent = money(sub);
    }
    if (feeEl) {
      feeEl.textContent = fee === null ? "Escolha o bairro" : fee === 0 ? "Grátis" : money(fee);
    }
    if (totalEl) {
      totalEl.textContent = money(sub + (fee || 0));
    }
  }

  document.querySelectorAll("[data-add]").forEach(function (button) {
    button.addEventListener("click", function () {
      var name = button.getAttribute("data-name");
      var price = parseFloat(button.getAttribute("data-price") || "0");
      var unit = button.getAttribute("data-unit") || "";
      var found = cart.filter(function (line) {
        return line.name === name;
      })[0];
      if (found) {
        found.qty += 1;
      } else {
        cart.push({ name: name, price: price, qty: 1, unit: unit });
      }
      renderCart();
      var original = button.textContent;
      button.textContent = "Adicionado";
      setTimeout(function () {
        button.textContent = original;
      }, 900);
    });
  });

  var feeSelect = document.querySelector("[data-fee-select]");
  if (feeSelect) {
    feeSelect.addEventListener("change", renderCart);
  }
  renderCart();

  /* Formulários que abrem o WhatsApp */
  document.querySelectorAll("[data-whatsapp-form]").forEach(function (form) {
    var errorBox = form.querySelector("[data-form-error]");
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var fields = Array.prototype.slice.call(form.querySelectorAll("input[name], select[name], textarea[name]"));
      var missing = fields.filter(function (field) {
        return field.required && !String(field.value).trim();
      });
      var needsCart = form.hasAttribute("data-needs-cart");
      var problems = missing.map(labelOf);
      if (needsCart && !cart.length) {
        problems.unshift(form.getAttribute("data-cart-name") || "adicione pelo menos um item");
      }
      if (problems.length) {
        errorBox.textContent =
          "Falta preencher: " +
          problems
            .map(function (text) {
              return /^[A-ZÀ-Ú]{2}/.test(text) ? text : text.charAt(0).toLowerCase() + text.slice(1);
            })
            .join(", ") +
          ".";
        errorBox.hidden = false;
        if (missing.length) {
          missing[0].focus();
        }
        return;
      }
      errorBox.hidden = true;

      var lines = [form.getAttribute("data-intro") || "Olá!", ""];
      if (needsCart) {
        lines.push(form.getAttribute("data-cart-title") || "Itens:");
        cart.forEach(function (line) {
          lines.push("- " + line.qty + (line.unit ? " " + line.unit : "x") + " " + line.name + (line.price ? " (" + money(line.price * line.qty) + ")" : ""));
        });
        if (cartSubtotal() > 0) {
          var fee = selectedFee();
          lines.push("Subtotal: " + money(cartSubtotal()));
          if (fee !== null) {
            lines.push("Entrega: " + (fee === 0 ? "grátis" : money(fee)));
            lines.push("Total: " + money(cartSubtotal() + fee));
          }
        }
        lines.push("");
      }
      fields.forEach(function (field) {
        var value = String(field.value).trim();
        if (value) {
          lines.push(labelOf(field) + ": " + value);
        }
      });
      var phone = form.getAttribute("data-whatsapp") || "5500000000000";
      window.location.href = "https://wa.me/" + phone + "?text=" + encodeURIComponent(lines.join("\n"));
    });
  });
})();
