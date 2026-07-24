# LinguaTint

**Beta.** Detection is heuristic: expect occasional misses on short or ambiguous text.

Chrome extension (MV3) that color-codes bilingual German/Spanish text and pronounces German words aloud using your system's local voice.

Created to highlight mixed German and Spanish text in NotebookLM and across the web. Each language gets its own color (blue for German, green for Spanish by default, both configurable). Colors update live without page reload.

## How it works

Three-level detection with NotebookLM chat scoping:

1. **Smart parentheses**: text inside `(...)` is scored as a single unit; defaults to Spanish only if ambiguous.
2. **Sentence-level**: split by `. ! ? \n` (preserving parens), detect dominant language with `scoreLanguage()`. If a sentence is clearly one language (ratio >= 0.7), it is colored as a whole.
3. **Word-level & DOM Stitching**: 5-word window scoring with word dictionaries, capital letters (German nouns), German suffixes (-ung, -keit, -heit, -schaft, -lich, -isch, -bar) and Spanish suffixes (-ción, -dad, -mente, -miento). Suffixes split by inline formatting tags (`<b>Mein</b>e`) are automatically stitched without moving text between formatting elements.

Glued German words like `einemKind` are split automatically (including Fugenlaut: *Arbeitstag*, *Kinderspielplatz*). Cognate words (*hotel*, *computer*, *park*) are excluded from scoring to avoid false positives. In NotebookLM, detection is strictly scoped to the chat panel area (`chat-panel`).

## German Pronunciation

Hover over a German word (blue) for 350 ms to see a popover with a play button. Click it to hear the word spoken by a local German voice. Press **Alt+click** on any German word to speak it immediately. Press **Alt+P** to pronounce the currently selected word.

Pronunciation uses your system's speech synthesis (Windows, macOS, ChromeOS). No audio data is sent over the network. Only local German voices (`localService === true`) are used. No AI, tokens, or external APIs are involved.

If no local German voice is installed, the popover displays an unavailable message. Install a German system voice in your operating system's language settings to enable pronunciation.

## German-Spanish Translation

When hovering a German word, the popover also shows a short Spanish translation below the word. Translation is dictionary-based and works completely offline. No network requests, AI, or external services are involved.

Inflected forms such as *Freunden* are automatically resolved to their lemma (*Freund*) before lookup. If a word has no entry in the dictionary, the popover shows pronunciation without translation. The initial dictionary covers everyday vocabulary. A larger open-data dictionary is planned.

## Usage

1. Load unpacked extension at `chrome://extensions/`.
2. Click the icon to open the popup.
3. Adjust colors, scope (NotebookLM-only or all sites), and toggle per language.
4. Enable German pronunciation and select a voice under "German pronunciation".

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
├── data/
│   └── translations-de-es.js  <- German-Spanish dictionary data
├── content/
│   ├── defaults.js           <- shared settings defaults
│   ├── dictionaries.js       <- German/Spanish word sets and patterns
│   ├── pronunciation.js      <- German speech controller, hover popover
│   ├── translation.js        <- German-Spanish dictionary lookup
│   ├── content.js            <- DOM, observer, processing pipeline
│   └── language-detector.js  <- pure detection, no DOM
```

## Tests

```sh
node test-detector.js           # core detection tests
node test-wordlevel.js          # segmentation and whitespace tests
node test-improvements.js       # improvement tests (cognates, parens, compounds, B1+)
node test-html-inline.js        # inline formatting & context tests
node test-notebooklm-cases.js   # real NotebookLM screenshot tests
node test-pronunciation.js      # word normalization, voice selection, settings validation
node test-translation.js        # German-Spanish lookup, lemma resolution, case/punctuation normalization
```

## License

MIT


