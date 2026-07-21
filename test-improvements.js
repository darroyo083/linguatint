// Tests for all improvements: regex fix, smart parens, cognates, Fugenlaut, expanded dictionaries
// Run with: node test-improvements.js

const fs = require('fs');
const vm = require('vm');

const dicts = fs.readFileSync(
  require('path').join(__dirname, 'lingua-tint', 'content', 'dictionaries.js'),
  'utf-8'
);
const code = fs.readFileSync(
  require('path').join(__dirname, 'lingua-tint', 'content', 'language-detector.js'),
  'utf-8'
);

vm.runInThisContext(dicts);
vm.runInThisContext(code);

let passed = 0;
let failed = 0;

const assert = (label, actual, expected) => {
  const pass = actual === expected;
  if (pass) {
    passed++;
    console.log('  ✅ ' + label + ' → ' + actual);
  } else {
    failed++;
    console.error('  ❌ ' + label + ' → expected "' + expected + '", got "' + actual + '"');
  }
};

// ═══════════════════════════════════════════════════════════════════════════
console.log('═══ P0: Regex Pattern Bug Fix ═══\n');
// The old bug: patterns were tested against the last word only.
// Now they should detect patterns anywhere in the text.

assert('sch in first word "Schule ist gut"', detectLanguage('Schule ist gut'), 'german');
assert('ung in middle word "die Zeitung ist"', detectLanguage('die Zeitung ist'), 'german');
assert('ción in first word "educación y cultura"', detectLanguage('educación y cultura'), 'spanish');
assert('multiple patterns across words', detectLanguage('Entschuldigung bitte'), 'german');

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══ P0: Smart Parentheses ═══\n');

// Spanish in parens — backward compatible
assert('(texto español) → spanish', detectLanguage('(esto es español)'), 'spanish');
assert('(una palabra) → spanish', detectLanguage('(hola)'), 'spanish');

// German in parens — NEW: should detect correctly
assert('(deutscher Text) → german', detectLanguage('(der Hund ist braun)'), 'german');
assert('(mit Umlaut) → german', detectLanguage('(Straße und Bäcker)'), 'german');

// Ambiguous parens — defaults to Spanish (backward compat)
assert('(short ambiguous) → spanish fallback', detectLanguage('(ok)'), 'spanish');

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══ P1: Cognate Handling ═══\n');

// Cognates alone should be neutral (no signal)
assert('hotel alone → neutral', detectLanguage('hotel'), 'neutral');
assert('computer alone → neutral', detectLanguage('computer'), 'neutral');
assert('normal alone → neutral', detectLanguage('normal'), 'neutral');

// Cognates with German context → german wins
assert('hotel + german context', detectLanguage('das Hotel ist schön'), 'german');
assert('auto + german context', detectLanguage('das Auto fährt schnell'), 'german');

// Cognates with Spanish context → spanish wins
assert('hotel + spanish context', detectLanguage('el hotel es bonito'), 'spanish');

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══ P1: Expanded German Dictionary ═══\n');

// Past participles
assert('gelaufen → german', detectLanguage('Ich bin gelaufen'), 'german');
assert('gesprochen → german', detectLanguage('wir haben gesprochen'), 'german');
assert('geschrieben → german', detectLanguage('er hat geschrieben'), 'german');

// Modal verb forms
assert('möchte → german', detectLanguage('ich möchte essen'), 'german');
assert('könnte → german', detectLanguage('er könnte kommen'), 'german');
assert('würde → german', detectLanguage('ich würde gehen'), 'german');
assert('hätte → german', detectLanguage('sie hätte gesagt'), 'german');

// B1+ nouns
assert('Entschuldigung → german', detectLanguage('Entschuldigung bitte'), 'german');
assert('Gesellschaft → german', detectLanguage('die Gesellschaft ist'), 'german');
assert('Möglichkeit → german', detectLanguage('eine Möglichkeit'), 'german');
assert('Erfahrung → german', detectLanguage('seine Erfahrung'), 'german');
assert('Entwicklung → german', detectLanguage('die Entwicklung'), 'german');

// B1+ adverbs
assert('wahrscheinlich → german', detectLanguage('wahrscheinlich nicht'), 'german');
assert('eigentlich → german', detectLanguage('eigentlich schon'), 'german');
assert('allerdings → german', detectLanguage('allerdings war'), 'german');

// B1+ adjectives
assert('wichtig → german', detectLanguage('das ist wichtig'), 'german');
assert('gefährlich → german', detectLanguage('sehr gefährlich'), 'german');

// B1+ verbs
assert('erklären → german', detectLanguage('er erklärt das'), 'german');
assert('entwickeln → german', detectLanguage('wir entwickeln'), 'german');

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══ P1: Expanded Spanish Dictionary ═══\n');

// Subjunctive
assert('tuviera → spanish', detectLanguage('si yo tuviera tiempo'), 'spanish');
assert('pudiera → spanish', detectLanguage('si pudiera venir'), 'spanish');
assert('quisiera → spanish', detectLanguage('quisiera hablar contigo'), 'spanish');
assert('hiciera → spanish', detectLanguage('que hiciera eso'), 'spanish');

// Past participles
assert('desarrollado → spanish', detectLanguage('hemos desarrollado esto'), 'spanish');
assert('conseguido → spanish', detectLanguage('ha conseguido el éxito'), 'spanish');

// B1+ nouns
assert('desarrollo → spanish', detectLanguage('el desarrollo del país'), 'spanish');
assert('gobierno → spanish', detectLanguage('el gobierno decidió'), 'spanish');
assert('sociedad → spanish', detectLanguage('la sociedad moderna'), 'spanish');
assert('experiencia → spanish', detectLanguage('una experiencia increíble'), 'spanish');

// B1+ adjectives
assert('importante → spanish', detectLanguage('es muy importante'), 'spanish');
assert('necesario → spanish', detectLanguage('es necesario saber'), 'spanish');
assert('interesante → spanish', detectLanguage('algo interesante'), 'spanish');

// B1+ verbs
assert('conseguir → spanish', detectLanguage('necesito conseguir eso'), 'spanish');
assert('explicar → spanish', detectLanguage('voy a explicar esto'), 'spanish');
assert('descubrir → spanish', detectLanguage('acabamos de descubrir'), 'spanish');

// Connectors
assert('sin embargo → spanish', detectLanguage('sin embargo no pudo'), 'spanish');

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══ P2: Fugenlaut Compound Splitting ═══\n');

// Compounds with Fugenlaut 's'
assert('Arbeitstag (s-Fuge) → german', detectLanguage('der Arbeitstag'), 'german');
assert('Geburtstag (s-Fuge) → german', detectLanguage('mein Geburtstag'), 'german');

// Compounds with Fugenlaut 'er'
assert('Kinderspielplatz (er-Fuge)', detectLanguage('der Kinderspielplatz'), 'german');

// Direct compound (no Fugenlaut) — regression check
assert('einemKind (direct) → german', detectLanguage('einemKind'), 'german');

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══ Regression: Original tests still work ═══\n');

// Quick spot check of core original behaviors
assert('Der Hund ist braun → german', detectLanguage('Der Hund ist braun'), 'german');
assert('el perro es marrón → spanish', detectLanguage('el perro es marrón'), 'spanish');
assert('Straße → german', detectLanguage('Straße'), 'german');
assert('español → spanish', detectLanguage('español'), 'spanish');
assert('123 → neutral', detectLanguage('123'), 'neutral');
assert('hi → neutral', detectLanguage('hi'), 'neutral');

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══ Summary ═══');
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
console.log(`  Total:  ${passed + failed}`);
if (failed > 0) {
  console.log('\n  ⚠️  Some tests FAILED');
  process.exit(1);
} else {
  console.log('\n  🎉 All tests passed!');
}
