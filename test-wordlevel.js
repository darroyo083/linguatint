// Test for wordLevelSegments logic
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

// wordLevelSegments is now defined in language-detector.js (loaded above)


const assert = (label, segments, expectations) => {
  let pass = true;
  if (segments.length !== expectations.length) {
    console.error(`  ❌ ${label}: expected ${expectations.length} segments, got ${segments.length}`);
    return;
  }
  for (let i = 0; i < segments.length; i++) {
    if (segments[i].language !== expectations[i].language ||
        segments[i].text.trim() !== expectations[i].text.trim()) {
      pass = false;
      console.error(`  ❌ ${label}: segment ${i}: expected "${expectations[i].language}:${expectations[i].text.trim()}", got "${segments[i].language}:${segments[i].text.trim()}"`);
    }
  }
  if (pass) console.log(`  ✅ ${label}`);
};

console.log('wordLevelSegments tests\n');

// German only → one german segment
const g1 = wordLevelSegments('Der Hund ist braun und läuft im Park');
assert('full german', g1, [
  { text: 'Der Hund ist braun und läuft im Park', language: 'german' }
]);

// Spanish only → one spanish segment
const s1 = wordLevelSegments('el perro es marrón y corre por el parque');
assert('full spanish', s1, [
  { text: 'el perro es marrón y corre por el parque', language: 'spanish' }
]);

// Mixed without parens
const m1 = wordLevelSegments('Der Hund ist braun el perro es marrón');
assert('mixed no parens', m1, [
  { text: 'Der Hund ist braun ', language: 'german' },
  { text: 'el perro es marrón', language: 'spanish' }
]);

// Test leading space preservation (prevents word joining bug)
const leadingTestText = '  Der Hund ist braun';
const leadingSegs = wordLevelSegments(leadingTestText);
const reconstructed = leadingSegs.map(s => s.text).join('');
if (reconstructed === leadingTestText) {
  console.log('  ✅ leading whitespace preserved (no word joining)');
} else {
  console.error(`  ❌ leading whitespace lost: expected "${leadingTestText}", got "${reconstructed}"`);
}

// ProcessTextNode-like simulation: split parens first, then word-level for remaining
function simulateProcessTextNode(text) {
  const parenRegex = /\([^)]+\)/g;
  const rawSegments = [];
  let lastIndex = 0;
  let match;

  while ((match = parenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      rawSegments.push({ text: text.slice(lastIndex, match.index), language: null });
    }
    rawSegments.push({ text: match[0], language: 'spanish' });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    rawSegments.push({ text: text.slice(lastIndex), language: null });
  }

  const expandedSegments = [];
  for (const seg of rawSegments) {
    if (seg.language === 'spanish') {
      expandedSegments.push(seg);
    } else {
      expandedSegments.push(...wordLevelSegments(seg.text));
    }
  }
  return expandedSegments;
}

const m2 = simulateProcessTextNode('Der Hund ist braun und läuft im Park (español)');
assert('paren segment is spanish', m2, [
  { text: 'Der Hund ist braun und läuft im Park ', language: 'german' },
  { text: '(español)', language: 'spanish' }
]);

// Short words with context
const m3 = wordLevelSegments('Die Katze und der Hund');
assert('short words context', m3, [
  { text: 'Die Katze und der Hund', language: 'german' }
]);

// All neutral
const n1 = wordLevelSegments('Hello World 123');
assert('all neutral', n1, [
  { text: 'Hello World 123', language: 'neutral' }
]);

console.log('\n---');
