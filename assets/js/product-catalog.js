(function () {
  var keywordInput = document.getElementById("catalogKeyword") || document.getElementById("catalogSearch");
  var countLabel = document.getElementById("catalogCount");
  var resetButton = document.getElementById("catalogReset");
  var grid = document.getElementById("catalogProductGrid") || document.querySelector(".catalog-grid");
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll("[data-catalog-category], [data-filter]"));

  function normalize(value) {
    return (value || "")
      .toString()
      .toLocaleLowerCase("vi-VN")
      .replace(/[øØ]/g, "o")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[–—−]/g, "-");
  }

  function searchable(value) {
    return normalize(value)
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function compact(value) {
    return normalize(value).replace(/[^a-z0-9]+/g, "");
  }

  function tokenize(value) {
    return searchable(value).split(/\s+/).filter(Boolean);
  }

  function matchesTokens(value, tokens) {
    if (!tokens.length) return true;
    var text = searchable(value);
    var compactText = compact(value);
    return tokens.every(function (token) {
      return text.indexOf(token) !== -1 || compactText.indexOf(compact(token)) !== -1;
    });
  }

  function createEmptyMessage(target, text) {
    var message = document.createElement("p");
    message.className = "catalog-empty";
    message.hidden = true;
    message.textContent = text;
    target.parentNode.insertBefore(message, target.nextSibling);
    return message;
  }

  function setupCatalogSearch() {
    if (!keywordInput || !grid) return;

    var cards = Array.prototype.slice.call(grid.querySelectorAll(".catalog-product-card, .catalog-card"));
    if (!cards.length) return;

    var emptyMessage = document.getElementById("catalogEmpty") ||
      createEmptyMessage(grid, "Không tìm thấy sản phẩm phù hợp.");
    var activeCategory = "";
    var countUnit = cards[0].classList && cards[0].classList.contains("catalog-card") ? "dòng" : "sản phẩm";
    var categoryAliases = {
      "den-thap-tin-hieu": "Đèn tháp tín hiệu",
      "den-canh-bao": "Đèn cảnh báo, còi và thiết bị báo hiệu",
      "coi-chuong-bao": "Đèn cảnh báo, còi và thiết bị báo hiệu",
      "chong-chay-no": "Thiết bị chống cháy nổ",
      "den-led-cong-nghiep": "Đèn LED công nghiệp",
      "smart-factory": "Smart Factory",
      "performance-line": "Performance Line",
      "limit-switch": "Limit Switch"
    };

    function updateCatalog() {
      var tokens = tokenize(keywordInput.value);
      var visible = 0;

      cards.forEach(function (card) {
        var categoryMatch = !activeCategory || card.dataset.category === activeCategory;
        var keywordMatch = matchesTokens(
          (card.dataset.category || "") + " " +
          (card.dataset.series || "") + " " +
          (card.dataset.search || "") + " " +
          card.textContent,
          tokens
        );
        var show = categoryMatch && keywordMatch;
        card.hidden = !show;
        if (show) visible += 1;
      });

      if (countLabel) {
        countLabel.textContent = visible + " / " + cards.length + " " + countUnit + " phù hợp";
      }

      if (emptyMessage) {
        emptyMessage.hidden = visible !== 0;
      }
    }

    filterButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        var category = button.dataset.catalogCategory || button.dataset.filter || "";
        activeCategory = category === "all" ? "" : category;
        filterButtons.forEach(function (item) {
          item.classList.toggle("active", item === button);
        });
        updateCatalog();
        var target = document.getElementById("catalog-list") || grid;
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    function setActiveCategory(category) {
      activeCategory = category || "";
      filterButtons.forEach(function (item) {
        var value = item.dataset.catalogCategory || item.dataset.filter || "";
        item.classList.toggle("active", value === activeCategory || (!activeCategory && value === "all"));
      });
      updateCatalog();
    }

    keywordInput.addEventListener("input", updateCatalog);
    keywordInput.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        keywordInput.value = "";
        updateCatalog();
      }
    });

    if (resetButton) {
      resetButton.addEventListener("click", function () {
        keywordInput.value = "";
        activeCategory = "";
        filterButtons.forEach(function (item, index) {
          item.classList.toggle("active", index === 0);
        });
        updateCatalog();
        keywordInput.focus();
      });
    }

    try {
      var params = new URLSearchParams(window.location.search);
      var categoryParam = params.get("category");
      var keywordParam = params.get("q") || params.get("search") || params.get("keyword");
      if (keywordParam) keywordInput.value = keywordParam;
      if (categoryParam && categoryAliases[categoryParam]) {
        setActiveCategory(categoryAliases[categoryParam]);
        return;
      }
    } catch (error) {
      // Query-string filters are optional.
    }

    updateCatalog();
  }

  function setupPartSearch() {
    var partInput = document.getElementById("partSearch");
    var partRows = Array.prototype.slice.call(document.querySelectorAll(".part-row"));
    if (!partInput || !partRows.length) return;

    var selects = {
      model: document.getElementById("partModel"),
      voltage: document.getElementById("partVoltage"),
      color: document.getElementById("partColor"),
      ip: document.getElementById("partIp")
    };
    var partCount = document.getElementById("partCount");
    var partReset = document.getElementById("partReset");
    var partEmpty = document.getElementById("partEmpty");
    var showMore = document.getElementById("partShowMore");
    var pageSize = 80;
    var shown = pageSize;

    function selectMatch(row, key, select) {
      if (!select || !select.value) return true;
      return normalize(row.dataset[key]) === normalize(select.value);
    }

    function updateParts(keepShown) {
      var tokens = tokenize(partInput.value);
      var matched = 0;
      var visible = 0;

      if (!keepShown) shown = pageSize;

      partRows.forEach(function (row) {
        var isMatch =
          matchesTokens((row.dataset.search || "") + " " + row.textContent, tokens) &&
          selectMatch(row, "model", selects.model) &&
          selectMatch(row, "voltage", selects.voltage) &&
          selectMatch(row, "color", selects.color) &&
          selectMatch(row, "ip", selects.ip);

        if (isMatch) {
          matched += 1;
          row.hidden = matched > shown;
          if (!row.hidden) visible += 1;
        } else {
          row.hidden = true;
        }
      });

      if (partCount) {
        partCount.textContent = visible + " / " + matched + " mã phù hợp đang hiển thị";
      }

      if (partEmpty) {
        partEmpty.hidden = matched !== 0;
      }

      if (showMore) {
        var remaining = matched - visible;
        showMore.hidden = remaining <= 0;
        showMore.textContent = remaining > 0 ? "Hiển thị thêm mã (" + remaining + ")" : "Hiển thị thêm model";
      }
    }

    partInput.addEventListener("input", function () { updateParts(); });
    partInput.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        partInput.value = "";
        updateParts();
      }
    });

    Object.keys(selects).forEach(function (key) {
      if (selects[key]) {
        selects[key].addEventListener("change", function () { updateParts(); });
      }
    });

    if (showMore) {
      showMore.addEventListener("click", function () {
        shown += pageSize;
        updateParts(true);
      });
    }

    if (partReset) {
      partReset.addEventListener("click", function () {
        partInput.value = "";
        Object.keys(selects).forEach(function (key) {
          if (selects[key]) selects[key].value = "";
        });
        updateParts();
        partInput.focus();
      });
    }

    updateParts(true);
  }

  setupCatalogSearch();
  setupPartSearch();
})();
