var GERMAN_WORDS = new Set([
  'der','die','das','dem','den','des','ist','sind','und','ein','eine','einen','einer','eines','einem',
  'nicht','mit','von','zu','sich','auch','werden','sein','hat','habe','hast','haben','bin','bist',
  'seid','kann','können','muss','müssen','will','wollen','für','auf','bei','aus','nach','ich','du',
  'er','sie','wir','ihr','aber','oder','schon','sehr','immer','kein','keine','keinen','keiner',
  'keines','keinem','mein','dein','sein','meine','deine','seine','dieser','diese','dieses','diesem',
  'diesen','man','noch','wieder','nur','doch','alle','viel','viele','vielen','vieler','wenig','klein',
  'groß','gut','besser','beste','alt','jung','neu','erste','letzte','nächste','andere','anderer',
  'anderes','solche','solcher','solches','jeder','jede','jedes','beide','beiden','beider','eigen',
  'eigene','eigenes','eigenen','während','gegen','durch','ohne','um','bis','unter','über','vor',
  'hinter','neben','zwischen','entlang','trotz','wegen','statt','innerhalb','außerhalb','oberhalb',
  'unterhalb','diesseits','jenseits','ab','seit','außer','sowie','als','wie','dass','da','weil',
  'denn','obwohl','obgleich','wenn','falls','sofern','solange','bis','bevor','nachdem','seitdem',
  'sobald','indem','dadurch','wodurch','womit','woran','worauf','wovon','wovor','wobei','weshalb',
  'weswegen','trotzdem','dessen','deren','denen','welcher','welche','welches','welchem','welchen',
  'wem','wen','was','wessen','wann','warum','wie','wo','wohin','woher','wieso','weshalb','weswegen',
  'wodurch','womit','woran','worauf','wovon','wovor','wobei',
  'laufen','läuft','laufe','läufst','gehen','geht','gehe','gehst','kommen','kommt','komme','kommst',
  'machen','macht','mache','machst','sagen','sagt','sage','sagst','wissen','weiß','weißt','wusste',
  'denken','denkt','denke','denkst','glauben','glaubt','glaube','glaubst','helfen','hilft','helfe',
  'bringen','bringt','bringe','bringst','nehmen','nimmt','nehme','nimmst','lassen','lässt','lasse',
  'sehen','sieht','sehe','siehst','geben','gibt','gebe','gibst','finden','findet','finde','findest',
  'halten','hält','halte','hältst','setzen','setzt','setze','treiben','treibt','treibe','tragen',
  'trägt','trage','trägst','bleiben','bleibt','bleibe','liegen','liegt','liege','stehen','steht',
  'stehe','schreiben','schreibt','schreibe','lesen','liest','lese','sprechen','spricht','spreche',
  'verstehen','versteht','verstehe',
  'katze','katzen','hund','hunde','pferd','pferde','vogel','vögel','fisch','fische','maus','mäuse',
  'schaf','schafe','kuh','kühe','schwein','schweine','hase','hasen','haus','häuser','tisch','tische',
  'stuhl','stühle','bett','betten','tür','türen','fenster','buch','bücher','lampe','lampen',
  'uhr','uhren','wasser','brot','milch','käse','fleisch','obst','gemüse','kaffee','tee','bier',
  'wein','saft','essen','isst','esse','trinken','trinkt','trinke','schlafen','schläft','schlafe',
  'fahren','fährt','fahre','spielen','spielt','spiele','arbeiten','arbeitet','arbeite','wohnen',
  'wohnt','wohne','heißen','heißt','heiße','lernen','lernt','lerne','kaufen','kauft','kaufe',
  'verkaufen','verkauft','verkaufe','suchen','sucht','suche',
  'mann','frau','kind','kinder','junge','jungen','mädchen','eltern','familie','bruder','schwester',
  'vater','mutter','sohn','tochter','freund','freunde','freundin',
  'schule','universität','stadt','dorf','land','straße','platz','garten','park','wald','see',
  'fluss','berg','meer','tag','nacht','morgen','abend','woche','monat','jahr','zeit','stunde',
  'ja','nein','doch','war','warst','waren','wart','spazieren','spazierte','spazierten','gestern','heute','morgen',
  'jetzt','dann','dort','hier','später','früher','danach','vorher','deshalb','trotzdem',
  'tun','tat','getan','legen','legte','gelegt','stellen','stellte','gestellt','setzte','gesetzt',
  'beginnen','beginnt','begann','begonnen','enden','endet','endete','geendet',
  'eins','zwei','drei','vier','fünf','sechs','sieben','acht','neun','zehn',
  'elf','zwölf','zwanzig','dreißig','hundert','tausend',
  'kindern','kindes','kinde','mannes','mannen','frauen','kindes','hauses','buches',
  'tisches','stuhles','bettes','wassers','brotes','milches','kaffees','tees',
  'tages','nachts','jahres','zeiten','minuten','stunden','wochen','monate','monaten',
  'name','namen','glaubens','willen','frieden'
]);

var SPANISH_WORDS = new Set([
  'el','la','los','las','un','una','unos','unas','es','son','está','están','estoy','estás',
  'estamos','estáis','tiene','tienen','tengo','tenemos','tienes','tenéis','no','y','pero','o',
  'que','con','para','de','en','por','a','hacia','desde','hasta','entre','según','sin','sobre',
  'tras','durante','más','menos','muy','mucho','poca','poco','muchos','muchas','bien','mal',
  'como','cuando','donde','quien','qué','cuál','cuáles','este','esta','estos','estas','ese',
  'esa','esos','esas','aquel','aquella','aquellos','aquellas','me','te','se','nos','os','lo',
  'la','le','les','mi','tu','su','mis','tus','sus','nuestro','nuestra','nuestros','nuestras',
  'hay','había','hubo','hace','hacía','hacen','hago','haces','puede','pueden','puedo','podemos',
  'todo','toda','todos','todas','cada','otro','otra','otros','otras','ya','también','sino',
  'aunque','nunca','siempre','tampoco','mismo','misma','mismos','mismas','primero','primera',
  'primer','último','última','gran','grande','grandes','mejor','peor','mayor','menor','buen',
  'bueno','buena','buenos','buenas','malo','mala','malos','malas','nuevo','nueva','nuevos',
  'nuevas','viejo','vieja','viejos','viejas','solo','sola','solos','solas','propio','propia',
  'propios','propias','ajeno','ajena','ajenos','ajenas','cualquier','cualquiera','demasiado',
  'demasiada','bastante','bastantes','cierto','cierta','ciertos','ciertas','varios','varias',
  'escaso','escasa','escasos','escasas','suficiente','suficientes','próximo','próxima',
  'próximos','próximas','pasado','pasada','pasados','pasadas','futuro','futura','futuros',
  'futuras','antes','después','luego','entonces','ahora','ayer','hoy','mañana','temprano',
  'tarde','siempre','nunca','jamás','tampoco','aquí','allí','allá','acá','ahí','cerca','lejos',
  'arriba','abajo','dentro','fuera','encima','debajo','delante','detrás','enfrente','atrás',
  'siquiera','quizá','quizás','acaso','tal','vez','acá','así','casi','medio','además','apenas',
  'incluso','excepto','salvo','menos','mediante',
  'fui','fue','fuiste','fuimos','fueron','fuera','fuese','ir','voy','vas','va','vamos','van',
  'iba','ibas','íbamos','iban','ido','yendo','al','del','era','eras','éramos','eran',
  'sea','seas','seamos','sean','ser','sido','siendo','caminar','camino','camina','caminan',
  'hablar','hablo','habla','hablan','habló','hablaba','comer','como','come','comen','comió',
  'vivir','vivo','vive','viven','vivió','tener','tiene','tienen','tengo','tenemos','tenía',
  'poder','puedo','puede','pueden','pudimos','pudo','hacer','hago','hace','hacen','hizo',
  'hacía','poner','pongo','pone','ponen','puso','decir','digo','dice','dicen','dijo','saber',
  'sé','sabe','saben','supo','dar','doy','da','dan','dio','ver','veo','ve','ven','vio','visto',
  'querer','quiero','quiere','quieren','quiso','sentir','siento','siente','sienten','sintió',
  'gato','gata','gatos','gatas','perro','perra','perros','perras','pájaro','pájaros','pez','peces',
  'caballo','caballos','vaca','vacas','oveja','ovejas','cerdo','cerdos','conejo','conejos',
  'pato','patos','gallina','gallinas','ratón','ratones',
  'casa','casas','libro','libros','mesa','mesas','silla','sillas','cama','camas','puerta','puertas',
  'ventana','ventanas','lámpara','lámparas','reloj','relojes','cuadro','cuadros',
  'agua','leche','pan','queso','carne','fruta','frutas','verdura','verduras','café','té','cerveza',
  'vino','zumo',
  'beber','bebe','bebo','bebes','beben','comer','come','como','comes','comen','leer','lee','leo',
  'lees','leen','dormir','duerme','duermo','duermes','duermen','escribir','escribe','escribo',
  'escribes','escriben','estudiar','estudia','estudio','estudias','estudian','trabajar','trabaja',
  'trabajo','trabajas','trabajan','vivir','vive','vivo','vives','viven','comprar','compra','compro',
  'compras','compran','vender','vende','vendo','vendes','venden','buscar','busca','busco','buscas',
  'buscan','jugar','juega','juego','juegas','juegan','pensar','piensa','pienso','piensas','piensan',
  'hombre','hombres','mujer','mujeres','niño','niña','niños','niñas','chico','chica','chicos',
  'chicas','padres','hermano','hermana','hermanos','hermanas','padre','madre','hijo','hija',
  'hijos','hijas','amigo','amiga','amigos','amigas',
  'escuela','colegio','ciudad','ciudades','pueblo','pueblos','país','países','calle','calles',
  'plaza','plazas','jardín','jardines','parque','parques','bosque','bosques','lago','lagos',
  'río','ríos','montaña','montañas','mar',
  'día','días','noche','noches','mañana','tardes','tarde','semana','semanas','mes','meses','año',
  'años','hora','horas','minuto','minutos',
  'ayer','anteayer','hoy','mañana','tarde','temprano','ahora','luego','después','antes',
  'entonces','mientras','siempre','nunca','jamás','también','tampoco','quizá','quizás',
  'acaso','tal','vez','acá','así','casi','medio','además','apenas','incluso','excepto',
  'salvo','mediante','durante','según','contra','hacia','desde','hasta','entre',
  'andar','anduvo','andaba','andan','anda','ando','seguir','sigue','siguen','siguió',
  'volver','vuelve','vuelven','volvió','deber','debe','debemos','debían','debió',
  'quedar','queda','quedan','quedó','quedaba','parecer','parece','parecen','parecía',
  'conocer','conoce','conocen','conoció','pasar','pasa','pasan','pasó','pasaba',
  'creer','cree','creen','creyó','dejar','deja','dejan','dejó','entrar','entra','entran',
  'entró','llegar','llegó','llega','llegan','llevar','lleva','llevan','llevó','sacar',
  'saca','sacan','sacó','necesitar','necesita','necesitan','necesitó','esperar','espera',
  'esperan','esperó','entender','entiende','entienden','entendió','perder','pierde',
  'pierden','perdió','morir','muere','mueren','murió'
]);

var GERMAN_PATTERNS = [
  /\bsch/, /cht/, /\bge\w{2}/, /ei(t|n|g)/, /ung\b/, /eit/, /\bvor/, /\bnach/, /\bbei/,
  /\bauf/, /\baus/, /ß/, /ö/, /ä/, /ü/, /tz/, /pf/, /st\b/, /en\b/, /er\b/, /liche/
];

var SPANISH_PATTERNS = [
  /\bqu[eé]/, /ión\b/, /dad\b/, /tad\b/, /mente\b/, /ez\b/, /eza\b/, /ista\b/,
  /\best/, /\bent/, /más\b/, /ñ/, /[éíóú]/, /mient/, /ción/, /cción/, /miento/, /mienta/
];

function trySplitCompound(word) {
  var lower = word.toLowerCase();
  for (var split = 2; split < lower.length; split++) {
    var left = lower.slice(0, split);
    var right = lower.slice(split);
    if (left.length < 2 || right.length < 2) continue;
    var rightIsCap = word[split] === word[split].toUpperCase() && word[split] !== word[split].toLowerCase();
    var gLeft = GERMAN_WORDS.has(left);
    var gRight = GERMAN_WORDS.has(right);
    var sLeft = SPANISH_WORDS.has(left);
    var sRight = SPANISH_WORDS.has(right);
    if ((gLeft || sLeft) && (gRight || sRight)) {
      var result = { german: 0, spanish: 0 };
      if (gLeft) result.german += 2;
      if (sLeft) result.spanish += 2;
      if (gRight) result.german += 2;
      if (sRight) result.spanish += 2;
      if (rightIsCap) result.german += 1;
      if (left.length === 4 && /^[A-Z]/.test(word[0])) result.german += 1;
      return result;
    }
  }
  return null;
}

function scoreLanguage(text) {
  var trimmed = text.trim();
  if (!trimmed || trimmed.length < 1) {
    return { german: 0, spanish: 0, reliable: false };
  }

  if (/^[\d\s.,;:!?¡¿()\-_\u2013\u2014\u2015]+$/.test(trimmed)) {
    return { german: 0, spanish: 0, reliable: false };
  }

  if (/^\(.*\)$/.test(trimmed)) {
    return { german: 0, spanish: 5, reliable: true };
  }

  var german = 0;
  var spanish = 0;
  var lower = trimmed.toLowerCase();

  if (/ß/.test(trimmed)) german += 5;
  if (/[ñÑ]/.test(trimmed)) spanish += 5;

  var words = trimmed.split(/\s+/).filter(function (w) { return w.length > 0; });
  if (words.length === 0) {
    return { german: german, spanish: spanish, reliable: german > 0 || spanish > 0 };
  }

  for (var i = 0; i < words.length; i++) {
    var raw = words[i];
    var clean = raw.replace(/[^\wáéíóúüñÁÉÍÓÚÜÑäöüßÄÖÜ]/g, '');
    if (clean.length < 2) continue;

    if (/[ßöäüÖÄÜ]/.test(clean)) german += 3;
    if (/[ñáéíóúÑÁÉÍÓÚ]/.test(clean)) spanish += 3;

    var lower = clean.toLowerCase();
    var inGerman = GERMAN_WORDS.has(lower);
    var inSpanish = SPANISH_WORDS.has(lower);

    if (inGerman) german += 2;
    if (inSpanish) spanish += 2;

    if (!inGerman && !inSpanish && clean.length >= 4) {
      var splitResult = trySplitCompound(clean);
      if (splitResult) {
        if (splitResult.german) german += splitResult.german;
        if (splitResult.spanish) spanish += splitResult.spanish;
      }
    }

    if (/^[A-ZÄÖÜ][a-zäöüß]/.test(clean)) german += 1;
    if (/(ción|sión|dad|tad|mente|ez|eza|ista)$/.test(lower)) spanish += 1;
  }

  for (var p = 0; p < GERMAN_PATTERNS.length; p++) {
    if (GERMAN_PATTERNS[p].test(lower)) german += 2;
  }
  for (var p = 0; p < SPANISH_PATTERNS.length; p++) {
    if (SPANISH_PATTERNS[p].test(lower)) spanish += 2;
  }

  var reliable = false;
  if (german >= 3 || spanish >= 3) {
    var total = german + spanish;
    var ratio = total > 0 ? Math.max(german, spanish) / total : 0;
    reliable = ratio >= 0.65;
  }

  return { german: german, spanish: spanish, reliable: reliable };
}

function detectLanguage(text) {
  var result = scoreLanguage(text);
  if (result.german > result.spanish && result.german >= 3) return 'german';
  if (result.spanish > result.german && result.spanish >= 3) return 'spanish';
  return 'neutral';
}

function detectLanguageAsync(text) {
  return new Promise(function (resolve) {
    if (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.detectLanguage) {
      chrome.i18n.detectLanguage(text, function (result) {
        if (result && result.languages && result.languages.length > 0) {
          var top = result.languages[0];
          if (top.percentage >= 70 && result.isReliable) {
            if (top.language === 'de') resolve('german');
            else if (top.language === 'es') resolve('spanish');
            else resolve(detectLanguage(text));
          } else {
            resolve(detectLanguage(text));
          }
        } else {
          resolve(detectLanguage(text));
        }
      });
    } else {
      resolve(detectLanguage(text));
    }
  });
}
