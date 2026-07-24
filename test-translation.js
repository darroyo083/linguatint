const fs = require('fs');
const vm = require('vm');
const path = require('path');

const data = fs.readFileSync(
  path.join(__dirname, 'lingua-tint', 'data', 'translations-de-es.js'),
  'utf-8'
);
const code = fs.readFileSync(
  path.join(__dirname, 'lingua-tint', 'content', 'translation.js'),
  'utf-8'
);

vm.runInThisContext(data);
vm.runInThisContext(code);

let failures = 0;

const assert = (label, actual, expected) => {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  if (!pass) failures++;
  console[pass ? 'log' : 'error'](
    (pass ? '  \u2705' : '  \u274C') + ' ' + label +
    ' \u2192 ' + (pass ? JSON.stringify(actual) : `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  );
};

const assertFound = (label, result, expectedTranslations) => {
  const pass = result.found === true &&
    result.translations &&
    JSON.stringify(result.translations) === JSON.stringify(expectedTranslations);
  if (!pass) failures++;
  console[pass ? 'log' : 'error'](
    (pass ? '  \u2705' : '  \u274C') + ' ' + label +
    ' \u2192 ' + (pass ? JSON.stringify(result.translations) : `expected "${expectedTranslations}", got "${JSON.stringify(result.translations)}"`)
  );
};

const assertNotFound = (label, result) => {
  const pass = result.found === false;
  if (!pass) failures++;
  console[pass ? 'log' : 'error'](
    (pass ? '  \u2705' : '  \u274C') + ' ' + label +
    ' \u2192 ' + (pass ? 'not found' : `expected not found but got ${JSON.stringify(result)}`)
  );
};

console.log('GermanTranslations.lookup tests\n');

assertFound('Freund (exact lemma)', GermanTranslations.lookup('Freund'), ['amigo', 'compañero']);
assertFound('gehen (exact lemma)', GermanTranslations.lookup('gehen'), ['ir', 'andar']);
assertFound('Mädchen (umlaut)', GermanTranslations.lookup('Mädchen'), ['niña', 'chica']);
assertFound('Freunden (inflected noun)', GermanTranslations.lookup('Freunden'), ['amigo', 'compañero']);
assertFound('geht (inflected verb)', GermanTranslations.lookup('geht'), ['ir', 'andar']);
assertFound('gute (inflected adjective)', GermanTranslations.lookup('gute'), ['bueno']);
assertFound('Nachbarinnen (inflected noun)', GermanTranslations.lookup('Nachbarinnen'), ['vecina']);
assertFound('lowercase freund', GermanTranslations.lookup('freund'), ['amigo', 'compañero']);
assertFound('UPPERCASE FREUND', GermanTranslations.lookup('FREUND'), ['amigo', 'compañero']);
assertFound('parentheses (Freund)', GermanTranslations.lookup('(Freund)'), ['amigo', 'compañero']);
assertFound('trailing comma Freund,', GermanTranslations.lookup('Freund,'), ['amigo', 'compañero']);
assertNotFound('unknown word xyz', GermanTranslations.lookup('xyz'));
assertNotFound('empty string', GermanTranslations.lookup(''));
assertNotFound('null input', GermanTranslations.lookup(null));

assert('normalize null input', GermanTranslations._normalize(null), '');
assert('normalize preserve umlauts', GermanTranslations._normalize('Straße'), 'straße');

console.log('\ntranslate() async tests (dictionary fallback, no Translator API)\n');

// Without Translator API available, translate() falls back to dictionary synchronously
GermanTranslations.translate('Freund').then(function(result) {
  assertFound('translate Freund (async)', result, ['amigo', 'compañero']);
  assert('translate source is dictionary', result.source, 'dictionary');
}).then(function() {
  return GermanTranslations.translate('Mädchen');
}).then(function(result) {
  assertFound('translate Mädchen (async)', result, ['niña', 'chica']);
}).then(function() {
  return GermanTranslations.translate('xyzxyz');
}).then(function(result) {
  assertNotFound('translate unknown word', result);
}).then(function() {
  // Test cache: second call with same word should return quickly
  var start = Date.now();
  return GermanTranslations.translate('Freund').then(function(result) {
    var elapsed = Date.now() - start;
    assert('translate cached Freund is fast', elapsed < 50, true);
    assertFound('translate cached Freund', result, ['amigo', 'compañero']);
  });
}).then(function() {
  // Test resetTranslator clears cache  
  GermanTranslations.resetTranslator();
  return GermanTranslations.translate('Freund');
}).then(function(result) {
  assertFound('translate Freund after reset', result, ['amigo', 'compañero']);
}).then(function() {
  console.log('\nStatus API tests\n');

  // reset translator and test onStatusChange
  GermanTranslations.resetTranslator();
  assert('getStatus returns unchecked after reset', GermanTranslations.getStatus(), 'unchecked');
  var statusReceived = null;
  GermanTranslations.onStatusChange(function(status, details) {
    statusReceived = status;
  });
  assert('onStatusChange listener fires immediately with current status', statusReceived, 'unchecked');

  // getDownloadProgress returns null when not downloading
  assert('getDownloadProgress returns null when idle', GermanTranslations.getDownloadProgress(), null);

  // resetTranslator resets downloadProgress
  GermanTranslations.resetTranslator();
  assert('getStatus after full reset', GermanTranslations.getStatus(), 'unchecked');

  // _debug flag is accessible
  assert('_debug flag is false by default', GermanTranslations._debug, false);

  // Toggle _debug on
  GermanTranslations._debug = true;
  assert('_debug flag can be set to true', GermanTranslations._debug, true);
  GermanTranslations._debug = false;
  assert('_debug flag can be set back to false', GermanTranslations._debug, false);

  console.log('\n---');
  if (failures > 0) process.exitCode = 1;
  if (failures === 0) console.log('All translation tests passed.');
});
