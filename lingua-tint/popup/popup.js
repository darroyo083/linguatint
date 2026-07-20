const DEFAULTS = {
  enabled: true,
  siteMode: 'notebooklm',
  germanColor: '#2563eb',
  spanishColor: '#16a34a',
  germanEnabled: true,
  spanishEnabled: true,
};

const $ = function (id) {
  return document.getElementById(id);
};

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
  updatePreview(settings);
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

chrome.storage.onChanged.addListener(function () {
  chrome.storage.sync.get(DEFAULTS, render);
});

loadSettings();
