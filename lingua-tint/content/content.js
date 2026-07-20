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
  if (parent.getAttribute('data-lingua-processed') === 'true') return;
  if (isSkippedAncestor(parent)) return;

  const parenRegex = /\([^)]++\)/g;
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
  const parts = text.match(/\S+\s*/g);
  if (!parts || parts.length === 0) {
    return [{ text, language: 'neutral' }];
  }

  const wordLangs = parts.map((part, i) => {
    const clean = part.trim();
    let windowText;
    if (clean.length <= 2) {
      const start = Math.max(0, i - 2);
      const end = Math.min(parts.length, i + 3);
      windowText = parts.slice(start, end).join('');
    } else {
      const end = Math.min(parts.length, i + 5);
      windowText = parts.slice(i, end).join('');
    }
    return { text: part, lang: detectLanguage(windowText) };
  });

  const groups = [];
  let currentLang = wordLangs[0]?.lang || 'neutral';
  let currentText = '';

  for (const w of wordLangs) {
    if (w.lang === currentLang) {
      currentText += w.text;
    } else {
      groups.push({ text: currentText, language: currentLang });
      currentLang = w.lang;
      currentText = w.text;
    }
  }
  if (currentText) {
    groups.push({ text: currentText, language: currentLang });
  }

  return groups.map(g => {
    const wordCount = g.text.trim().split(/\s+/).length;
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
