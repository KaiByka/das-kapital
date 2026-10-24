#!/usr/bin/env python3
"""Build the Das Kapital multi-page site from the OCR'd Kerr edition text."""
import re, os, html

SRC = '/tmp/kap/vol1.txt'
OUT = '/workspace/das-kapital'

CH = [
 (1,'I','Commodities',1),(2,'II','Exchange',1),
 (3,'III','Money, or the Circulation of Commodities',1),
 (4,'IV','The General Formula for Capital',2),
 (5,'V','Contradictions in the General Formula of Capital',2),
 (6,'VI','The Buying and Selling of Labour-Power',2),
 (7,'VII','The Labour-Process and the Process of Producing Surplus-Value',3),
 (8,'VIII','Constant Capital and Variable Capital',3),
 (9,'IX','The Rate of Surplus-Value',3),
 (10,'X','The Working-Day',3),
 (11,'XI','Rate and Mass of Surplus-Value',3),
 (12,'XII','The Concept of Relative Surplus-Value',4),
 (13,'XIII','Co-Operation',4),
 (14,'XIV','Division of Labour and Manufacture',4),
 (15,'XV','Machinery and Modern Industry',4),
 (16,'XVI','Absolute and Relative Surplus-Value',5),
 (17,'XVII','Changes of Magnitude in the Price of Labour-Power and Surplus-Value',5),
 (18,'XVIII','Various Formulae for the Rate of Surplus-Value',5),
 (19,'XIX','The Transformation of the Value (and Respectively the Price) of Labour-Power into Wages',6),
 (20,'XX','Time-Wages',6),(21,'XXI','Piece-Wages',6),
 (22,'XXII','National Differences of Wages',6),
 (23,'XXIII','Simple Reproduction',7),
 (24,'XXIV','Conversion of Surplus-Value into Capital',7),
 (25,'XXV','The General Law of Capitalist Accumulation',7),
 (26,'XXVI','The Secret of Primitive Accumulation',8),
 (27,'XXVII','Expropriation of the Agricultural Population from the Land',8),
 (28,'XXVIII','Bloody Legislation against the Expropriated, from the End of the 15th Century. Forcing down of Wages by Acts of Parliament',8),
 (29,'XXIX','Genesis of the Capitalist Farmer',8),
 (30,'XXX','Reaction of the Agricultural Revolution on Industry. Creation of the Home-Market for Industrial Capital',8),
 (31,'XXXI','Genesis of the Industrial Capitalist',8),
 (32,'XXXII','Historical Tendency of Capitalist Accumulation',8),
 (33,'XXXIII','The Modern Theory of Colonisation',8),
]
PARTS = {1:'Commodities and Money',2:'The Transformation of Money into Capital',
 3:'The Production of Absolute Surplus-Value',4:'The Production of Relative Surplus-Value',
 5:'The Production of Absolute and of Relative Surplus-Value',6:'Wages',
 7:'The Accumulation of Capital',8:'The So-Called Primitive Accumulation'}
PART_ROMAN = {1:'I',2:'II',3:'III',4:'IV',5:'V',6:'VI',7:'VII',8:'VIII'}

STARTS = {1:1992,2:4546,3:5025,4:7778,5:8275,6:8836,7:9352,8:10471,9:11087,
 10:12157,11:16264,12:16704,13:17190,14:17914,15:19641,16:27651,17:28170,
 18:28781,19:28996,20:29370,21:29797,22:30250,23:30595,24:31253,25:33004,
 26:39706,27:39874,28:40756,29:41155,30:41286,31:41514,32:42075,33:42232}
BODY_END = 42695

text = open(SRC, encoding='utf-8').read().split('\n')

RUNNING  = re.compile(r"^\d{1,3}\s+[A-Z][A-Z '\-,&.]+\s*\d*$")
RUNNING2 = re.compile(r"^[A-Z][A-Z '\-,&.]+\s+\d{1,3}$")
PURE_PG  = re.compile(r'^\s*\d{1,3}\s*$')
# words that mean a leading digit is a quantity, not a footnote marker
UNIT_AFTER = re.compile(r'^(hours?|hrs?|lb s?|lbs|yards?|per cent|shillings?|men|women|children|francs?|pounds?|o\'clock|minutes?|days?|weeks?|years?|times|bushels?|quarters|cwts?|cents?|copies|persons|workmen|labourers|spindles|looms|machines|factories)\b', re.I)

def is_header(line):
    l = line.strip()
    if not l: return False
    if PURE_PG.match(l): return True
    if RUNNING.match(l): return True
    if RUNNING2.match(l) and len(l) > 14: return True
    return False

def join_lines(raw):
    """Merge wrapped lines into paragraphs, de-hyphenating line-break words."""
    paras, buf = [], []
    for ln in raw:
        s = ln.rstrip('\n')
        if not s.strip():
            if buf: paras.append(' '.join(buf)); buf = []
            continue
        if is_header(s): continue   # page headers are transparent, do not break paragraph
        s = re.sub(r'\s+', ' ', s).strip()
        if buf and buf[-1].endswith('-') and re.search(r'[a-z]-$', buf[-1]):
            buf[-1] = buf[-1][:-1] + s
        else:
            buf.append(s)
    if buf: paras.append(' '.join(buf))
    return paras

TERMINAL = re.compile(r'(?:[.!?:;\"\u201d\u2019\u2014)]|\.\d{1,2}|,\d{1,2}|\"\d{1,2}|\u201d\d{1,2}|\u2019\d{1,2})$')
LOWER_START = re.compile(r'^[a-z\u201c\u2018\u2014("\']')

def merge_page_splits(items):
    """Re-join body paragraphs that OCR split at page boundaries: only when the
    previous paragraph lacks terminal punctuation AND the next starts lowercase."""
    out = []
    for kind, p in items:
        if kind == 'sec' or not out or out[-1][0] == 'sec':
            out.append((kind, p)); continue
        prev = out[-1][1]
        if not TERMINAL.search(prev) and LOWER_START.match(p):
            out[-1] = ('p', prev + ('' if prev.endswith('-') else ' ') + p)
        else:
            out.append((kind, p))
    return out

def clean_text(t):
    t = t.replace('  ', ' ')
    t = re.sub(r'\s+([,.;:!?])', r'\1', t)
    t = re.sub(r'\(\s+', '(', t)
    t = re.sub(r'\s+\)', ')', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t

def classify(paras, ch_title_upper):
    """Split paragraphs into body / section-heads / footnotes.
    Footnotes restart at 1 on each printed page: accept a leading 'N  ' when
    N <= last_note + 1 and N is not followed by a unit word.
    Each note remembers the index of the body paragraph it follows."""
    body, notes = [], []
    last = 0
    for p in paras:
        p = clean_text(p)
        if not p: continue
        pu = p.upper()
        # drop chapter/part title furniture (OCR may split words: "CH APTER X")
        if pu.replace(' ', '').startswith('CHAPTER') or pu.startswith('PART '): continue
        if pu == ch_title_upper or (len(pu) < 90 and pu == ch_title_upper[:len(pu)] and len(pu) > 12): continue
        # section heading
        if re.match(r'^SECTION\s*\d', pu):
            body.append(('sec', p)); last = 0; continue
        # all-caps subsection heading (wrapped continuation of section titles)
        if p == pu and len(p) > 12 and len(p) < 200 and re.search(r'[A-Z]{4}', p) \
           and not re.match(r'^(SECTION|CHAPTER|PART)\b', pu):
            body.append(('sub', p)); continue
        m = re.match(r'^(\d{1,2})\s+(.+)$', p)
        if m:
            n = int(m.group(1)); rest = m.group(2)
            if n <= last + 1 and not UNIT_AFTER.match(rest) and len(rest) > 6:
                notes.append({'after': len(body) - 1, 'text': rest}); last = n
                continue
        body.append(('p', p))
    return body, notes

def find_refs(body_text):
    """Find inline footnote markers: a small digit after punctuation or a word,
    optionally separated by a space, not part of a larger number."""
    return list(re.finditer(
        r'(?<![\d\u00a7])(?<=["\'\u201d\u2019.,;:a-zA-Z)])(?: )?(\d{1,2})(?=[\s\u201d"\u2019,;:.!?)]|$)',
        body_text))

def slug(n, title):
    s = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
    s = re.sub(r'-{2,}', '-', s)
    return f'ch{n:02d}-{s}'[:60]

def esc(t):
    return html.escape(t, quote=False)

def head_block(t):
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{t} — Das Kapital, Vol. I</title>
<meta name="description" content="Karl Marx, Capital Volume I — the 1887 Moore-Aveling translation, presented as a reading edition.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=UnifrakturMaguntia&family=Cormorant+SC:wght@400;600&display=swap" rel="stylesheet">
<link rel="icon" type="image/svg+xml" href="../favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="../favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="../favicon-16.png">
<link rel="shortcut icon" href="../favicon.ico">
<link rel="stylesheet" href="../styles.css">
</head>
<body>
<div id="progress"></div>
'''

FOOT = '''
<script src="../site.js"></script>
</body>
</html>
'''

chapters = {}
for (n, roman, title, part) in CH:
    start = STARTS[n]
    end = STARTS.get(n + 1, BODY_END) if n < 33 else BODY_END
    raw = text[start - 1:end - 1]
    paras = join_lines(raw)
    body, notes = classify(paras, title.upper())
    body = merge_page_splits(body)
    chapters[n] = dict(num=n, roman=roman, title=title, part=part,
                       body=body, notes=notes, slug=slug(n, title))

def chapter_page(c):
    n = c['num']
    prev = chapters.get(n - 1); nxt = chapters.get(n + 1)
    out = [head_block(f'Chapter {c["roman"]}. {c["title"]}')]
    out.append(f'''<header class="hero chapter-hero frame">
  <div class="hero-inner">
    <div class="hero-ornament">✦ ✦ ✦</div>
    <p class="chapter-no">Chapter {c['roman']}</p>
    <h1 class="chapter-title">{esc(c['title'])}</h1>
    <p class="hero-rule">{esc(PARTS[c['part']])}</p>
    <p class="part-tag">Part {PART_ROMAN[c['part']]} · Band I</p>
  </div>
</header>
<main class="reading">''')
    body = c['body']; notes = c['notes']
    # count refs in order; if the count matches the note count, link sequentially
    ref_positions = []  # (para_idx, match)
    for idx, (kind, p) in enumerate(body):
        if kind != 'p': continue
        for m in find_refs(p):
            ref_positions.append((idx, m))
    use_marker_links = (len(ref_positions) >= len(notes) > 0)
    marker_note = list(enumerate(ref_positions)) if use_marker_links else []
    # fallback: bind each note to the post-merge body paragraph it physically follows
    anch = {}
    if not use_marker_links and notes:
        # build pre->post merge mapping identical to merge_page_splits decisions
        pre2post = {}
        post_i = -1
        for pre_i, (kind, p) in enumerate(body):
            if pre_i == 0 or kind == 'sec' or body[pre_i-1][0] == 'sec' \
               or (TERMINAL.search(body[pre_i-1][1]) or not LOWER_START.match(p)):
                post_i += 1
            pre2post[pre_i] = post_i
        for j, note in enumerate(notes, 1):
            post_idx = pre2post.get(note['after'], 0)
            anch.setdefault(post_idx, []).append(j)
    first_para = True
    for idx, (kind, p) in enumerate(body):
        if kind in ('sec', 'sub'):
            if kind == 'sub' and out and out[-1].startswith('<h4 class="sec">'):
                # wrapped continuation: merge into the open section heading
                out[-1] = out[-1][:-5] + ' ' + esc(p) + '</h4>'
                continue
            m2 = re.match(r'^(SECTION\s*\d+)\.?[\u2014\u2014-]?\s*(.*)$', p)
            if m2:
                out.append(f'<h4 class="sec"><span class="no">{esc(m2.group(1))}</span>{esc(m2.group(2))}</h4>')
            else:
                out.append(f'<h4 class="sec">{esc(p)}</h4>')
            first_para = True
            continue
        cls = 'dropcap' if first_para else ''
        first_para = False
        if use_marker_links:
            parts_list, lastpos = [], 0
            for j, (pi, m) in marker_note:
                if pi != idx: continue
                note_no = j + 1
                if note_no > len(notes): break
                parts_list.append(esc(p[lastpos:m.start(1)]))
                parts_list.append(f'<sup class="fnref"><a href="#fn{note_no}" id="ref{note_no}">{note_no}</a></sup>')
                lastpos = m.end(1)
            parts_list.append(esc(p[lastpos:]))
            out.append(f'<p class="{cls}">' + ''.join(parts_list) + '</p>')
        elif idx in anch:
            marks = ''.join(
                f'<sup class="fnref" id="ref{j}"><a href="#fn{j}">{j}</a></sup>'
                for j in anch[idx])
            out.append(f'<p class="{cls}">{esc(p)}{marks}</p>')
        else:
            out.append(f'<p class="{cls}">{esc(p)}</p>')
    if notes:
        out.append('</main><section class="footnotes"><h3>Anmerkungen · Notes</h3>')
        for i, note in enumerate(notes, 1):
            txt = note['text'] if isinstance(note, dict) else note
            back = f' <a class="back" href="#ref{i}">↩</a>' if use_marker_links else ''
            out.append(f'<p class="fn" id="fn{i}"><sup>{i}</sup>{esc(txt)}{back}</p>')
        out.append('</section>')
    else:
        out.append('</main>')
    out.append('<nav class="chapter-pager">')
    out.append(f'<a href="{prev["slug"]}.html">← Chapter {prev["roman"]}</a>' if prev else '<span></span>')
    out.append('<a href="../index.html#contents">Inhalt</a>')
    out.append(f'<a href="{nxt["slug"]}.html">Chapter {nxt["roman"]} →</a>' if nxt else '<span></span>')
    out.append('</nav>')
    out.append(FOOT)
    return '\n'.join(out)

os.makedirs(os.path.join(OUT, 'chapters'), exist_ok=True)
report = []
for n, c in chapters.items():
    path = os.path.join(OUT, 'chapters', c['slug'] + '.html')
    open(path, 'w', encoding='utf-8').write(chapter_page(c))
    report.append((n, len([1 for k, _ in c['body'] if k == 'p']), len(c['notes'])))
for n, np_, nn in report:
    print(f'ch{n:02d}: {np_:4d} paragraphs, {nn:3d} footnotes')
