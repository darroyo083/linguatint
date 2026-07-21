// Append missing German word forms to the existing dictionaries.js
// WITHOUT touching the rest of the file
const fs = require('fs');
const path = require('path');

var filePath = path.join(__dirname, '..', 'lingua-tint', 'content', 'dictionaries.js');
var code = fs.readFileSync(filePath, 'utf-8');

// Read existing German words
var germanRe = /var GERMAN_WORDS = new Set\(\[([\s\S]*?)\]\s*\);?/;
var germanM = code.match(germanRe);
if (!germanM) { console.error('GERMAN_WORDS not found'); process.exit(1); }

var existing = new Set();
(germanM[1].match(/'[^']+'/g) || []).forEach(function(s) {
  existing.add(s.replace(/'/g, '').toLowerCase());
});

// New words to add (all lower-case, not yet in the set)
var newWords = [];

// Article forms
['der','die','das','dem','den','des','ein','eine','einen','einem','einer','eines',
 'kein','keine','keinen','keinem','keiner','keines',
 'mein','meine','meinen','meinem','meiner','meines',
 'dein','deine','deinen','deinem','deiner','deines',
 'sein','seine','seinen','seinem','seiner','seines',
 'ihr','ihre','ihren','ihrem','ihrer','ihres',
 'unser','unsere','unseren','unserem','unserer','unseres',
 'euer','eure','euren','eurem','eurer','eures',
 'Ihr','Ihre','Ihren','Ihrem','Ihrer','Ihres',
 'deren','dessen','denen','derer',
].forEach(function(w) { if (!existing.has(w.toLowerCase())) newWords.push(w); });

// Pronoun case forms
['ich','du','er','sie','es','wir','ihr','sie','Sie',
 'mich','dich','ihn','sie','es','uns','euch','sie','Sie',
 'mir','dir','ihm','ihr','ihm','uns','euch','ihnen','Ihnen',
].forEach(function(w) { if (!existing.has(w.toLowerCase())) newWords.push(w); });

// Prepositions
['an','auf','aus','bei','bis','durch','entlang','für','gegen','hinter',
 'in','mit','nach','neben','ohne','über','um','unter','von','vor',
 'zu','zwischen','seit','ab','außer','gegenüber','laut','gemäß',
 'entgegen','entsprechend','wider','dank','trotz','wegen','statt',
 'während','infolge','kraft','mittels','unweit','zwecks','betreffs',
 'bezüglich','einschließlich','ausschließlich','zugunsten','zulasten',
 'anhand','mithilfe','mitsamt','samt','nebst',
 'innerhalb','außerhalb','oberhalb','unterhalb','diesseits','jenseits',
].forEach(function(w) { if (!existing.has(w.toLowerCase())) newWords.push(w); });

// Verb forms (missing conjugations)
var verbs = {
  'helfen':['hilfst','hilft','half','halfst','halfen','halft','geholfen','hilfe','hülfe'],
  'geben':['gibst','gibt','gab','gabst','gaben','gabt','gegeben','gebe'],
  'schenken':['schenkst','schenkt','schenkte','schenktest','schenkten','schenktet','geschenkt'],
  'gratulieren':['gratulierst','gratuliert','gratulierte','gratuliertest','gratulierten','gratuliertet','gratuliert'],
  'fahren':['fährst','fährt','fuhr','fuhrst','fuhren','fuhrt','gefahren'],
  'schlafen':['schläfst','schläft','schlief','schliefst','schliefen','schlieft','geschlafen'],
  'lesen':['liest','las','last','lasest','lasen','gelesen'],
  'sprechen':['sprichst','spricht','sprach','sprachst','sprachen','spracht','gesprochen'],
  'nehmen':['nimmst','nimmt','nahm','nahmst','nahmen','nahmt','genommen'],
  'treffen':['triffst','trifft','traf','trafst','trafen','traft','getroffen'],
  'sehen':['siehst','sieht','sah','sahst','sahen','saht','gesehen'],
  'essen':['isst','aß','aßest','aßen','aßt','gegessen','fresse','frisst','fraß','gefressen'],
  'laufen':['läufst','läuft','lief','liefst','liefen','lieft','gelaufen'],
  'tragen':['trägst','trägt','trug','trugst','trugen','trugt','getragen'],
  'halten':['hältst','hält','hielt','hieltst','hielten','hieltet','gehalten'],
  'laden':['lädt','lud','ludst','luden','ludet','geladen'],
  'braten':['brätst','brät','briet','brietst','brieten','brietet','gebraten'],
  'hauen':['haust','haut','haute','hautest','hauten','hautet','gehauen','hieb'],
  'heißen':['heißt','hieß','hießest','hießen','hießt','geheißen'],
  'scheißen':['scheißt','schiss','schisst','schissen','schisst','geschissen'],
  'reiten':['reitest','reitet','ritt','rittst','ritten','rittet','geritten'],
  'streiten':['streite','streitest','streitet','stritt','strittst','stritten','strittet','gestritten'],
  'schreiten':['schreite','schreitest','schreitet','schritt','schrittst','schritten','schrittet','geschritten'],
};
Object.keys(verbs).forEach(function(v) {
  verbs[v].forEach(function(f) {
    if (!existing.has(f.toLowerCase())) newWords.push(f);
  });
});

// Noun forms (missing plurals, dative, genitive)
var nouns = [
  // User-requested specific words
  'auto','autos','auton','autos','autoe','autoen',
  'bus','busses','buse','busse','bussen',
  'blatt','blätter','blättern','blattes','blatte',
  'schokolade','schokoladen',
  'kollege','kollegen','kolleges','kollegens',
  'kollegin','kolleginnen',
  'sandwich','sandwichs','sandwiche','sandwichs',
  'freundin','freundinnen','freundinen',
  'nachbarin','nachbarinnen',
  'mutter','mütter','müttern','muttert',
  'vater','väter','vätern',
  'tochter','töchter','töchtern',
  'sohn','söhne','söhnen','sohnes','sohne',
  'bruder','brüder','brüdern',
  'schwester','schwestern',
  'onkel','onkeln','onkels',
  'tante','tanten','tantes',
  'cousin','cousins','cousinen',
  'cousine','cousinen',
  'enkel','enkelin','enkelinnen',
  'nichte','nichten',
  'neffe','neffen',
  'schwiegermutter','schwiegermütter',
  'schwiegervater','schwiegerväter',
  'lehrer','lehrern','lehrers','lehrerin','lehrerinnen',
  'schüler','schülern','schülers','schülerin','schülerinnen',
  'arbeitgeber','arbeitgebern',
  'arbeitnehmer','arbeitnehmern',
  'krankenschwester','krankenschwestern',
  'krankenhaus','krankenhäuser','krankenhäusern',
  'hochschule','hochschulen',
  'bahnhof','bahnhöfe','bahnhöfen',
  'flughafen','flughäfen',
  'buchhandlung','buchhandlungen',
  'supermarkt','supermärkte','supermärkten',
  'supermarktes','supermarkts',
  'apfel','äpfel','äpfeln',
  'birne','birnen',
  'banane','bananen',
  'ei','eier','eiern','eies','eis',
  'nudel','nudeln',
  'suppe','suppen',
  'salat','salate','salaten',
  'kuchen','kuchenn','kuchens',
  'torte','torten',
  'butter','buttern',
  'wurst','würste','würsten',
  'käse','käsen',
  'zucker','zuckern',
  'salz','salzen',
  'pfeffer','pfeffern',
  'getränk','getränke','getränken',
  'geburtstag','geburtstage','geburtstagen','geburtstags',
  'geschenk','geschenke','geschenken',
  'freund','freunde','freunden','freundes','freunds',
  'kind','kinder','kindern','kindes','kinde',
  'mann','männer','männern','mannes','manne',
  'frau','frauen','fraus',
  'mensch','menschen','mensches','menschens',
  'herz','herzen','herzens',
  'kopf','köpfe','köpfen',
  'auge','augen','auges',
  'nase','nasen',
  'mund','münder','münden','mundes',
  'ohr','ohren','ohres',
  'arm','arme','armen','armes',
  'hand','hände','händen',
  'bein','beine','beinen',
  'finger','finger','fingern','fingers',
  'knie','knien',
  'schulter','schultern',
  'hals','hälse','hälsen','halses',
  'bauch','bäuche','bäuchen','bauches',
  'fuß','füße','füßen','fußes',
  'rücken','rückenn','rückens',
  'zahn','zähne','zähnen',
  'zunge','zungen',
  'haar','haare','haaren','haares',
  'blut','blute','blutes','bluten',
  'muskel','muskeln',
  'knochen','knochenn','knochens',
  'haut','häute','häuten',
  'erde','erden',
  'stern','sterne','sternen','sternes',
  'blatt','blätter','blättern','blattes',
  'baum','bäume','bäumen','baumes',
  'pflanze','pflanzen',
  'tier','tiere','tieren','tieres',
  'welt','welten',
  'himmel','himmeln','himmels',
  'zug','züge','zügen','zuges',
  'auto','autos','autoen','auton',
  'bus','busse','bussen','busses',
  'fahrrad','fahrräder','fahrrädern','fahrrades',
  'flugzeug','flugzeuge','flugzeugen',
  'schiff','schiffe','schiffen',
  'baby','babys',
];

nouns.forEach(function(w) {
  if (!existing.has(w.toLowerCase())) newWords.push(w);
});

// Separable prefix verb forms (past tense)
var separableVerbForms = [
  'anrufen','anrief','angerufen','rufe an','rufst an','ruft an',
  'aufstehen','aufgestanden','stehe auf','stehst auf','steht auf','stand auf',
  'mitkommen','mitgekommen','komme mit','kommst mit','kam mit',
  'einladen','eingeladen','lade ein','lädt ein','lud ein',
  'stattfinden','stattgefunden','finde statt','fand statt',
  'teilnehmen','teilgenommen','nehme teil','nimmst teil','nimmt teil','nahm teil',
  'vorbereiten','vorbereitet','bereite vor','bereitet vor','bereitete vor',
  'vorschlagen','vorgeschlagen','schlage vor','schlägst vor','schlug vor',
  'abholen','abgeholt','hole ab','holst ab','holt ab','holte ab',
  'anziehen','angezogen','ziehe an','ziehst an','zog an',
  'aufmachen','aufgemacht','mache auf','machst auf','machte auf',
  'einkaufen','eingekauft','kaufe ein','kaufst ein','kaufte ein',
  'auspacken','ausgepackt','packe aus','packst aus','packte aus',
  'einpacken','eingepackt','packe ein','packst ein','packte ein',
  'fernsehen','ferngesehen','sehe fern','siehst fern','sah fern',
  'kennenlernen','kennengelernt','lerne kennen','lernst kennen','lernte kennen',
  'mitbringen','mitgebracht','bringe mit','bringst mit','brachte mit',
  'zurückgeben','zurückgegeben','gebe zurück','gibst zurück','gab zurück',
  'übersetzen','übersetzt','übersetzte',
  'wiederholen','wiederholt','wiederholte',
  'spazierengehen','spazierengegangen',
];

separableVerbForms.forEach(function(w) {
  if (!existing.has(w.toLowerCase())) newWords.push(w);
});

// Remove duplicates and sort
newWords = newWords.filter(function(w, i) {
  return w && w.length >= 2 && newWords.indexOf(w) === i;
}).sort();

console.log('New words to add:', newWords.length);

if (newWords.length === 0) {
  console.log('No new words needed.');
  process.exit(0);
}

// Append to the GERMAN_WORDS set (before the closing ])
var insertPoint = code.indexOf('var GERMAN_WORDS');
var setEnd = code.indexOf('];', insertPoint);
var before = code.substring(0, setEnd);
var after = code.substring(setEnd);
var insert = ',\n' + newWords.map(function(w) { return "  '" + w + "'"; }).join(',\n');
code = before + insert + after;

fs.writeFileSync(filePath, code, 'utf-8');
console.log('Updated dictionaries.js');
