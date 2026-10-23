(function () {
  'use strict';

  var rail = document.createElement('div');
  rail.className = 'rail';
  rail.innerHTML =
    '<div class="rail-track"></div>' +
    '<div class="rail-thumb"><span class="rail-glyph">§</span></div>';
  document.body.appendChild(rail);

  var track = rail.querySelector('.rail-track');
  var thumb = rail.querySelector('.rail-thumb');
  var glyph = rail.querySelector('.rail-glyph');

  var sections = Array.prototype.slice.call(
    document.querySelectorAll('main.reading, section[id], section.contents, footer')
  );

  // tick marks: one per section, placed at its scroll position
  var ticks = [];
  sections.forEach(function (s) {
    var t = document.createElement('div');
    t.className = 'rail-tick';
    rail.appendChild(t);
    ticks.push({ el: t, sec: s });
  });

  var dragging = false;

  function railRect() {
    return rail.getBoundingClientRect();
  }

  function docHeight() {
    var h = document.documentElement;
    return h.scrollHeight - h.clientHeight;
  }

  function place(el, ratio, offsetPx) {
    var r = railRect();
    var y = r.top + ratio * r.height + (offsetPx || 0);
    el.style.top = (y - r.top) + 'px';
  }

  function sectionRatio(sec) {
    var r = sec.getBoundingClientRect();
    return (r.top + window.pageYOffset - 80) / (docHeight() + 0.0001);
  }

  function render() {
    var max = docHeight();
    var ratio = max > 0 ? (window.pageYOffset / max) : 0;
    place(thumb, ratio);
    // glyph rides below the thumb, flips to top when near the bottom
    glyph.style.transform = 'translate(50%,-50%) translateY(' + (ratio > .92 ? -40 : 40) + 'px)';
    thumb.classList.toggle('bottom-cap', ratio > .92);
    ticks.forEach(function (t) {
      var sr = sectionRatio(t.sec);
      place(t.el, sr);
      t.el.classList.toggle('past', sr <= ratio - 0.008);
    });
  }

  function scrollToRatio(r) {
    window.scrollTo({ top: r * docHeight(), behavior: dragging ? 'auto' : 'smooth' });
  }

  rail.addEventListener('click', function (e) {
    var r = railRect();
    scrollToRatio((e.clientY - r.top) / r.height);
  });

  thumb.addEventListener('mousedown', function (e) {
    dragging = true;
    thumb.style.cursor = 'grabbing';
    e.preventDefault();
  });
  thumb.addEventListener('touchstart', function () { dragging = true; }, { passive: true });

  window.addEventListener('mousemove', function (e) {
    if (!dragging) return;
    var r = railRect();
    scrollToRatio(Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)));
  });
  window.addEventListener('touchmove', function (e) {
    if (!dragging) return;
    var r = railRect();
    var y = e.touches[0].clientY;
    scrollToRatio(Math.min(1, Math.max(0, (y - r.top) / r.height)));
  }, { passive: true });

  window.addEventListener('mouseup', function () {
    dragging = false;
    thumb.style.cursor = 'grab';
  });
  window.addEventListener('touchend', function () { dragging = false; });

  // keyboard: rail is focusable, arrows jump between sections
  rail.tabIndex = 0;
  rail.setAttribute('aria-label', 'Reading position');
  rail.addEventListener('keydown', function (e) {
    var cur = window.pageYOffset;
    var next = null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      var down = e.key === 'ArrowDown';
      sections.forEach(function (s) {
        var top = s.getBoundingClientRect().top + window.pageYOffset - 60;
        if (down && top > cur + 10 && (next === null || top < next)) next = top;
        if (!down && top < cur - 10 && (next === null || top > next)) next = top;
      });
      if (next !== null) {
        e.preventDefault();
        window.scrollTo({ top: next, behavior: 'smooth' });
      }
    }
  });

  var bar = document.getElementById('progress');

  var scheduled = false;
  function onScroll() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      render();
      if (bar) bar.style.width = (window.pageYOffset / (docHeight() || 1) * 100) + '%';
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  render();
})();

/* ============ LANGUAGE SWITCH (EN/HR) ============ */
(function () {
  var path = location.pathname.split('/').pop() || 'index.html';
  var map = null;
  var EN2HR = {
    'index.html': 'hr/index.html',
    'ch01-commodities.html': 'hr01-roba.html',
    'ch02-exchange.html': 'hr02-proces-razmjene.html',
    'ch03-money-or-the-circulation-of-commodities.html': 'hr03-novac-ili-robni-promet.html',
    'ch04-the-general-formula-for-capital.html': 'hr04-pretvaranje-novca-u-kapital.html',
    'ch05-contradictions-in-the-general-formula-of-capital.html': 'hr05-proces-rada-i-proces-oplođivanja-vrijednosti.html',
    'ch06-the-buying-and-selling-of-labour-power.html': 'hr06-postojan-kapital-i-promjenljiv-kapital.html',
    'ch07-the-labour-process-and-the-process-of-producing-surplus.html': 'hr05-proces-rada-i-proces-oplođivanja-vrijednosti.html',
    'ch08-constant-capital-and-variable-capital.html': 'hr05-proces-rada-i-proces-oplođivanja-vrijednosti.html',
    'ch09-the-rate-of-surplus-value.html': 'hr07-stopa-viška-vrijednosti.html',
    'ch10-the-working-day.html': 'hr08-radni-dan.html',
    'ch11-rate-and-mass-of-surplus-value.html': 'hr08-radni-dan.html',
    'ch12-the-concept-of-relative-surplus-value.html': 'hr10-pojam-relativnog-viška-vrijednosti.html',
    'ch13-co-operation.html': 'hr11-kooperacija.html',
    'ch14-division-of-labour-and-manufacture.html': 'hr12-podjela-rada-i-manufaktura.html',
    'ch15-machinery-and-modern-industry.html': 'hr13-mašinerija-i-krupna-industrija.html',
    'ch16-absolute-and-relative-surplus-value.html': 'hr14-apsolutni-i-relativni-višak-vrijednosti.html',
    'ch17-changes-of-magnitude-in-the-price-of-labour-power-and-s.html': 'hr15-mijenjanje-velicine-cijene-radne-snage-i-viška-vrijedno.html',
    'ch18-various-formulae-for-the-rate-of-surplus-value.html': 'hr16-različni-obrasci-za-stopu-viška-vrijednosti.html',
    'ch19-the-transformation-of-the-value-and-respectively-the-pr.html': 'hr17-pretvaranje-vrijednosti-ili-cijene-radne-snage-u-najamn.html',
    'ch20-time-wages.html': 'hr18-najamnina-od-vremena.html',
    'ch21-piece-wages.html': 'hr19-najamnina-od-komada.html',
    'ch22-national-differences-of-wages.html': 'hr20-nacionalna-različnost-najamnina.html',
    'ch23-simple-reproduction.html': 'hr21-jednostavna-reprodukcija.html',
    'ch24-conversion-of-surplus-value-into-capital.html': 'hr22-pretvaranje-viška-vrijednosti-u-kapital.html',
    'ch25-the-general-law-of-capitalist-accumulation.html': 'hr23-opći-zakon-kapitalističke-akumulacije.html',
    'ch26-the-secret-of-primitive-accumulation.html': 'hr24-tako-zvana-prvobitna-akumulacija.html',
    'ch27-expropriation-of-the-agricultural-population-from-the-l.html': 'hr24-tako-zvana-prvobitna-akumulacija.html',
    'ch28-bloody-legislation-against-the-expropriated-from-the-en.html': 'hr24-tako-zvana-prvobitna-akumulacija.html',
    'ch29-genesis-of-the-capitalist-farmer.html': 'hr24-tako-zvana-prvobitna-akumulacija.html',
    'ch30-reaction-of-the-agricultural-revolution-on-industry-cre.html': 'hr24-tako-zvana-prvobitna-akumulacija.html',
    'ch31-genesis-of-the-industrial-capitalist.html': 'hr24-tako-zvana-prvobitna-akumulacija.html',
    'ch32-historical-tendency-of-capitalist-accumulation.html': 'hr24-tako-zvana-prvobitna-akumulacija.html',
    'ch33-the-modern-theory-of-colonisation.html': 'hr25-moderna-teorija-kolonizacije.html'
  };
  var HR2EN = {
    'index.html': '../index.html',
    'hr01-roba.html': 'ch01-commodities.html',
    'hr02-proces-razmjene.html': 'ch02-exchange.html',
    'hr03-novac-ili-robni-promet.html': 'ch03-money-or-the-circulation-of-commodities.html',
    'hr04-pretvaranje-novca-u-kapital.html': 'ch04-the-general-formula-for-capital.html',
    'hr05-proces-rada-i-proces-oplođivanja-vrijednosti.html': 'ch05-contradictions-in-the-general-formula-of-capital.html',
    'hr06-postojan-kapital-i-promjenljiv-kapital.html': 'ch06-the-buying-and-selling-of-labour-power.html',
    'hr07-stopa-viška-vrijednosti.html': 'ch09-the-rate-of-surplus-value.html',
    'hr08-radni-dan.html': 'ch10-the-working-day.html',
    'hr09-stopa-i-masa-viška-vrijednosti.html': 'ch11-rate-and-mass-of-surplus-value.html',
    'hr10-pojam-relativnog-viška-vrijednosti.html': 'ch12-the-concept-of-relative-surplus-value.html',
    'hr11-kooperacija.html': 'ch13-co-operation.html',
    'hr12-podjela-rada-i-manufaktura.html': 'ch14-division-of-labour-and-manufacture.html',
    'hr13-mašinerija-i-krupna-industrija.html': 'ch15-machinery-and-modern-industry.html',
    'hr14-apsolutni-i-relativni-višak-vrijednosti.html': 'ch16-absolute-and-relative-surplus-value.html',
    'hr15-mijenjanje-velicine-cijene-radne-snage-i-viška-vrijedno.html': 'ch17-changes-of-magnitude-in-the-price-of-labour-power-and-s.html',
    'hr16-različni-obrasci-za-stopu-viška-vrijednosti.html': 'ch18-various-formulae-for-the-rate-of-surplus-value.html',
    'hr17-pretvaranje-vrijednosti-ili-cijene-radne-snage-u-najamn.html': 'ch19-the-transformation-of-the-value-and-respectively-the-pr.html',
    'hr18-najamnina-od-vremena.html': 'ch20-time-wages.html',
    'hr19-najamnina-od-komada.html': 'ch21-piece-wages.html',
    'hr20-nacionalna-različnost-najamnina.html': 'ch22-national-differences-of-wages.html',
    'hr21-jednostavna-reprodukcija.html': 'ch23-simple-reproduction.html',
    'hr22-pretvaranje-viška-vrijednosti-u-kapital.html': 'ch24-conversion-of-surplus-value-into-capital.html',
    'hr23-opći-zakon-kapitalističke-akumulacije.html': 'ch25-the-general-law-of-capitalist-accumulation.html',
    'hr24-tako-zvana-prvobitna-akumulacija.html': 'ch26-the-secret-of-primitive-accumulation.html',
    'hr25-moderna-teorija-kolonizacije.html': 'ch33-the-modern-theory-of-colonisation.html'
  };

  var inEn = /^ch\d+-/.test(path) || (path === 'index.html' && location.pathname.indexOf('/hr/') === -1);
  var inHrDir = /\/hr\//.test(location.pathname);
  var inHr = /^hr\d+-/.test(path) || (path === 'index.html' && inHrDir);

  var target = null;
  var label = '';
  if (inEn && EN2HR[path]) {
    var t = EN2HR[path];
    target = (path === 'index.html') ? t : '../hr/glave/' + t;
    label = 'HR';
  } else if (inHr && HR2EN[path]) {
    var t = HR2EN[path];
    target = (path === 'index.html') ? t : '../../chapters/' + t;
    label = 'EN';
  }
  if (!target) return;

  var a = document.createElement('a');
  a.className = 'lang-switch';
  a.href = target;
  a.title = label === 'HR' ? 'Hrvatska verzija' : 'English version';
  var cur = document.createElement('span');
  cur.className = 'cur';
  cur.textContent = label === 'HR' ? 'EN' : 'HR';
  var bar = document.createElement('span');
  bar.className = 'bar';
  var other = document.createElement('b');
  other.textContent = label;
  a.appendChild(cur);
  a.appendChild(bar);
  a.appendChild(other);
  document.body.appendChild(a);
})();
