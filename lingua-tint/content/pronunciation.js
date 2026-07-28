var PronunciationController = (function () {

  var HOST_SELECTOR = '[data-lingua-tint-ui="pronunciation"]';
  var OWNED_SELECTOR = '[data-lingua-tint-owned="true"]';

  var host = null;
  var shadowRoot = null;
  var settings = {};
  var availableVoices = [];
  var selectedVoice = null;
  var voiceLoadAttempted = false;
  var currentWord = '';
  var currentRect = null;
  var hoverGeneration = 0;
  var hoverTimer = null;
  var closeTimer = null;
  var isSpeaking = false;
  var isDestroyed = false;

  var popoverState = 'hidden';
  var popoverEl = null;
  var wordEl = null;
  var translationEl = null;
  var lemmaEl = null;
  var buttonEl = null;
  var statusEl = null;
  var voiceInfoEl = null;
  var voiceWhyBtnEl = null;
  var voiceExplanationEl = null;

  var ARTICLES = { masculine: 'der', feminine: 'die', neuter: 'das' };

  function normalizePronunciationWord(raw) {
    if (typeof raw !== 'string') return '';
    var trimmed = raw.trim();
    if (trimmed.length === 0) return '';
    if (trimmed.length > 64) return '';
    if (/\n/.test(trimmed)) return '';
    if (/^\d+$/.test(trimmed)) return '';
    var clean = trimmed.replace(/^[^A-Za-zÄÖÜäöüß]+|[^A-Za-zÄÖÜäöüß'’-]+$/g, '');
    if (clean.length === 0) return '';
    if (clean.length < 2) return '';
    return clean;
  }

  function findWordSegment(text, offset) {
    if (typeof text !== 'string' || typeof offset !== 'number') return null;
    if (offset < 0 || offset >= text.length) return null;
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      try {
        var segmenter = new Intl.Segmenter('de', { granularity: 'word' });
        var segments = Array.from(segmenter.segment(text));
        for (var i = 0; i < segments.length; i++) {
          var seg = segments[i];
          if (seg.isWordLike && offset >= seg.index && offset < seg.index + seg.segment.length) {
            return { word: seg.segment, start: seg.index, end: seg.index + seg.segment.length };
          }
        }
        return null;
      } catch (e) {
      }
    }
    var regex = /[A-Za-zÄÖÜäöüß]+(?:[''-][A-Za-zÄÖÜäöüß]+)*/g;
    var m;
    while ((m = regex.exec(text)) !== null) {
      if (offset >= m.index && offset < m.index + m[0].length) {
        return { word: m[0], start: m.index, end: m.index + m[0].length };
      }
    }
    return null;
  }

  function selectGermanVoice(voices, preferredURI) {
    if (!voices || voices.length === 0) return null;
    var localGerman = [];
    for (var i = 0; i < voices.length; i++) {
      var v = voices[i];
      if (v.lang && v.lang.toLowerCase().startsWith('de') && v.localService === true) {
        localGerman.push(v);
      }
    }
    if (localGerman.length === 0) return null;
    if (preferredURI) {
      for (var i = 0; i < localGerman.length; i++) {
        if (localGerman[i].voiceURI === preferredURI) return localGerman[i];
      }
    }
    for (var i = 0; i < localGerman.length; i++) {
      if (localGerman[i].lang === 'de-DE') return localGerman[i];
    }
    return localGerman[0];
  }

  function validatePronunciationSettings(s) {
    return {
      pronunciationEnabled: typeof s.pronunciationEnabled === 'boolean' ? s.pronunciationEnabled : true,
      translationEnabled: typeof s.translationEnabled === 'boolean' ? s.translationEnabled : true,
      pronunciationHoverDelay: typeof s.pronunciationHoverDelay === 'number' ? Math.max(200, Math.min(1500, s.pronunciationHoverDelay)) : 350,
      pronunciationRate: typeof s.pronunciationRate === 'number' ? Math.max(0.5, Math.min(1.2, s.pronunciationRate)) : 0.8,
      pronunciationVoiceURI: typeof s.pronunciationVoiceURI === 'string' && s.pronunciationVoiceURI.length <= 256 ? s.pronunciationVoiceURI : '',
      pronunciationAutoPlay: typeof s.pronunciationAutoPlay === 'boolean' ? s.pronunciationAutoPlay : false,
    };
  }

  function refreshVoices() {
    if (isDestroyed) return;
    voiceLoadAttempted = true;
    var allVoices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    availableVoices = allVoices;
    selectedVoice = selectGermanVoice(availableVoices, settings.pronunciationVoiceURI);
    updatePopoverState();
  }

  function handleVoicesChanged() {
    refreshVoices();
  }

  function speakWord(word) {
    if (!window.speechSynthesis) return false;
    if (!selectedVoice) {
      setPopoverState('unavailable');
      return false;
    }
    var normalized = normalizePronunciationWord(word);
    if (!normalized) return false;
    if (isSpeaking) window.speechSynthesis.cancel();
    var utterance = new SpeechSynthesisUtterance(normalized);
    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice.lang || 'de-DE';
    utterance.rate = settings.pronunciationRate;
    utterance.pitch = 1;
    utterance.volume = 1;
    isSpeaking = true;
    setPopoverState('speaking');
    utterance.onend = function () {
      isSpeaking = false;
      if (popoverState === 'speaking') setPopoverState('ready');
    };
    utterance.onerror = function () {
      isSpeaking = false;
      setPopoverState('error');
    };
    try {
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      isSpeaking = false;
      setPopoverState('error');
      return false;
    }
    return true;
  }

  function stop() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    isSpeaking = false;
    if (popoverState === 'speaking') setPopoverState('ready');
  }

  function setPopoverState(newState) {
    popoverState = newState;
    if (!popoverEl) return;
    popoverEl.setAttribute('data-state', newState);
    if (wordEl) wordEl.textContent = currentWord || '';
    var pronunciationActive = settings.pronunciationEnabled;
    if (buttonEl) {
      if (!pronunciationActive) {
        buttonEl.style.display = 'none';
      } else {
        buttonEl.style.display = '';
        buttonEl.disabled = (newState === 'unavailable' || newState === 'disabled');
        if (newState === 'speaking') {
          buttonEl.textContent = '\u25A0';
          buttonEl.setAttribute('aria-label', t('stop'));
        } else {
          buttonEl.textContent = '\u25B6';
          buttonEl.setAttribute('aria-label', currentWord ? t('pronounce') + ' ' + currentWord : t('pronounce'));
        }
      }
    }
    if (statusEl) {
      statusEl.textContent = '';
    }
    if (voiceInfoEl) {
      voiceInfoEl.style.display = 'none';
      voiceInfoOpen = false;
    }
  }

  function updatePopoverState() {
    var pronunciationActive = settings.pronunciationEnabled;
    var translationActive = settings.translationEnabled;
    if (!pronunciationActive && !translationActive) {
      setPopoverState('disabled');
      return;
    }
    if (pronunciationActive && !selectedVoice) {
      setPopoverState('unavailable');
      return;
    }
    setPopoverState('ready');
  }

  function buildPopover() {
    host = document.createElement('div');
    host.setAttribute('data-lingua-tint-ui', 'pronunciation');
    host.style.cssText = 'position:fixed;z-index:2147483647;pointer-events:none;left:0;top:0;width:0;height:0';
    shadowRoot = host.attachShadow({ mode: 'closed' });
    var style = document.createElement('style');
    style.textContent = [
      ':host { all: initial; }',
      '#popover {',
      '  position:fixed; pointer-events:auto; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;',
      '  font-size:13px; background:#ffffff; border:1px solid #e5e7eb; border-radius:8px;',
      '  padding:10px 14px; box-shadow:0 4px 12px rgba(0,0,0,0.12);',
      '  display:flex; flex-direction:column; gap:6px; min-width:150px;',
      '  opacity:0; transition:opacity 0.15s ease;',
      '}',
      '#popover[data-state="hidden"], #popover:not([data-state]) { display:none; }',
      '#popover[data-state="ready"], #popover[data-state="speaking"], #popover[data-state="unavailable"], #popover[data-state="error"], #popover[data-state="disabled"] { display:flex; opacity:1; }',
      '.top-row { display:flex; align-items:flex-start; gap:10px; }',
      '.info { display:flex; flex-direction:column; gap:1px; flex:1; min-width:0; }',
      '#word { font-weight:500; color:#1f2937; white-space:nowrap; max-width:140px; overflow:hidden; text-overflow:ellipsis; }',
      '#lemma { font-size:11px; color:#6b7280; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }',
      '#lemma:empty { display:none; }',
      '#translation { font-size:12px; color:#6b7280; max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }',
      '#translation:empty { display:none; }',
      '#lang { font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:0.03em; }',
      '#play {',
      '  display:inline-flex; align-items:center; justify-content:center;',
      '  width:28px; height:28px; border:none; border-radius:50%;',
      '  background:#2563eb; color:#fff; cursor:pointer; font-size:13px; flex-shrink:0;',
      '  margin-top:2px;',
      '}',
      '#play:hover { background:#1d4ed8; }',
      '#play:focus-visible { outline:2px solid #2563eb; outline-offset:2px; }',
      '#play:disabled { background:#d1d5db; cursor:default; }',
      '#voiceInfo { display:none; margin-top:2px; }',
      '#voiceWhyBtn {',
      '  font-size:11px; color:#2563eb; background:none; border:none; padding:0; cursor:pointer; text-decoration:none;',
      '}',
      '#voiceWhyBtn:hover { text-decoration:underline; }',
      '#voiceExplanation {',
      '  display:none; font-size:11px; color:#6b7280; line-height:1.4; margin-top:4px; max-width:200px;',
      '}',
      '#voiceExplanation a { color:#2563eb; }',
      '@media (prefers-reduced-motion:reduce) { #popover { transition:none; } }',
    ].join('');
    var html = [
      '<div id="popover" data-state="hidden" role="tooltip">',
      '  <div class="top-row">',
      '    <div class="info">',
      '      <div id="word"></div>',
      '      <div id="lemma"></div>',
      '      <div id="translation"></div>',
      '    </div>',
      '    <div>',
      '      <div id="lang">DE</div>',
      '      <button id="play" aria-label="' + t('pronounce') + '" disabled>\u25B6</button>',
      '    </div>',
      '  </div>',
,
      '</div>',
    ].join('');
    shadowRoot.appendChild(style);
    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    shadowRoot.appendChild(wrapper);
    popoverEl = shadowRoot.getElementById('popover');
    wordEl = shadowRoot.getElementById('word');
    lemmaEl = shadowRoot.getElementById('lemma');
    translationEl = shadowRoot.getElementById('translation');
    buttonEl = shadowRoot.getElementById('play');
    voiceInfoEl = shadowRoot.getElementById('voiceInfo');
    voiceWhyBtnEl = shadowRoot.getElementById('voiceWhyBtn');
    voiceExplanationEl = shadowRoot.getElementById('voiceExplanation');
    buttonEl.addEventListener('click', function () {
      if (isSpeaking) { stop(); return; }
      if (currentWord) speakWord(currentWord);
    });

    document.documentElement.appendChild(host);
  }

  function positionPopover(clientRect) {
    if (!popoverEl || !clientRect) return;
    var popoverRect = popoverEl.getBoundingClientRect();
    var popoverW = popoverRect.width || 170;
    var popoverH = popoverRect.height || 70;
    var margin = 8;
    var wordCenterX = clientRect.left + clientRect.width / 2;
    var wordTop = clientRect.top;
    var x = Math.max(margin, Math.min(window.innerWidth - popoverW - margin, wordCenterX - popoverW / 2));
    var y = wordTop - popoverH - margin;
    if (y < margin) y = clientRect.bottom + margin;
    popoverEl.style.left = x + 'px';
    popoverEl.style.top = y + 'px';
  }

  function showPopover(word, clientRect) {
    currentWord = word;
    currentRect = clientRect;
    hoverGeneration++;
    var gen = hoverGeneration;
    if (!popoverEl) buildPopover();

    var pronunciationActive = settings.pronunciationEnabled;
    var translationActive = settings.translationEnabled;

    // Reset optional elements
    if (lemmaEl) lemmaEl.textContent = '';
    if (translationEl) translationEl.textContent = '';

    // Translation lookup (synchronous lemma/gender + async translate)
    if (translationActive && typeof GermanTranslations !== 'undefined') {
      var status = GermanTranslations.getStatus();
      if (status === 'checking') {
        translationEl.textContent = t('preparingTranslation');
      } else if (status === 'downloading') {
        var prog = GermanTranslations.getDownloadProgress();
        if (prog && prog.total) {
            translationEl.textContent = t('downloadingTranslator') + ' ' + Math.round(prog.loaded * 100 / prog.total) + '%';
        } else {
          translationEl.textContent = t('downloadingTranslator');
        }
      } else if (status === 'unsupported' || status === 'error') {
        translationEl.textContent = '';
      } else {
        translationEl.textContent = '';
      }

      // Synchronous lookup for lemma/gender
      var lookupResult = GermanTranslations.lookup(word);
      if (lookupResult && lookupResult.found) {
        var lemma = lookupResult.lemma;
        var hasForm = lemma && lemma !== lookupResult.normalized;
        if (hasForm && lemmaEl) {
          var article = lookupResult.gender ? ARTICLES[lookupResult.gender] || '' : '';
          if (article) {
            lemmaEl.textContent = article + ' ' + lemma;
          } else {
            lemmaEl.textContent = lemma;
          }
        } else if (!hasForm && lookupResult.gender && lemmaEl) {
          var article2 = ARTICLES[lookupResult.gender];
          if (article2) {
            lemmaEl.textContent = article2 + ' ' + lookupResult.normalized;
          }
        }
      }

      GermanTranslations.translate(word).then(function (result) {
        if (gen !== hoverGeneration) return;
        if (result && result.translations && result.translations.length > 0) {
          translationEl.textContent = result.translations.join(', ');
        }
        // Update lemma from async result if more complete
        if (result && result.found && lemmaEl && !lemmaEl.textContent) {
          var resLemma = result.lemma;
          var resNorm = result.normalized;
          var hasForm = resLemma && resLemma !== resNorm;
          if (hasForm) {
            var article = result.gender ? ARTICLES[result.gender] || '' : '';
            lemmaEl.textContent = article ? article + ' ' + resLemma : resLemma;
          } else if (result.gender) {
            var article2 = ARTICLES[result.gender];
            if (article2) lemmaEl.textContent = article2 + ' ' + resNorm;
          }
        }
      });
    }

    // Determine state based on active features
    if (pronunciationActive && !selectedVoice) {
      setPopoverState('unavailable');
    } else if (!pronunciationActive && translationActive) {
      setPopoverState('ready');
    } else if (pronunciationActive) {
      setPopoverState('ready');
    } else {
      setPopoverState('disabled');
      return;
    }

    if (popoverState === 'disabled') return;

    wordEl.textContent = word;
    positionPopover(clientRect);

    if (pronunciationActive && selectedVoice) {
      setPopoverState('ready');
    }
  }

  function hidePopover() {
    currentWord = '';
    currentRect = null;
    hoverGeneration++;
    if (lemmaEl) lemmaEl.textContent = '';
    if (translationEl) translationEl.textContent = '';
    voiceInfoOpen = false;
    if (popoverEl) {
      setPopoverState('hidden');
      popoverEl.style.left = '';
      popoverEl.style.top = '';
    }
  }

  function handlePointerMove(e) {
    if (!settings.pronunciationEnabled && !settings.translationEnabled) return;
    if (isDestroyed) return;
    var target = e.target;
    if (!target || !target.closest) return;
    var span = target.closest(OWNED_SELECTOR + '[data-lingua-lang="german"]');
    if (!span) {
      clearTimers();
      if (popoverState !== 'hidden' && popoverState !== 'disabled' && !isHoveringPopover(e)) {
        closeWithDelay();
      }
      return;
    }
    cancelClose();
    if (hoverTimer) clearTimeout(hoverTimer);
    hoverTimer = setTimeout(function () {
      hoverTimer = null;
      var x = e.clientX;
      var y = e.clientY;
      var pos = null;
      if (document.caretPositionFromPoint) {
        pos = document.caretPositionFromPoint(x, y);
      } else if (document.caretRangeFromPoint) {
        var range = document.caretRangeFromPoint(x, y);
        if (range) pos = { offsetNode: range.startContainer, offset: range.startOffset };
      }
      if (!pos) return;
      var node = pos.offsetNode;
      if (!node) return;
      if (node.nodeType !== Node.TEXT_NODE) return;
      var parent = node.parentElement;
      if (!parent || !parent.closest) return;
      if (!parent.closest(OWNED_SELECTOR + '[data-lingua-lang="german"]')) return;
      var fullText = node.textContent;
      var seg = findWordSegment(fullText, pos.offset);
      if (!seg) return;
      var word = normalizePronunciationWord(seg.word);
      if (!word) return;
      var wordRange = document.createRange();
      wordRange.setStart(node, seg.start);
      wordRange.setEnd(node, seg.end);
      var rects = wordRange.getClientRects();
      if (!rects || rects.length === 0) return;
      var closestRect = rects[0];
      var minDist = Infinity;
      for (var i = 0; i < rects.length; i++) {
        var cx = rects[i].left + rects[i].width / 2;
        var cy = rects[i].top + rects[i].height / 2;
        var d = Math.pow(cx - x, 2) + Math.pow(cy - y, 2);
        if (d < minDist) { minDist = d; closestRect = rects[i]; }
      }
      showPopover(word, closestRect);
    }, settings.pronunciationHoverDelay);
  }

  function isHoveringPopover(e) {
    if (!popoverEl) return false;
    var rect = popoverEl.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    return e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
  }

  function cancelClose() {
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
  }

  function closeWithDelay() {
    if (closeTimer) return;
    if (popoverState === 'hidden' || popoverState === 'disabled') return;
    closeTimer = setTimeout(function () {
      closeTimer = null;
      hidePopover();
    }, 150);
  }

  function clearTimers() {
    if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null; }
    cancelClose();
  }

  function handleClick(e) {
    if (!settings.pronunciationEnabled) return;
    if (isDestroyed) return;
    if (!e.altKey) return;
    var target = e.target;
    if (!target || !target.closest) return;
    var span = target.closest(OWNED_SELECTOR + '[data-lingua-lang="german"]');
    if (!span) return;
    var x = e.clientX;
    var y = e.clientY;
    var pos = null;
    if (document.caretPositionFromPoint) {
      pos = document.caretPositionFromPoint(x, y);
    } else if (document.caretRangeFromPoint) {
      var range = document.caretRangeFromPoint(x, y);
      if (range) pos = { offsetNode: range.startContainer, offset: range.startOffset };
    }
    if (!pos) return;
    var node = pos.offsetNode;
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    var fullText = node.textContent;
    var seg = findWordSegment(fullText, pos.offset);
    if (!seg) return;
    var word = normalizePronunciationWord(seg.word);
    if (!word) return;
    e.preventDefault();
    speakWord(word);
  }

  function handleKeyDown(e) {
    if (!settings.pronunciationEnabled) return;
    if (isDestroyed) return;
    if (e.altKey && e.key === 'p' && !e.ctrlKey && !e.metaKey) {
      var sel = window.getSelection();
      var selectedText = sel ? sel.toString().trim() : '';
      if (selectedText) {
        var words = selectedText.split(/\s+/);
        if (words.length === 1) {
          var word = normalizePronunciationWord(words[0]);
          if (word) { e.preventDefault(); speakWord(word); return; }
        }
      }
    }
  }

  function handleScroll() {
    if (popoverState !== 'hidden' && popoverState !== 'disabled') hidePopover();
  }

  function handleResize() {
    if (popoverState !== 'hidden' && popoverState !== 'disabled') hidePopover();
  }

  var boundPointerMove = null;
  var boundClick = null;
  var boundKeyDown = null;
  var boundScroll = null;
  var boundResize = null;
  var boundVoicesChanged = null;

  function addListeners() {
    boundPointerMove = handlePointerMove;
    boundClick = handleClick;
    boundKeyDown = handleKeyDown;
    boundScroll = handleScroll;
    boundResize = handleResize;
    boundVoicesChanged = handleVoicesChanged;
    document.addEventListener('pointermove', boundPointerMove, { passive: true });
    document.addEventListener('click', boundClick, true);
    document.addEventListener('keydown', boundKeyDown);
    window.addEventListener('scroll', boundScroll, { passive: true });
    window.addEventListener('resize', boundResize, { passive: true });
    if (window.speechSynthesis) {
      window.speechSynthesis.addEventListener('voiceschanged', boundVoicesChanged);
    }
  }

  function removeListeners() {
    if (boundPointerMove) document.removeEventListener('pointermove', boundPointerMove);
    if (boundClick) document.removeEventListener('click', boundClick, true);
    if (boundKeyDown) document.removeEventListener('keydown', boundKeyDown);
    if (boundScroll) window.removeEventListener('scroll', boundScroll);
    if (boundResize) window.removeEventListener('resize', boundResize);
    if (boundVoicesChanged && window.speechSynthesis) {
      window.speechSynthesis.removeEventListener('voiceschanged', boundVoicesChanged);
    }
    boundPointerMove = null;
    boundClick = null;
    boundKeyDown = null;
    boundScroll = null;
    boundResize = null;
    boundVoicesChanged = null;
  }

  var statusSubscribed = false;

  function handleTranslationStatus(status, details) {
    if (!translationEl || popoverState === 'hidden' || popoverState === 'disabled') return;
    if (status === 'downloading') {
      var pct = details.pct || 0;
      translationEl.textContent = t('downloadingTranslator') + ' ' + pct + '%';
    } else if (status === 'available') {
      if (translationEl.textContent.indexOf(t('preparingTranslation')) >= 0 || translationEl.textContent.indexOf(t('downloadingTranslator')) >= 0 || translationEl.textContent === '') {
        translationEl.textContent = '';
      }
    } else if (status === 'error') {
      if (!translationEl.textContent || translationEl.textContent.indexOf(t('preparingTranslation')) >= 0 || translationEl.textContent.indexOf(t('downloadingTranslator')) >= 0) {
        translationEl.textContent = '';
      }
    } else if (status === 'unsupported') {
      if (!translationEl.textContent || translationEl.textContent === t('preparingTranslation')) {
        translationEl.textContent = '';
      }
    }
  }

  function init(options) {
    isDestroyed = false;
    settings = validatePronunciationSettings(options || {});
    refreshVoices();
    if (!voiceLoadAttempted) {
      refreshVoices();
    }
    if (!statusSubscribed && typeof GermanTranslations !== 'undefined' && GermanTranslations.onStatusChange) {
      statusSubscribed = true;
      GermanTranslations.onStatusChange(handleTranslationStatus);
    }
    // Listen for UI language changes from the popup
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      if (!window._linguaUIListener) {
        window._linguaUIListener = true;
        chrome.storage.onChanged.addListener(function (changes) {
          if (changes.uiLanguage && typeof UI_LANGUAGE !== 'undefined') {
            UI_LANGUAGE = changes.uiLanguage.newValue || 'en';
            // Update visible strings in the current popover if visible
            if (popoverState !== 'hidden' && popoverState !== 'disabled' && popoverEl) {
              if (buttonEl) {
                if (isSpeaking) {
                  buttonEl.setAttribute('aria-label', t('stop'));
                } else {
                  buttonEl.setAttribute('aria-label', currentWord ? t('pronounce') + ' ' + currentWord : t('pronounce'));
                }
              }
              if (voiceWhyBtnEl) {
                voiceWhyBtnEl.textContent = voiceInfoOpen ? t('hide') : t('learnWhy');
              }
            }
          }
        });
      }
    }
    addListeners();
  }

  function update(options) {
    settings = validatePronunciationSettings(options || {});
    if (!settings.pronunciationEnabled && !settings.translationEnabled) {
      stop();
      hidePopover();
      if (popoverEl) setPopoverState('disabled');
      return;
    }
    selectedVoice = selectGermanVoice(availableVoices, settings.pronunciationVoiceURI);
    if (popoverEl && popoverState !== 'hidden') {
      updatePopoverState();
    }
  }

  function destroy() {
    isDestroyed = true;
    statusSubscribed = false;
    stop();
    clearTimers();
    hidePopover();
    removeListeners();
    if (host && host.parentNode) host.parentNode.removeChild(host);
    host = null;
    shadowRoot = null;
    popoverEl = null;
    wordEl = null;
    lemmaEl = null;
    translationEl = null;
    buttonEl = null;
    statusEl = null;
    voiceInfoEl = null;
    availableVoices = [];
    selectedVoice = null;
    currentWord = '';
    currentRect = null;
    settings = {};
    voiceLoadAttempted = false;
  }

  return {
    init: init,
    update: update,
    destroy: destroy,
    speakWord: speakWord,
    stop: stop,
    refreshVoices: refreshVoices,
    getVoices: function () { return availableVoices; },
    getSelectedVoice: function () { return selectedVoice; },
    getState: function () { return popoverState; },
    getWord: function () { return currentWord; },
    _normalize: normalizePronunciationWord,
    _findSegment: findWordSegment,
    _selectVoice: selectGermanVoice,
    _validate: validatePronunciationSettings,
  };
})();
