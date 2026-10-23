#!/usr/bin/env python3
"""Build the Croatian mirror site (hr/): index + 25 chapter pages.
Same design, same components, Croatian content. Removes chapters-hr/."""
import re, os, html, json

HR_SRC = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(os.path.abspath(__file__))
SITE = 'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=UnifrakturMaguntia&family=Cormorant+SC:wght@400;600&display=swap'

TITLES = json.load(open(os.path.join(HR_SRC, 'titles.json'), encoding='utf-8'))
TITLES['1'] = 'ROBA'

ODJELJCI = {1:1,2:1,3:1, 4:2,5:2,6:2, 7:3,8:3,9:3, 10:4,11:4,12:4,13:4,
 14:5,15:5,16:5, 17:6,18:6,19:6,20:6, 21:7,22:7,23:7, 24:8,25:8}
ODJELJAK_NAMES = {1:'Roba i novac',2:'Pretvaranje novca u kapital',
 3:'Proizvođenje apsolutnog viška vrijednosti',
 4:'Proizvođenje relativnog viška vrijednosti',
 5:'Proizvođenje apsolutnog i relativnog viška vrijednosti',
 6:'Najamnina',7:'Akumulacija kapitala',8:'Takozvana prvobitna akumulacija'}
ODJELJAK_ROMAN = {1:'Prvi',2:'Drugi',3:'Treći',4:'Četvrti',5:'Peti',6:'Šesti',7:'Sedmi',8:'Osmi'}
ORDINALS = {1:'prva',2:'druga',3:'treća',4:'četvrta',5:'peta',6:'šesta',7:'sedma',
 8:'osma',9:'deveta',10:'deseta',11:'jedanaesta',12:'dvanaesta',13:'trinaesta',
 14:'četrnaesta',15:'petnaesta',16:'šesnaesta',17:'sedamnaesta',18:'osamnaesta',
 19:'devetnaesta',20:'dvadeseta',21:'dvadeset prva',22:'dvadeset druga',
 23:'dvadeset treća',24:'dvadeset četvrta',25:'dvadeset peta'}

def esc(t):
    return html.escape(t, quote=False)

def md_inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r'\$^\{(\d+)\}\$', r'<sup class="fnref">\1</sup>', t)
    t = re.sub(r'\*(.+?)\*', r'<em>\1</em>', t)
    return t

def parse_hr(md):
    out_paras, notes = [], []
    buf = []
    def flush():
        nonlocal buf
        if buf:
            t = re.sub(r'\s+', ' ', ' '.join(buf)).strip()
            if t:
                out_paras.append(('p', t))
            buf = []
    for ln in md.split('\n'):
        s = ln.strip()
        if not s:
            flush(); continue
        if re.match(r'^--- Page \d+ ---$', s):
            flush(); continue
        if re.match(r'^\d+\s*$', s):
            continue
        if re.match(r'^[IVX]+\.\s+[A-ZČĆŠŽĐ]', s) and len(s) < 60 and s == s.upper():
            flush(); continue
        if re.match(r'^\d+\.\s+[A-ZČĆŠŽĐ]', s) and len(s) < 60 and s == s.upper():
            flush(); continue
        m = re.match(r'^#{1,4}\s+(\d+\..*)$', s)
        if m:
            flush()
            out_paras.append(('sec', m.group(1)))
            continue
        if re.match(r'^(\$\^\{\d+\}\$|\^\d+|\^\u00b9|\^\u00b2|\^\u00b3)', s):
            flush()
            notes.append(s)
            continue
        buf.append(s)
    flush()
    return out_paras, notes

def hr_slug(n):
    t = TITLES[str(n)].lower()
    s = re.sub(r'[^a-z0-9\u010d\u0107\u0161\u017e\u0111]+', '-', t).strip('-')
    return f'hr{n:02d}-{s}'[:60]

# ---------- shared head/foot ----------
def head_block(t, lang, css_path):
    return f'''<!DOCTYPE html>
<html lang="{lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{t}</title>
<meta name="description" content="Karl Marx, Kapital I — hrvatsko izdanje, u duhu prvog hamburgerskog izdanja 1867.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="{SITE}" rel="stylesheet">
<link rel="icon" type="image/svg+xml" href="{css_path}favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="{css_path}favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="{css_path}favicon-16.png">
<link rel="shortcut icon" href="{css_path}favicon.ico">
<link rel="stylesheet" href="{css_path}styles.css">
</head>
<body>
<div id="progress"></div>
'''

FOOT_TMPL = '''<script src="{js}site.js"></script>
</body>
</html>
'''

# ---------- chapter pages ----------
os.makedirs(os.path.join(OUT, 'hr', 'glave'), exist_ok=True)
pages = {}
for n in range(1, 26):
    md = open(os.path.join(HR_SRC, f'hr{n:02d}.md'), encoding='utf-8').read()
    md = re.sub(r'^#\s*.*\n', '', md, count=1)
    paras, notes = parse_hr(md)
    pages[n] = dict(paras=paras, notes=notes, title=TITLES[str(n)],
                    odj=ODJELJCI[n], slug=hr_slug(n))

for n, c in pages.items():
    prev = pages.get(n - 1); nxt = pages.get(n + 1)
    out = [head_block(f'Glava {ORDINALS[n].capitalize()} · {c["title"].capitalize()} — Kapital, I. svezak', 'hr', '../../')]
    out.append(f'''<header class="hero chapter-hero frame">
  <div class="hero-inner">
    <div class="hero-ornament">✦ ✦ ✦</div>
    <p class="chapter-no">Glava {ORDINALS[n]}</p>
    <h1 class="chapter-title">{esc(c['title'].lower().capitalize())}</h1>
    <p class="hero-rule">{esc(ODJELJAK_NAMES[c['odj']])}</p>
    <p class="part-tag">{ODJELJAK_ROMAN[c['odj']]} odjeljak · Svezak I</p>
  </div>
</header>
<main class="reading">''')
    first_para = True
    for kind, p in c['paras']:
        if kind == 'sec':
            m2 = re.match(r'^(\d+\.)\s*(.*)$', p)
            if m2:
                out.append(f'<h4 class="sec"><span class="no">{esc(m2.group(1))}</span>{esc(m2.group(2))}</h4>')
            else:
                out.append(f'<h4 class="sec">{esc(p)}</h4>')
            first_para = True
            continue
        cls = 'dropcap' if first_para else ''
        first_para = False
        out.append(f'<p class="{cls}">{md_inline(p)}</p>')
    if c['notes']:
        out.append('</main><section class="footnotes"><h3>Bilješke · Fusnote</h3>')
        for note in c['notes']:
            out.append(f'<p class="fn">{md_inline(note)}</p>')
        out.append('</section>')
    else:
        out.append('</main>')
    out.append('<nav class="chapter-pager">')
    out.append(f'<a href="{prev["slug"]}.html">← Glava {ORDINALS[n-1]}</a>' if prev else '<span></span>')
    out.append(f'<a href="../index.html#sadrzaj">Sadržaj</a>')
    out.append(f'<a href="{nxt["slug"]}.html">Glava {ORDINALS[n+1]} →</a>' if nxt else '<span></span>')
    out.append('</nav>')
    out.append(FOOT_TMPL.format(js='../../'))
    path = os.path.join(OUT, 'hr', 'glave', c['slug'] + '.html')
    open(path, 'w', encoding='utf-8').write('\n'.join(out))
    print('wrote glave/' + c['slug'] + '.html', f"({len(c['paras'])} paras, {len(c['notes'])} notes)")

# ---------- Croatian index ----------
ODJ_CH = {1:[1,2,3],2:[4,5,6],3:[7,8,9],4:[10,11,12,13],5:[14,15,16],
 6:[17,18,19,20],7:[21,22,23],8:[24,25]}
rows = []
for odj in range(1, 9):
    rows.append(f'    <div class="toc-part">{ODJELJAK_ROMAN[odj]} odjeljak — {ODJELJAK_NAMES[odj]}</div>')
    for n in ODJ_CH[odj]:
        rows.append(f'    <div class="toc-vol"><span class="toc-num">{n}.</span><a class="toc-title" href="glave/{pages[n]["slug"]}.html">{esc(TITLES[str(n)].lower().capitalize())}</a></div>')
TOC = '\n'.join(rows)

index = head_block('KAPITAL — Karl Marx · Kritika političke ekonomije', 'hr', '../') + f'''
<!-- ================= HERO ================= -->
<header class="hero frame">
  <div class="hero-inner">
    <div class="hero-ornament">✦ ✦ ✦</div>
    <h1 class="book-title">Kapital</h1>
    <p class="hero-sub">Kritika političke ekonomije</p>
    <p class="hero-author">Karl Marx</p>
    <p class="hero-meta">Erster Band · Hamburg, 1867 · <em>Der Produktionsprocess des Kapitals</em></p>
    <div class="hero-rule">MANDUS &amp; MANDUS</div>
    <p class="hero-meta" style="margin-top:2rem;max-width:40ch;margin-left:auto;margin-right:auto">
      „Der Reichtum der Gesellschaften, in welchen kapitalistische
      Produktionsweise herrscht, erscheint als eine
      <span style="color:var(--red-deep)">›ungeheure Warensammlung‹</span>“
    </p>
  </div>
  <div class="scroll-cue">Počnite čitati ▾</div>
</header>

<!-- ================= SADRŽAJ ================= -->
<section class="contents frame" id="sadrzaj">
  <p class="kicker">Sadržaj · Prvi svezak</p>
  <h2>Sadržaj</h2>
  <p class="subtitle">Osam odjeljaka, dvadeset pet glava — cijeli prvi svezak. Kliknite bilo koju glavu za čitanje.</p>

  <div class="toc">
{TOC}
  </div>
</section>

<!-- ================= TRI SVESKA ================= -->
<section class="frame" id="svesci">
  <p class="kicker">Ukupni proces</p>
  <h2>Tri sveska, jedna kritika</h2>
  <p class="subtitle">Marx je četrdeset godina radio na kritici političke ekonomije. Ovo izdanje donosi prvi svezak u cijelosti; ostali su sačuvani zahvaljujući Engelsu.</p>

  <div class="volumes">
    <article class="volume">
      <div class="volume-roman">I<small>Svezak · 1867</small></div>
      <div>
        <h4>Proces proizvodnje kapitala</h4>
        <p class="de">Der Produktionsprocess des Kapitals</p>
        <p>Od robe i njezina dvostrukog karaktera do tajne viška vrijednosti.
        Jedini svezak koji je Marx sam pripremio za tisak — <em>čitajte ga ovdje u cijelosti</em>, u hrvatskom prijevodu.</p>
        <p class="dates">Hamburg · Verlag von Otto Meissner · 1867</p>
      </div>
    </article>

    <article class="volume">
      <div class="volume-roman">II<small>Svezak · 1885</small></div>
      <div>
        <h4>Proces cirkulacije kapitala</h4>
        <p class="de">Der Cirkulationsprocess des Kapitals</p>
        <p>Kruženje i obrtaj kapitala, te sheme reprodukcije: kako se ukupni
        društveni kapital obnavlja iz godine u godinu.</p>
        <p class="dates">Uredio Friedrich Engels · Hamburg · 1885</p>
      </div>
    </article>

    <article class="volume">
      <div class="volume-roman">III<small>Svezak · 1894</small></div>
      <div>
        <h4>Ukupni proces kapitalističke proizvodnje</h4>
        <p class="de">Der Gesammtprocess der kapitalistischen Produktion</p>
        <p>Profit, kamata, renta — i zakon koji je Marx smatrao svojim najboljim
        rezultatom: težnja stope profita da opada.</p>
        <p class="dates">Uredio Friedrich Engels · Hamburg · 1894</p>
      </div>
    </article>
  </div>
</section>

<!-- ================= MARX ================= -->
<section class="marx frame" id="marx">
  <p class="kicker">Autor</p>
  <h2>Autor</h2>
  <p class="subtitle">Čitatelj u Britanskom muzeju, izbjeglica u Londonu, čovjek koji je desetljećima
  proučavao izvještaje o tvornicama i plave knjige svoga doba.</p>

  <div class="timeline">
    <div class="event">
      <span class="year">1818 · Trier</span>
      <h5>Rođen u mozelarskom vinorodnom kraju</h5>
      <p>Treće od devetero djece u židovskoj obitelji prevedenoj na prusku
      državnu crkvu; raste pod ograničenjima restauratorske Njemačke.</p>
    </div>
    <div class="event">
      <span class="year">1843–1849 · Pariz, Bruxelles, London</span>
      <h5>Progonstvo i revolucija</h5>
      <p>Protjeran iz grada za gradom, konačno se skrasio u Londonu. S
      Engelsom piše <em>Komunistički manifest</em> uoči europskih
      revolucija 1848.</p>
    </div>
    <div class="event">
      <span class="year">1849–1859 · Dean Street, Soho</span>
      <h5>Siromaštvo i Grundrisse</h5>
      <p>Godine neimaštine: izgubljena djeca, dugovi, novinarstvo za
      <em>New-York Daily Tribune</em>. Noću, u čitaonici Britanskog
      muzeja, rukopisi koji će postati <em>Kapital</em>.</p>
    </div>
    <div class="event">
      <span class="year">1867 · Hamburg</span>
      <h5>Objavljen prvi svezak</h5>
      <p>Prvo izdanje od 1.000 primjeraka tiska Otto Meissner. Marx
      piše Engelsu u posljednjoj noći korekture: <em>„Tako je ovaj
      svezak dovršen. Samo zahvaljujući tebi to je bilo moguće.“</em></p>
    </div>
    <div class="event">
      <span class="year">1883 · Highgate</span>
      <h5>„Najveći živući mislilac prestao je misliti“</h5>
      <p>Jedanaest ožalošćenih na groblju Highgate. Engels održava
      govor: „Kao što je Darwin otkrio zakon razvitka organske
      prirode, tako je Marx otkrio zakon razvitka ljudske povijesti.“</p>
    </div>
  </div>
</section>

<!-- ================= POJMOVI ================= -->
<section class="frame" id="pojmovi">
  <p class="kicker">Osnovni pojmovi</p>
  <h2>Arhitektura argumenta</h2>
  <p class="subtitle">Svaki pojam u <em>Kapitalu</em> građen je dijalektički:
  jedan vodi u drugi unutrašnjom nužnošću, od jednostavne robe do
  kretanja čitavog društvenog kapitala.</p>

  <div class="principles">
    <div class="card">
      <div class="glyph">R</div>
      <h4>Roba — Commodity</h4>
      <p>Stanični oblik buržoaskog društva: odjednom upotrebna vrijednost
      i vrijednost, stvar i društveni odnos u maski.</p>
    </div>
    <div class="card">
      <div class="glyph">N</div>
      <h4>Novac — Money</h4>
      <p>Univerzalni ekvivalent: prvi adekvatni oblik pojavljivanja
      vrijednosti i vrata kroz koja vrijednost postaje kapital.</p>
    </div>
    <div class="card">
      <div class="glyph">V</div>
      <h4>Višak vrijednosti — Surplus-Value</h4>
      <p>Otkud profit? Iz osobitosti radne snage: ona stvara više
      vrijednosti nego što košta njezina vlastita reprodukcija.</p>
    </div>
    <div class="card">
      <div class="glyph">K</div>
      <h4>Kapital — Capital</h4>
      <p>Ne stvar nego proces: vrijednost u kretanju koja se oplođuje —
      „mrtav rad koji, vampirski, živi sišući živi rad.“</p>
    </div>
    <div class="card">
      <div class="glyph">A</div>
      <h4>Akumulacija — Accumulation</h4>
      <p>Višak vrijednosti postaje novi kapital, a novi kapital traži
      više radne snage: sustav širi vlastiti temelj.</p>
    </div>
    <div class="card">
      <div class="glyph">Z</div>
      <h4>Zakon — The Law</h4>
      <p>Opći zakon kapitalističke akumulacije koncentrira i
      centralizira kapital — pripremajući vlastite povijesne granice.</p>
    </div>
  </div>
  <div class="ornament">⁂</div>
</section>

<footer>
  <div class="fin">Ex libris</div>
  <p>Hrvatski prijevod prvog sveska slijedi strukturu njemačkog drugog izdanja
  (25 glava). Izvorni engleski tekst (Moore–Aveling, 1887) dostupan je na
  engleskoj verziji ovih stranica. Tipografija u duhu prvog hamburgerskog
  izdanja.</p>
  <p class="colophon">Tiskano godine MMXXV · Proletari svih zemalja, ujedinite se</p>
</footer>

''' + FOOT_TMPL.format(js='../')

open(os.path.join(OUT, 'hr', 'index.html'), 'w', encoding='utf-8').write(index)
print('wrote hr/index.html')

# remove old chapters-hr
import shutil
if os.path.exists(os.path.join(OUT, 'chapters-hr')):
    shutil.rmtree(os.path.join(OUT, 'chapters-hr'))
    print('removed chapters-hr/')
