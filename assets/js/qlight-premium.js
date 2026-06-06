(function () {
  var header = document.getElementById("siteHeader");
  var toggle = document.querySelector(".menu-toggle");
  var menu = document.getElementById("primaryMenu");
  var form = document.getElementById("quoteForm");
  var catalogSearch = document.getElementById("catalogSearch");
  var catalogCount = document.getElementById("catalogCount");
  var catalogEmpty = document.getElementById("catalogEmpty");
  var catalogCards = Array.prototype.slice.call(document.querySelectorAll(".catalog-card"));
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
  var activeFilter = "all";
  var partSearch = document.getElementById("partSearch");
  var partCount = document.getElementById("partCount");
  var partEmpty = document.getElementById("partEmpty");
  var partShowMore = document.getElementById("partShowMore");
  var partReset = document.getElementById("partReset");
  var partRows = Array.prototype.slice.call(document.querySelectorAll(".part-row"));
  var partFilters = ["partModel", "partVoltage", "partColor", "partIp"]
    .map(function (id) {
      return document.getElementById(id);
    })
    .filter(Boolean);
  var partLineLinks = Array.prototype.slice.call(document.querySelectorAll(".part-line-link"));
  var partDisplayLimit = 80;
  var partBatchSize = 80;

  function updateHeader() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var isOpen = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      document.body.classList.toggle("menu-open", isOpen);
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("menu-open");
      });
    });
  }

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var formData = new FormData(form);
      var name = (formData.get("name") || "anh/chị").toString().trim();
      alert("Cảm ơn " + name + ". Qlight Vietnam đã nhận yêu cầu và sẽ liên hệ lại trong giờ làm việc.");
      form.reset();
    });
  }

  function normalizeText(value) {
    return (value || "")
      .toString()
      .toLocaleLowerCase("vi-VN")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function updateCatalog() {
    if (!catalogCards.length) return;
    var keyword = normalizeText(catalogSearch ? catalogSearch.value : "");
    var visibleCount = 0;

    catalogCards.forEach(function (card) {
      var categoryMatch = activeFilter === "all" || card.dataset.category === activeFilter;
      var searchSource = normalizeText((card.dataset.search || "") + " " + card.textContent);
      var searchMatch = !keyword || searchSource.indexOf(keyword) !== -1;
      var isVisible = categoryMatch && searchMatch;

      card.hidden = !isVisible;
      if (isVisible) visibleCount += 1;
    });

    if (catalogCount) {
      catalogCount.textContent = visibleCount + " dòng đang hiển thị";
    }

    if (catalogEmpty) {
      catalogEmpty.hidden = visibleCount !== 0;
    }
  }

  function getPartFilterValue(id) {
    var field = document.getElementById(id);
    return field ? field.value : "";
  }

  function updatePartLookup(resetLimit) {
    if (!partRows.length) return;
    if (resetLimit) {
      partDisplayLimit = partBatchSize;
    }

    var keyword = normalizeText(partSearch ? partSearch.value : "");
    var model = getPartFilterValue("partModel");
    var voltage = getPartFilterValue("partVoltage");
    var color = getPartFilterValue("partColor");
    var ip = getPartFilterValue("partIp");
    var matchCount = 0;
    var shownCount = 0;

    partRows.forEach(function (row) {
      var searchSource = normalizeText((row.dataset.search || "") + " " + row.textContent);
      var isMatch = true;

      if (keyword && searchSource.indexOf(keyword) === -1) {
        isMatch = false;
      }

      if (model && row.dataset.model !== model) {
        isMatch = false;
      }

      if (voltage && row.dataset.voltage !== voltage) {
        isMatch = false;
      }

      if (color && row.dataset.color !== color) {
        isMatch = false;
      }

      if (ip && row.dataset.ip !== ip) {
        isMatch = false;
      }

      if (isMatch) {
        matchCount += 1;
        if (matchCount <= partDisplayLimit) {
          row.hidden = false;
          shownCount += 1;
        } else {
          row.hidden = true;
        }
      } else {
        row.hidden = true;
      }
    });

    if (partCount) {
      partCount.textContent = shownCount + " / " + matchCount + " mã phù hợp đang hiển thị";
    }

    if (partEmpty) {
      partEmpty.hidden = matchCount !== 0;
    }

    if (partShowMore) {
      partShowMore.hidden = shownCount >= matchCount;
    }
  }

  if (catalogCards.length) {
    filterButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        activeFilter = button.dataset.filter || "all";
        filterButtons.forEach(function (item) {
          item.classList.toggle("active", item === button);
        });
        updateCatalog();
      });
    });

    if (catalogSearch) {
      catalogSearch.addEventListener("input", updateCatalog);
    }

    updateCatalog();
  }

  if (partRows.length) {
    if (partSearch) {
      partSearch.addEventListener("input", function () {
        updatePartLookup(true);
      });
    }

    partFilters.forEach(function (field) {
      field.addEventListener("change", function () {
        updatePartLookup(true);
      });
    });

    if (partShowMore) {
      partShowMore.addEventListener("click", function () {
        partDisplayLimit += partBatchSize;
        updatePartLookup(false);
      });
    }

    if (partReset) {
      partReset.addEventListener("click", function () {
        if (partSearch) {
          partSearch.value = "";
        }
        partFilters.forEach(function (field) {
          field.value = "";
        });
        updatePartLookup(true);
      });
    }

    partLineLinks.forEach(function (link) {
      link.addEventListener("click", function () {
        if (partSearch) {
          partSearch.value = link.dataset.partQuery || "";
          partFilters.forEach(function (field) {
            field.value = "";
          });
          updatePartLookup(true);
        }
      });
    });

    updatePartLookup(true);
  }
})();
