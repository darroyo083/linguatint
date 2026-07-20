const DEFAULTS = {
  enabled: true,
  siteMode: 'notebooklm',
  germanColor: '#2563eb',
  spanishColor: '#16a34a',
  germanEnabled: true,
  spanishEnabled: true,
};

let settings = { ...DEFAULTS };

function isSkippedAncestor(el) {
  while (el) {
    const tag = el.tagName && el.tagName.toUpperCase();
    if (['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'CODE', 'PRE'].includes(tag)) return true;
    if (el.isContentEditable) return true;
    if (el.classList && Array.from(el.classList).some(c => c.toLowerCase().includes('code'))) return true;
    el = el.parentElement;
  }
  return false;
}

function shouldProcess() {
  if (!settings.enabled) return false;
  if (settings.siteMode === 'notebooklm' && !location.hostname.includes('notebooklm.google.com')) return false;
  return true;
}

function processTextNode(textNode) {
  const text = textNode.textContent;
  const trimmed = text.trim();
  if (trimmed.length < 3) return;
  if (/^[\d\s.,;:!?¡¿()\-_]+$/.test(trimmed)) return;

  const parent = textNode.parentElement;
  if (!parent) return;
  if (parent.classList.contains('lingua-tint-span')) return;
  if (isSkippedAncestor(parent)) return;

  const parenRegex = /\([^)]+\)/g;
  const rawSegments = [];
  let lastIndex = 0;
  let match;

  while ((match = parenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      rawSegments.push({
        text: text.slice(lastIndex, match.index),
        language: null,
      });
    }
    rawSegments.push({
      text: match[0],
      language: 'spanish',
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    rawSegments.push({
      text: text.slice(lastIndex),
      language: null,
    });
  }

  var expandedSegments = [];
  for (var s = 0; s < rawSegments.length; s++) {
    if (rawSegments[s].language === 'spanish') {
      expandedSegments.push(rawSegments[s]);
    } else {
      var subs = sentenceLevelSegments(rawSegments[s].text);
      for (var t = 0; t < subs.length; t++) {
        expandedSegments.push(subs[t]);
      }
    }
  }

  var effectiveSegments = [];
  for (var s = 0; s < expandedSegments.length; s++) {
    var seg = expandedSegments[s];
    if (
      (seg.language === 'german' && !settings.germanEnabled) ||
      (seg.language === 'spanish' && !settings.spanishEnabled)
    ) {
      effectiveSegments.push({ text: seg.text, language: 'neutral' });
    } else {
      effectiveSegments.push(seg);
    }
  }

  var hasColor = false;
  for (var s = 0; s < effectiveSegments.length; s++) {
    if (effectiveSegments[s].language !== 'neutral') {
      hasColor = true;
      break;
    }
  }
  if (!hasColor) return;

  var fragment = document.createDocumentFragment();
  for (var s = 0; s < effectiveSegments.length; s++) {
    var seg = effectiveSegments[s];
    if (seg.language === 'neutral') {
      fragment.appendChild(document.createTextNode(seg.text));
    } else {
      var span = document.createElement('span');
      span.className = 'lingua-tint-span';
      span.setAttribute('data-lingua-lang', seg.language);
      span.style.color = seg.language === 'german' ? settings.germanColor : settings.spanishColor;
      span.textContent = seg.text;
      fragment.appendChild(span);
    }
  }

  parent.replaceChild(fragment, textNode);
  parent.setAttribute('data-lingua-processed', 'true');
}

function wordLevelSegments(text) {
  var parts = text.match(/\S+\s*/g);
  if (!parts || parts.length === 0) {
    return [{ text: text, language: 'neutral' }];
  }

  var wordTokens = parts.filter(function (p) {
    return /[a-zA-ZáéíóúüñÁÉÍÓÚÜÑäöüßÄÖÜ]/.test(p);
  });
  if (wordTokens.length === 0) {
    return [{ text: text, language: 'neutral' }];
  }

  var tokenLangs = wordTokens.map(function (token, i) {
    var start = Math.max(0, i - 2);
    var end = Math.min(wordTokens.length, i + 3);
    var windowText = wordTokens.slice(start, end).join('');
    return { text: token, lang: detectLanguage(windowText) };
  });

  var wordIdx = 0;
  var partLangs = parts.map(function (part) {
    if (/[a-zA-ZáéíóúüñÁÉÍÓÚÜÑäöüßÄÖÜ]/.test(part)) {
      var result = tokenLangs[wordIdx];
      wordIdx++;
      return { text: part, lang: result.lang };
    }
    return { text: part, lang: 'neutral' };
  });

  var groups = [];
  var currentLang = partLangs[0]?.lang || 'neutral';
  var currentText = '';

  for (var i = 0; i < partLangs.length; i++) {
    if (partLangs[i].lang === currentLang) {
      currentText += partLangs[i].text;
    } else {
      groups.push({ text: currentText, language: currentLang });
      currentLang = partLangs[i].lang;
      currentText = partLangs[i].text;
    }
  }
  if (currentText) {
    groups.push({ text: currentText, language: currentLang });
  }

  return groups.map(function (g) {
    var wordCount = g.text.trim().split(/\s+/).length;
    if (g.language !== 'neutral' && wordCount < 3) {
      return { text: g.text, language: 'neutral' };
    }
    return g;
  });
}

function splitSentences(text) {
  var result = [];
  var parts = text.match(/[^.!?\n]+[.!?]*(\s+|$)/g);
  if (!parts || parts.length === 0) {
    return [text];
  }
  for (var i = 0; i < parts.length; i++) {
    var s = parts[i];
    if (/^[\s.,;:!?]+$/.test(s.trim())) continue;
    result.push(s);
  }
  return result.length > 0 ? result : [text];
}

function sentenceLevelSegments(text) {
  var sentences = splitSentences(text);
  if (sentences.length <= 1) {
    return wordLevelSegments(text);
  }

  var result = [];
  for (var i = 0; i < sentences.length; i++) {
    var sentence = sentences[i];
    if (sentence.trim().length < 3) {
      result.push({ text: sentence, language: 'neutral' });
      continue;
    }

    var scores = scoreLanguage(sentence);
    var total = scores.german + scores.spanish;

    if (total >= 3) {
      var ratio = Math.max(scores.german, scores.spanish) / total;
      var lang = scores.german > scores.spanish ? 'german' : 'spanish';

      if (ratio >= 0.7 && scores[lang] >= 3) {
        result.push({ text: sentence, language: lang });
        continue;
      }
    }

    var sub = wordLevelSegments(sentence);
    for (var j = 0; j < sub.length; j++) {
      result.push(sub[j]);
    }
  }

  return result;
}

function processNode(node) {
  if (!shouldProcess()) return;

  if (node.nodeType === Node.TEXT_NODE) {
    processTextNode(node);
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    if (node.classList && node.classList.contains('lingua-tint-span')) return;
    if (node.getAttribute && node.getAttribute('data-lingua-processed') === 'true') return;
    if (isSkippedAncestor(node)) return;

    node.normalize();

    const walker = document.createTreeWalker(
      node,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (n) {
          const p = n.parentElement;
          if (!p) return NodeFilter.FILTER_REJECT;
          if (p.getAttribute('data-lingua-processed') === 'true') return NodeFilter.FILTER_REJECT;
          if (isSkippedAncestor(p)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    const textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    for (const tn of textNodes) {
      processTextNode(tn);
    }

    node.setAttribute('data-lingua-processed', 'true');
  }
}

function restoreDocument() {
  const spans = document.querySelectorAll('.lingua-tint-span');
  for (const span of spans) {
    const text = document.createTextNode(span.textContent);
    span.parentNode.replaceChild(text, span);
  }

  const processed = document.querySelectorAll('[data-lingua-processed]');
  for (const el of processed) {
    el.removeAttribute('data-lingua-processed');
  }
}

function processDocument() {
  processNode(document.body);
}

function isCosmetic(key) {
  return key === 'germanColor' || key === 'spanishColor';
}

function updateColors() {
  var spans = document.querySelectorAll('.lingua-tint-span');
  for (var i = 0; i < spans.length; i++) {
    var span = spans[i];
    var lang = span.getAttribute('data-lingua-lang');
    if (lang === 'german') span.style.color = settings.germanColor;
    else if (lang === 'spanish') span.style.color = settings.spanishColor;
  }
}

function applySettings(changedKeys) {
  if (!shouldProcess()) {
    restoreDocument();
    return;
  }

  if (changedKeys && changedKeys.length > 0 && changedKeys.every(isCosmetic)) {
    updateColors();
    return;
  }

  restoreDocument();
  processDocument();
}

var pendingNodes = [];
var pendingChars = [];
var observerTimer = null;
var observer = null;

function flushObserver() {
  observerTimer = null;
  if (!shouldProcess()) {
    pendingNodes = [];
    pendingChars = [];
    return;
  }

  for (var i = 0; i < pendingNodes.length; i++) {
    var node = pendingNodes[i];
    if (node.nodeType === Node.ELEMENT_NODE && node.getAttribute && node.getAttribute('data-lingua-processed') === 'true') continue;
    if (node.nodeType === Node.TEXT_NODE && node.parentElement && node.parentElement.getAttribute('data-lingua-processed') === 'true') continue;
    processNode(node);
  }

  for (var i = 0; i < pendingChars.length; i++) {
    var entry = pendingChars[i];
    var p = entry.parent;
    if (p && p.getAttribute('data-lingua-processed') === 'true') {
      p.removeAttribute('data-lingua-processed');
    }
    processTextNode(entry.node);
  }

  pendingNodes = [];
  pendingChars = [];
}

function startObserver() {
  if (observer) observer.disconnect();

  observer = new MutationObserver(function (mutations) {
    for (var m = 0; m < mutations.length; m++) {
      var mutation = mutations[m];
      for (var n = 0; n < mutation.addedNodes.length; n++) {
        pendingNodes.push(mutation.addedNodes[n]);
      }
      if (mutation.type === 'characterData') {
        pendingChars.push({
          node: mutation.target,
          parent: mutation.target.parentElement,
        });
      }
    }

    if (!observerTimer) {
      observerTimer = setTimeout(flushObserver, 30);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

function init() {
  chrome.storage.sync.get(DEFAULTS, function (saved) {
    settings = Object.assign({}, DEFAULTS, saved);
    applySettings();
    startObserver();
  });

  chrome.storage.onChanged.addListener(function (changes) {
    var keys = Object.keys(changes);
    for (var i = 0; i < keys.length; i++) {
      settings[keys[i]] = changes[keys[i]].newValue;
    }
    applySettings(keys);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
