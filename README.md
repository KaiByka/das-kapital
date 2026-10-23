# Das Kapital — A Reading Edition

A bilingual reading edition of Karl Marx's *Das Kapital* (Volume I), designed
in the manner of the 1867 Hamburg first edition: letterpress typography,
cream paper and ink, one revolutionary red accent.

## Structure

- `index.html` — English edition (Moore–Aveling translation, 1887)
- `chapters/` — 33 English chapters
- `hr/` — Croatian edition (25 glava, following the German 2nd-edition structure)
- `styles.css`, `site.js` — shared letterpress design, reading rail, progress bar,
  and the EN/HR language pill (bottom-right corner of every page)

## Building from source

The chapter pages are generated:

```bash
python build.py          # English: downloads the public-domain source text
python build_hr.py       # Croatian: splits ocr-transcripts/ into 25 chapters
python build_hr_site.py  # Croatian: builds hr/ pages from the split chapters
```

Requires Python 3 standard library only. The English source is fetched from
the Internet Archive on first run and cached as `vol1_source.txt`.

## Notes

- Text is OCR from public-domain scans (Kerr 1906 English edition; Croatian
  edition via OCR of the print scan). Occasional character-level OCR noise
  is possible.
- The English translation (Moore–Aveling, 1887) is in the public domain.
