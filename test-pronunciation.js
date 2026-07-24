const fs = require('fs');
const vm = require('vm');

const dicts = fs.readFileSync(
  require('path').join(__dirname, 'lingua-tint', 'content', 'dictionaries.js'),
  'utf-8'
);
const code = fs.readFileSync(
  require('path').join(__dirname, 'lingua-tint', 'content', 'pronunciation.js'),
  'utf-8'
);

vm.runInThisContext(dicts);
vm.runInThisContext(code);

let failures = 0;

const assert = (label, actual, expected) => {
  const pass = actual === expected;
  if (!pass) failures++;
  console[pass ? 'log' : 'error'](
    (pass ? '  \u2705' : '  \u274C') + ' ' + label +
    ' \u2192 ' + (pass ? JSON.stringify(actual) : `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  );
};

console.log('normalizePronunciationWord tests\n');

assert('normal word', PronunciationController._normalize('Freunden'), 'Freunden');
assert('word with umlauts', PronunciationController._normalize('Mädchen'), 'Mädchen');
assert('word with eszett', PronunciationController._normalize('Straße'), 'Straße');
assert('word with apostrophe', PronunciationController._normalize("Mutter's"), "Mutter's");
assert('compound word', PronunciationController._normalize('Geburtstagsgeschenk'), 'Geburtstagsgeschenk');
assert('word with hyphen', PronunciationController._normalize('Deutsch-Lernende'), 'Deutsch-Lernende');
assert('trimmed surrounding parens', PronunciationController._normalize('(Freunden)'), 'Freunden');
assert('trailing comma', PronunciationController._normalize('Straße,'), 'Straße');
assert('number only returns empty', PronunciationController._normalize('123'), '');
assert('(7) returns empty', PronunciationController._normalize('(7)'), '');
assert('empty string', PronunciationController._normalize(''), '');
assert('whitespace only', PronunciationController._normalize('   '), '');
assert('string with newline', PronunciationController._normalize('Freun\nden'), '');
assert('over 64 chars', PronunciationController._normalize('Donaudampfschifffahrtsgesellschaftskapitänswitwenrentenausschusses'), '');
assert('single char returns empty', PronunciationController._normalize('a'), '');
assert('spanish word with tildes accepted (language filtered elsewhere)', PronunciationController._normalize('canción'), 'canción');
assert('non-alpha prefix stripped', PronunciationController._normalize('2Freunde'), 'Freunde');
assert('leading punctuation stripped', PronunciationController._normalize('.test'), 'test');
assert('null input', PronunciationController._normalize(null), '');

console.log('\nfindWordSegment tests\n');

assert('offset at word start', PronunciationController._findSegment('Der Hund', 0).word, 'Der');
assert('offset mid word', PronunciationController._findSegment('Freunden und', 3).word, 'Freunden');
assert('offset on space returns null', PronunciationController._findSegment('Der Hund', 3), null);
assert('offset out of bounds', PronunciationController._findSegment('Der', 10), null);
assert('offset negative', PronunciationController._findSegment('Der', -1), null);
assert('umlaut word', PronunciationController._findSegment('Mädchen', 0).word, 'Mädchen');
assert('compound word', PronunciationController._findSegment('Geburtstag', 5).word, 'Geburtstag');

console.log('\nselectGermanVoice tests\n');

function makeVoice(name, lang, local) {
  return { voiceURI: name, name: name, lang: lang, localService: local };
}

var voices = [
  makeVoice('Anna', 'de-DE', true),
  makeVoice('Katrin', 'de-DE', true),
  makeVoice('Maria', 'es-ES', true),
  makeVoice('Hans', 'de-CH', true),
  makeVoice('Remote DE', 'de-DE', false),
];

assert('prefers de-DE local', PronunciationController._selectVoice(voices, '').voiceURI, 'Anna');
assert('prefers matching URI', PronunciationController._selectVoice(voices, 'Katrin').voiceURI, 'Katrin');
assert('returns null for non-matching URI', PronunciationController._selectVoice(voices, 'nonexistent').voiceURI, 'Anna');
assert('returns null if no de voices', PronunciationController._selectVoice([makeVoice('Maria', 'es-ES', true)], ''), null);
assert('ignores remote voice', PronunciationController._selectVoice([makeVoice('Remote DE', 'de-DE', false)], ''), null);
assert('uses de-CH when no de-DE', PronunciationController._selectVoice([makeVoice('Hans', 'de-CH', true)], '').voiceURI, 'Hans');
assert('returns null for empty array', PronunciationController._selectVoice([], ''), null);
assert('returns null for null', PronunciationController._selectVoice(null, ''), null);

console.log('\nvalidatePronunciationSettings tests\n');

var valid = PronunciationController._validate({});
assert('default pronunciationEnabled', valid.pronunciationEnabled, true);
assert('default hoverDelay', valid.pronunciationHoverDelay, 350);
assert('default rate', valid.pronunciationRate, 0.8);
assert('default voiceURI', valid.pronunciationVoiceURI, '');
assert('default autoPlay', valid.pronunciationAutoPlay, false);

var clamped = PronunciationController._validate({
  pronunciationHoverDelay: 50,
  pronunciationRate: 3,
  pronunciationVoiceURI: 'a'.repeat(300),
});
assert('clamp low delay', clamped.pronunciationHoverDelay, 200);
assert('clamp high rate', clamped.pronunciationRate, 1.2);
assert('truncate long URI', clamped.pronunciationVoiceURI, '');

var custom = PronunciationController._validate({
  pronunciationEnabled: false,
  pronunciationHoverDelay: 500,
  pronunciationRate: 0.65,
  pronunciationVoiceURI: 'urn:test:voice',
});
assert('custom enabled', custom.pronunciationEnabled, false);
assert('custom delay', custom.pronunciationHoverDelay, 500);
assert('custom rate', custom.pronunciationRate, 0.65);
assert('custom URI', custom.pronunciationVoiceURI, 'urn:test:voice');

var boolClamp = PronunciationController._validate({ pronunciationEnabled: 'yes' });
assert('non-boolean enabled falls back', boolClamp.pronunciationEnabled, true);

console.log('\n---');
if (failures > 0) process.exitCode = 1;
if (failures === 0) console.log('All pronunciation tests passed.');
