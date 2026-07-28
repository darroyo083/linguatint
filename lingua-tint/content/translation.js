var GermanTranslations = (function () {
  var dict = typeof GERMAN_TRANSLATIONS !== 'undefined' ? GERMAN_TRANSLATIONS : {};
  var forms = typeof GERMAN_FORMS !== 'undefined' ? GERMAN_FORMS : {};

  var translatorInstance = null;
  var translatorStatus = 'unchecked';
  var translationCache = {};
  var pendingQueue = [];
  var downloadProgress = null;
  var statusListeners = [];
  var CACHE_MAX = 1000;
  var _debug = false;
  var _consented = false;

  function normalize(word) {
    if (typeof word !== 'string') return '';
    var cleaned = word.trim().replace(/^[^a-zA-ZäöüßÄÖÜ]+|[^a-zA-ZäöüßÄÖÜ'’-]+$/g, '');
    return cleaned.toLowerCase();
  }

  function notifyStatus(status, details) {
    details = details || {};
    for (var i = 0; i < statusListeners.length; i++) {
      try { statusListeners[i](status, details); } catch (e) {}
    }
  }

  function onStatusChange(listener) {
    statusListeners.push(listener);
    var details = { status: translatorStatus };
    if (translatorStatus === 'downloading' && downloadProgress) {
      details.progress = downloadProgress.loaded;
      details.total = downloadProgress.total;
      details.pct = downloadProgress.pct;
    }
    try { listener(translatorStatus, details); } catch (e) {}
  }

  function getStatus() { return translatorStatus; }

  function getDownloadProgress() { return downloadProgress; }

  function setConsented() {
    _consented = true;
  }

  function lookupWord(normalized) {
    var entry = dict[normalized];
    if (entry) {
      return {
        found: true,
        translations: entry.translations,
        lemma: normalized,
        partOfSpeech: entry.pos || null,
        gender: entry.gender || null,
        source: 'dictionary'
      };
    }
    var lemma = forms[normalized];
    if (lemma) {
      entry = dict[lemma];
      if (entry) {
        return {
          found: true,
          translations: entry.translations,
          lemma: lemma,
          partOfSpeech: entry.pos || null,
          gender: entry.gender || null,
          source: 'dictionary'
        };
      }
    }
    return { found: false };
  }

  function lookup(word) {
    var original = word;
    var normalized = normalize(word);
    if (!normalized) {
      return { found: false, original: original, normalized: normalized };
    }
    var result = lookupWord(normalized);
    result.original = original;
    result.normalized = normalized;
    return result;
  }

  function createTranslator() {
    if (translatorInstance) return Promise.resolve(translatorInstance);
    return Translator.create({
      sourceLanguage: 'de',
      targetLanguage: 'es'
    }).then(function (instance) {
      translatorInstance = instance;
      return instance;
    });
  }

  function createTranslatorWithMonitor() {
    return Translator.create({
      sourceLanguage: 'de',
      targetLanguage: 'es',
      monitor: function (m) {
        m.addEventListener('downloadprogress', function (e) {
          var pct = Math.round(e.loaded * 100 / e.total);
          downloadProgress = { loaded: e.loaded, total: e.total, pct: pct };
          translatorStatus = 'downloading';
          notifyStatus('downloading', { progress: e.loaded, total: e.total, pct: pct, message: t('downloadingModel') + ' ' + pct + '%' });
          if (_debug) console.log('[LinguaTint] Translator download: ' + pct + '%');
        });
      }
    });
  }

  function checkAvailability() {
    if (translatorStatus !== 'unchecked') return;
    if (typeof Translator === 'undefined') {
      translatorStatus = 'unsupported';
      notifyStatus('unsupported', { message: t('translationNotSupported') });
      if (_debug) console.log('[LinguaTint] Translator: not supported');
      return;
    }
    translatorStatus = 'checking';
    notifyStatus('checking', { message: t('checkingModel') });
    if (_debug) console.log('[LinguaTint] Translator: checking availability');

    Translator.availability({
      sourceLanguage: 'de',
      targetLanguage: 'es'
    }).then(function (availability) {
      if (_debug) console.log('[LinguaTint] Translator availability: ' + availability);
      if (availability === 'available') {
        // Model is confirmed installed. Safe to create.
        createTranslator().then(function () {
          translatorStatus = 'available';
          downloadProgress = null;
          notifyStatus('available', { message: null });
          if (_debug) console.log('[LinguaTint] Translator: ready');
          processPendingQueue();
        }).catch(function () {
          translatorStatus = 'error';
          notifyStatus('error', { message: t('failedCreateTranslator') });
          if (_debug) console.log('[LinguaTint] Translator: create failed');
          drainPendingQueue();
        });
      } else if (availability === 'downloadable') {
        // Privacy: may be 'downloadable' even if model exists.
        // Only call create() if user has explicitly consented.
        if (_consented) {
          if (_debug) console.log('[LinguaTint] Translator: downloadable but consented, creating...');
          createTranslator().then(function () {
            translatorStatus = 'available';
            downloadProgress = null;
            notifyStatus('available', { message: null });
            if (_debug) console.log('[LinguaTint] Translator: ready (consented)');
            processPendingQueue();
          }).catch(function () {
            translatorStatus = 'downloadable';
            downloadProgress = null;
            notifyStatus('downloadable', { message: t('modelRequired'), pct: 0 });
            if (_debug) console.log('[LinguaTint] Translator: model needs download');
          });
        } else {
          translatorStatus = 'downloadable';
          downloadProgress = null;
          notifyStatus('downloadable', { message: t('modelRequired'), pct: 0 });
          if (_debug) console.log('[LinguaTint] Translator: model needs download');
          // Check chrome.storage.local in background (for consented flag from popup)
          if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            try {
              chrome.storage.local.get('translationConsented', function(result) {
                if (result && result.translationConsented) {
                  _consented = true;
                  if (_debug) console.log('[LinguaTint] Translator: consent found in storage');
                  // Re-run availability check with consent
                  if (translatorStatus === 'downloadable') {
                    translatorStatus = 'unchecked';
                    checkAvailability();
                  }
                }
              });
            } catch(e) {}
          }
        }
      } else {
        translatorStatus = 'unsupported';
        notifyStatus('unsupported', { message: t('translationUnavailable') });
        if (_debug) console.log('[LinguaTint] Translator: unavailable');
      }
    }).catch(function () {
      translatorStatus = 'error';
      notifyStatus('error', { message: t('couldNotCheck') });
      if (_debug) console.log('[LinguaTint] Translator: availability check failed');
    });
  }

  function startDownload() {
    if (translatorStatus !== 'downloadable') return;
    if (_debug) console.log('[LinguaTint] Translator: starting download');
    _consented = true;

    createTranslatorWithMonitor().then(function (instance) {
      translatorInstance = instance;
      translatorStatus = 'available';
      downloadProgress = null;
      notifyStatus('available', { message: null });
      if (_debug) console.log('[LinguaTint] Translator: ready after download');
      processPendingQueue();
    }).catch(function () {
      translatorStatus = 'error';
      downloadProgress = null;
      notifyStatus('error', { message: t('couldNotDownload') });
      if (_debug) console.log('[LinguaTint] Translator: download failed');
    });
  }

  function processPendingQueue() {
    var queue = pendingQueue;
    pendingQueue = [];
    for (var i = 0; i < queue.length; i++) {
      (function (item) {
        if (!translatorInstance) {
          item.resolve(item.fallback);
          return;
        }
        translatorInstance.translate(item.original).then(function (text) {
          var result = {
            found: true,
            original: item.original,
            normalized: item.normalized,
            translations: [text],
            lemma: item.normalized,
            source: 'translator'
          };
          if (Object.keys(translationCache).length >= CACHE_MAX) translationCache = {};
          translationCache[item.normalized] = { translations: result.translations, source: 'translator' };
          item.resolve(result);
        }).catch(function () {
          item.resolve(item.fallback);
        });
      })(queue[i]);
    }
  }

  function drainPendingQueue() {
    var queue = pendingQueue;
    pendingQueue = [];
    for (var i = 0; i < queue.length; i++) {
      queue[i].resolve(queue[i].fallback);
    }
  }

  function translate(word) {
    return new Promise(function (resolve) {
      var original = word;
      var normalized = normalize(word);
      var startTime = Date.now();

      if (!normalized) {
        resolve({ found: false, original: original, normalized: normalized });
        return;
      }

      var cached = translationCache[normalized];
      if (cached) {
        var r = {
          found: true,
          original: original,
          normalized: normalized,
          translations: cached.translations,
          source: cached.source
        };
        if (cached.lemma) r.lemma = cached.lemma;
        if (cached.partOfSpeech) r.partOfSpeech = cached.partOfSpeech;
        if (cached.gender) r.gender = cached.gender;
        if (_debug) console.log('[LinguaTint] translate "' + original + '" \u2192 cache (' + cached.source + '): ' + cached.translations.join(', '));
        resolve(r);
        return;
      }

      if (translatorStatus === 'unchecked' || translatorStatus === 'checking') {
        checkAvailability();
      }

      if (translatorStatus === 'available' && translatorInstance) {
        translatorInstance.translate(original).then(function (apiText) {
          var elapsed = Date.now() - startTime;
          var result = {
            found: true,
            original: original,
            normalized: normalized,
            translations: [apiText],
            lemma: normalized,
            source: 'translator'
          };
          if (Object.keys(translationCache).length >= CACHE_MAX) translationCache = {};
          translationCache[normalized] = { translations: result.translations, source: 'translator' };
          if (_debug) console.log('[LinguaTint] translate "' + original + '" \u2192 chrome (' + elapsed + 'ms): ' + apiText);
          resolve(result);
        }).catch(function (err) {
          if (_debug) console.log('[LinguaTint] translate "' + original + '" \u2192 error: ' + (err && err.message ? err.message : String(err)));
          resolve({ found: false, original: original, normalized: normalized, source: 'none' });
        });
        return;
      }

      var fallback = lookupWord(normalized);
      if (fallback.found) {
        fallback.original = original;
        fallback.normalized = normalized;
        if (_debug) console.log('[LinguaTint] translate "' + original + '" \u2192 dictionary: ' + fallback.translations.join(', '));
        resolve(fallback);
        return;
      }

      if (translatorStatus === 'downloading' || translatorStatus === 'downloadable') {
        if (_debug) console.log('[LinguaTint] translate "' + original + '" \u2192 queued (status: ' + translatorStatus + ')');
        pendingQueue.push({
          original: original,
          normalized: normalized,
          fallback: { found: false, original: original, normalized: normalized, source: 'none' },
          resolve: resolve
        });
        return;
      }

      if (_debug) console.log('[LinguaTint] translate "' + original + '" \u2192 none');
      resolve({ found: false, original: original, normalized: normalized, source: 'none' });
    });
  }

  function resetTranslator() {
    translatorInstance = null;
    translatorStatus = 'unchecked';
    translationCache = {};
    pendingQueue = [];
    downloadProgress = null;
  }

  return {
    lookup: lookup,
    translate: translate,
    resetTranslator: resetTranslator,
    checkAvailability: checkAvailability,
    startDownload: startDownload,
    setConsented: setConsented,
    onStatusChange: onStatusChange,
    getStatus: getStatus,
    getDownloadProgress: getDownloadProgress,
    _normalize: normalize,
    get _debug() { return _debug; },
    set _debug(v) { _debug = v; }
  };
})();
