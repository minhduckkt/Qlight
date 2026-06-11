(function () {
  var tableBody = document.getElementById("partTableBody");
  var keywordInput = document.getElementById("partKeyword");
  var categorySelect = document.getElementById("partCategory");
  var modelSelect = document.getElementById("partModel");
  var voltageSelect = document.getElementById("partVoltage");
  var colorSelect = document.getElementById("partColor");
  var ipSelect = document.getElementById("partIp");
  var resultCount = document.getElementById("partResultCount");
  var resetButton = document.getElementById("partReset");

  if (!tableBody || !keywordInput) return;

  var rows = [];
  var pageMap = Object.create(null);
  var renderLimit = 120;

  function normalize(value) {
    return (value || "")
      .toString()
      .toLocaleLowerCase("vi-VN")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function escapeHtml(value) {
    return (value || "")
      .toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function shortCategory(value) {
    return (value || "")
      .replace(/^Đèn tháp tín hiệu /, "Đèn tháp ")
      .replace(/^Catalog /, "")
      .replace(/^Thiết bị /, "TB ");
  }

  function uniqueSorted(data, getter) {
    var seen = Object.create(null);
    data.forEach(function (item) {
      var value = getter(item);
      if (value && value !== "-") seen[value] = true;
    });
    return Object.keys(seen).sort(function (a, b) {
      return a.localeCompare(b, "vi");
    });
  }

  function fillSelect(select, values, transform) {
    if (!select) return;
    var current = select.value;
    select.innerHTML = '<option value="">Tất cả</option>';
    values.forEach(function (value) {
      var option = document.createElement("option");
      option.value = value;
      option.textContent = transform ? transform(value) : value;
      select.appendChild(option);
    });
    if (values.indexOf(current) !== -1) {
      select.value = current;
    }
  }

  function setupFilters() {
    fillSelect(categorySelect, uniqueSorted(rows, function (item) { return item.category_name; }), shortCategory);
    fillSelect(modelSelect, uniqueSorted(rows, function (item) { return item.model || item.data_model; }));
    fillSelect(voltageSelect, uniqueSorted(rows, function (item) { return item.voltage || item.data_voltage; }));
    fillSelect(colorSelect, uniqueSorted(rows, function (item) { return item.color || item.data_color; }));
    fillSelect(ipSelect, uniqueSorted(rows, function (item) { return item.ip || item.data_ip; }));
  }

  function rowMatches(item) {
    var keyword = normalize(keywordInput.value);
    var category = categorySelect ? categorySelect.value : "";
    var model = modelSelect ? modelSelect.value : "";
    var voltage = voltageSelect ? voltageSelect.value : "";
    var color = colorSelect ? colorSelect.value : "";
    var ip = ipSelect ? ipSelect.value : "";

    if (category && item.category_name !== category) return false;
    if (model && (item.model || item.data_model) !== model) return false;
    if (voltage && (item.voltage || item.data_voltage) !== voltage) return false;
    if (color && (item.color || item.data_color) !== color) return false;
    if (ip && (item.ip || item.data_ip) !== ip) return false;

    if (!keyword) return true;
    return normalize([
      item.part_number,
      item.model,
      item.light_type,
      item.buzzer,
      item.voltage,
      item.color,
      item.mount,
      item.ip,
      item.db,
      item.size,
      item.pdf_page,
      item.description,
      item.category_name,
      item.search_text
    ].join(" ")).indexOf(keyword) !== -1;
  }

  function render() {
    var matches = rows.filter(rowMatches);
    var visible = matches.slice(0, renderLimit);

    if (!matches.length) {
      tableBody.innerHTML = '<tr><td colspan="8">Không tìm thấy part number phù hợp. Hãy thử model ngắn hơn như S80, QTG, ST45 hoặc DC24V.</td></tr>';
    } else {
      tableBody.innerHTML = visible.map(function (item) {
        var page = pageMap[item.part_number];
        var partLabel = page && page.url
          ? '<a href="' + escapeHtml(page.url) + '">' + escapeHtml(item.part_number) + '</a>'
          : escapeHtml(item.part_number);
        return "<tr>" +
          "<td><strong>" + partLabel + "</strong><small>" + escapeHtml(shortCategory(item.category_name)) + "</small></td>" +
          "<td>" + escapeHtml(item.model || item.data_model) + "</td>" +
          "<td>" + escapeHtml(item.light_type) + "</td>" +
          "<td>" + escapeHtml(item.voltage || item.data_voltage) + "</td>" +
          "<td>" + escapeHtml(item.color || item.data_color) + "</td>" +
          "<td>" + escapeHtml(item.ip || item.data_ip) + "</td>" +
          "<td>" + escapeHtml(item.size) + "</td>" +
          "<td>" + escapeHtml(item.description) + (item.pdf_page && item.pdf_page !== "-" ? '<br><small>PDF page: ' + escapeHtml(item.pdf_page) + '</small>' : "") + "</td>" +
        "</tr>";
      }).join("");
    }

    if (resultCount) {
      resultCount.textContent = "Hiển thị " + visible.length + " / " + matches.length + " kết quả phù hợp, tổng " + rows.length + " dòng";
    }
  }

  function bindFilters() {
    [keywordInput, categorySelect, modelSelect, voltageSelect, colorSelect, ipSelect].forEach(function (field) {
      if (!field) return;
      field.addEventListener(field === keywordInput ? "input" : "change", render);
    });

    if (resetButton) {
      resetButton.addEventListener("click", function () {
        keywordInput.value = "";
        [categorySelect, modelSelect, voltageSelect, colorSelect, ipSelect].forEach(function (field) {
          if (field) field.value = "";
        });
        render();
      });
    }
  }

  Promise.all([
    fetch("../assets/data/part_numbers.json").then(function (response) {
      if (!response.ok) throw new Error("Cannot load part_numbers.json");
      return response.json();
    }),
    fetch("../assets/data/part_number_pages.json").then(function (response) {
      return response.ok ? response.json() : {};
    }).catch(function () {
      return {};
    })
  ])
    .then(function (payload) {
      rows = payload[0] || [];
      pageMap = payload[1] || Object.create(null);
      setupFilters();
      bindFilters();
      render();
    })
    .catch(function () {
      tableBody.innerHTML = '<tr><td colspan="8">Không tải được dữ liệu part number. Khi xem local, hãy chạy bằng server http://localhost thay vì mở file trực tiếp.</td></tr>';
      if (resultCount) resultCount.textContent = "Không tải được dữ liệu";
    });
})();
