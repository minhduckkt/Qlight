(function () {
  var keywordInput = document.getElementById("catalogKeyword");
  var countLabel = document.getElementById("catalogCount");
  var resetButton = document.getElementById("catalogReset");
  var grid = document.getElementById("catalogProductGrid");
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll("[data-catalog-category]"));

  if (!keywordInput || !grid) return;

  var cards = Array.prototype.slice.call(grid.querySelectorAll(".catalog-product-card"));
  var activeCategory = "";
  var PAGE_SIZE = 24;
  var shown = PAGE_SIZE;

  // Tạo nút "Xem thêm" tự động (không cần sửa từng trang HTML)
  var loadMoreWrap = null, loadMoreBtn = null;
  if (cards.length > PAGE_SIZE) {
    loadMoreWrap = document.createElement("div");
    loadMoreWrap.className = "catalog-loadmore";
    loadMoreWrap.style.cssText = "display:flex;justify-content:center;margin-top:28px";
    loadMoreBtn = document.createElement("button");
    loadMoreBtn.type = "button";
    loadMoreBtn.className = "btn btn-secondary";
    loadMoreBtn.textContent = "Xem thêm sản phẩm";
    loadMoreWrap.appendChild(loadMoreBtn);
    grid.parentNode.insertBefore(loadMoreWrap, grid.nextSibling);
    loadMoreBtn.addEventListener("click", function () {
      shown += PAGE_SIZE;
      updateCatalog(true);
    });
  }

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
      .replace(/[̀-ͯ]/g, "");
  }

  function updateCatalog(keepPage) {
    var keyword = normalize(keywordInput.value);
    if (!keepPage) shown = PAGE_SIZE;
    var matched = 0;

    cards.forEach(function (card) {
      var categoryMatch = !activeCategory || card.dataset.category === activeCategory;
      var text = normalize((card.dataset.search || "") + " " + card.textContent);
      var keywordMatch = !keyword || text.indexOf(keyword) !== -1;
      var isMatch = categoryMatch && keywordMatch;
      if (isMatch) {
        matched += 1;
        card.hidden = matched > shown;
      } else {
        card.hidden = true;
      }
    });

    if (countLabel) {
      countLabel.textContent = matched + " / " + cards.length + " sản phẩm phù hợp";
    }

    if (loadMoreWrap) {
      var remaining = matched - shown;
      if (remaining > 0) {
        loadMoreWrap.style.display = "flex";
        loadMoreBtn.textContent = "Xem thêm sản phẩm (còn " + remaining + ")";
      } else {
        loadMoreWrap.style.display = "none";
      }
    }
  }

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      activeCategory = button.dataset.catalogCategory || "";
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

  keywordInput.addEventListener("input", function () { updateCatalog(); });

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
