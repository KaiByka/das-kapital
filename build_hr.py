#!/usr/bin/env python3
"""Parse the Croatian OCR transcripts into per-chapter markdown files,
aligned to the 25-chapter German structure, and emit JSON for the site build."""
import re, os, json

OCR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ocr-transcripts')
T1 = os.path.join(OCR, 'part1.md')
T2 = os.path.join(OCR, 'part2.md')
OUT = '/tmp/kap/hr'

# Croatian chapter ordinal words as they appear in the OCR
GLAVA = ['PRVA','DRUGA','TREĆA','ČETVRTA','PETA','ŠESTA','SEDMA','OSMA','DEVETA',
 'DESETA','JEDANAESTA','DVANAESTA','TRINAESTA','CETRNAESTA','PETNAESTA',
 'ŠESNAESTA','SEDAMNAESTA','OSAMNAESTA','DEVETNAESTA','DVADESETA',
 'DVADESET PRVA','DVADESET DRUGA','DVADESET TREĆA','DVADESET ČETVRTA','DVADESET PETA']

text = open(T1, encoding='utf-8').read() + '\n' + open(T2, encoding='utf-8').read()
lines = text.split('\n')

# locate chapter starts: a line "GLAVA <ordinal>" (with optional # prefixes)
starts = {}
for i, l in enumerate(lines):
    s = l.strip().lstrip('#').strip()
    for n, w in enumerate(GLAVA, 1):
        if s == f'GLAVA {w}':
            if n not in starts:
                starts[n] = i
            break
print('chapters found:', sorted(starts.keys()))
missing = [n for n in range(1, 26) if n not in starts]
if missing:
    print('MISSING:', missing)

os.makedirs(OUT, exist_ok=True)
chapters = {}
for n in range(1, 26):
    a = starts[n]
    b = starts.get(n + 1, len(lines))
    chunk = lines[a:b]
    # title: first all-caps line after the GLAVA line (skip blanks)
    title = ''
    title_idx = None
    for j in range(a + 1, min(a + 6, len(lines))):
        t = lines[j].strip().lstrip('#').strip()
        if t and t == t.upper() and len(t) > 5 and not t.startswith('GLAVA'):
            title = t; title_idx = j; break
    body_lines = lines[(title_idx + 1 if title_idx else a + 1):b]
    body = '\n'.join(body_lines).strip()
    chapters[n] = dict(n=n, title=title, body=body)
    open(os.path.join(OUT, f'hr{n:02d}.md'), 'w', encoding='utf-8').write(
        f'# {title}\n\n{body}\n')
    print(f'hr{n:02d}: {title[:60]!r} ({len(body)} chars)')

json.dump({str(k): v['title'] for k, v in chapters.items()},
          open(os.path.join(OUT, 'titles.json'), 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)
print('done')
