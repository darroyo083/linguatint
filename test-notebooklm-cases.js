// Comprehensive test suite for real NotebookLM screenshots cases
// Run with: node test-notebooklm-cases.js

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

console.log('═══ NotebookLM Screenshot Test Cases ═══\n');

// 1. Spanish Headings & Explanations (MUST NOT be German)
assert(
  'Spanish heading: "3. La Gran Tabla de Terminaciones"',
  detectLanguage('3. La Gran Tabla de Terminaciones'),
  'spanish'
);

assert(
  'Spanish explanation: "Este ejercicio en forma de tabla te pide marcar con una X"',
  detectLanguage('Este ejercicio en forma de tabla te pide marcar con una X'),
  'spanish'
);

assert(
  'Spanish sentence: "Fíjate cómo el verbo modal va en la Posición 2"',
  detectLanguage('Fíjate cómo el verbo modal va en la Posición 2'),
  'spanish'
);

assert(
  'Spanish sentence: "Antes de nada, el idioma te pide elegir la raíz del posesivo"',
  detectLanguage('Antes de nada, el idioma te pide elegir la raíz del posesivo'),
  'spanish'
);

assert(
  'Spanish grammar term: "Masculino y neutro no llevan terminación"',
  detectLanguage('Masculino y neutro no llevan terminación'),
  'spanish'
);

// 2. Individual Spanish Words in Headers (MUST NOT be German)
assert('Spanish word "Terminaciones" → spanish', detectLanguage('Terminaciones'), 'spanish');
assert('Spanish word "Masculino" → spanish', detectLanguage('Masculino'), 'spanish');
assert('Spanish word "Femenino" → spanish', detectLanguage('Femenino'), 'spanish');
assert('Spanish word "Nominativo" → spanish', detectLanguage('Nominativo'), 'spanish');
assert('Spanish word "Acusativo" → spanish', detectLanguage('Acusativo'), 'spanish');
assert('Spanish word "Dativo" → spanish', detectLanguage('Dativo'), 'spanish');

// 3. German Exercise Items (MUST be German)
assert('German verb line: "ich: möchte, kann, muss"', detectLanguage('ich: möchte, kann, muss'), 'german');
assert('German verb line: "er, sie, es, man: möchte, kann, muss"', detectLanguage('er, sie, es, man: möchte, kann, muss'), 'german');
assert('German verb line: "wir: wollen, können"', detectLanguage('wir: wollen, können'), 'german');
assert('German verb line: "ihr: dürft, müsst"', detectLanguage('ihr: dürft, müsst'), 'german');
assert('German verb line: "sie, Sie: wollen, können"', detectLanguage('sie, Sie: wollen, können'), 'german');

// 4. German Sentences & Declensions (MUST be German)
assert('German sentence: "Am Sonntag können wir lange schlafen."', detectLanguage('Am Sonntag können wir lange schlafen.'), 'german');
assert('German sentence: "Meine Tochter will eine Freundin besuchen."', detectLanguage('Meine Tochter will eine Freundin besuchen.'), 'german');
assert('German sentence: "Mein Mann möchte Fußball sehen."', detectLanguage('Mein Mann möchte Fußball sehen.'), 'german');
assert('German sentence: "Am Sonntag muss ich leider auch kochen."', detectLanguage('Am Sonntag muss ich leider auch kochen.'), 'german');
assert('German sentence: "Am Nachmittag möchten wir zusammen spazieren gehen."', detectLanguage('Am Nachmittag möchten wir zusammen spazieren gehen.'), 'german');
assert('German phrase: "meinem Vater, meinem Kind"', detectLanguage('meinem Vater, meinem Kind'), 'german');
assert('German phrase: "meiner Mutter"', detectLanguage('meiner Mutter'), 'german');
assert('German phrase: "meinen Eltern"', detectLanguage('meinen Eltern'), 'german');
assert('German phrase: "eure Mutter, euren Vater, eurem Kind"', detectLanguage('eure Mutter, euren Vater, eurem Kind'), 'german');

// 5. Mixed Lines with Parentheses (Bilingual Segmentation)
const line1 = 'Am Sonntag können wir lange schlafen. (El domingo podemos dormir hasta tarde).';
const segs1 = sentenceLevelSegments(line1);
assert('Bilingual line 1 German segment', segs1[0].language, 'german');
assert('Bilingual line 1 Spanish segment', segs1[1].language, 'spanish');

console.log('\n═══ Summary ═══');
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
console.log(`  Total:  ${passed + failed}`);

if (failed > 0) {
  console.log('\n  ⚠️  Some tests FAILED');
  process.exit(1);
} else {
  console.log('\n  🎉 All NotebookLM screenshot tests passed!');
}
