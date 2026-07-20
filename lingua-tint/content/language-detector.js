function detectLanguage(text) {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 1) return 'neutral';

  if (/^[\d\s.,;:!?¡¿()\-_]+$/.test(trimmed)) return 'neutral';

  if (/^\(.*\)$/.test(trimmed)) return 'spanish';

  if (/ß/.test(trimmed)) return 'german';
  if (/[ñÑ]/.test(trimmed)) return 'spanish';

  const words = trimmed.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return 'neutral';

  let germanScore = 0;
  let spanishScore = 0;

  const GERMAN_WORDS = new Set([
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
    'fluss','berg','meer','tag','nacht','morgen','abend','woche','monat','jahr','zeit','stunde'
  ]);

  const SPANISH_WORDS = new Set([
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
    'iba','ibas','íbamos','iban','ido','yendo','ido','al','del','era','eras','éramos','eran',
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
    'años','hora','horas','minuto','minutos'
  ]);

  for (const word of words) {
    const clean = word.replace(/[^\wáéíóúüñÁÉÍÓÚÜÑäöüßÄÖÜ]/g, '');
    if (clean.length < 2) continue;

    if (/[ßöäüÖÄÜ]/.test(clean)) germanScore += 3;
    if (/[ñáéíóúÑÁÉÍÓÚ]/.test(clean)) spanishScore += 3;

    if (GERMAN_WORDS.has(clean.toLowerCase())) germanScore += 2;
    if (SPANISH_WORDS.has(clean.toLowerCase())) spanishScore += 2;

    if (/^[A-ZÄÖÜ][a-zäöüß]/.test(clean)) germanScore += 1;

    if (/(ción|sión|dad|tad|mente|ez|eza|ista)$/.test(clean.toLowerCase())) spanishScore += 1;
  }

  if (germanScore > spanishScore && germanScore >= 3) return 'german';
  if (spanishScore > germanScore && spanishScore >= 3) return 'spanish';

  return 'neutral';
}
