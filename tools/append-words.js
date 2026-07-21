const fs = require('fs');
const path = require('path');

var filePath = path.join(__dirname, '..', 'lingua-tint', 'content', 'dictionaries.js');
var code = fs.readFileSync(filePath, 'utf-8');

// Parse existing
var match = code.match(/var GERMAN_WORDS = new Set\(\[([\s\S]*?)\]\s*\);?/);
var existing = new Set();
(match[1].match(/'[^']+'/g) || []).forEach(function(s) {
  existing.add(s.replace(/'/g, '').toLowerCase());
});
console.log('Existing German words:', existing.size);

// All missing A1-B2 words organized by category
var NEW = [];

function add(w) {
  if (!w || w.length < 2) return;
  if (!existing.has(w.toLowerCase())) NEW.push(w);
}

// Articles and pronouns
'der die das dem den des ein eine einen einem einer eines'.split(' ').forEach(add);
'kein keine keinen keinem keiner keines'.split(' ').forEach(add);
'mein meine meinen meinem meiner meines'.split(' ').forEach(add);
'dein deine deinen deinem deiner deines'.split(' ').forEach(add);
'sein seine seinen seinem seiner seines'.split(' ').forEach(add);
'ihr ihre ihren ihrem ihrer ihres'.split(' ').forEach(add);
'unser unsere unseren unserem unserer unseres'.split(' ').forEach(add);
'euer eure euren eurem eurer eures'.split(' ').forEach(add);
'deren dessen denen derer'.split(' ').forEach(add);
'ich du er sie es wir ihr sie mich dich ihn uns euch mir dir ihm'.split(' ').forEach(add);
'wem wen wessen'.split(' ').forEach(add);

// Numbers
'null eins zwei drei vier fünf sechs sieben acht neun zehn'.split(' ').forEach(add);
'elf zwölf dreizehn vierzehn fünfzehn sechzehn siebzehn achtzehn neunzehn'.split(' ').forEach(add);
'zwanzig dreißig vierzig fünfzig sechzig siebzig achtzig neunzig hundert tausend'.split(' ').forEach(add);
'erste zweite dritte vierte fünfte sechste siebte achte neunte zehnte'.split(' ').forEach(add);
'letzte nächste'.split(' ').forEach(add);

// User-specific missing words
['auto','autos','bus','busse','bussen','blatt','blätter','blättern',
 'schokolade','schokoladen','kollege','kollegen','kollegin','kolleginnen',
 'sandwich','sandwichs','freundin','freundinnen','nachbarin','nachbarinnen',
 'mutter','mütter','müttern','vater','väter','vätern',
 'tochter','töchter','töchtern','sohn','söhne','söhnen',
 'bruder','brüder','brüdern','schwester','schwestern',
 'onkel','onkeln','tante','tanten','cousin','cousins','cousine','cousinen',
 'enkel','enkelin','enkelinnen','nichte','nichten','neffe','neffen',
 'schwiegermutter','schwiegervater',
 'lehrer','lehrern','lehrerin','lehrerinnen',
 'schüler','schülern','schülerin','schülerinnen',
 'arbeitgeber','arbeitnehmer','krankenschwester','krankenhaus',
 'hochschule','bahnhof','flughafen','buchhandlung','supermarkt',
 'apfel','äpfel','birne','birnen','banane','bananen',
 'ei','eier','eiern','wurst','würste','käse',
 'geburtstag','geschenk','freude',
 'freund','freunde','freunden',
 'kind','kinder','kindern',
 'mann','männer','männern',
 'frau','frauen',
 'mensch','menschen',
 'herz','herzen','kopf','köpfe','auge','augen',
 'nase','nasen','mund','münder','ohr','ohren',
 'arm','arme','hand','hände','bein','beine',
 'finger','fingern','knie','knien',
 'schulter','schultern','hals','bauch','rücken','zahn','zähne',
 'haar','haare','blut','muskel','knochen','haut',
 'erde','erde','stern','sterne','pflanze','pflanzen',
 'tier','tiere','welt','welten','himmel','zug','züge',
 'fahrrad','fahrräder','flugzeug','flugzeuge',
 'schiff','schiffe','baby','babys',
].forEach(add);

// Verb forms (complete conjugations for missing verbs)
function conj(stem, infinitive) {
  // Present: e, st, t, en, t
  add(stem + 'e'); add(stem + 'st'); add(stem + 't');
  add(stem + 'en'); add(stem + 't');
  // Past: te, test, ten, tet
  add(stem + 'te'); add(stem + 'test'); add(stem + 'ten'); add(stem + 'tet');
  // Participle
  add('ge' + stem + 't');
  add('ge' + stem + 'en');
}

// All regular verb stems
[
  'schenk','gratulier','kauf','verkauf','hol','bestell','bezahl',
  'glaub','hoff','lern','studier','reis',
  'lächel','wein','flüster','schrei',
  'arbeit','wart','atm','rechn','zeichn',
  'kümm','eign','wechsel','samml','handl',
  'druck','drück','öffn','schließ','leg','stell','setz',
  'red','sprich','antwort','bedeut','feier','putz',
  'koch','back','spiel','tanz',
].forEach(conj);

// Irregular verb forms
var irregulars = {
  'helfen': ['hilfst','hilft','half','halft','halfen','geholfen'],
  'geben': ['gibst','gibt','gab','gabst','gaben','gabt','gegeben'],
  'sehen': ['siehst','sieht','sah','sahst','sahen','saht','gesehen'],
  'nehmen': ['nimmst','nimmt','nahm','nahmst','nahmen','nahmt','genommen'],
  'treffen': ['triffst','trifft','traf','trafst','trafen','traft','getroffen'],
  'sprechen': ['sprichst','spricht','sprach','sprachst','sprachen','spracht','gesprochen'],
  'essen': ['isst','aß','aßest','aßen','aßt','gegessen','fraß','gefressen'],
  'fahren': ['fährst','fährt','fuhr','fuhrst','fuhren','fuhrt','gefahren'],
  'schlafen': ['schläfst','schläft','schlief','schliefst','schliefen','schlieft','geschlafen'],
  'laufen': ['läufst','läuft','lief','liefst','liefen','lieft','gelaufen'],
  'tragen': ['trägst','trägt','trug','trugst','trugen','trugt','getragen'],
  'halten': ['hältst','hält','hielt','hieltst','hielten','hieltet','gehalten'],
  'lesen': ['liest','las','last','lasen','gelesen'],
  'heißen': ['heißt','hieß','hießen','geheißen'],
  'scheißen': ['scheißt','schiss','schisst','schissen','geschissen'],
  'reiten': ['ritt','rittst','ritten','rittet','geritten'],
  'streiten': ['stritt','strittst','stritten','strittet','gestritten'],
};
Object.keys(irregulars).forEach(function(v) {
  irregulars[v].forEach(add);
});

// Separable prefix verb forms
add('anrufen'); add('anrief'); add('angerufen');
add('aufstehen'); add('aufgestanden'); add('stand');
add('mitkommen'); add('mitgekommen');
add('stattfinden'); add('stattgefunden');
add('teilnehmen'); add('teilgenommen');
add('vorbereiten'); add('vorbereitet');
add('abholen'); add('abgeholt');
add('anziehen'); add('angezogen');
add('einkaufen'); add('eingekauft');
add('fernsehen'); add('ferngesehen');
add('kennenlernen'); add('kennengelernt');
add('mitbringen'); add('mitgebracht');
add('zurückgeben'); add('zurückgegeben');
add('übersetzen'); add('übersetzt');
add('wiederholen'); add('wiederholt');
add('spazierengehen'); add('spazierengegangen');

// Additional nouns (common objects and places)
[
  'wohnung','wohnungen','zimmer','zimmern','küche','küchen',
  'bad','bäder','garten','gärten','balkon','balkons','terrasse','terrassen',
  'garage','garagen','keller','kellern','treppe','treppen',
  'aufzug','aufzüge','flur','flure','eingang','eingänge','ausgang','ausgänge',
  'markt','märkte','laden','läden','geschäft','geschäfte',
  'bank','banken','post','kino','theater','museum','museen',
  'restaurant','restaurants','café','cafés','bar','bars',
  'hotel','hotels','kirche','kirchen','schloss','schlösser',
  'brücke','brücken','turm','türme','mauer','mauern',
  'tor','tore','denkmal','denkmäler','platz','plätze',
  'straße','straßen','weg','wege','gasse','gassen',
  'dorf','dörfer','stadt','städte','land','länder',
  'berg','berge','tal','täler','insel','inseln','see','seen',
  'fluss','flüsse','bach','bäche','wald','wälder',
  'wiese','wiesen','feld','felder',
  'boden','böden','wand','wände','decke','decken',
  'dach','dächer','möbel','schrank','schränke','regal','regale',
  'sofa','sofas','sessel','teppich','teppiche',
  'vorhang','vorhänge','spiegel','spiegeln',
  'vase','vasen','bild','bilder','uhr','uhren',
  'wecker','kalender','lampe','lampen',
  'teller','tellern','schüssel','schüsseln','topf','töpfe',
  'pfanne','pfannen','kelle','kellen','becher','bechern',
  'tasse','tassen','krug','krüge',
  'tasche','taschen','rucksack','rucksäcke','koffer','koffern',
  'geldbörse','geldbörsen','schirm','schirme','regenschirm',
  'handy','handys','computer','computern','laptop','laptops',
  'fernseher','kühlschrank','kühlschränke',
  'waschmaschine','waschmaschinen','herd','herde','ofen','öfen',
  'mikrowelle','mikrowellen','staubsauger',
].forEach(add);

// Remove duplicates, sort
NEW = NEW.filter(function(w, i) { return NEW.indexOf(w) === i; }).sort();
console.log('New words to add:', NEW.length);

if (NEW.length === 0) { console.log('Nothing to add.'); process.exit(0); }

// Append to GERMAN_WORDS set
var setEnd = code.indexOf(']);', code.indexOf('var GERMAN_WORDS')) + 3;
var before = code.substring(0, setEnd - 3); // before the ]);
var after = code.substring(setEnd - 3);     // the ]);
var insert = ',\n' + NEW.map(function(w) { return "  '" + w + "'"; }).join(',\n');
code = before + insert + after;

fs.writeFileSync(filePath, code, 'utf-8');
console.log('Written:', fs.statSync(filePath).size, 'bytes');
