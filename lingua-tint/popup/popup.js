// DEFAULTS loaded from ../content/defaults.js via popup.html script tag

const $ = function (id) {
  return document.getElementById(id);
};

var germanVoices = [];
var popupSpeech = null;

function loadSettings() {
  chrome.storage.sync.get(DEFAULTS, render);
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
  $('pronunciationEnabled').checked = settings.pronunciationEnabled;
  var rateRadio = document.querySelector('input[name="pronRate"][value="' + settings.pronunciationRate + '"]');
  if (rateRadio) rateRadio.checked = true;
  populateVoiceSelect(settings.pronunciationVoiceURI);
  updatePronTestButton(settings);
  updatePreview(settings);
}

function populateVoiceSelect(preferredURI) {
  var sel = $('pronunciationVoice');
  if (!sel) return;
  if (germanVoices.length === 0) {
    sel.innerHTML = '<option value="">No German voices available</option>';
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

function updatePronTestButton(settings) {
  var btn = $('pronunciationTest');
  if (!btn) return;
  if (!settings.pronunciationEnabled) {
    btn.disabled = true;
    return;
  }
  var hasVoice = germanVoices.length > 0;
  if (hasVoice) {
    var pref = $('pronunciationVoice').value;
    var selected = germanVoices.some(function (v) { return v.voiceURI === pref; });
    btn.disabled = !selected;
  } else {
    btn.disabled = true;
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
    updatePronTestButton(settings);
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

$('pronunciationEnabled').addEventListener('change', function (e) {
  saveSetting('pronunciationEnabled', e.target.checked);
  updatePronTestButton({ pronunciationEnabled: e.target.checked });
});

$('pronunciationVoice').addEventListener('change', function (e) {
  saveSetting('pronunciationVoiceURI', e.target.value);
  updatePronTestButton({ pronunciationEnabled: $('pronunciationEnabled').checked });
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

chrome.storage.onChanged.addListener(function () {
  chrome.storage.sync.get(DEFAULTS, render);
});

if (window.speechSynthesis) {
  var voicesLoaded = window.speechSynthesis.getVoices();
  if (voicesLoaded.length > 0) {
    refreshGermanVoices();
  }
  window.speechSynthesis.addEventListener('voiceschanged', refreshGermanVoices);
}

loadSettings();
