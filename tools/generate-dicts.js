// Generator: expands base words with common inflection forms
const fs = require('fs');
const path = require('path');

// ── German inflection rules ──────────────────────────────────────────

function conjugateGerman(verb) {
  // Regular weak verb: lieben → liebe, liebst, liebt, lieben, liebt
  // Stem = verb minus -en or -n
  var stem = verb.replace(/en$/, '').replace(/n$/, '');
  if (stem === verb) return []; // not a regular verb
  // Avoid double consonants
  var forms = [verb];
  if (stem.length > 0) {
    forms.push(stem + 'e');
    forms.push(stem + 'st');
    forms.push(stem + 't');
    forms.push(stem + 'en');
  }
  return forms.filter(function(f) { return f.length >= 2; });
}

function pluralizeGerman(noun) {
  var forms = [noun];
  var lower = noun.toLowerCase();
  // Regular plural endings
  if (lower.endsWith('e')) forms.push(noun + 'n');      // Blume → Blumen
  if (lower.endsWith('el')) forms.push(noun + 'n');      // Tafel → Tafeln
  if (lower.endsWith('er')) forms.push(noun + 'n');      // Feder → Federn
  if (lower.endsWith('in')) {
    forms.push(noun + 'nen');                            // Nachbarin → Nachbarinnen
    forms.push(noun.replace(/in$/, 'innen'));             // redundant with above
  }
  if (lower.endsWith('nis')) forms.push(noun + 'se');
  if (lower.endsWith('tum')) forms.push(noun.replace(/um$/, 'ümer'));
  // General -en for feminines
  forms.push(noun + 'n');
  forms.push(noun + 'e');
  forms.push(noun + 's');
  forms.push(noun + 'en');
  return forms.filter(function(f) { return f.length >= 2; });
}

function possessiveForms(stem) {
  // mein, dein, sein, ihr, unser, euer
  var forms = [stem];
  var endings = ['e', 'en', 'em', 'er', 'es'];
  for (var i = 0; i < endings.length; i++) {
    forms.push(stem + endings[i]);
  }
  return forms;
}

// ── Spanish inflection rules ─────────────────────────────────────────

function conjugateSpanish(verb) {
  // -ar: hablar → hablo, hablas, habla, hablamos, habláis, hablan
  // -er: comer → como, comes, come, comemos, coméis, comen
  // -ir: vivir → vivo, vives, vive, vivimos, vivís, viven
  var stem = verb.replace(/[aei]r$/, '');
  var ending = verb.slice(-2);
  if (stem === verb) return [];
  if (ending === 'ar') {
    return [
      verb, stem + 'o', stem + 'as', stem + 'a',
      stem + 'amos', stem + 'ais', stem + 'an',
      stem + 'e', stem + 'aste', stem + 'o',
      stem + 'aremos', stem + 'ara', stem + 'ase'
    ];
  }
  if (ending === 'er') {
    return [
      verb, stem + 'o', stem + 'es', stem + 'e',
      stem + 'emos', stem + 'eis', stem + 'en',
      stem + 'i', stem + 'iste', stem + 'io',
      stem + 'era', stem + 'iese'
    ];
  }
  if (ending === 'ir') {
    return [
      verb, stem + 'o', stem + 'es', stem + 'e',
      stem + 'imos', stem + 'is', stem + 'en',
      stem + 'i', stem + 'iste', stem + 'io',
      stem + 'iera', stem + 'iese'
    ];
  }
  return [];
}

function pluralizeSpanish(noun) {
  var forms = [noun];
  if (noun.endsWith('a') || noun.endsWith('e') || noun.endsWith('o')) {
    forms.push(noun + 's');
  } else if (noun.endsWith('z')) {
    forms.push(noun.replace(/z$/, 'ces'));
  } else if (noun.endsWith('í') || noun.endsWith('ú')) {
    forms.push(noun + 'es');
  } else {
    forms.push(noun + 'es');
    forms.push(noun + 's');
  }
  return forms;
}

function feminineSpanish(adj) {
  if (adj.endsWith('o')) return adj.replace(/o$/, 'a');
  return adj;
}

// ── Read current dictionaries ────────────────────────────────────────

function readDict(name) {
  var code = fs.readFileSync(
    path.join(__dirname, '..', 'lingua-tint', 'content', 'dictionaries.js'),
    'utf-8'
  );
  var re = new RegExp('var ' + name + ' = new Set\\(\\[([\\s\\S]*?)\\]\\s*\\)');
  var m = code.match(re);
  if (!m) { console.error('Not found:', name); return []; }
  var items = m[1].match(/'[^']+'/g) || [];
  return items.map(function(s) { return s.replace(/'/g, ''); });
}

function getDictBlock(name, code) {
  var re = new RegExp('var ' + name + ' = new Set\\(\\[([\\s\\S]*?)\\]\\s*\\)');
  var m = code.match(re);
  return m ? m[0] : null;
}

// ── Main ─────────────────────────────────────────────────────────────

var existingGerman = new Set(readDict('GERMAN_WORDS'));
var existingSpanish = new Set(readDict('SPANISH_WORDS'));
var code = fs.readFileSync(
  path.join(__dirname, '..', 'lingua-tint', 'content', 'dictionaries.js'),
  'utf-8'
);

// Base words to ADD (A1-B2, not yet in dictionary)
var moreGerman = [
  // Missing verbs (common A1-B1)
  'schenken','gratulieren','blühen','fehlen','passieren',
  'erzählen','erklären','beschreiben','bestellen','bezahlen',
  'einladen','einladen','vorstellen','unterschreiben','unterrichten',
  'verdienen','vergleichen','vermissen','verreisen','verstehen',
  'empfehlen','entschuldigen','entdecken','erwarten','erhalten',
  'erreichen','erinnern','ertrinken','erwähnen','erziehen',
  'bedeuten','beginnen','bekommen','bemerken','benutzen',
  'bereiten','berichten','besuchen','betreten','bewegen',
  'beziehen','brauchen','danken','drucken','dürfen',
  'ehren','einatmen','empfangen','entlassen','entwickeln',
  'erkälten','ernähren','erscheinen','ersticken','ertragen',
  'erwischen','feiern','fliegen','fliehen','fließen',
  'fragen','frieren','füllen','fürchten','gebrauchen',
  'gedenken','gefallen','genießen','geraten','geschehen',
  'gewinnen','gießen','grüßen','gucken','halten',
  // Nouns (common A1-B1)
  'blume','blumen','geburtstag','geschenk','freude','freundin',
  'freundinnen','nachbarin','nachbarinnen','arbeit','arbeiter',
  'aufgabe','antwort','antworten','buchstabe','bürger',
  'dame','damen','dienst','dorf','dörfer','ecke',
  'eltern','ende','entscheidung','entwicklung','erfahrung',
  'erfolg','ergebnis','erinnerung','erkältung','ernährung',
  'erscheinung','erwartung','erziehung','essen','esszimmer',
  'fach','fachmann','fahrt','fall','familie','familien',
  'farbe','farben','fehler','feier','feiern','feld','ferien',
  'fest','festtag','feuer','figur','film','filme',
  'fläche','flasche','flaschen','fledermaus','flug','flugzeug',
  'fluss','flüsse','flut','folge','frage','fragen','frau',
  'frauen','freiheit','fremde','freude','freuden','freund',
  'freunde','freundin','freundinnen','freundschaft','friede',
  'frieden','frist','froh','frucht','früchte','frühling',
  'frühstück','fuchs','fühler','führung','fund','furcht',
  'fuß','fußball','füße','fütterung','gabel','gang','gänse',
  'ganze','garage','garten','gärten','gast','gäste','gebäude',
  'geben','gebiet','gebirge','gebot','gebrauch','geburt',
  'geburtstag','gedächtnis','gedanke','gedanken','gefahr',
  'gefühl','gegenstand','gegenteil','gehirn','geist','gelb',
  'geld','gelände','gemüse','genau','genosse','genuss',
  'gerät','geräusch','gericht','geruch','gesang','geschäft',
  'geschenk','geschichte','geschmack','gesellschaft','gesetz',
  'gesicht','gespräch','gestalt','gesundheit','getränk',
  'gewalt','gewerbe','gewitter','gift','gipfel','glas',
  'gläser','glaube','gleich','glied','glück','glut','gnade',
  'gold','gott','grab','grad','gramm','grenze','griff',
  'groll','grund','gründe','gruppe','gruppen','gruß','grüße',
  'gummi','gunst','gurke','gusto','gut','güte','gymnasium',
  'haar','haare','haben','hafen','haften','hagel','hahn',
  'hälfte','hals','halt','hamburger','hammer','hand','hände',
  'handel','handlung','handtuch','haufen','haupt','haus',
  'häuser','haut','heft','heftigkeit','heide','heil','heim',
  'heimat','heirat','heiterkeit','heizung','held','helfer',
  'helligkeit','hemd','herb','herbst','herr','herren',
  'herrschaft','herz','herzen','herzog','heulen','heute',
  'hier','hilfe','himmel','hin','hindernis','hinken','hinten',
  'hirn','hirsch','hitze','hobby','hobel','hoch','hochzeit',
  'hof','höfe','hoffen','höhe','hölle','holz','hölzer',
  'horizont','hörer','hörnchen','hose','hübsch','hügel',
  'huhn','hühner','humor','hund','hunde','hunger','husten',
  'hut','hüte','hütte','hyperbel','idee','ihnen','ihr',
  'ihre','ihrem','ihren','ihrer','ihres','immer','immobilie',
  'impuls','industrie','info','information','ingenieur',
  'inhalt','initiative','innen','inner','institut','instrument',
  'interesse','internet','interview','irrtum','jacke','jacken',
  'jahr','jahre','jahren','jahres','jahrhundert','jährlich',
  'jammer','januar','jazz','jeder','jeden','jedes',
  'jedoch','jemand','jener','jenes','jetzt','job','jubel',
  'jugend','jugendliche','juli','jung','junge','jungen',
  'jünger','juni','jura','jurist','kabinett','käfer',
  'kaffee','käfig','kahl','kairo','kaiser','kajüte','kakao',
  'kalb','kälber','kalk','kalt','kälte','kamel','kamera',
  'kampf','kämpfe','kanal','kaninchen','kannte','kante',
  'kapitän','kapitel','kaputt','karriere','karte','karten',
  'karton','käs','katze','katzen','kauf','käufer','kaum',
  'kein','keine','keinem','keinen','keiner','keines','keller',
  'kenner','kenntnis','kerl','kern','kerze','kerzen','kette',
  'keule','kind','kinder','kindern','kindes','kinn','kirche',
  'kirsche','kissen','kiste','kisten','klage','klang','klar',
  'klasse','klassen','klavier','kleid','kleider','klein',
  'klinge','klingel','klinik','klopfen','klosett','klub',
  'klug','knapp','knecht','knie','knien','knoblauch','knochen',
  'knopf','knöpfe','knoten','knüpfen','koch','kochen','koffer',
  'komma','kommentar','kommunikation','komödie','kompass',
  'könig','königin','können','konsulat','kontakt','konzert',
  'kopf','köpfe','kopie','korb','körbe','korn','körper',
  'korrektur','kosten','kraft','kräfte','kragen','krank',
  'kranke','krankheit','kranz','kränze','krebs','kreide',
  'kreis','kreise','kreta','kreuz','krieg','kriege','kriminal',
  'krise','kristall','kriterium','kritik','krokodil','krone',
  'küche','kuchen','kugel','kugeln','kuh','kühe','kühl',
  'kühn','kultur','kümmer','kunde','kunden','kunst','künste',
  'künstler','kunststoff','kur','kurier','kurs','kurse',
  'kurve','kurz','kuss','küsse','küste','küster','labor',
  'lächeln','lachen','lage','lagen','lager','lagune','lahm',
  'lampe','land','länder','landschaft','lang','länge',
  'langsam','langweilig','larve','lassen','last','laster',
  'laterne','latten','laub','lauf','laufe','laufen','laus',
  'laut','läuten','leben','lebend','leber','lebewohl',
  'leblos','leder','ledig','leer','leere','legal','legen',
  'leger','lehen','lehrer','lehrerin','leicht','leid',
  'leiden','leider','leih','leihen','leim','leine','leise',
  'leisten','leiste','leitung','lenken','lernen','lesen',
  'leser','letzt','leuchten','leugnen','leute','licht',
  'lichtung','lieb','liebe','lieben','lieber','liebes',
  'liebhaber','lied','lieder','liefern','liegen','lift',
  'linear','linie','link','links','linse','lippe','lissen',
  'liste','liter','literatur','loben','löcher','locke',
  'locken','löffel','logik','lohn','löhne','lok','loch',
  'löcher','locke','locken','löffel','logik','lohn','löhne',
  'los','lösen','lösung','luft','lüften','lüge','lügen',
  'luke','lump','lust','lustig','lutschen','macht','mädchen',
  'maien','mal','malen','manchmal','mantel','mäntel',
  'manuskript','mappe','mäppchen','märchen','marder','marine',
  'markt','märkte','maschine','maske','maß','maße',
  'maßstab','mast','material','mathematik','matratze',
  'mauer','mäuse','maximal','mechanik','medium','meer',
  'megaphon','mehl','mehr','mehrheit','mehrere','mein',
  'meine','meinem','meinen','meiner','meines','meinung',
  'meister','melden','melodie','menge','mensch','menschen',
  'menschenmenge','mentalität','menü','merken','messe',
  'messer','metall','meter','methode','mich','miete','mieten',
  'mikrofon','mikroskop','milch','mild','millimeter',
  'million','mindestens','mineral','minister','minus',
  'minute','minuten','mir','mischen','miss','mission',
  'mit','mitarbeiter','mitglied','mitte','mittel',
  'mittelalter','mittelpunkt','möbel','möchten','mode',
  'modell','modern','mögen','möglich','möglichkeit',
  'monarch','monat','monate','monaten','monats','mond',
  'moral','morgen','morgend','morgens','morphium','morsch',
  'mörser','mortal','moskito','motiv','motor','müde',
  'mühe','mühle','mund','münder','münze','münzen','murren',
  'muskel','müssen','mut','mutig','mutter','mütter',
  'muttersprache','mütze','mythos','nach','nachbar',
  'nachbarn','nachbarin','nachbarinnen','nachdem','nachricht',
  'nachrichten','nacht','nächte','nachtisch','nadel',
  'nagel','nägel','nah','nähe','nahmen','name','namen',
  'namens','nämlich','narbe','narr','nation','nationalität',
  'natur','natürlich','nebel','neben','neffe','negativ',
  'nehmen','neid','nein','nennen','nerven','nervös',
  'nett','netz','neu','neue','neuen','neues','neun',
  'neunte','neutral','nicht','nichts','nie','nieder',
  'niedrig','niemand','niveau','noch','norden','nordisch',
  'normal','normale','not','notar','note','noten','nötig',
  'notiz','notizen','notwendig','november','null','nummer',
  'nummern','nur','nutzen','nützlich','ob','oben','ober',
  'oberfläche','obst','obstbau','obwohl','ochse','oder',
  'offen','offenbar','öffentlich','öffnung','oft','ohne',
  'ohnmacht','ohr','ohren','oktober','ökologie','optimal',
  'optimum','orange','orbit','orchester','orden','ordentlich',
  'ordnung','organ','organisation','orient','original',
  'ort','orte','orten','orts','ost','osten','österreich',
  'ostsee','otter','oval','paar','päckchen','packen',
  'paket','palast','palme','panik','panne','panorama',
  'papier','pappe','paradies','paragraph','parallel',
  'parfüm','park','parken','parlament','partei','partie',
  'partner','pass','passen','passion','passiv','passwort',
  'paste','patent','patient','patrone','pauschal','pause',
  'pavillon','pech','pedal','pein','peinlich','pelz','pelze',
  'pendel','perfekt','periode','perle','perlen','person',
  'personal','persönlich','perspektive','pfad','pfahl',
  'pfanne','pfarrer','pfeffer','pfeife','pfeil','pferd',
  'pferde','pfingsten','pfirsich','pflanze','pflaume',
  'pflege','pflicht','pflücken','pflug','pforte','pfote',
  'pfund','phänomen','phantasie','phase',' philosophie',
  'photo','physik','pianist','picknick','pilz','pilze',
  'pin','pinsel','pirat','plakat','plan','plane','planen',
  'planet','plastik','platte','platten','platz','plätze',
  'platzen','pleite','plötzlich','plug','plus','wochentag',
  'wunder','wunderschön','wunsch','wünschen','würde',
  'würdig','wurm','würmer','wurst','würste','würstchen',
  'würze','wurzel','wüste','wüten','zahlen','zähler',
  'zählen','zahlreich','zahn','zähne','zart','zauber',
  'zaun','zäune','zeichen','zeigen','zeile','zeit',
  'zeitschrift','zeitung','zelten','zentimeter','zentral',
  'zentrum','zerbrechen','zeremonie','zerreißen','zerren',
  'zerschlagen','zettel','zeug','zeuge','zeugen','zeugnis',
  'ziehen','ziel','ziemlich','zierde','zimmer','zittern',
  'zivil','zivilisation','zögern','zoll','zorn','zu',
  'zubehör','zucht','zucker','zufällig','zug','züge',
  'zugeben','zugleich','zukünftig','zulassen','zuletzt',
  'zum','zunächst','zünden','zustand','zuverlässig',
  'zwar','zweck','zweifel','zweifeln','zweig','zwerg',
  'zwiebel','zwilling','zwingen','zwischen','zwölf',
  // Possessive pronouns - complete set
  'mein','meine','meinem','meinen','meiner','meines',
  'dein','deine','deinem','deinen','deiner','deines',
  'sein','seine','seinem','seinen','seiner','seines',
  'ihr','ihre','ihrem','ihren','ihrer','ihres',
  'unser','unsere','unserem','unseren','unserer','unseres',
  'euer','eure','eurem','euren','eurer','eures',
  'ihr','ihre','ihrem','ihren','ihrer','ihres',
  // Artikel forms
  'deren','dessen','denen',
  // Missing common A1 verbs
  'teilnehmen','stattfinden','stattgefunden','aufstehen',
  'aussehen','mitbringen','mitkommen','mitnehmen',
  'zurückkommen','zurückgehen','zurückgeben','vorbereiten',
  'vorhaben','vorkommen','vorschlagen','vorstellen',
  'weitergehen','weiterhelfen','wiederholen','wiederfinden',
  'überlegen','überraschen','übersetzen','überweisen',
  'umziehen','unterhalten','unterscheiden','unterstreichen',
  'aufräumen','ausgeben','ausschalten','einschalten',
  'einkaufen','einpacken','auspacken','anfangen','anrufen',
  'abholen','abgeben','abfahren','anziehen','ausziehen',
  'aufmachen','zumachen','durchführen','nachfragen',
  'fernsehen','kennenlernen','spazierengehen',
].filter(function(w) { return !existingGerman.has(w); });

// Remove duplicates
moreGerman = moreGerman.filter(function(w, i) {
  return moreGerman.indexOf(w) === i;
});

var moreSpanish = [
  // Missing common verbs
  'felicitar','regalar','florecer','faltar','suceder',
  'contar','explicar','describir','pedir','pagar',
  'invitar','presentar','firmar','enseñar','ganar',
  'comparar','extrañar','viajar','entender','recomendar',
  'disculpar','descubrir','esperar','recibir','alcanzar',
  'significar','comenzar','conseguir','notar','usar',
  'preparar','informar','visitar','entrar','mover',
  'relacionar','necesitar','agradecer','desarrollar',
  'aparecer','pertenecer','ofrecer','traducir','conducir',
  'producir','reducir','introducir','construir','destruir',
  'incluir','contribuir','sustituir','huir','fluir',
  'sonreír','reír','freír','seguir','conseguir',
  'perseguir','servir','medir','repetir','competir',
  'vestir','pedir','impedir','elegir','corregir',
  'exigir','fingir','dirigir','recoger','acoger',
  'escoger','proteger','coger','elegir','emergir',
  // Nouns
  'flor','flores','cumpleaños','regalo','alegría',
  'vecina','vecinas','trabajo','trabajos','tarea',
  'respuesta','letra','ciudadano','señora','servicio',
  'esquina','padres','decisión','desarrollo','experiencia',
  'éxito','resultado','recuerdo','resfriado','alimentación',
  'aparición','expectativa','educación','comida','comedor',
  'asignatura','especialista','viaje','caso','alegría',
  'colores','error','celebración','campo','vacaciones',
  'fiesta','fuego','figura','película','superficie',
  'botella','murciélago','vuelo','avión','río','ola',
  'pregunta','mujeres','libertad','extranjero','amistad',
  'paz','tristeza','primavera','desayuno','zorro',
  'sentimiento','tenedor','pasillo','ganso','edificio',
  'territorio','mandato','memoria','pensamiento','peligro',
  'sentido','objeto','ruido','negocio','historia','gusto',
  'sociedad','ley','cara','conversación','forma','salud',
  'bebida','violencia','comercio','tormenta','veneno',
  'cumbre','vidrio','fe','miembro','gracia','grado',
  'frontera','grupo','saludo','apetito','habilidad',
  'valle','mitad','cuello','detención','martillo','mano',
  'comercio','acción','toalla','montón','piel','cuaderno',
  'seriedad','calefacción','héroe','ayudante','brillantez',
  'camisa','otoño','señor','caballeros','dominio',
  'obstáculo','cojera','detrás','cerebro','ciervo','calor',
  'pasatiempo','altura','infierno','bosque','horizonte',
  'audífono','conejito','pantalón','linda','colina',
  'pollo','hambre','sombrero','cabaña','idea','ellos',
  'siempre','inmobiliaria','impulso','industria','información',
  'ingeniero','contenido','iniciativa','interior','instituto',
  'instrumento','interés','internet','entrevista','error',
  'chaqueta','año','años','siglo','enero','jazz',
  'alegría','juventud','joven','julio','junio','jurista',
  'calcio','jaula','calvo','frío','camello','cámara',
  'lucha','canal','conejo','carrera','capítulo','carta',
  'cartón','queso','gato','gatos','compra','comprador',
  'apenas','bodega','conocedor','conocimiento','tío','núcleo',
  'vela','cadena','maza','rodilla','iglesia','cereza',
  'cojín','caja','cofres','queja','sonido','claro',
  'clase','clases','piano','vestido','hoja','campana',
  'clínica','golpear','inteligente','apretado','rodilla',
  'nudo','cocinar','maleta','coma','comentario',
  'comunicación','comedia','brújula','rey','reina',
  'consulado','contacto','concierto','copia','canasta',
  'grano','cuerpo','corrección','costo','fuerza',
  'cuello','enfermo','enfermedad','corona','cangrejo',
  'tiza','círculo','Creta','cruz','guerra','crisis',
  'cristal','criterio','crítica','cocodrilo','corona',
  'cocina','pastel','bola','vaca','cultura','atrevido',
  'cliente','arte','artista','plástico','cura','mensajero',
  'curso','curva','corto','beso','costa','sacamuelas',
  'laboratorio','sonrisa','risa','situación','almacén',
  'laguna','cojo','lámpara','nación','paisaje','perezoso',
  'gorgojo','carga','camión','linterna','listón','follaje',
  'curso','sonido','pío','vida','hígado','adiós',
  'sin vida','cuero','soltero','vacío','legal','suave',
  'enseñante','enseñante','sufrimiento','desafortunadamente',
  'préstamo','cuerda','tranquilo','logro','cinta',
  'conducción','timón','aprender','lector','último',
  'brillar','negar','gente','claro','claro','amante',
  'canción','proveedor','acostado','literatura','alabar',
  'agujeros','cerradura','cuchara','lógica','salario',
  'solución','aire','ventilación','mentira','trampilla',
  'harapiento','placer','divertido','chupar','poder',
  'niña','mayo','vez','pintar','a veces','abrigo',
  'mapa','carpeta','cuento','martín','margarita',
  'mercado','máquina','máscara','medida','mástil',
  'material','matemáticas','colchón','pared','ratón',
  'máximo','mecánica','medio','mar','megáfono','harina',
  'mayoría','varios','opinión','maestro','anunciar',
  'melodía','multitud','mentalidad','menú','notar',
  'feria','cuchillo','metal','metro','método',
  'micrófono','microscopio','leche','suave','milímetro',
  'millón','mental','ministro','menos','minuto','mezclar',
  'misión','colaborador','miembro','medio','medios',
  'Edad Media','centro','muebles','moda','modelo',
  'moderno','posible','posibilidad','monarca','mes',
  'luna','moral','mañana','mañanero','por las mañanas',
  'mosquito','motivo','motor','cansado','esfuerzo','molino',
  'moneda','refunfuñar','músculo','valiente','lengua materna',
  'gorra','mito','noticia','noche','postre','aguja',
  'clavo','cercanía','cerca','nombre','es decir','cicatriz',
  'bufón','nación','nacionalidad','naturaleza','natural',
  'niebla','lado','sobrino','negativo','envidia',
  'llamar','nervio','nervioso','bonito','red','nueve',
  'noveno','neutral','norte','nórdico','normal','nota',
  'necesario','noviembre','cero','número','solo','nuez',
  'útil','aunque','arriba','superficie','fruta','no obstante',
  'buey','abierto','aparente','público','apertura','a menudo',
  'sin','desmayo','oído','ecología','óptimo','naranja',
  'orquesta','orden','ordenado','orden','organismo',
  'organización','oriente','original','hueso','nido',
  'huevo','búho','óvalo','par','paquete','empaquetar',
  'palacio','palma','pánico','avería','panorama','papel',
  'cartón','paraíso','párrafo','paralelo','perfume',
  'parque','estacionar','parlamento','partido','pase',
  'pasaporte','pasta','patente','paciente','cartucho',
  'pausa','pabellón','brea','pedal','pena','penoso',
  'piel','péndulo','perfecto','período','perla','persona',
  'personal','personalidad','perspectiva','camino','estaca',
  'sartén','párroco','pimienta','pipa','flecha','caballo',
  'pentecostés','melocotón','planta','ciruela','cuidado',
  'deber','recoger','arado','puerta','pata','libra',
  'fenómeno','fantasía','fase','filosofía','foto','física',
  'pianista','picnic','hongo','póster','alfiler','pincel',
  'pirata','cartel','plan','avión','planeta','plástico',
  'plato','plataforma','asiento','asientos','reventar',
  'bancarrota','de repente','enchufe','más','día de la semana', 'milagro', 'maravilloso', 'deseo', 'desear', 'digno',
  'gusano','salchicha','especia','raíz','desierto',
  'furia','número','contador','numeroso','diente','tiemo',
  'magia','valla','seña','señal','tiempo','revista',
  'periódico','acampar','centímetro','central','centro',
  'romper','ceremonia','rasgar','tirón','romper','nota',
  'testigo','atestiguar','certificado','tirar','objetivo',
  'bastante','adorno','habitación','temblar','civil',
  'civilización','dudar','aduana','ira','adicional',
  'crianza','azúcar','casual','tren','admitir',
  'de antemano','futuro','permitir','por último','encender',
  'estado','confiable','es decir','propósito','duda',
  'rama','enano','cebolla','gemelo','obligar','doce',
].filter(function(w) { return !existingSpanish.has(w); });

moreSpanish = moreSpanish.filter(function(w, i) {
  return moreSpanish.indexOf(w) === i;
});

console.log('More German to add:', moreGerman.length);
console.log('More Spanish to add:', moreSpanish.length);

// Generate inflections for German verbs in the expanded set
// For each verb ending in -en, add conjugated forms
var germanInflections = [];
var allGermanBase = Array.from(existingGerman).concat(moreGerman);
allGermanBase.forEach(function(w) {
  if (w.endsWith('en') || w.endsWith('n')) {
    var conj = conjugateGerman(w);
    conj.forEach(function(f) {
      if (!existingGerman.has(f) && moreGerman.indexOf(f) === -1 && germanInflections.indexOf(f) === -1) {
        germanInflections.push(f);
      }
    });
  }
});

console.log('Generated German inflections:', germanInflections.length);

// Generate Spanish inflections for verbs ending in -ar, -er, -ir
var spanishInflections = [];
var allSpanishBase = Array.from(existingSpanish).concat(moreSpanish);
allSpanishBase.forEach(function(w) {
  if (w.endsWith('ar') || w.endsWith('er') || w.endsWith('ir')) {
    var conj = conjugateSpanish(w);
    conj.forEach(function(f) {
      if (!existingSpanish.has(f) && moreSpanish.indexOf(f) === -1 && spanishInflections.indexOf(f) === -1) {
        spanishInflections.push(f);
      }
    });
  }
});

console.log('Generated Spanish inflections:', spanishInflections.length);

// ── Write back ───────────────────────────────────────────────────────

var existingGermanArr = Array.from(existingGerman);
var existingSpanishArr = Array.from(existingSpanish);
var newGerman = [].concat(moreGerman, germanInflections).sort();
var newSpanish = [].concat(moreSpanish, spanishInflections).sort();

function formatList(words) {
  return words.map(function(w) { return "  '" + w.replace(/'/g, "\\'") + "'"; }).join(',\n');
}

// Read current GERMAN_WORDS block position
var germanStart = code.indexOf('var GERMAN_WORDS = new Set([');
var germanEnd = code.indexOf(']);', germanStart) + 3;

var germanBlock = 'var GERMAN_WORDS = new Set([\n' + formatList(existingGermanArr.concat(newGerman)) + '\n]);';

var spanishStart = code.indexOf('var SPANISH_WORDS = new Set([');
var spanishEnd = code.indexOf(']);', spanishStart) + 3;

var spanishBlock = 'var SPANISH_WORDS = new Set([\n' + formatList(existingSpanishArr.concat(newSpanish)) + '\n]);';

var result = code.substring(0, germanStart) + germanBlock +
  code.substring(germanEnd, spanishStart) + spanishBlock +
  code.substring(spanishEnd);

fs.writeFileSync(
  path.join(__dirname, '..', 'lingua-tint', 'content', 'dictionaries.js'),
  result,
  'utf-8'
);

console.log('\nWritten new dictionaries.js');
console.log('GERMAN_WORDS:', existingGerman.length, '→', existingGerman.length + newGerman.length);
console.log('SPANISH_WORDS:', existingSpanish.length, '→', existingSpanish.length + newSpanish.length);
