function trySplitCompound(word) {
  var lower = word.toLowerCase();
  // Try direct split first, then with Fugenlaut removal
  for (var split = 3; split < lower.length; split++) {
    var left = lower.slice(0, split);
    var rightRest = lower.slice(split);

    // Candidates: direct split + Fugenlaut variants
    var candidates = [{ right: rightRest, fugen: '' }];
    for (var f = 0; f < FUGENLAUTE.length; f++) {
      var fl = FUGENLAUTE[f];
      if (rightRest.length > fl.length && rightRest.slice(0, fl.length) === fl) {
        var afterFugen = rightRest.slice(fl.length);
        if (afterFugen.length >= 3) {
          candidates.push({ right: afterFugen, fugen: fl });
        }
      }
    }

    for (var c = 0; c < candidates.length; c++) {
      var right = candidates[c].right;
      if (left.length < 3 || right.length < 3) continue;

      var rightIsCap = false;
      if (candidates[c].fugen === '') {
        rightIsCap = word[split] === word[split].toUpperCase() && word[split] !== word[split].toLowerCase();
      }

      var gLeft = GERMAN_WORDS.has(left);
      var gRight = GERMAN_WORDS.has(right);
      var sLeft = SPANISH_WORDS.has(left);
      var sRight = SPANISH_WORDS.has(right);

      if ((gLeft || sLeft) && (gRight || sRight)) {
        var result = { german: 0, spanish: 0 };
        if (gLeft) result.german += 2;
        if (sLeft) result.spanish += 2;
        if (gRight) result.german += 2;
        if (sRight) result.spanish += 2;
        if (rightIsCap) result.german += 1;
        if (candidates[c].fugen !== '') result.german += 2; // Fugenlaut is German-specific
        if (left.length === 4 && /^[A-Z]/.test(word[0])) result.german += 1;
        return result;
      }
    }
  }
  return null;
}

function scoreLanguage(text) {
  var trimmed = text.trim();
  if (!trimmed || trimmed.length < 1) {
    return { german: 0, spanish: 0, reliable: false };
  }

  if (RE_ONLY_PUNCT.test(trimmed)) {
    return { german: 0, spanish: 0, reliable: false };
  }

  // Smart parentheses: detect language instead of blindly assuming Spanish
  if (RE_PARENS_WRAP.test(trimmed)) {
    var innerText = trimmed.slice(1, -1).trim();
    if (innerText.length < 2) {
      return { german: 0, spanish: 5, reliable: true };
    }
    // Score the inner text without the parens wrapper
    var innerScore = scoreLanguageInner(innerText);
    // If ambiguous or tied, default to Spanish (backward compatible)
    if (innerScore.german > innerScore.spanish && innerScore.german >= 3) {
      return { german: innerScore.german, spanish: 0, reliable: true };
    }
    // Default: treat as Spanish (original behavior as fallback)
    return { german: 0, spanish: Math.max(innerScore.spanish, 5), reliable: true };
  }

  return scoreLanguageInner(trimmed);
}

function scoreLanguageInner(trimmed) {
  var german = 0;
  var spanish = 0;
  var fullLower = trimmed.toLowerCase();

  if (RE_ESZETT.test(trimmed)) german += 5;
  if (RE_ENE.test(trimmed)) spanish += 5;

  var words = trimmed.split(/\s+/).filter(function (w) { return w.length > 0; });
  if (words.length === 0) {
    return { german: german, spanish: spanish, reliable: german > 0 || spanish > 0 };
  }

  for (var i = 0; i < words.length; i++) {
    var raw = words[i];
    var clean = raw.replace(RE_WORD_CLEAN, '');
    if (clean.length < 2) continue;

    if (RE_GERMAN_CHARS.test(clean)) german += 3;
    if (RE_SPANISH_CHARS.test(clean)) spanish += 3;

    var wordLower = clean.toLowerCase();

    // Skip cognates — they don't provide language signal
    if (COGNATE_WORDS.has(wordLower)) continue;

    var inGerman = GERMAN_WORDS.has(wordLower);
    var inSpanish = SPANISH_WORDS.has(wordLower);

    // Exclusive dictionary match scores higher than shared
    if (inGerman && !inSpanish) german += 3;
    else if (inSpanish && !inGerman) spanish += 3;
    else if (inGerman && inSpanish) {
      // Word in both dictionaries — reduced score
      german += 1;
      spanish += 1;
    }

    if (!inGerman && !inSpanish && clean.length >= 4) {
      var splitResult = trySplitCompound(clean);
      if (splitResult) {
        if (splitResult.german) german += splitResult.german;
        if (splitResult.spanish) spanish += splitResult.spanish;
      }
    }

    if (RE_CAPITAL_GERMAN.test(clean) && !inSpanish) {
      if (inGerman || clean.length >= 4) german += 1;
    }
    if (RE_SPANISH_SUFFIX.test(wordLower)) spanish += 1;
    if (RE_GERMAN_SUFFIX.test(wordLower)) german += 1;
  }

  // FIX: Apply patterns against the FULL text, not the last word's `lower`
  for (var p = 0; p < GERMAN_PATTERNS.length; p++) {
    if (GERMAN_PATTERNS[p].test(fullLower)) german += 2;
  }
  for (var p = 0; p < SPANISH_PATTERNS.length; p++) {
    if (SPANISH_PATTERNS[p].test(fullLower)) spanish += 2;
  }

  var reliable = false;
  if (german >= 3 || spanish >= 3) {
    var total = german + spanish;
    var ratio = total > 0 ? Math.max(german, spanish) / total : 0;
    reliable = ratio >= 0.65;
  }

  return { german: german, spanish: spanish, reliable: reliable };
}

function detectLanguage(text, contextText) {
  var result = scoreLanguage(text);
  if (result.german > result.spanish && result.german >= 3) return 'german';
  if (result.spanish > result.german && result.spanish >= 3) return 'spanish';

  if (contextText && typeof contextText === 'string' && RE_ALPHA.test(text)) {
    var ctxResult = scoreLanguage(contextText);
    var totalCtx = ctxResult.german + ctxResult.spanish;
    if (totalCtx >= 5) {
      var ratioCtx = Math.max(ctxResult.german, ctxResult.spanish) / totalCtx;
      if (ratioCtx >= 0.75) {
        var dominant = ctxResult.german > ctxResult.spanish ? 'german' : 'spanish';
        if (dominant === 'german' && result.spanish === 0) return 'german';
        if (dominant === 'spanish' && result.german === 0) return 'spanish';
      }
    }
  }

  return 'neutral';
}

function wordLevelSegments(text, contextText) {
  var leadingSpaceMatch = text.match(/^\s+/);
  var prefix = leadingSpaceMatch ? leadingSpaceMatch[0] : '';
  var trimmedText = leadingSpaceMatch ? text.slice(prefix.length) : text;

  var parts = trimmedText.match(/\S+\s*/g);
  if (!parts || parts.length === 0) {
    return [{ text: text, language: 'neutral' }];
  }
  parts[0] = prefix + parts[0];

  var wordTokens = parts.filter(function (p) {
    return RE_ALPHA.test(p);
  });
  if (wordTokens.length === 0) {
    return [{ text: text, language: 'neutral' }];
  }

  var tokenLangs = wordTokens.map(function (token, i) {
    var clean = token.replace(RE_WORD_CLEAN, '');
    var wordLower = clean.toLowerCase();

    var inGerman = GERMAN_WORDS.has(wordLower);
    var inSpanish = SPANISH_WORDS.has(wordLower);

    if (inSpanish && !inGerman && !COGNATE_WORDS.has(wordLower)) {
      return { text: token, lang: 'spanish' };
    }
    if (inGerman && !inSpanish && !COGNATE_WORDS.has(wordLower)) {
      if (clean.length >= 2) {
        return { text: token, lang: 'german' };
      }
    }

    var start = Math.max(0, i - 2);
    var end = Math.min(wordTokens.length, i + 3);
    var windowText = wordTokens.slice(start, end).join(' ');
    return { text: token, lang: detectLanguage(windowText, contextText) };
  });

  var wordIdx = 0;
  var partLangs = parts.map(function (part) {
    if (RE_ALPHA.test(part)) {
      var result = tokenLangs[wordIdx];
      wordIdx++;
      return { text: part, lang: result.lang };
    }
    return { text: part, lang: 'neutral' };
  });

  var groups = [];
  var currentLang = partLangs[0] ? partLangs[0].lang : 'neutral';
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

  return groups;
}

function splitSentences(text) {
  var result = [];
  var current = '';
  var parenDepth = 0;

  for (var i = 0; i < text.length; i++) {
    var char = text[i];
    if (char === '(') parenDepth++;
    else if (char === ')' && parenDepth > 0) parenDepth--;

    current += char;

    if (parenDepth === 0 && /[.!?\n]/.test(char)) {
      if (i === text.length - 1 || /\s/.test(text[i + 1])) {
        if (current.trim().length > 0) {
          result.push(current);
          current = '';
        }
      }
    }
  }
  if (current.trim().length > 0) {
    result.push(current);
  }

  return result.length > 0 ? result : [text];
}

function sentenceLevelSegments(text, contextText) {
  var sentences = splitSentences(text);
  if (sentences.length <= 1) {
    return wordLevelSegments(text, contextText);
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

    var sub = wordLevelSegments(sentence, contextText);
    for (var j = 0; j < sub.length; j++) {
      result.push(sub[j]);
    }
  }

  return result;
}

function detectLanguageAsync(text) {
  return new Promise(function (resolve) {
    if (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.detectLanguage) {
      chrome.i18n.detectLanguage(text, function (result) {
        if (result && result.languages && result.languages.length > 0) {
          var top = result.languages[0];
          if (top.percentage >= 70 && result.isReliable) {
            if (top.language === 'de') resolve('german');
            else if (top.language === 'es') resolve('spanish');
            else resolve(detectLanguage(text));
          } else {
            resolve(detectLanguage(text));
          }
        } else {
          resolve(detectLanguage(text));
        }
      });
    } else {
      resolve(detectLanguage(text));
    }
  });
}

