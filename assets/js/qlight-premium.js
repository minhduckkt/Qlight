(function () {
  "use strict";

  // URL Apps Script (.../exec). Kiểm tra bằng cách mở URL này trên trình duyệt:
  // đúng  -> {"ok":true,"service":"qlight.vn RFQ endpoint",...}
  // sai   -> trang 404 => deployment đã bị xoá hoặc chưa để "Anyone".
  var FORM_ENDPOINT = "https://script.google.com/macros/s/AKfycbwGDUNHGoWbLUx7zFZZsq5Dwh-M0lVWrhSiApiQveNkW4lPdDcaHsse14Xz-TVxpup5/exec";

  var SALES_EMAIL = "sales@qlight.vn";
  var HOTLINE     = "0938888958";
  var TIMEOUT_MS  = 15000;

  var header = document.getElementById("siteHeader");
  var toggle = document.querySelector(".menu-toggle");
  var menu   = document.getElementById("primaryMenu");
  var form   = document.getElementById("quoteForm");

  /* ------------------------------------------------------------ header */

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

  if (!form) return;

  /* ----------------------------------------------------------- prefill */

  try {
    var params        = new URLSearchParams(window.location.search);
    var model         = params.get("model");
    var series        = params.get("series");
    var category      = params.get("category");
    var productSelect = form.querySelector('[name="product"]');
    var messageField  = form.querySelector('[name="message"]');

    if (productSelect && category) {
      Array.prototype.slice.call(productSelect.options).some(function (option) {
        var matched = option.textContent.toLowerCase()
          .indexOf(category.toLowerCase().split(",")[0]) !== -1;
        if (matched) productSelect.value = option.value || option.textContent;
        return matched;
      });
    }

    if (messageField && !messageField.value && (model || series || category)) {
      var lines = ["Tôi cần báo giá / tài liệu cho sản phẩm Qlight:"];
      if (model)    lines.push("- Model: " + model);
      if (series)   lines.push("- Series: " + series);
      if (category) lines.push("- Nhóm sản phẩm: " + category);
      lines.push("- Điện áp / màu / số lượng / môi trường lắp đặt: ");
      messageField.value = lines.join("\n");
    }
  } catch (error) {
    /* prefill là tuỳ chọn, hỏng cũng không chặn form */
  }

  /* ------------------------------------------------------------ submit */

  var LABELS = {
    name: "Họ tên", company: "Công ty", email: "Email", phone: "Điện thoại",
    product: "Nhóm sản phẩm", quantity: "Số lượng", deadline: "Cần hàng",
    message: "Nội dung"
  };

  function collect() {
    var data = {};
    new FormData(form).forEach(function (value, key) {
      if (key !== "_website") data[key] = String(value).trim();
    });
    data.page = window.location.href;
    return data;
  }

  /** Link mailto điền sẵn toàn bộ nội dung — để lead không mất khi endpoint hỏng. */
  function mailtoLink(data) {
    var subject = "[RFQ qlight.vn] " + (data.name || "Yêu cầu báo giá")
                + (data.company ? " - " + data.company : "");
    var body = [];
    Object.keys(LABELS).forEach(function (key) {
      if (data[key]) body.push(LABELS[key] + ": " + data[key]);
    });
    body.push("Trang gửi: " + data.page);
    return "mailto:" + SALES_EMAIL
         + "?subject=" + encodeURIComponent(subject)
         + "&body="    + encodeURIComponent(body.join("\n"));
  }

  function track(eventName, data) {
    try {
      if (typeof window.gtag === "function") {
        window.gtag("event", eventName, {
          form_location: window.location.pathname,
          product_group: data.product || "(không chọn)"
        });
      }
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: eventName, form_location: window.location.pathname });
    } catch (err) { /* không có analytics thì bỏ qua */ }
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (form.getAttribute("data-sending") === "1") return;

    var status = form.querySelector(".form-status");
    var button = form.querySelector('button[type="submit"]');
    var trap   = form.querySelector('[name="_website"]');
    if (trap && trap.value) return;   // bot

    var data  = collect();
    var label = button ? button.innerHTML : "";

    function show(kind, html) {
      if (!status) return;
      status.className = "form-status is-visible is-" + kind;
      status.innerHTML = html;
      status.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function done() {
      form.setAttribute("data-sending", "0");
      if (button) { button.disabled = false; button.innerHTML = label; }
    }

    function succeeded() {
      form.reset();
      track("generate_lead", data);
      show("ok",
        "<strong>Đã gửi yêu cầu thành công.</strong> Một email xác nhận vừa được gửi tới " +
        (data.email ? "<strong>" + data.email + "</strong>" : "email của anh/chị") +
        ". Đội kỹ thuật Fast Group sẽ phản hồi trong 2 giờ làm việc. " +
        'Cần gấp, anh/chị gọi <a href="tel:+84' + HOTLINE.slice(1) + '">' + HOTLINE + '</a>.');
    }

    /** Không gửi được: đưa ngay đường thoát để khách không phải gõ lại. */
    function failed(reason) {
      show("err",
        "<strong>Chưa gửi được yêu cầu qua website.</strong> " +
        "Anh/chị bấm nút dưới đây để gửi cùng nội dung vừa nhập qua email, " +
        'hoặc gọi <a href="tel:+84' + HOTLINE.slice(1) + '">' + HOTLINE + "</a> " +
        '(Zalo cùng số).<br><a class="btn btn-primary" style="margin-top:10px" href="' +
        mailtoLink(data) + '">Gửi bằng email tới ' + SALES_EMAIL + "</a>" +
        '<br><small style="opacity:.7">Mã lỗi: ' + reason + "</small>");
      track("lead_submit_failed", data);
    }

    if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]{20,}\/exec$/.test(FORM_ENDPOINT)) {
      failed("endpoint_chua_cau_hinh");
      return;
    }

    form.setAttribute("data-sending", "1");
    if (button) { button.disabled = true; button.textContent = "Đang gửi…"; }
    show("ok", "Đang gửi yêu cầu…");

    var body = new URLSearchParams();
    Object.keys(data).forEach(function (key) { body.append(key, data[key]); });

    var controller = ("AbortController" in window) ? new AbortController() : null;
    var timer = setTimeout(function () { if (controller) controller.abort(); }, TIMEOUT_MS);

    var options = { method: "POST", body: body, redirect: "follow" };
    if (controller) options.signal = controller.signal;

    fetch(FORM_ENDPOINT, options)
      .then(function (response) {
        if (!response.ok) throw new Error("http_" + response.status);
        return response.json();
      })
      .then(function (result) {
        // Chỉ báo thành công khi server thật sự xác nhận đã nhận lead.
        if (!result || result.ok !== true) {
          throw new Error(result && result.error ? result.error : "server_tu_choi");
        }
        succeeded();
        if (result.mail === "failed" && window.console) {
          console.warn("[qlight] Lead đã lưu vào Sheet nhưng email không gửi được:", result.message);
        }
      })
      .catch(function (err) {
        var reason = (err && err.name === "AbortError") ? "timeout" : String(err.message || err);
        failed(reason);
      })
      .then(function () { clearTimeout(timer); done(); },
            function () { clearTimeout(timer); done(); });
  });
})();
