const DEFAULTS = {
  enabled: true,
  siteMode: 'notebooklm',
  germanColor: '#2563eb',
  spanishColor: '#16a34a',
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

  const expandedSegments = [];
  for (const seg of rawSegments) {
    if (seg.language === 'spanish') {
      expandedSegments.push(seg);
    } else {
      expandedSegments.push(...wordLevelSegments(seg.text));
    }
  }

  const hasColor = expandedSegments.some(s => s.language !== 'neutral');
  if (!hasColor) return;

  const fragment = document.createDocumentFragment();
  for (const seg of expandedSegments) {
    if (seg.language === 'neutral') {
      fragment.appendChild(document.createTextNode(seg.text));
    } else {
      const span = document.createElement('span');
      span.className = 'lingua-tint-span';
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

function processNode(node) {
  if (!shouldProcess()) return;

  if (node.nodeType === Node.TEXT_NODE) {
    processTextNode(node);
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    if (node.classList && node.classList.contains('lingua-tint-span')) return;
    if (node.getAttribute && node.getAttribute('data-lingua-processed') === 'true') return;
    if (isSkippedAncestor(node)) return;

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

function applySettings() {
  if (shouldProcess()) {
    processDocument();
  } else {
    restoreDocument();
  }
}

let observer = null;

function startObserver() {
  if (observer) observer.disconnect();

  observer = new MutationObserver(function (mutations) {
    if (!shouldProcess()) return;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        processNode(node);
      }
      if (mutation.type === 'characterData') {
        const p = mutation.target.parentElement;
        if (p && p.getAttribute('data-lingua-processed') === 'true') {
          p.removeAttribute('data-lingua-processed');
        }
        processTextNode(mutation.target);
      }
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
    for (const key in changes) {
      settings[key] = changes[key].newValue;
    }
    applySettings();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
