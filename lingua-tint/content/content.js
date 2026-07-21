// DEFAULTS loaded from content/defaults.js via manifest.json

let settings = { ...DEFAULTS };

function isSkippedAncestor(el) {
  while (el) {
    const tag = el.tagName && el.tagName.toUpperCase();
    if (['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'CODE', 'PRE', 'MAT-ICON', 'BUTTON'].includes(tag)) return true;
    if (el.isContentEditable) return true;
    if (el.classList && Array.from(el.classList).some(c => c.toLowerCase().includes('code'))) return true;
    el = el.parentElement;
  }
  return false;
}

function isInsideNotebookLMChat(el) {
  if (!location.hostname.includes('notebooklm.google.com')) return true;

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
  if (settings.siteMode === 'notebooklm' && !location.hostname.includes('notebooklm.google.com')) return false;
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
  if (parent.classList.contains('lingua-tint-span')) return;
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
    if (node.classList && node.classList.contains('lingua-tint-span')) return;
    if (isSkippedAncestor(node)) return;
    if (location.hostname.includes('notebooklm.google.com')) {
      if (!isInsideNotebookLMChat(node) && !node.querySelector('chat-panel, .chat-panel, .chat-panel-content, chat-message')) {
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
          if (p.classList && p.classList.contains('lingua-tint-span')) return NodeFilter.FILTER_REJECT;
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
  const spans = root.querySelectorAll('.lingua-tint-span');
  for (let i = 0; i < spans.length; i++) {
    const span = spans[i];
    const lang = span.getAttribute('data-lingua-lang');
    if (!lang || lang === 'neutral') continue;

    let targetTextNode = null;
    let curr = span;

    if (curr.nextSibling && curr.nextSibling.nodeType === Node.TEXT_NODE) {
      targetTextNode = curr.nextSibling;
    } else {
      let parent = curr.parentElement;
      while (parent && parent !== root && parent !== document.body && ['B', 'I', 'STRONG', 'EM', 'SPAN', 'MARK'].includes(parent.tagName)) {
        if (parent.nextSibling && parent.nextSibling.nodeType === Node.TEXT_NODE) {
          targetTextNode = parent.nextSibling;
          break;
        }
        if (parent.nextSibling) break;
        parent = parent.parentElement;
      }
    }

    if (!targetTextNode) continue;

    const text = targetTextNode.textContent;
    if (/^\s/.test(text)) continue;

    const match = text.match(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑäöüßÄÖÜ]+/);
    if (!match) continue;

    const suffix = match[0];
    if (suffix.length > 4) continue;

    span.textContent += suffix;
    targetTextNode.textContent = text.slice(suffix.length);
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
  if (location.hostname.includes('notebooklm.google.com')) {
    const chatPanels = document.querySelectorAll('chat-panel, .chat-panel, .chat-panel-content, chat-message');
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
var isFlushing = false;

function flushObserver() {
  observerTimer = null;
  if (!shouldProcess()) {
    pendingNodes = [];
    pendingChars = [];
    return;
  }

  // Pause observer while mutating the DOM to prevent feedback loops/freezes
  if (observer) observer.disconnect();
  isFlushing = true;

  try {
    var nodesToProcess = pendingNodes;
    var charsToProcess = pendingChars;
    pendingNodes = [];
    pendingChars = [];

    for (var i = 0; i < nodesToProcess.length; i++) {
      var node = nodesToProcess[i];
      if (!node || !node.parentElement) continue;
      if (node.nodeType === Node.ELEMENT_NODE && (node.classList.contains('lingua-tint-span') || node.getAttribute('data-lingua-processed') === 'true')) continue;
      if (node.nodeType === Node.TEXT_NODE && node.parentElement.classList && node.parentElement.classList.contains('lingua-tint-span')) continue;
      processNode(node);
    }

    for (var i = 0; i < charsToProcess.length; i++) {
      var entry = charsToProcess[i];
      var p = entry.parent;
      if (p && p.classList && !p.classList.contains('lingua-tint-span')) {
        processTextNode(entry.node);
      }
    }

    stitchSuffixSpans(document.body);
  } finally {
    isFlushing = false;
    startObserver();
  }
}

function startObserver() {
  if (observer) observer.disconnect();

  observer = new MutationObserver(function (mutations) {
    if (isFlushing) return;

    for (var m = 0; m < mutations.length; m++) {
      var mutation = mutations[m];
      for (var n = 0; n < mutation.addedNodes.length; n++) {
        var added = mutation.addedNodes[n];
        if (added.nodeType === Node.ELEMENT_NODE && added.classList && added.classList.contains('lingua-tint-span')) continue;
        if (added.nodeType === Node.TEXT_NODE && added.parentElement && added.parentElement.classList && added.parentElement.classList.contains('lingua-tint-span')) continue;
        if (location.hostname.includes('notebooklm.google.com')) {
          const parent = added.nodeType === Node.TEXT_NODE ? added.parentElement : added;
          if (parent && !isInsideNotebookLMChat(parent) && !(added.nodeType === Node.ELEMENT_NODE && added.querySelector && added.querySelector('chat-panel, .chat-panel, .chat-panel-content, chat-message'))) {
            continue;
          }
        }
        pendingNodes.push(added);
      }
      if (mutation.type === 'characterData') {
        var p = mutation.target.parentElement;
        if (p && p.classList && !p.classList.contains('lingua-tint-span')) {
          if (location.hostname.includes('notebooklm.google.com') && !isInsideNotebookLMChat(p)) {
            continue;
          }
          pendingChars.push({
            node: mutation.target,
            parent: p,
          });
        }
      }
    }

    if (!observerTimer && (pendingNodes.length > 0 || pendingChars.length > 0)) {
      observerTimer = setTimeout(flushObserver, 50);
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
