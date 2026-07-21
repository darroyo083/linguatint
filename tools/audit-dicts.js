const fs = require('fs');
const code = fs.readFileSync(
  require('path').join(__dirname, '..', 'lingua-tint', 'content', 'dictionaries.js'),
  'utf-8'
);

const germanMatch = code.match(/var GERMAN_WORDS = new Set\(\[([\s\S]*?)\]\s*\);/);
const spanishMatch = code.match(/var SPANISH_WORDS = new Set\(\[([\s\S]*?)\]\s*\);/);

function countItems(match) {
  if (!match) return 0;
  return (match[1].match(/'[^']+'/g) || []).length;
}

console.log('GERMAN_WORDS:', countItems(germanMatch));
console.log('SPANISH_WORDS:', countItems(spanishMatch));

const germanContent = germanMatch ? germanMatch[0] : '';
const spanishContent = spanishMatch ? spanishMatch[0] : '';

const userWords = [
  'hilft','schenkt','blumen','gratuliert','nachbarin','nachbar',
  'ihrem','ihrer','geburstag','freundin','keiner','keinem',
  'ihre','ihren','ihres','keines','keine'
];

console.log('\nUser words:');
userWords.forEach(function(w) {
  const foundDE = germanContent.includes("'" + w + "'");
  const foundES = spanishContent.includes("'" + w + "'");
  console.log('  ' + w + ': ' + (foundDE ? '✅ DE' : '❌ MISSING') + (foundES ? ' (also in ES)' : ''));
});
