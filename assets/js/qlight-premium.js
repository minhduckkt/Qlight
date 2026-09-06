(function () {
  // Dán URL Apps Script (.../exec) vào đây sau khi deploy:
  var FORM_ENDPOINT = "https://script.google.com/macros/s/AKfycbxr-qWjcgFdJqSWWl8x2LoHXXEgK8W_LeHpShRRDm8O7fomlkB7LHHkuNj3fr9Yg3BA/exec";

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
      if (form.getAttribute("data-sending") === "1") return;

      var status = form.querySelector(".form-status");
      var button = form.querySelector('button[type="submit"]');
      var trap = form.querySelector('[name="_website"]');
      if (trap && trap.value) return;

      function show(kind, html) {
        if (!status) return;
        status.className = "form-status is-visible is-" + kind;
        status.innerHTML = html;
        status.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }

      var FALLBACK =
        'Không gửi được tự động. Anh/chị vui lòng gửi trực tiếp về ' +
        '<a href="mailto:sales@qlight.vn">sales@qlight.vn</a> hoặc gọi ' +
        '<a href="tel:+84938888958">0938 888 958</a>.';

      if (!/^https?:\/\//.test(FORM_ENDPOINT)) {
        show("err", FALLBACK);
        return;
      }

      var body = new URLSearchParams();
      new FormData(form).forEach(function (value, key) { body.append(key, value); });
      body.append("page", window.location.href);

      var label = button ? button.innerHTML : "";
      form.setAttribute("data-sending", "1");
      if (button) { button.disabled = true; button.textContent = "Đang gửi…"; }
      show("ok", "Đang gửi yêu cầu…");

      fetch(FORM_ENDPOINT, { method: "POST", body: body })
        .then(function (response) {
          return response.json().catch(function () { return { ok: response.ok }; });
        })
        .then(function (data) {
          if (data && data.ok === false) throw new Error(data.error || "failed");
          form.reset();
          show("ok",
            "Đã gửi yêu cầu thành công. Fast Group Engineering sẽ phản hồi trong vòng 24 giờ làm việc. " +
            "Trường hợp gấp, anh/chị gọi <a href=\"tel:+84938888958\">0938 888 958</a>.");
        })
        .catch(function () { show("err", FALLBACK); })
        .then(function () {
          form.setAttribute("data-sending", "0");
          if (button) { button.disabled = false; button.innerHTML = label; }
        });
    });
  }
})();
