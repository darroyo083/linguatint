// DEFAULTS loaded from content/defaults.js via manifest.json

let settings = { ...DEFAULTS };

const NOTEBOOKLM_HOST = 'notebooklm.google.com';
const NOTEBOOKLM_SELECTOR = 'chat-panel, chat-message, chat-message-pair, chat-panel-header, .chat-panel, .chat-panel-content, .chat-message, .chat-history';
const OWNED_SELECTOR = '[data-lingua-tint-owned="true"]';

function isNotebookLM() {
  return location.hostname === NOTEBOOKLM_HOST;
}

function isSkippedAncestor(el) {
  while (el) {
    const tag = el.tagName && el.tagName.toUpperCase();
    if (['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'CODE', 'PRE', 'MAT-ICON', 'BUTTON', 'SVG', 'MATH'].includes(tag)) return true;
    if (el.isContentEditable) return true;
    if (el.classList && Array.from(el.classList).some(c => /(^|[-_])(code|katex)([-_]|$)/i.test(c))) return true;
    el = el.parentElement;
  }
  return false;
}

function isInsideNotebookLMChat(el) {
  if (!isNotebookLM()) return true;

  let current = el;
  while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body) {
    const tag = current.tagName.toUpperCase();
    if (
      tag === 'CHAT-PANEL' ||
      tag === 'CHAT-MESSAGE' ||
      tag === 'CHAT-MESSAGE-PAIR' ||
      tag === 'CHAT-PANEL-HEADER'
    ) {
      return true;
    }
    if (current.classList) {
      for (let i = 0; i < current.classList.length; i++) {
        const cls = current.classList[i].toLowerCase();
        if (
          cls === 'chat-panel' ||
          cls === 'chat-panel-content' ||
          cls.includes('chat-message') ||
          cls === 'chat-history'
        ) {
          return true;
        }
      }
    }
    current = current.parentElement;
  }
  return false;
}

function shouldProcess() {
  if (!settings.enabled) return false;
  if (settings.siteMode === 'notebooklm' && !isNotebookLM()) return false;
  return true;
}

function getBlockAncestor(el) {
  const BLOCK_TAGS = new Set([
    'P', 'DIV', 'LI', 'BLOCKQUOTE', 'ARTICLE', 'SECTION', 'HEADER', 'FOOTER',
    'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'TD', 'TH', 'MAIN'
  ]);
  let current = el;
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    if (BLOCK_TAGS.has(current.tagName)) return current;
    current = current.parentElement;
  }
  return null;
}

function processTextNode(textNode) {
  const text = textNode.textContent;
  const trimmed = text.trim();
  if (trimmed.length < 2) return;
  if (/^[\d\s.,;:!?¡¿()\-_]+$/.test(trimmed)) return;

  const parent = textNode.parentElement;
  if (!parent) return;
  if (parent.matches(OWNED_SELECTOR)) return;
  if (isSkippedAncestor(parent)) return;
  if (!isInsideNotebookLMChat(parent)) return;

  const blockEl = getBlockAncestor(parent);
  const contextText = blockEl ? blockEl.textContent : null;

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
    var parenLang = detectLanguage(match[0], contextText);
    rawSegments.push({
      text: match[0],
      language: parenLang === 'neutral' ? null : parenLang,
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
      var subs = sentenceLevelSegments(rawSegments[s].text, contextText);
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
      span.setAttribute('data-lingua-tint-owned', 'true');
      span.setAttribute('data-lingua-lang', seg.language);
      span.style.color = seg.language === 'german' ? settings.germanColor : settings.spanishColor;
      span.textContent = seg.text;
      fragment.appendChild(span);
    }
  }

  parent.replaceChild(fragment, textNode);
}

// wordLevelSegments, splitSentences, and sentenceLevelSegments
// are now in language-detector.js (loaded first via manifest.json)

function processNode(node) {
  if (!shouldProcess()) return;

  if (node.nodeType === Node.TEXT_NODE) {
    processTextNode(node);
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    if (node.matches && node.matches(OWNED_SELECTOR)) return;
    if (isSkippedAncestor(node)) return;
    if (isNotebookLM()) {
      if (!isInsideNotebookLMChat(node) && !node.querySelector(NOTEBOOKLM_SELECTOR)) {
        return;
      }
    }

    node.normalize();

    const walker = document.createTreeWalker(
      node,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (n) {
          const p = n.parentElement;
          if (!p) return NodeFilter.FILTER_REJECT;
          if (p.matches && p.matches(OWNED_SELECTOR)) return NodeFilter.FILTER_REJECT;
          if (isSkippedAncestor(p)) return NodeFilter.FILTER_REJECT;
          if (!isInsideNotebookLMChat(p)) return NodeFilter.FILTER_REJECT;
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

    stitchSuffixSpans(node);
  }
}

function stitchSuffixSpans(container) {
  const root = container || document.body;
  if (!root) return;

  const spans = root.querySelectorAll(OWNED_SELECTOR + '[data-lingua-lang]');
  for (let i = 0; i < spans.length; i++) {
    const span = spans[i];
    const lang = span.getAttribute('data-lingua-lang');
    if (!lang || lang === 'neutral') continue;

    const color = span.style.color;

    let outer = span;
    while (
      outer.parentElement &&
      outer.parentElement !== root &&
      outer.parentElement !== document.body &&
      ['B', 'I', 'STRONG', 'EM', 'SPAN', 'MARK', 'SMALL'].includes(outer.parentElement.tagName) &&
      !outer.parentElement.matches(OWNED_SELECTOR)
    ) {
      if (outer.parentElement.nextSibling) {
        outer = outer.parentElement;
        break;
      }
      outer = outer.parentElement;
    }

    let next = outer.nextSibling;
    while (next) {
      if (next.nodeType === 8 || next.nodeType === 7) {
        next = next.nextSibling;
        continue;
      }
      if (next.nodeType === Node.TEXT_NODE) {
        const text = next.textContent;
        if (/^\s/.test(text)) break;

        const match = text.match(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑäöüßÄÖÜ]+/);
        if (!match) break;

        const suffix = match[0];
        if (suffix.length > 5) break;

        const suffixSpan = document.createElement('span');
        suffixSpan.className = 'lingua-tint-span';
        suffixSpan.setAttribute('data-lingua-tint-owned', 'true');
        suffixSpan.setAttribute('data-lingua-lang', lang);
        suffixSpan.style.color = color;
        suffixSpan.textContent = suffix;
        next.parentNode.insertBefore(suffixSpan, next);
        next.textContent = text.slice(suffix.length);
        break;
      } else if (next.nodeType === Node.ELEMENT_NODE) {
        const tag = next.tagName ? next.tagName.toUpperCase() : '';
        if (!['B', 'I', 'STRONG', 'EM', 'SPAN', 'MARK', 'SMALL', 'SUB', 'SUP'].includes(tag)) break;
        if (next.matches && next.matches(OWNED_SELECTOR)) break;

        const elText = next.textContent;
        if (/^\s/.test(elText) || /\s$/.test(elText.trim())) break;

        const trimmed = elText.trim();
        if (trimmed.length === 0 || trimmed.length > 5) break;
        if (!/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑäöüßÄÖÜ]+$/.test(trimmed)) break;

        const textNodes = [];
        const walker = document.createTreeWalker(next, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) textNodes.push(walker.currentNode);
        for (let j = 0; j < textNodes.length; j++) {
          const textNode = textNodes[j];
          const wrapper = document.createElement('span');
          wrapper.className = 'lingua-tint-span';
          wrapper.setAttribute('data-lingua-tint-owned', 'true');
          wrapper.setAttribute('data-lingua-lang', lang);
          wrapper.style.color = color;
          wrapper.textContent = textNode.textContent;
          textNode.parentNode.replaceChild(wrapper, textNode);
        }
        next = next.nextSibling;
      } else {
        break;
      }
    }
  }
}

function restoreDocument() {
  const spans = document.querySelectorAll(OWNED_SELECTOR);
  for (const span of spans) {
    const parent = span.parentNode;
    if (!parent) continue;
    while (span.firstChild) parent.insertBefore(span.firstChild, span);
    parent.removeChild(span);
    parent.normalize();
  }

  const processed = document.querySelectorAll('[data-lingua-processed]');
  for (const el of processed) {
    el.removeAttribute('data-lingua-processed');
  }
}

function processDocument() {
  if (isNotebookLM()) {
    const chatPanels = document.querySelectorAll(NOTEBOOKLM_SELECTOR);
    if (chatPanels.length > 0) {
      for (let i = 0; i < chatPanels.length; i++) {
        processNode(chatPanels[i]);
      }
      stitchSuffixSpans(document.body);
      return;
    }
  }
  processNode(document.body);
  stitchSuffixSpans(document.body);
}

function isCosmetic(key) {
  return key === 'germanColor' || key === 'spanishColor';
}

function updateColors() {
  var spans = document.querySelectorAll(OWNED_SELECTOR + '[data-lingua-lang]');
  for (var i = 0; i < spans.length; i++) {
    var span = spans[i];
    var lang = span.getAttribute('data-lingua-lang');
    if (lang === 'german') span.style.color = settings.germanColor;
    else if (lang === 'spanish') span.style.color = settings.spanishColor;
  }
}

function applySettings(changedKeys) {
  if (!shouldProcess()) {
    stopObserver();
    restoreDocument();
    return;
  }

  if (changedKeys && changedKeys.length > 0 && changedKeys.every(isCosmetic)) {
    updateColors();
    startObserver();
    return;
  }

  stopObserver();
  restoreDocument();
  processDocument();
  startObserver();
}

var pendingNodes = new Set();
var pendingChars = new Set();
var observerTimer = null;
var observer = null;
var isFlushing = false;

function flushObserver() {
  observerTimer = null;
  if (!shouldProcess()) {
    pendingNodes.clear();
    pendingChars.clear();
    return;
  }

  // Pause observer while mutating the DOM to prevent feedback loops/freezes
  if (observer) observer.disconnect();
  isFlushing = true;

  try {
    var nodesToProcess = Array.from(pendingNodes);
    var charsToProcess = Array.from(pendingChars);
    pendingNodes.clear();
    pendingChars.clear();

    for (var i = 0; i < nodesToProcess.length; i++) {
      var node = nodesToProcess[i];
      if (!node || !node.parentElement) continue;
      if (node.nodeType === Node.ELEMENT_NODE && node.matches(OWNED_SELECTOR)) continue;
      if (node.nodeType === Node.TEXT_NODE && node.parentElement.matches(OWNED_SELECTOR)) continue;
      processNode(node);
    }

    for (var i = 0; i < charsToProcess.length; i++) {
      var textNode = charsToProcess[i];
      var p = textNode.parentElement;
      if (p && !p.matches(OWNED_SELECTOR)) {
        processTextNode(textNode);
      }
    }

    for (var i = 0; i < nodesToProcess.length; i++) {
      var root = nodesToProcess[i].nodeType === Node.ELEMENT_NODE ? nodesToProcess[i] : nodesToProcess[i].parentElement;
      if (root && root.isConnected) stitchSuffixSpans(root);
    }
  } finally {
    isFlushing = false;
    startObserver();
  }
}

function startObserver() {
  if (!document.body || !shouldProcess()) return;
  if (observer) observer.disconnect();

  observer = new MutationObserver(function (mutations) {
    if (isFlushing) return;

    for (var m = 0; m < mutations.length; m++) {
      var mutation = mutations[m];
      for (var n = 0; n < mutation.addedNodes.length; n++) {
        var added = mutation.addedNodes[n];
        if (added.nodeType === Node.ELEMENT_NODE && added.matches(OWNED_SELECTOR)) continue;
        if (added.nodeType === Node.TEXT_NODE && added.parentElement && added.parentElement.matches(OWNED_SELECTOR)) continue;
        if (isNotebookLM()) {
          const parent = added.nodeType === Node.TEXT_NODE ? added.parentElement : added;
          if (parent && !isInsideNotebookLMChat(parent) && !(added.nodeType === Node.ELEMENT_NODE && added.querySelector && added.querySelector(NOTEBOOKLM_SELECTOR))) {
            continue;
          }
        }
        pendingNodes.add(added);
      }
      if (mutation.type === 'characterData') {
        var p = mutation.target.parentElement;
        if (p && !p.matches(OWNED_SELECTOR)) {
          if (isNotebookLM() && !isInsideNotebookLMChat(p)) {
            continue;
          }
          pendingChars.add(mutation.target);
        }
      }
    }

    if (!observerTimer && (pendingNodes.size > 0 || pendingChars.size > 0)) {
      observerTimer = setTimeout(flushObserver, 50);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

function stopObserver() {
  if (observer) observer.disconnect();
  if (observerTimer) clearTimeout(observerTimer);
  observerTimer = null;
  pendingNodes.clear();
  pendingChars.clear();
}

function sanitizeSettings(saved) {
  return {
    enabled: typeof saved.enabled === 'boolean' ? saved.enabled : DEFAULTS.enabled,
    siteMode: saved.siteMode === 'all' || saved.siteMode === 'notebooklm' ? saved.siteMode : DEFAULTS.siteMode,
    germanEnabled: typeof saved.germanEnabled === 'boolean' ? saved.germanEnabled : DEFAULTS.germanEnabled,
    spanishEnabled: typeof saved.spanishEnabled === 'boolean' ? saved.spanishEnabled : DEFAULTS.spanishEnabled,
    germanColor: /^#[0-9a-f]{6}$/i.test(saved.germanColor) ? saved.germanColor : DEFAULTS.germanColor,
    spanishColor: /^#[0-9a-f]{6}$/i.test(saved.spanishColor) ? saved.spanishColor : DEFAULTS.spanishColor,
  };
}

function init() {
  chrome.storage.sync.get(DEFAULTS, function (saved) {
    settings = sanitizeSettings(saved);
    applySettings();
  });

  chrome.storage.onChanged.addListener(function (changes) {
    var keys = Object.keys(changes).filter(function (key) { return key in DEFAULTS; });
    if (keys.length === 0) return;
    for (var i = 0; i < keys.length; i++) {
      settings[keys[i]] = changes[keys[i]].newValue;
    }
    settings = sanitizeSettings(settings);
    applySettings(keys);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
