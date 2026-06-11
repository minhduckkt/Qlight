(function () {
  var keywordInput = document.getElementById("catalogKeyword") || document.getElementById("catalogSearch");
  var countLabel = document.getElementById("catalogCount");
  var resetButton = document.getElementById("catalogReset");
  var grid = document.getElementById("catalogProductGrid") || document.querySelector(".catalog-grid");
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll("[data-catalog-category], [data-filter]"));

  if (!keywordInput || !grid) return;

  var cards = Array.prototype.slice.call(grid.querySelectorAll(".catalog-product-card, .catalog-card"));
  var activeCategory = "";
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

  function normalize(value) {
    return (value || "")
      .toString()
      .toLocaleLowerCase("vi-VN")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function updateCatalog() {
    var keyword = normalize(keywordInput.value);
    var visible = 0;

    cards.forEach(function (card) {
      var categoryMatch = !activeCategory || card.dataset.category === activeCategory;
      var text = normalize((card.dataset.search || "") + " " + card.textContent);
      var keywordMatch = !keyword || text.indexOf(keyword) !== -1;
      var show = categoryMatch && keywordMatch;
      card.hidden = !show;
      if (show) visible += 1;
    });

    if (countLabel) {
      countLabel.textContent = visible + " / " + cards.length + " sản phẩm phù hợp";
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
      var target = document.getElementById("catalog-list");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  function setActiveCategory(category) {
    activeCategory = category || "";
    filterButtons.forEach(function (item) {
      item.classList.toggle("active", (item.dataset.catalogCategory || "") === activeCategory);
    });
    updateCatalog();
  }

  keywordInput.addEventListener("input", updateCatalog);

  if (resetButton) {
    resetButton.addEventListener("click", function () {
      keywordInput.value = "";
      activeCategory = "";
      filterButtons.forEach(function (item, index) {
        item.classList.toggle("active", index === 0);
      });
      updateCatalog();
    });
  }

  try {
    var params = new URLSearchParams(window.location.search);
    var categoryParam = params.get("category");
    if (categoryParam && categoryAliases[categoryParam]) {
      setActiveCategory(categoryAliases[categoryParam]);
    }
  } catch (error) {
    updateCatalog();
  }

  updateCatalog();
})();
