const fs = require('fs');
const code = fs.readFileSync(
  require('path').join(__dirname, '..', 'lingua-tint', 'content', 'dictionaries.js'),
  'utf-8'
);
const dict = code.substring(code.indexOf('GERMAN_WORDS'), code.indexOf('SPANISH_WORDS'));

const words = [
  'auto','babys','baby','schokolade','kollegen','kollege',
  'sandwich','sandwichs','seiner','freunden','mutter','vater',
  'helfen','eltern','schwester','bruder','tochter','sohne','sohnen',
  'wohnung','zug','bus','fahrrad','flugzeug','schiff',
  'welt','himmel','erde','sonne','stern',
  'tier','pflanze','baum','blatt','apfel','birne','banane',
  'butter','eier','ei','wurst','nudel','suppe','salat',
  'torte','getraenk','saft','zucker','salz','pfeffer',
  'schueler','lehrer','lehrerin','arbeitgeber','arbeitnehmer',
  'krankenschwester','krankenhaus','hochschule','hauptbahnhof',
  'flughafen','bahnhof','buchhandlung','buchladen','supermarkt',
  'kaese','geschwister','onkel','tante','cousin','cousine',
  'enkel','enkelin','nichte','neffe','schwiegermutter','schwiegervater'
];

words.forEach(function(w) {
  var found = dict.includes("'" + w + "'");
  var foundCap = dict.includes("'" + w.charAt(0).toUpperCase() + w.slice(1) + "'");
  if (!found && !foundCap) console.log('MISSING: ' + w);
});
