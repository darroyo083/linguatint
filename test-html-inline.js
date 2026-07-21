// Tests for inline formatting tags (<b>, <strong>, <em>, <span>) context handling
// Run with: node test-html-inline.js

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

console.log('═══ Inline Formatting & Context Tests ═══\n');

// 1. Single German word in bold inside German paragraph
const germanContext = 'Das ist ein sehr wichtiger Punkt in der deutschen Sprache.';

assert('Cognate word "auto" alone without context → neutral', detectLanguage('auto'), 'neutral');
assert('Cognate word "auto" with German block context → german', detectLanguage('auto', 'Das neue Auto ist sehr schnell und schön.'), 'german');
assert('Cognate word "auto" with Spanish block context → spanish', detectLanguage('auto', 'El auto nuevo es muy rápido y bonito.'), 'spanish');

// 3. Parentheses inside paragraph override context if explicit opposite language
assert('Spanish paren in German context → spanish', detectLanguage('(esto es español)', germanContext), 'spanish');

const spanishContext = 'Este es un punto muy importante en el idioma español.';

// 4. Non-alpha elements stay neutral even with context
assert('Numbers "123" with German context → neutral', detectLanguage('123', germanContext), 'neutral');
assert('Punctuation "..." with Spanish context → neutral', detectLanguage('...', spanishContext), 'neutral');

// 5. sentenceLevelSegments with context
const segs = sentenceLevelSegments('Wichtig ist hier.', germanContext);
assert('sentenceLevelSegments inline word with context → german', segs[0].language, 'german');

console.log('\n═══ Summary ═══');
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
console.log(`  Total:  ${passed + failed}`);

if (failed > 0) {
  console.log('\n  ⚠️  Some tests FAILED');
  process.exit(1);
} else {
  console.log('\n  🎉 All inline context tests passed!');
}
