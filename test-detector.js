// Test file for language-detector.js
// Run with: node test-detector.js

const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync(
  require('path').join(__dirname, 'lingua-tint', 'content', 'language-detector.js'),
  'utf-8'
);

vm.runInThisContext(code);

const assert = (label, actual, expected) => {
  const pass = actual === expected;
  console[pass ? 'log' : 'error'](
    (pass ? '  ✅' : '  ❌') + ' ' + label +
    ' → ' + (pass ? actual : `expected "${expected}", got "${actual}"`)
  );
};

console.log('detectLanguage tests\n');

// Parens
assert('(texto en parens) → spanish', detectLanguage('(texto en parens)'), 'spanish');

// Exclusive chars
assert('ß → german', detectLanguage('Straße'), 'german');
assert('ñ → spanish', detectLanguage('español'), 'spanish');
assert('Ñ → spanish', detectLanguage('ESPAÑOL'), 'spanish');

// German sentences
assert('"Der Hund ist braun" → german', detectLanguage('Der Hund ist braun'), 'german');
assert('"Gestern war ich im Wald" → german', detectLanguage('Gestern war ich im Wald'), 'german');
assert('"Die Katze trinkt Milch" → german', detectLanguage('Die Katze trinkt Milch'), 'german');

// Spanish sentences
assert('"el perro es marrón" → spanish', detectLanguage('el perro es marrón'), 'spanish');
assert('"ayer fui a caminar" → spanish', detectLanguage('ayer fui a caminar'), 'spanish');
assert('"ayer fui a caminar al bosque" → spanish', detectLanguage('ayer fui a caminar al bosque'), 'spanish');

// Mixed (no parens) → whichever has higher score
const mixed = detectLanguage('Der Hund ist braun el perro es marrón');
assert('mixed german+spanish', mixed === 'german' || mixed === 'spanish', true);

// Short text
assert('"hi" (short) → neutral', detectLanguage('hi'), 'neutral');

// Numbers/punctuation
assert('"123" → neutral', detectLanguage('123'), 'neutral');
assert('"..." → neutral', detectLanguage('...'), 'neutral');

// Window context for short words
assert('"ist" with context → german', detectLanguage('Der ist ein Hund'), 'german');
assert('"es" with context → spanish', detectLanguage('el es un perro'), 'spanish');

// Umlaut detection
assert('ä → german +3', detectLanguage('Mädchen'), 'german');
assert('ö → german +3', detectLanguage('schön'), 'german');
assert('ü with context → german', detectLanguage('führen auf'), 'german');
assert('ü alone → german (scoring)', detectLanguage('führen'), 'german');

// Accent detection
assert('é → spanish +3', detectLanguage('canción'), 'spanish');
assert('í → spanish +3', detectLanguage('sí'), 'spanish');
assert('ó → spanish +3', detectLanguage('canción'), 'spanish');

// Spanish suffix bonus
assert('termina en -ción → spanish +1', detectLanguage('educación'), 'spanish');
assert('termina en -dad → spanish (with context)', detectLanguage('la universidad'), 'spanish');
assert('termina en -mente → spanish +1', detectLanguage('fácilmente'), 'spanish');

// Capital letter bonus (German nouns)
assert('capital word in dict → german', detectLanguage('Hund'), 'german'); // now 'hund' is in GERMAN_WORDS
assert('capital with context → german', detectLanguage('der Hund ist'), 'german');

console.log('\n---');
