(function () {
  'use strict';

  var rail = document.createElement('div');
  rail.className = 'rail';
  rail.innerHTML =
    '<div class="rail-track"></div>' +
    '<div class="rail-thumb"><span class="rail-spine">MARX</span></div>';
  document.body.appendChild(rail);

  var track = rail.querySelector('.rail-track');
  var thumb = rail.querySelector('.rail-thumb');

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
  var heroEl = document.querySelector('header.hero');
  var chHero = document.querySelector('header.chapter-hero');
  var isHrPage = document.documentElement.lang === 'hr';

  // Build Running Book Header (Kolumnentitel) + integrated progress bar
  var rHeader = document.createElement('div');
  rHeader.className = 'running-header';

  var leftHtml = '';
  var defaultSecLabel = '';
  if (chHero) {
    var chNoEl = chHero.querySelector('.chapter-no');
    var chTitleEl = chHero.querySelector('.chapter-title');
    var partRuleEl = chHero.querySelector('.hero-rule');
    var chNoTxt = chNoEl ? chNoEl.textContent.trim() : '';
    var chTitleTxt = chTitleEl ? chTitleEl.textContent.trim() : '';
    defaultSecLabel = partRuleEl ? partRuleEl.textContent.trim() : '';
    var backHref = isHrPage ? '../index.html#sadrzaj' : '../index.html#contents';
    var backText = isHrPage ? '← Sadržaj' : '← Inhalt';
    leftHtml =
      '<a class="rh-back" href="' + backHref + '">' + backText + '</a>' +
      '<span class="rh-sep">·</span>' +
      '<span class="rh-book">' + chNoTxt + '</span>' +
      '<span class="rh-sep">—</span>' +
      '<span class="rh-title">' + chTitleTxt + '</span>';
  } else {
    defaultSecLabel = isHrPage ? 'Prvi svezak · 1867' : 'Erster Band · 1867';
    leftHtml =
      '<span class="rh-book">Karl Marx</span>' +
      '<span class="rh-sep">·</span>' +
      '<span class="rh-title">' + (isHrPage ? 'Kapital' : 'Das Kapital') + '</span>';
  }

  rHeader.innerHTML =
    '<div class="rh-inner">' +
      '<div class="rh-left">' + leftHtml + '</div>' +
      '<div class="rh-right">' +
        '<span class="rh-sec"></span>' +
        '<span class="rh-pct">0%</span>' +
      '</div>' +
    '</div>' +
    '<div class="rh-rule-track"></div>';

  document.body.appendChild(rHeader);
  if (bar) {
    rHeader.appendChild(bar);
  }

  var rhSecEl = rHeader.querySelector('.rh-sec');
  var rhPctEl = rHeader.querySelector('.rh-pct');

  // Collect section headings for live Kolumnentitel updates
  var trackedHeadings = [];
  if (chHero) {
    var secNodes = document.querySelectorAll('main.reading h4.sec, section.footnotes h3');
    Array.prototype.forEach.call(secNodes, function (node) {
      var noSpan = node.querySelector('.no');
      var label = '';
      if (noSpan) {
        var noTxt = noSpan.textContent.trim().replace(/\.$/, '');
        var restTxt = node.textContent.replace(noSpan.textContent, '').trim();
        label = restTxt ? (noTxt + ' · ' + restTxt) : noTxt;
      } else {
        label = node.textContent.trim();
      }
      trackedHeadings.push({ el: node, label: label });
    });
  } else {
    var idxNodes = document.querySelectorAll('section[id] h2');
    Array.prototype.forEach.call(idxNodes, function (node) {
      trackedHeadings.push({ el: node, label: node.textContent.trim() });
    });
  }

  function updateRunningHeader() {
    var max = docHeight();
    var y = window.pageYOffset;
    var pct = max > 0 ? Math.min(100, Math.max(0, (y / max) * 100)) : 0;
    if (bar) {
      bar.style.width = pct + '%';
      bar.classList.toggle('has-progress', pct > 0.2);
    }
    if (rhPctEl) {
      rhPctEl.textContent = Math.round(pct) + '%';
    }
    var triggerY = heroEl ? Math.max(160, heroEl.offsetHeight - 80) : 240;
    rHeader.classList.toggle('is-visible', y > triggerY);

    var activeLabel = defaultSecLabel;
    for (var i = 0; i < trackedHeadings.length; i++) {
      var hTop = trackedHeadings[i].el.getBoundingClientRect().top + y - 140;
      if (y >= hTop) {
        activeLabel = trackedHeadings[i].label;
      } else {
        break;
      }
    }
    if (rhSecEl && rhSecEl.textContent !== activeLabel) {
      rhSecEl.textContent = activeLabel;
    }
  }

  var scheduled = false;
  function onScroll() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      render();
      updateRunningHeader();
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  render();
  updateRunningHeader();
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
  var curLang = label === 'HR' ? 'EN' : 'HR';
  a.title = label === 'HR' ? 'Switch to Croatian edition (Hrvatsko izdanje)' : 'Switch to English edition';
  a.innerHTML =
    '<span class="l-glyph">❧</span>' +
    '<span class="l-cur">' + curLang + '</span>' +
    '<span class="l-next">' + label + '</span>';
  document.body.appendChild(a);
})();

/* ============ MARGINALIA (EN & HR chapter pages) ============ */
(function () {
  'use strict';

  var path = location.pathname.split('/').pop() || 'index.html';
  var isEnChapter = /^ch\d+-/.test(path);
  var isHrChapter = /^hr\d+-/.test(path);
  var readingMain = document.querySelector('main.reading');
  if ((!isEnChapter && !isHrChapter) || !readingMain) return;

  // Ensure handwritten font (Caveat) is loaded
  var hasCaveat = Array.prototype.some.call(
    document.querySelectorAll('link[rel="stylesheet"]'),
    function (l) { return l.href && l.href.indexOf('Caveat') !== -1; }
  );
  if (!hasCaveat) {
    var fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&display=swap';
    document.head.appendChild(fontLink);
  }

  var storageKey = 'kapital_marginalia_' + path.replace(/\.html$/, '');
  var visibleKey = 'kapital_marginalia_visible';

  function loadNotes() {
    try {
      var raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveNotes(data) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (e) {}
  }

  function loadVisibility() {
    try {
      var v = localStorage.getItem(visibleKey);
      return v === null ? true : v !== '0';
    } catch (e) {
      return true;
    }
  }

  function saveVisibility(visible) {
    try {
      localStorage.setItem(visibleKey, visible ? '1' : '0');
    } catch (e) {}
  }

  var notesData = loadNotes();
  var isVisible = loadVisibility();
  if (!isVisible) {
    document.body.classList.add('marginalia-hidden');
  }

  var paras = Array.prototype.slice.call(readingMain.querySelectorAll('p'));
  var rail = document.querySelector('.rail');
  var railDots = [];

  function autoResize(ta) {
    ta.style.height = 'auto';
    ta.style.height = Math.max(28, ta.scrollHeight) + 'px';
  }

  function syncParaHeight(p) {
    if (document.body.classList.contains('marginalia-hidden') || window.innerWidth <= 1080) {
      p.style.minHeight = '';
      return;
    }
    var slots = p.querySelectorAll('.marginalia-slot.has-note, .marginalia-slot.is-editing');
    var maxH = 0;
    for (var i = 0; i < slots.length; i++) {
      var h = slots[i].offsetHeight;
      if (h > maxH) maxH = h;
    }
    p.style.minHeight = maxH > 0 ? maxH + 'px' : '';
  }

  function syncAllParaHeights() {
    paras.forEach(syncParaHeight);
  }

  function getNoteText(entry) {
    if (!entry) return '';
    if (typeof entry === 'string') return entry;
    return typeof entry.text === 'string' ? entry.text : '';
  }

  function randomPose() {
    var dir = Math.random() < 0.5 ? -1 : 1;
    var mag = 0.35 + Math.random() * 1.05; // 0.35° to 1.4°
    return {
      rot: +(dir * mag).toFixed(2),
      x: 0,
      y: 0
    };
  }

  function applyPose(wrap, pose) {
    wrap.style.setProperty('--note-rot', pose.rot + 'deg');
  }

  function updateRailDots() {
    if (!rail) return;
    railDots.forEach(function (d) {
      if (d.el && d.el.parentNode) d.el.parentNode.removeChild(d.el);
    });
    railDots = [];
    var docH = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (docH <= 0) return;

    paras.forEach(function (p, idx) {
      var hasLeft = getNoteText(notesData[idx + ':left']).trim().length > 0;
      var hasRight = getNoteText(notesData[idx + ':right']).trim().length > 0;
      if (!hasLeft && !hasRight) return;
      var dot = document.createElement('div');
      dot.className = 'rail-note-dot';
      var topPx = p.getBoundingClientRect().top + window.pageYOffset - 80;
      var ratio = Math.min(1, Math.max(0, topPx / (docH + 0.0001)));
      dot.style.top = (ratio * 100) + '%';
      rail.appendChild(dot);
      railDots.push({ el: dot, para: p });
    });
  }

  // Toggle button in bottom-left corner
  var toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'marginalia-toggle';
  toggleBtn.title = isHrChapter
    ? 'Prikaži / sakrij marginalije (Alt+M)'
    : 'Toggle marginalia notes on/off (Alt+M)';
  toggleBtn.innerHTML =
    '<span class="m-Nib">✎</span>' +
    '<span class="m-label">' + (isHrChapter ? 'Marginalije' : 'Marginalia') + '</span>' +
    '<span class="m-count"></span>' +
    '<span class="m-state"></span>';
  document.body.appendChild(toggleBtn);

  var countEl = toggleBtn.querySelector('.m-count');
  var stateEl = toggleBtn.querySelector('.m-state');

  function updateToggleUI() {
    var count = Object.keys(notesData).filter(function (k) {
      return getNoteText(notesData[k]).trim().length > 0;
    }).length;
    countEl.textContent = count > 0 ? '(' + count + ')' : '';
    stateEl.textContent = isVisible ? 'ON' : 'OFF';
    toggleBtn.setAttribute('aria-pressed', isVisible ? 'true' : 'false');
  }

  function setMarginaliaVisible(vis) {
    isVisible = vis;
    document.body.classList.toggle('marginalia-hidden', !isVisible);
    saveVisibility(isVisible);
    updateToggleUI();
    syncAllParaHeights();
  }

  toggleBtn.addEventListener('click', function () {
    setMarginaliaVisible(!isVisible);
  });

  window.addEventListener('keydown', function (e) {
    if (e.altKey && (e.key === 'm' || e.key === 'M')) {
      e.preventDefault();
      setMarginaliaVisible(!isVisible);
    }
  });

  function createSlot(p, idx, side) {
    var key = idx + ':' + side;
    var slot = document.createElement('span');
    slot.className = 'marginalia-slot ' + side;

    var addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'marginalia-add';
    var noteWord = isHrChapter ? 'bilješka' : 'note';
    addBtn.title = isHrChapter
      ? (side === 'left' ? 'Dodaj lijevu marginaliju' : 'Dodaj desnu marginaliju')
      : ('Add ' + side + ' margin note');
    addBtn.textContent = side === 'left' ? ('✎ ' + noteWord) : (noteWord + ' ✎');

    var wrap = document.createElement('span');
    wrap.className = 'marginalia-note-wrap';

    var ta = document.createElement('textarea');
    ta.className = 'marginalia-input';
    ta.rows = 1;
    ta.placeholder = isHrChapter
      ? (side === 'left' ? 'Bilješka na lijevoj margini…' : 'Bilješka na desnoj margini…')
      : (side === 'left' ? 'Left margin note…' : 'Right margin note…');
    ta.setAttribute('aria-label', (side === 'left' ? 'Left' : 'Right') + ' margin note for paragraph ' + (idx + 1));

    var delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'marginalia-del';
    delBtn.title = isHrChapter ? 'Obriši bilješku' : 'Erase note';
    delBtn.setAttribute('aria-label', isHrChapter ? 'Obriši bilješku' : 'Erase note');
    delBtn.textContent = '×';

    wrap.appendChild(ta);
    wrap.appendChild(delBtn);
    slot.appendChild(addBtn);
    slot.appendChild(wrap);

    var entry = notesData[key];
    var hasValidPose = entry && typeof entry === 'object' && typeof entry.rot === 'number' && Math.abs(entry.rot) <= 1.4;
    var pose = hasValidPose
      ? { rot: entry.rot, x: 0, y: 0 }
      : randomPose();
    applyPose(wrap, pose);

    var initialText = getNoteText(entry);
    if (initialText.trim().length > 0) {
      ta.value = initialText;
      slot.classList.add('has-note');
      if (!hasValidPose) {
        notesData[key] = { text: initialText, rot: pose.rot, x: 0, y: 0 };
        saveNotes(notesData);
      }
    }

    function openEditor() {
      if (!isVisible) return;
      if (!slot.classList.contains('has-note') && !slot.classList.contains('is-editing')) {
        pose = randomPose();
        applyPose(wrap, pose);
      }
      slot.classList.add('is-editing');
      autoResize(ta);
      ta.focus();
      syncParaHeight(p);
    }

    addBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      openEditor();
    });

    // Clicking anywhere in the empty margin slot opens the editor
    slot.addEventListener('click', function (e) {
      if (e.target === slot) {
        openEditor();
      }
    });

    ta.addEventListener('focus', function () {
      slot.classList.add('is-editing');
      autoResize(ta);
      syncParaHeight(p);
    });

    ta.addEventListener('input', function () {
      autoResize(ta);
      var val = ta.value;
      if (val.trim().length > 0) {
        notesData[key] = { text: val, rot: pose.rot, x: pose.x, y: pose.y };
        slot.classList.add('has-note');
      } else {
        delete notesData[key];
        slot.classList.remove('has-note');
      }
      saveNotes(notesData);
      updateToggleUI();
      syncParaHeight(p);
      updateRailDots();
    });

    ta.addEventListener('blur', function () {
      slot.classList.remove('is-editing');
      var val = ta.value.trim();
      if (val.length > 0) {
        notesData[key] = { text: ta.value, rot: pose.rot, x: pose.x, y: pose.y };
        slot.classList.add('has-note');
        saveNotes(notesData);
      } else {
        ta.value = '';
        delete notesData[key];
        slot.classList.remove('has-note');
        saveNotes(notesData);
      }
      updateToggleUI();
      syncParaHeight(p);
      updateRailDots();
    });

    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        ta.blur();
      }
    });

    delBtn.addEventListener('mousedown', function (e) {
      // Prevent blur before delete fires
      e.preventDefault();
    });

    delBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      ta.value = '';
      delete notesData[key];
      slot.classList.remove('has-note', 'is-editing');
      saveNotes(notesData);
      updateToggleUI();
      syncParaHeight(p);
      updateRailDots();
    });

    return { slot: slot, ta: ta };
  }

  var allTextareas = [];
  paras.forEach(function (p, idx) {
    p.classList.add('has-marginalia-slots');
    p.setAttribute('data-para-idx', idx);
    var leftObj = createSlot(p, idx, 'left');
    var rightObj = createSlot(p, idx, 'right');
    p.appendChild(leftObj.slot);
    p.appendChild(rightObj.slot);
    if (getNoteText(notesData[idx + ':left']).trim()) allTextareas.push({ ta: leftObj.ta, p: p });
    if (getNoteText(notesData[idx + ':right']).trim()) allTextareas.push({ ta: rightObj.ta, p: p });
  });

  function refreshAllNotesLayout() {
    allTextareas.forEach(function (item) {
      autoResize(item.ta);
    });
    paras.forEach(function (p) {
      var activeTas = p.querySelectorAll('.marginalia-slot.has-note .marginalia-input');
      for (var i = 0; i < activeTas.length; i++) {
        autoResize(activeTas[i]);
      }
      syncParaHeight(p);
    });
    updateRailDots();
  }

  updateToggleUI();
  refreshAllNotesLayout();

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(refreshAllNotesLayout);
  }
  window.addEventListener('resize', refreshAllNotesLayout);
})();
