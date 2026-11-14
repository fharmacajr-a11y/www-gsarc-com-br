(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var body = document.body;

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function brl(v) {
    return "R$ " + v.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  function wa(number, text) {
    return "https://wa.me/" + number + "?text=" + encodeURIComponent(text);
  }

  var toastEl = null;
  var toastTimer = null;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toastEl.classList.remove("is-on");
    }, 2200);
  }

  /* ---------------------------------------------------------- menu */
  var menuBtn = $("[data-menu-btn]");
  var menu = $("[data-menu]");

  function setMenu(open) {
    if (!menuBtn || !menu) return;
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    var label = $(".menu-btn__label", menuBtn);
    if (label) label.textContent = open ? "Fechar" : "Menu";
    menu.hidden = !open;
  }

  if (menuBtn && menu) {
    menuBtn.addEventListener("click", function () {
      setMenu(menu.hidden);
    });
    menu.addEventListener("click", function (event) {
      if (event.target.closest("a")) setMenu(false);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1100) setMenu(false);
    });
  }

  /* ---------------------------------------------------------- header shadow */
  var header = $("[data-header]");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------------------------------------------------------- active nav (one page) */
  var navLinks = $$(".nav a[href^='#']");
  if ("IntersectionObserver" in window && navLinks.length) {
    var byId = {};
    navLinks.forEach(function (link) {
      byId[link.getAttribute("href").slice(1)] = link;
    });
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          navLinks.forEach(function (l) {
            l.classList.remove("is-active");
          });
          var link = entry.target.id ? byId[entry.target.id] : null;
          if (link) link.classList.add("is-active");
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    $$("main > section, main > div").forEach(function (section) {
      navObserver.observe(section);
    });
  }

  /* ---------------------------------------------------------- open now */
  var hoursData = body.getAttribute("data-hours");
  if (hoursData) {
    var hours = {};
    try {
      hours = JSON.parse(hoursData);
    } catch (e) {
      hours = {};
    }
    var now = new Date();
    var day = now.getDay();
    var h = now.getHours() + now.getMinutes() / 60;
    var fmt = function (x) {
      var hh = Math.floor(x);
      var mm = Math.round((x - hh) * 60);
      return hh + "h" + (mm ? String(mm).padStart(2, "0") : "");
    };
    var today = hours[day];
    var text;
    var open = false;
    if (today === "24h") {
      open = true;
      text = "Aberta agora · 24 horas";
    } else if (today && h >= today[0] && h < today[1]) {
      open = true;
      text = "Aberta agora · fecha às " + fmt(today[1]);
    } else {
      var next = null;
      for (var i = 0; i < 8; i++) {
        var d = (day + i) % 7;
        var slot = hours[d];
        if (!slot) continue;
        if (slot === "24h") {
          next = [i, 0];
          break;
        }
        if (i === 0 && h >= slot[0]) continue;
        next = [i, slot[0]];
        break;
      }
      var names = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
      if (next) {
        var when = next[0] === 0 ? "hoje" : next[0] === 1 ? "amanhã" : names[(day + next[0]) % 7];
        text = "Fechada agora · abre " + when + " às " + fmt(next[1]);
      } else {
        text = "Fechada agora";
      }
    }
    $$("[data-open-status]").forEach(function (el) {
      el.textContent = text;
      if (!open) el.setAttribute("data-closed", "");
    });
    $$("[data-when-closed]").forEach(function (el) {
      el.hidden = open;
    });
    $$("[data-when-open]").forEach(function (el) {
      el.hidden = !open;
    });
    $$("[data-day]").forEach(function (row) {
      var days = row.getAttribute("data-day").split(",").map(Number);
      if (days.indexOf(day) !== -1) row.classList.add("is-today");
    });
  }

  /* ---------------------------------------------------------- WhatsApp forms */
  // "Seu nome" -> "seu nome", mas mantém CNPJ, WhatsApp e nomes próprios; tira o "?" do fim.
  function softLower(text) {
    text = text.replace(/[?:]\s*$/, "");
    var first = text.split(" ")[0];
    return /^[A-ZÀ-Ý][a-zà-ÿ]*$/.test(first) ? text.charAt(0).toLowerCase() + text.slice(1) : text;
  }

  function labelOf(field) {
    if (field.getAttribute("data-label")) return field.getAttribute("data-label");
    var lab = field.closest("label");
    if (lab) {
      var span = lab.querySelector("span");
      return (span ? span.textContent : lab.textContent).replace("*", "").trim();
    }
    return field.name;
  }

  function validate(form, errorBox) {
    $$("[aria-invalid]", form).forEach(function (el) {
      el.removeAttribute("aria-invalid");
    });
    var missing = [];
    var seen = {};
    $$("[required]", form).forEach(function (field) {
      if (seen[field.name]) return;
      seen[field.name] = true;
      if (field.closest("[hidden]")) return;
      var ok;
      if (field.type === "radio") {
        ok = !!form.querySelector('[name="' + field.name + '"]:checked');
      } else if (field.type === "checkbox") {
        ok = field.checked;
      } else {
        ok = !!String(field.value || "").trim();
      }
      if (!ok) missing.push(field);
    });
    if (missing.length) {
      missing.forEach(function (f) {
        f.setAttribute("aria-invalid", "true");
      });
      if (errorBox) {
        errorBox.textContent =
          "Preencha: " +
          missing
            .map(function (f) {
              return softLower(f.type === "radio" ? (f.closest("fieldset") ? $("legend", f.closest("fieldset")).textContent.replace("*", "").trim() : f.name) : labelOf(f));
            })
            .join(", ") +
          ".";
        errorBox.hidden = false;
      }
      missing[0].focus();
      return false;
    }
    if (errorBox) errorBox.hidden = true;
    return true;
  }

  function formLines(form) {
    var lines = [];
    var done = {};
    $$("input, select, textarea", form).forEach(function (field) {
      if (!field.name || done[field.name] || field.hasAttribute("data-wa-skip") || field.closest("[hidden]")) return;
      if (field.type === "submit" || field.type === "button") return;
      var value;
      var label;
      if (field.type === "radio") {
        done[field.name] = true;
        var checked = form.querySelector('[name="' + field.name + '"]:checked');
        value = checked ? checked.value : "";
        var fs = field.closest("fieldset");
        label = field.getAttribute("data-label") || (fs ? $("legend", fs).textContent.replace("*", "").trim() : field.name);
      } else if (field.type === "checkbox") {
        if (!field.checked) return;
        value = "sim";
        label = labelOf(field);
      } else {
        value = String(field.value || "").trim();
        label = labelOf(field);
      }
      if (value) lines.push(label + ": " + value);
    });
    return lines;
  }

  /* forms with a pickup/delivery choice: show [data-delivery-only] only for delivery */
  function bindDelivery(form, after) {
    var sync = function () {
      var mode = form.querySelector('[name="entrega"]:checked');
      var isDelivery = !!mode && mode.value.indexOf("Entrega") === 0;
      $$("[data-delivery-only]", form).forEach(function (el) {
        el.hidden = !isDelivery;
      });
      if (after) after();
    };
    form.addEventListener("change", function (event) {
      if (event.target.name === "entrega" || event.target.name === "bairro") sync();
    });
    sync();
  }

  $$("form[data-wa-form]").forEach(function (form) {
    var errorBox = $("[data-form-error]", form);
    bindDelivery(form);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!validate(form, errorBox)) return;
      var text = (form.getAttribute("data-wa-title") || "Olá!") + "\n\n" + formLines(form).join("\n");
      var extra = form.getAttribute("data-wa-footer");
      if (extra) text += "\n\n" + extra;
      window.location.href = wa(form.getAttribute("data-whatsapp"), text);
    });
  });

  /* ---------------------------------------------------------- clear the error mark once a field is filled */
  ["input", "change"].forEach(function (type) {
    document.addEventListener(type, function (event) {
      var f = event.target;
      if (!f || !f.name || !f.form) return;
      var group = f.type === "radio" ? f.form.querySelectorAll('[name="' + f.name + '"]') : [f];
      var filled = f.type === "radio" ? f.checked : f.type === "checkbox" ? f.checked : !!String(f.value || "").trim();
      if (!filled) return;
      Array.prototype.forEach.call(group, function (el) {
        el.removeAttribute("aria-invalid");
      });
    });
  });

  /* ---------------------------------------------------------- filters */
  $$("[data-filter]").forEach(function (root) {
    var items = $$("[data-item]", root);
    var chips = $$("[data-filter-btn]", root);
    var search = $("[data-filter-search]", root);
    var selects = $$("[data-filter-by]", root);
    var countEl = $("[data-filter-count]", root);
    var emptyEl = $("[data-filter-empty]", root);
    var noun = root.getAttribute("data-filter-noun") || "itens";
    var nounOne = root.getAttribute("data-filter-noun-one") || "item";
    var current = "todos";

    function norm(s) {
      return String(s || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
    }

    function apply() {
      var q = search ? norm(search.value.trim()) : "";
      var shown = 0;
      items.forEach(function (item) {
        var cats = (item.getAttribute("data-cat") || "").split(" ");
        var okCat = current === "todos" || cats.indexOf(current) !== -1 || cats.indexOf("todas") !== -1;
        var okText = !q || norm(item.getAttribute("data-text") || item.textContent).indexOf(q) !== -1;
        var okSel = selects.every(function (sel) {
          return !sel.value || (item.getAttribute("data-" + sel.getAttribute("data-filter-by")) || "").split(" ").indexOf(sel.value) !== -1;
        });
        item.hidden = !(okCat && okText && okSel);
        if (!item.hidden) shown++;
      });
      chips.forEach(function (c) {
        c.setAttribute("aria-pressed", c.getAttribute("data-filter-btn") === current ? "true" : "false");
      });
      if (countEl) countEl.textContent = shown + " " + (shown === 1 ? nounOne : noun) + (shown === 1 ? " encontrado" : " encontrados") + ".";
      if (countEl && root.hasAttribute("data-filter-fem")) countEl.textContent = countEl.textContent.replace("encontrados", "encontradas").replace("encontrado.", "encontrada.");
      if (emptyEl) emptyEl.hidden = shown !== 0;
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        current = chip.getAttribute("data-filter-btn");
        apply();
      });
    });
    if (search) search.addEventListener("input", apply);
    selects.forEach(function (sel) {
      sel.addEventListener("change", apply);
    });
    $$("[data-filter-reset]", root).forEach(function (btn) {
      btn.addEventListener("click", function () {
        current = "todos";
        if (search) search.value = "";
        selects.forEach(function (sel) {
          sel.value = "";
        });
        apply();
        if (search) search.focus();
      });
    });
    var params = new URLSearchParams(window.location.search);
    var wanted = params.get(root.getAttribute("data-filter-param") || "cat");
    if (wanted && chips.some(function (c) { return c.getAttribute("data-filter-btn") === wanted; })) current = wanted;
    var qName = root.getAttribute("data-filter-q") || "q";
    if (search && params.get(qName)) search.value = params.get(qName);
    apply();
  });

  /* ---------------------------------------------------------- jump to a filter (e.g. city select in the hero) */
  $$("[data-jump-filter]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var select = $("select", form);
      var target = $(form.getAttribute("data-jump-filter"));
      if (!target) return;
      var chip = select && select.value ? $('[data-filter-btn="' + select.value + '"]', target) : null;
      if (chip) chip.click();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      var first = chip || $("[data-filter-btn]", target);
      if (first) first.focus({ preventScroll: true });
    });
  });

  /* ---------------------------------------------------------- links that prefill a form field (e.g. job opening) */
  $$("[data-prefill]").forEach(function (link) {
    link.addEventListener("click", function () {
      var raw = link.getAttribute("data-prefill");
      var cut = raw.indexOf("=");
      var field = document.querySelector('[name="' + raw.slice(0, cut) + '"]');
      if (!field) return;
      field.value = raw.slice(cut + 1);
      field.dispatchEvent(new Event("change", { bubbles: true }));
    });
  });

  /* ---------------------------------------------------------- share links */
  $$("[data-share]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var url = window.location.href.split("#")[0] + "#" + btn.getAttribute("data-share");
      var done = function () {
        toast("Link da oferta copiado");
      };
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        navigator.share({ title: document.title, url: url }).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(done, done);
      } else {
        done();
      }
    });
  });

  /* ---------------------------------------------------------- order by WhatsApp (single product) */
  var storeSelect = $("[data-store-select]");
  $$("[data-order]").forEach(function (btn) {
    btn.addEventListener("click", function (event) {
      event.preventDefault();
      var number = body.getAttribute("data-whatsapp");
      var store = "";
      if (storeSelect) {
        if (!storeSelect.value) {
          storeSelect.setAttribute("aria-invalid", "true");
          storeSelect.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
          storeSelect.focus({ preventScroll: true });
          toast("Escolha a loja para receber o pedido");
          return;
        }
        storeSelect.removeAttribute("aria-invalid");
        var picked = storeSelect.options[storeSelect.selectedIndex];
        number = picked.getAttribute("data-wa") || storeSelect.value;
        store = " (loja " + (picked.getAttribute("data-name") || picked.text) + ")";
      }
      var text = "Olá! Quero pedir esta oferta" + store + ":\n\n" + btn.getAttribute("data-order");
      window.location.href = wa(number, text);
    });
  });
  if (storeSelect) {
    try {
      var saved = localStorage.getItem("demo-store");
      if (saved) storeSelect.value = saved;
    } catch (e) {}
    var syncStore = function (fromUser) {
      var picked = storeSelect.options[storeSelect.selectedIndex];
      $$("[data-store-name]").forEach(function (el) {
        el.textContent = storeSelect.value ? picked.getAttribute("data-name") || picked.text : el.getAttribute("data-store-name");
      });
      var region = picked ? picked.getAttribute("data-region") : null;
      var chip = region ? $('[data-filter-btn="' + region + '"]') : null;
      if (chip && fromUser) chip.click();
    };
    storeSelect.addEventListener("change", function () {
      storeSelect.removeAttribute("aria-invalid");
      try {
        localStorage.setItem("demo-store", storeSelect.value);
      } catch (e) {}
      syncStore(true);
    });
    syncStore(false);
  }

  /* ---------------------------------------------------------- delivery fee checker */
  $$("[data-fee-check]").forEach(function (select) {
    var out = $(select.getAttribute("data-fee-check"));
    var initial = out.textContent;
    select.addEventListener("change", function () {
      var opt = select.options[select.selectedIndex];
      out.classList.toggle("is-set", !!opt.value);
      if (!opt.value) {
        out.textContent = initial;
        return;
      }
      var fee = parseFloat(opt.getAttribute("data-fee"));
      var eta = opt.getAttribute("data-eta");
      out.textContent = (fee === 0 ? "Entrega grátis" : "Taxa de entrega " + brl(fee)) + (eta ? " · chega em até " + eta : "") + ".";
    });
  });

  /* ---------------------------------------------------------- cart */
  var cartKey = body.getAttribute("data-cart");
  if (cartKey) {
    var showPrices = body.getAttribute("data-cart-prices") !== "off";
    var maxQty = parseInt(body.getAttribute("data-cart-max") || "99", 10);
    var cart = {};
    try {
      cart = JSON.parse(localStorage.getItem(cartKey) || "{}") || {};
    } catch (e) {
      cart = {};
    }
    var drawer = $("[data-drawer]");
    var linesEl = $("[data-cart-lines]");
    var cartForm = $("[data-cart-form]");
    var lastFocus = null;

    var save = function () {
      try {
        localStorage.setItem(cartKey, JSON.stringify(cart));
      } catch (e) {}
    };

    var count = function () {
      return Object.keys(cart).reduce(function (n, id) {
        return n + cart[id].qty;
      }, 0);
    };

    var subtotal = function () {
      return Object.keys(cart).reduce(function (s, id) {
        return s + cart[id].qty * cart[id].price;
      }, 0);
    };

    var fee = function () {
      if (!cartForm) return 0;
      var mode = cartForm.querySelector('[name="entrega"]:checked');
      if (!mode || mode.value.indexOf("Entrega") !== 0) return 0;
      var b = cartForm.querySelector('[name="bairro"]');
      if (!b || !b.value) return 0;
      return parseFloat(b.options[b.selectedIndex].getAttribute("data-fee") || "0");
    };

    var render = function () {
      var n = body.getAttribute("data-cart-count-mode") === "lines" ? Object.keys(cart).length : count();
      $$("[data-cart-count]").forEach(function (el) {
        el.textContent = n;
        if (n) el.removeAttribute("data-zero");
        else el.setAttribute("data-zero", "");
      });
      $$("[data-add]").forEach(function (btn) {
        var inCart = !!cart[btn.getAttribute("data-id")];
        btn.classList.toggle("is-added", inCart && !btn.hasAttribute("data-qty-from"));
        var lbl = $("[data-add-label]", btn);
        if (lbl && !btn.hasAttribute("data-qty-from")) lbl.textContent = inCart ? btn.getAttribute("data-added-text") || "Na lista" : btn.getAttribute("data-add-text") || "Adicionar";
      });
      if (!linesEl) return;
      var ids = Object.keys(cart);
      var footer = $("[data-cart-foot]");
      if (!ids.length) {
        linesEl.innerHTML = '<p class="cart-empty">' + (body.getAttribute("data-cart-empty") || "Sua lista está vazia.") + "</p>";
        if (footer) footer.hidden = true;
      } else {
        if (footer) footer.hidden = false;
        linesEl.innerHTML = ids
          .map(function (id) {
            var it = cart[id];
            return (
              '<div class="cart-line" data-line="' + id + '">' +
              (it.img ? '<img src="' + it.img + '" alt="" width="64" height="64" loading="lazy" />' : '<span class="cart-line__ph" aria-hidden="true">' + (it.ph || "") + "</span>") +
              "<div><p class=\"cart-line__name\">" + it.name + "</p>" +
              (showPrices ? '<p class="cart-line__price">' + brl(it.price) + " cada</p>" : '<p class="cart-line__price">' + (it.size || "") + "</p>") +
              '<button type="button" class="cart-line__remove" data-remove="' + id + '">Remover</button></div>' +
              '<div class="qty" aria-label="Quantidade de ' + it.name + '">' +
              '<button type="button" data-dec="' + id + '" aria-label="Diminuir">−</button>' +
              '<input type="number" min="1" max="' + maxQty + '" value="' + it.qty + '" data-qty="' + id + '" aria-label="Quantidade" />' +
              '<button type="button" data-inc="' + id + '" aria-label="Aumentar">+</button></div></div>'
            );
          })
          .join("");
      }
      var sub = subtotal();
      var f = fee();
      var set = function (sel, v) {
        $$(sel).forEach(function (el) {
          el.textContent = v;
        });
      };
      set("[data-cart-subtotal]", brl(sub));
      var vols = count();
      set("[data-cart-skus]", ids.length + (ids.length === 1 ? " produto" : " produtos"));
      var volUnit = (body.getAttribute("data-cart-vol-unit") || "volume|volumes").split("|");
      set("[data-cart-volumes]", vols.toLocaleString("pt-BR") + " " + (vols === 1 ? volUnit[0] : volUnit[1] || volUnit[0]));
      set("[data-cart-fee]", f ? brl(f) : "—");
      set("[data-cart-total]", brl(sub + f));
    };

    var openDrawer = function () {
      if (!drawer) return;
      lastFocus = document.activeElement;
      drawer.hidden = false;
      body.style.overflow = "hidden";
      var first = $(".drawer__panel [data-cart-close]", drawer);
      if (first) first.focus();
    };

    var closeDrawer = function () {
      if (!drawer || drawer.hidden) return;
      drawer.hidden = true;
      body.style.overflow = "";
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };

    $$("[data-cart-open]").forEach(function (btn) {
      btn.addEventListener("click", function (event) {
        if (!drawer) return;
        event.preventDefault();
        openDrawer();
      });
    });
    $$("[data-cart-close]").forEach(function (btn) {
      btn.addEventListener("click", closeDrawer);
    });
    if (drawer) {
      drawer.addEventListener("click", function (event) {
        if (event.target === drawer) closeDrawer();
      });
    }
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        if (drawer && !drawer.hidden) closeDrawer();
        else if (menu && !menu.hidden) {
          setMenu(false);
          menuBtn.focus();
        }
      }
    });

    $$("[data-add]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-id");
        var qty = 1;
        var from = btn.getAttribute("data-qty-from");
        if (from && $(from)) qty = Math.max(1, Math.min(maxQty, parseInt($(from).value, 10) || 1));
        if (cart[id] && !from) {
          openDrawer();
          return;
        }
        cart[id] = {
          name: btn.getAttribute("data-name"),
          price: parseFloat(btn.getAttribute("data-price") || "0"),
          img: btn.getAttribute("data-img") || "",
          ph: btn.getAttribute("data-ph") || "",
          size: btn.getAttribute("data-size") || "",
          unit: btn.getAttribute("data-unit") || "",
          qty: Math.min(maxQty, (cart[id] ? cart[id].qty : 0) + qty)
        };
        save();
        render();
        toast(body.getAttribute("data-cart-toast") || "Adicionado à lista");
      });
    });

    if (linesEl) {
      linesEl.addEventListener("click", function (event) {
        var t = event.target.closest("button");
        if (!t) return;
        var id = t.getAttribute("data-inc") || t.getAttribute("data-dec") || t.getAttribute("data-remove");
        if (!id || !cart[id]) return;
        if (t.hasAttribute("data-inc")) cart[id].qty = Math.min(maxQty, cart[id].qty + 1);
        if (t.hasAttribute("data-dec")) cart[id].qty -= 1;
        if (t.hasAttribute("data-remove") || cart[id].qty < 1) delete cart[id];
        save();
        render();
        var again = $('[data-line="' + id + '"] [data-' + (t.hasAttribute("data-inc") ? "inc" : "dec") + "]", linesEl);
        if (again) again.focus();
      });
      linesEl.addEventListener("change", function (event) {
        var id = event.target.getAttribute("data-qty");
        if (!id || !cart[id]) return;
        var v = parseInt(event.target.value, 10);
        if (!v || v < 1) delete cart[id];
        else cart[id].qty = Math.min(maxQty, v);
        save();
        render();
      });
    }

    $$("[data-qty-step]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var input = $(btn.getAttribute("data-target"));
        var v = (parseInt(input.value, 10) || 1) + parseInt(btn.getAttribute("data-qty-step"), 10);
        input.value = Math.max(1, Math.min(parseInt(input.getAttribute("max") || maxQty, 10), v));
      });
    });

    if (cartForm) {
      var errorBox = $("[data-form-error]", cartForm);
      bindDelivery(cartForm, render);
      cartForm.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!Object.keys(cart).length) {
          toast("Adicione pelo menos um produto");
          return;
        }
        if (!validate(cartForm, errorBox)) return;
        var lines = [body.getAttribute("data-cart-title") || "Olá! Quero fazer um pedido:", ""];
        Object.keys(cart).forEach(function (id) {
          var it = cart[id];
          var units = (it.unit || "").split("|");
          var unitTxt = it.qty === 1 ? units[0] : units[1] || units[0];
          lines.push((it.unit ? it.qty + " " + unitTxt + " · " : it.qty + "x ") + it.name + (it.size ? " (" + it.size + ")" : "") + (showPrices ? " · " + brl(it.price * it.qty) : ""));
        });
        if (showPrices) {
          lines.push("");
          lines.push("Subtotal: " + brl(subtotal()));
          var f = fee();
          if (f) lines.push("Taxa de entrega: " + brl(f));
          lines.push("Total estimado: " + brl(subtotal() + f));
        }
        lines.push("");
        lines = lines.concat(formLines(cartForm));
        var footerNote = body.getAttribute("data-cart-footer");
        if (footerNote) lines.push("", footerNote);
        window.location.href = wa(body.getAttribute("data-whatsapp"), lines.join("\n"));
      });
    }

    window.addEventListener("storage", function (event) {
      if (event.key !== cartKey) return;
      try {
        cart = JSON.parse(event.newValue || "{}") || {};
      } catch (e) {
        cart = {};
      }
      render();
    });

    render();
  } else {
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && menu && !menu.hidden) {
        setMenu(false);
        menuBtn.focus();
      }
    });
  }

  /* ---------------------------------------------------------- year */
  $$("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
