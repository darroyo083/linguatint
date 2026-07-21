# LinguaTint

**Beta.** Detection is heuristic — expect occasional misses on short or ambiguous text.

Chrome extension (MV3) that color-codes bilingual German/Spanish text.

I started this because I use NotebookLM to do German exercises and got tired of squinting at mixed-language paragraphs trying to tell which word is which. Each language gets its own color (blue for German, green for Spanish by default, both configurable). Parenthesized text is assumed Spanish; everything else is detected via statistical scoring with character patterns and word dictionaries. Colors update live without page reload.

Each language gets its own color (blue for German, green for Spanish by default, both configurable). Parenthesized text is assumed Spanish; everything else is detected via statistical scoring with character patterns and word dictionaries. Colors update live without page reload.

## How it works

Three-level detection:

1. **Smart parentheses** — text inside `(...)` is scored; defaults to Spanish only if ambiguous.
2. **Sentence-level** — split by `. ! ? \n`, detect the dominant language of each sentence with `scoreLanguage()`. If a sentence is clearly one language (ratio ≥ 0.7), it's colored as a whole.
3. **Word-level** — centered 5-word window using: exclusive characters (ß, ñ, ö, ü, é, í…), 800+ word dictionary per language, capital letter (German noun), suffixes (-ción, -dad, -mente) and character patterns (sch, cht, ung; que, ión, miento, cción).

Glued words like `einemKind` are split automatically (including Fugenlaut: *Arbeitstag*, *Kinderspielplatz*). Cognate words (*hotel*, *computer*, *park*) are excluded from scoring to avoid false positives.

## Usage

1. Load unpacked extension at `chrome://extensions/`.
2. Click the icon to open the popup.
3. Adjust colors, scope (NotebookLM-only or all sites), and toggle per language.

Color changes apply instantly without page reload.

## Files

```
lingua-tint/
├── manifest.json
├── icons/
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
└── content/
    ├── defaults.js          ← shared settings defaults
    ├── content.js           ← DOM, observer, processing pipeline
    └── language-detector.js ← pure detection, no DOM
```

## Tests

```sh
node test-detector.js      # 50 detection tests
node test-wordlevel.js     # 6 segmentation tests
node test-improvements.js  # 61 improvement tests (cognates, parens, compounds, B1+)
```

## License

MIT
