// DEFAULTS loaded from ../content/defaults.js via popup.html script tag

const $ = function (id) {
  return document.getElementById(id);
};

var germanVoices = [];
var popupSpeech = null;
var voiceExplanationOpen = false;

function loadSettings() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(DEFAULTS, render);
  }
}

function render(settings) {
  $('enabled').checked = settings.enabled;
  $('germanEnabled').checked = settings.germanEnabled;
  $('spanishEnabled').checked = settings.spanishEnabled;
  var modeRadio = document.querySelector(
    'input[name="siteMode"][value="' + settings.siteMode + '"]'
  );
  if (modeRadio) modeRadio.checked = true;
  $('germanColor').value = settings.germanColor;
  $('spanishColor').value = settings.spanishColor;
  $('translationEnabled').checked = settings.translationEnabled;
  $('pronunciationEnabled').checked = settings.pronunciationEnabled;
  var rateRadio = document.querySelector('input[name="pronRate"][value="' + settings.pronunciationRate + '"]');
  if (rateRadio) rateRadio.checked = true;
  populateVoiceSelect(settings.pronunciationVoiceURI);
  updatePronOptions(settings);
  updatePreview(settings);
}

function updatePronOptions(settings) {
  var opts = $('pronunciationOptions');
  if (!opts) return;
  if (settings.pronunciationEnabled) {
    opts.style.display = 'block';
  } else {
    opts.style.display = 'none';
    return;
  }
  var hasVoice = germanVoices.length > 0;
  var noVoiceEl = $('voiceNoVoice');
  var controlsEl = $('voiceControls');
  if (noVoiceEl) noVoiceEl.style.display = hasVoice ? 'none' : 'flex';
  if (controlsEl) controlsEl.style.display = hasVoice ? 'block' : 'none';
}

function populateVoiceSelect(preferredURI) {
  var sel = $('pronunciationVoice');
  if (!sel) return;
  if (germanVoices.length === 0) {
    sel.innerHTML = '<option value="">' + t('noVoices') + '</option>';
    sel.disabled = true;
    return;
  }
  sel.disabled = false;
  sel.innerHTML = '';
  var found = false;
  for (var i = 0; i < germanVoices.length; i++) {
    var v = germanVoices[i];
    var opt = document.createElement('option');
    opt.value = v.voiceURI;
    opt.textContent = v.name + ' (' + v.lang + ')';
    if (v.voiceURI === preferredURI) { opt.selected = true; found = true; }
    sel.appendChild(opt);
  }
  if (!found && preferredURI) {
    sel.innerHTML = '<option value="' + preferredURI + '" selected>' + preferredURI + '</option>' + sel.innerHTML;
  }
}

function refreshGermanVoices() {
  var allVoices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
  germanVoices = [];
  for (var i = 0; i < allVoices.length; i++) {
    var v = allVoices[i];
    if (v.lang && v.lang.toLowerCase().startsWith('de') && v.localService === true) {
      germanVoices.push(v);
    }
  }
  chrome.storage.sync.get(DEFAULTS, function (settings) {
    populateVoiceSelect(settings.pronunciationVoiceURI);
    updatePronOptions(settings);
  });
}

function saveSetting(key, value) {
  var obj = {};
  obj[key] = value;
  chrome.storage.sync.set(obj);
}

function updatePreview(settings) {
  var de = document.querySelector('.preview-de');
  var es = document.querySelector('.preview-es');
  if (de) {
    de.style.color = settings.germanEnabled ? settings.germanColor : 'inherit';
    de.style.opacity = settings.germanEnabled ? '1' : '0.3';
  }
  if (es) {
    es.style.color = settings.spanishEnabled ? settings.spanishColor : 'inherit';
    es.style.opacity = settings.spanishEnabled ? '1' : '0.3';
  }
}

function applyLanguage(lang) {
  UI_LANGUAGE = lang || 'en';

  var els = document.querySelectorAll('[data-i18n]');
  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    var key = el.getAttribute('data-i18n');
    var translation = t(key);
    if (el.tagName === 'INPUT' && el.type === 'radio') {
      var label = el.parentElement;
      if (label) {
        var span = label.querySelector('span');
        if (span) span.textContent = translation;
      }
    } else if (el.tagName === 'OPTION') {
      el.textContent = translation;
    } else {
      el.innerHTML = translation;
    }
  }

  var btnEn = $('langEn');
  var btnEs = $('langEs');
  if (btnEn) {
    btnEn.setAttribute('aria-label', t('english'));
    btnEn.setAttribute('title', t('english'));
    btnEn.classList.toggle('active', lang === 'en');
  }
  if (btnEs) {
    btnEs.setAttribute('aria-label', t('spanishLang'));
    btnEs.setAttribute('title', t('spanishLang'));
    btnEs.classList.toggle('active', lang === 'es');
  }

  updateDynamicUI();
}

function updateDynamicUI() {
  var sel = $('pronunciationVoice');
  if (sel && sel.options.length === 1 && sel.options[0].value === '') {
    sel.options[0].textContent = t('noVoices');
  }
  updateTranslationDisplay();
  var voiceExpl = $('voiceExplanation');
  if (voiceExpl && voiceExpl.getAttribute('data-i18n')) {
    voiceExpl.innerHTML = t(voiceExpl.getAttribute('data-i18n'));
  }
}

function updateTranslationDisplay() {
  // Called by applyLanguage to refresh the current translation state text
  var icon = $('translationIcon');
  var title = $('translationTitle');
  var action = $('translationAction');
  if (!icon || !title || !action) return;

  var state = getCurrentTranslationState();
  if (state === 'available' && title) {
    title.textContent = '\u2713 ' + t('ready');
    title.style.color = '#16a34a';
    icon.style.display = 'none';
  } else if (state === 'downloadable') {
    title.textContent = t('modelRequired');
    action.textContent = t('download');
  } else if (state === 'downloading') {
    updateDownloadingLabel();
  } else if (state === 'error') {
    title.textContent = t('downloadFailed');
    action.textContent = t('retry');
  } else if (state === 'unsupported') {
    title.textContent = t('notSupported');
  } else if (state === 'checking') {
    title.textContent = t('checkingModel');
  }
}

var _translationState = '';

function getCurrentTranslationState() {
  return _translationState;
}

$('enabled').addEventListener('change', function (e) {
  saveSetting('enabled', e.target.checked);
});

$('germanEnabled').addEventListener('change', function (e) {
  saveSetting('germanEnabled', e.target.checked);
  var de = document.querySelector('.preview-de');
  if (de) {
    de.style.opacity = e.target.checked ? '1' : '0.3';
  }
});

$('spanishEnabled').addEventListener('change', function (e) {
  saveSetting('spanishEnabled', e.target.checked);
  var es = document.querySelector('.preview-es');
  if (es) {
    es.style.opacity = e.target.checked ? '1' : '0.3';
  }
});

var modeRadios = document.querySelectorAll('input[name="siteMode"]');
for (var i = 0; i < modeRadios.length; i++) {
  modeRadios[i].addEventListener('change', function (e) {
    if (e.target.checked) {
      saveSetting('siteMode', e.target.value);
    }
  });
}

var debounceDE = null;
var debounceES = null;

$('germanColor').addEventListener('input', function (e) {
  var de = document.querySelector('.preview-de');
  if (de) de.style.color = e.target.value;
  clearTimeout(debounceDE);
  debounceDE = setTimeout(function () {
    saveSetting('germanColor', e.target.value);
  }, 200);
});

$('spanishColor').addEventListener('input', function (e) {
  var es = document.querySelector('.preview-es');
  if (es) es.style.color = e.target.value;
  clearTimeout(debounceES);
  debounceES = setTimeout(function () {
    saveSetting('spanishColor', e.target.value);
  }, 200);
});

$('translationEnabled').addEventListener('change', function (e) {
  saveSetting('translationEnabled', e.target.checked);
});

$('pronunciationEnabled').addEventListener('change', function (e) {
  saveSetting('pronunciationEnabled', e.target.checked);
  updatePronOptions({ pronunciationEnabled: e.target.checked });
});

$('pronunciationVoice').addEventListener('change', function (e) {
  saveSetting('pronunciationVoiceURI', e.target.value);
});

var rateRadios = document.querySelectorAll('input[name="pronRate"]');
for (var i = 0; i < rateRadios.length; i++) {
  rateRadios[i].addEventListener('change', function (e) {
    if (e.target.checked) {
      saveSetting('pronunciationRate', parseFloat(e.target.value));
    }
  });
}

$('pronunciationTest').addEventListener('click', function () {
  var prefVoice = $('pronunciationVoice').value;
  var prefRate = parseFloat(document.querySelector('input[name="pronRate"]:checked').value || '0.8');
  var selected = null;
  for (var i = 0; i < germanVoices.length; i++) {
    if (germanVoices[i].voiceURI === prefVoice) { selected = germanVoices[i]; break; }
  }
  if (!selected) return;
  if (popupSpeech) window.speechSynthesis.cancel();
  var utterance = new SpeechSynthesisUtterance('Freundschaft');
  utterance.voice = selected;
  utterance.lang = selected.lang || 'de-DE';
  utterance.rate = prefRate;
  utterance.pitch = 1;
  utterance.volume = 1;
  popupSpeech = utterance;
  window.speechSynthesis.speak(utterance);
});

$('voiceHelpLink').addEventListener('click', function () {
  voiceExplanationOpen = !voiceExplanationOpen;
  var expl = $('voiceExplanation');
  if (expl) {
    expl.style.display = voiceExplanationOpen ? 'block' : 'none';
  }
});

// Translation model management
var translationDownloading = false;

function setTranslationState(state, pct) {
  _translationState = state;
  var icon = $('translationIcon');
  var title = $('translationTitle');
  var detail = $('translationDetail');
  var progress = $('translationProgress');
  var fill = $('translationProgressFill');
  var actionRow = $('translationActionRow');
  var action = $('translationAction');

  if (!icon || !title || !detail || !progress || !fill || !actionRow || !action) return;

  progress.style.display = 'none';
  actionRow.style.display = 'none';
  icon.style.color = '';
  icon.style.display = '';
  title.style.color = '';

  switch (state) {
    case 'checking':
      icon.textContent = '\u23F3';
      title.textContent = t('checkingModel');
      detail.textContent = '';
      break;
    case 'downloadable':
      icon.textContent = '\u21E9';
      title.textContent = t('modelRequired');
      detail.textContent = '';
      actionRow.style.display = 'block';
      action.textContent = t('download');
      action.disabled = false;
      break;
    case 'downloading':
      icon.textContent = '\u23F3';
      title.textContent = pct !== undefined ? t('downloadingModel') + ' ' + pct + '%' : t('downloadingModel');
      detail.textContent = pct !== undefined ? pct + '%' : '';
      progress.style.display = 'block';
      fill.style.width = (pct !== undefined ? pct : 0) + '%';
      actionRow.style.display = 'block';
      action.textContent = t('downloading');
      action.disabled = true;
      break;
    case 'available':
      icon.textContent = '\u2713';
      icon.style.color = '#16a34a';
      icon.style.display = 'none';
      title.textContent = '\u2713 ' + t('ready');
      title.style.color = '#16a34a';
      detail.textContent = '';
      break;
    case 'error':
      icon.textContent = '\u2717';
      icon.style.color = '#dc2626';
      title.textContent = t('downloadFailed');
      detail.textContent = '';
      actionRow.style.display = 'block';
      action.textContent = t('retry');
      action.disabled = false;
      break;
    case 'unsupported':
      icon.textContent = '\u2717';
      icon.style.color = '#9ca3af';
      title.textContent = t('notSupported');
      detail.textContent = '';
      break;
    default:
      icon.textContent = '';
      title.textContent = '';
      detail.textContent = '';
  }
}

function updateDownloadingLabel() {
  // Re-apply the downloading state text for language switch
  var title = $('translationTitle');
  var detail = $('translationDetail');
  if (title && detail) {
    var pct = detail.textContent.replace('%', '');
    if (pct && !isNaN(pct)) {
      title.textContent = t('downloadingModel') + ' ' + pct + '%';
    } else {
      title.textContent = t('downloadingModel');
    }
  }
}

function checkTranslationAvailability() {
  if (typeof Translator === 'undefined') {
    setTranslationState('unsupported');
    return;
  }
  setTranslationState('checking');
  Translator.create({
    sourceLanguage: 'de',
    targetLanguage: 'es'
  }).then(function () {
    setTranslationState('available');
  }).catch(function () {
    setTranslationState('downloadable');
  });
}

function startModelDownload() {
  if (translationDownloading) return;
  translationDownloading = true;
  setTranslationState('downloading', 0);

  Translator.create({
    sourceLanguage: 'de',
    targetLanguage: 'es',
    monitor: function (m) {
      m.addEventListener('downloadprogress', function (e) {
        var pct = Math.round(e.loaded * 100 / e.total);
        setTranslationState('downloading', pct);
      });
    }
  }).then(function () {
    translationDownloading = false;
    setTranslationState('available');
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ translationConsented: true });
    }
  }).catch(function () {
    translationDownloading = false;
    setTranslationState('error');
  });
}

$('translationAction').addEventListener('click', function () {
  startModelDownload();
});

// Language switching
$('langEn').addEventListener('click', function () {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.set({ uiLanguage: 'en' });
  }
  applyLanguage('en');
});

$('langEs').addEventListener('click', function () {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.set({ uiLanguage: 'es' });
  }
  applyLanguage('es');
});

if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener(function () {
    chrome.storage.sync.get(DEFAULTS, render);
  });
}

if (window.speechSynthesis) {
  var voicesLoaded = window.speechSynthesis.getVoices();
  if (voicesLoaded.length > 0) {
    refreshGermanVoices();
  }
  window.speechSynthesis.addEventListener('voiceschanged', refreshGermanVoices);
}

// Load saved language preference
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
  chrome.storage.sync.get('uiLanguage', function (result) {
    var lang = result && result.uiLanguage ? result.uiLanguage : 'en';
    applyLanguage(lang);
  });
} else {
  applyLanguage('en');
}

checkTranslationAvailability();
updatePronOptions({ pronunciationEnabled: $('pronunciationEnabled') ? $('pronunciationEnabled').checked : true });
loadSettings();
