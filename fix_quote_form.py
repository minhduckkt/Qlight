# -*- coding: utf-8 -*-
"""
fix_quote_form.py — kích hoạt form báo giá qlight.vn (gửi về Google Sheet + email).

Cách dùng:
    cd "D:\\20. Các website\\Qlight\\Qlight"
    python fix_quote_form.py             # chạy thử
    python fix_quote_form.py --apply     # ghi thật

Sau khi chạy, mở assets/js/qlight-premium.js và dán URL Apps Script vào
dòng  var FORM_ENDPOINT = "...";
"""
import argparse
import os
import re
import sys

HONEYPOT = (
    '<div class="form-hp" aria-hidden="true">'
    '<label>Website<input autocomplete="off" name="_website" tabindex="-1" type="text"/></label>'
    '</div>'
)
STATUS = '<p aria-live="polite" class="form-status" role="status"></p>'

CSS_MARK = "/* == RFQ form status (auto-added) == */"
CSS_BLOCK = CSS_MARK + """
.form-hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
.form-status {
  display: none; margin: 16px 0 0; padding: 13px 15px;
  border-radius: var(--radius-control); font-size: 14px; line-height: 1.65;
}
.form-status.is-visible { display: block; }
.form-status.is-ok { background: #e9f8f1; border: 1px solid rgba(22,163,107,.45); color: #0d7048; }
.form-status.is-err { background: #fdeced; border: 1px solid rgba(229,72,77,.45); color: #b02a2e; }
.form-status a { color: inherit; font-weight: 700; }
.contact-form button[disabled] { opacity: .6; cursor: progress; }
"""

# --- các đoạn "demo" cần bỏ khỏi HTML ---------------------------------------
DEMO_PATTERNS = [
    re.compile(r'\s*<p[^>]*>[^<]*[Bb]ản demo[^<]*</p>', re.S),
    re.compile(r'\s*<p[^>]*>[^<]*demo chờ cấu hình[^<]*</p>', re.S),
]

JS_OLD = re.compile(r'\n\s*form\.addEventListener\("submit".*?\n\s*\}\);\n', re.S)

JS_NEW = '''
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

      if (!/^https?:\\/\\//.test(FORM_ENDPOINT)) {
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
            "Trường hợp gấp, anh/chị gọi <a href=\\"tel:+84938888958\\">0938 888 958</a>.");
        })
        .catch(function () { show("err", FALLBACK); })
        .then(function () {
          form.setAttribute("data-sending", "0");
          if (button) { button.disabled = false; button.innerHTML = label; }
        });
    });
'''


def patch_html(src):
    out = src
    if 'id="quoteForm"' not in out:
        return out
    for pat in DEMO_PATTERNS:
        out = pat.sub('', out)
    if 'name="_website"' not in out:
        out = re.sub(r'(<form[^>]*id="quoteForm"[^>]*>)', r'\1\n' + HONEYPOT, out, count=1)
    if 'class="form-status"' not in out:
        out = re.sub(r'(<button[^>]*type="submit")', STATUS + r'\n\1', out, count=1)
    return out


def patch_js(src):
    out = src
    if 'FORM_ENDPOINT' not in out:
        out = out.replace(
            '(function () {',
            '(function () {\n'
            '  // Dán URL Apps Script (.../exec) vào đây sau khi deploy:\n'
            '  var FORM_ENDPOINT = "PASTE_APPS_SCRIPT_URL_HERE";\n',
            1)
    if 'data-sending' not in out:
        if not JS_OLD.search(out):
            raise RuntimeError('Không tìm thấy khối submit cũ trong qlight-premium.js')
        out = JS_OLD.sub(JS_NEW, out, count=1)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--root', default=os.path.dirname(os.path.abspath(__file__)))
    ap.add_argument('--apply', action='store_true')
    args = ap.parse_args()
    root = os.path.abspath(args.root)
    write = args.apply
    touched = []

    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in ('.git', 'node_modules')]
        for fn in filenames:
            if not fn.lower().endswith('.html'):
                continue
            p = os.path.join(dirpath, fn)
            src = open(p, encoding='utf-8').read()
            if 'id="quoteForm"' not in src:
                continue
            out = patch_html(src)
            if out != src:
                touched.append(os.path.relpath(p, root))
                if write:
                    open(p, 'w', encoding='utf-8', newline='').write(out)

    js = os.path.join(root, 'assets', 'js', 'qlight-premium.js')
    js_msg = 'không thấy file js'
    if os.path.exists(js):
        src = open(js, encoding='utf-8').read()
        out = patch_js(src)
        if out == src:
            js_msg = 'đã cập nhật từ trước'
        else:
            js_msg = 'đã thay khối submit demo bằng bản gửi thật' if write else 'sẽ thay khối submit demo'
            if write:
                open(js, 'w', encoding='utf-8', newline='').write(out)

    css = os.path.join(root, 'assets', 'css', 'qlight-premium.css')
    css_msg = 'không thấy file css'
    if os.path.exists(css):
        cur = open(css, encoding='utf-8').read()
        if CSS_MARK in cur:
            css_msg = 'đã có sẵn'
        else:
            css_msg = 'đã thêm CSS' if write else 'sẽ thêm CSS'
            if write:
                open(css, 'a', encoding='utf-8', newline='').write('\n\n' + CSS_BLOCK)

    print('\n=== %s ===' % ('ĐÃ GHI FILE' if write else 'CHẠY THỬ (chưa ghi gì)'))
    print('Trang có form: %d' % len(touched))
    for t in touched:
        print('  - %s' % t)
    print('JS  : %s' % js_msg)
    print('CSS : %s' % css_msg)
    if not write:
        print('\n-> Chạy lại với --apply để ghi thật.')
    else:
        print('\n-> Nhớ dán URL Apps Script vào FORM_ENDPOINT trong assets/js/qlight-premium.js')


if __name__ == '__main__':
    main()
