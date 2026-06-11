(function () {
  var header = document.getElementById("siteHeader");
  var toggle = document.querySelector(".menu-toggle");
  var menu = document.getElementById("primaryMenu");
  var form = document.getElementById("quoteForm");

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
    try {
      var params = new URLSearchParams(window.location.search);
      var model = params.get("model");
      var series = params.get("series");
      var category = params.get("category");
      var productSelect = form.querySelector('[name="product"]');
      var messageField = form.querySelector('[name="message"]');

      if (productSelect && category) {
        Array.prototype.slice.call(productSelect.options).some(function (option) {
          var matched = option.textContent.toLowerCase().indexOf(category.toLowerCase().split(",")[0]) !== -1;
          if (matched) productSelect.value = option.value || option.textContent;
          return matched;
        });
      }

      if (messageField && (model || series || category)) {
        var lines = ["Tôi cần báo giá / tài liệu cho sản phẩm Qlight:"];
        if (model) lines.push("- Model: " + model);
        if (series) lines.push("- Series: " + series);
        if (category) lines.push("- Nhóm sản phẩm: " + category);
        lines.push("- Điện áp / màu / số lượng / môi trường lắp đặt: ");
        messageField.value = lines.join("\n");
      }
    } catch (error) {
      // Query string prefill is optional; keep the demo form usable if parsing fails.
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var formData = new FormData(form);
      var name = (formData.get("name") || "anh/chị").toString().trim();
      alert("Cảm ơn " + name + ". Form này hiện là bản demo chờ cấu hình gửi email. Vui lòng liên hệ sales@qlight.vn, hotline 0938 888 958 hoặc Zalo để gửi yêu cầu thật.");
    });
  }
})();
