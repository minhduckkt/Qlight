# -*- coding: utf-8 -*-
"""
bump_assets.py — gắn số phiên bản vào CSS/JS để trình duyệt khách hàng
buộc phải tải file mới, không dùng bản cũ trong cache.

    cd "D:\\20. Các website\\Qlight\\Qlight"
    python bump_assets.py             # xem thử
    python bump_assets.py --apply     # ghi thật

Mỗi lần sửa CSS/JS về sau, chạy lại script này là số phiên bản tự tăng
theo ngày giờ, khách sẽ nhận file mới ngay.
"""
import argparse
import os
import re
import time

ASSETS = re.compile(r'(assets/(?:css|js)/[A-Za-z0-9_.-]+\.(?:css|js))(\?v=[0-9]+)?')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--root', default=os.path.dirname(os.path.abspath(__file__)))
    ap.add_argument('--apply', action='store_true')
    ap.add_argument('--version', default=time.strftime('%Y%m%d%H%M'))
    args = ap.parse_args()
    root = os.path.abspath(args.root)
    stamp = '?v=' + args.version

    scanned = changed = 0
    sample = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in ('.git', 'node_modules')]
        for fn in filenames:
            if not fn.lower().endswith('.html'):
                continue
            p = os.path.join(dirpath, fn)
            scanned += 1
            src = open(p, encoding='utf-8').read()
            out = ASSETS.sub(lambda m: m.group(1) + stamp, src)
            if out != src:
                changed += 1
                if len(sample) < 3:
                    sample.append(os.path.relpath(p, root))
                if args.apply:
                    open(p, 'w', encoding='utf-8', newline='').write(out)

    print('\n=== %s ===' % ('ĐÃ GHI FILE' if args.apply else 'CHẠY THỬ (chưa ghi gì)'))
    print('Phiên bản: %s' % stamp)
    print('Quét     : %d file .html' % scanned)
    print('Thay đổi : %d file' % changed)
    for s in sample:
        print('  - %s' % s)
    if not args.apply:
        print('\n-> Chạy lại với --apply để ghi thật.')


if __name__ == '__main__':
    main()
