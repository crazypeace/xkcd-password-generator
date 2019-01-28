"use strict";
const $ = selector => document.querySelector(selector);
const NUM_PHRASE = 4;
let dictPinyin = null;
let dictWubi = null;
let dictEnglish = null;

async function loadDict(url) {
  const resp = await fetch(url);
  const text = await resp.text();
  return text.split('\n')
    .filter(s => s.includes('\t'))
    .map(s => s.split('\t'))
    .map(([code, hans]) => ({
      hans: hans.trim(),
      code: code.trim(),
    }));
}

(async function () {
  try {
    dictPinyin = await loadDict("pinyin8k.wordlist");
	dictWubi = await loadDict("wubi8k.wordlist");
	dictEnglish = await loadDict("english4k.wordlist");
  } catch (e) {
    alert("Fail to load dict: " + e);
    return;
  }
  console.log(`dictPinyin${dictPinyin.length} phrases loaded`);
  console.log(`dictWubi${dictWubi.length} phrases loaded`);
  console.log(`dictEnglish${dictEnglish.length} phrases loaded`);
  generatePassphrase();
  $('#generator').classList.remove('loading');
  $('#generate').disabled = false;
})();

function generatePassphrase() {
  const listPinyin = $('#phrasespinyin');
  listPinyin.innerHTML = '';
  const listWubi = $('#phraseswubi');
  listWubi.innerHTML = '';
  const listEnglish = $('#phrasesen');
  listEnglish.innerHTML = '';
  
  let randoms = new Uint16Array(NUM_PHRASE);
  
  if (document.getElementById("randomarray").value == "")
  {
    window.crypto.getRandomValues(randoms);
  }
  else
  {
    var randomarray = document.getElementById("randomarray").value;
    randoms = randomarray.split(/\s+/, 4);
  }
  
  Array.from(randoms)
  .map(n => dictPinyin[n % dictPinyin.length])
  .map(phraseToHTML)
  .forEach(html => listPinyin.appendChild(html));
  Array.from(randoms)
  .map(n => dictWubi[n % dictWubi.length])
  .map(phraseToHTML)
  .forEach(html => listWubi.appendChild(html)); 
  Array.from(randoms)
  .map(n => dictEnglish[n % dictEnglish.length])
  .map(phraseToHTML)
  .forEach(html => listEnglish.appendChild(html)); 
}

function phraseToHTML(phrase) {
  const template = $('#phrase');
  const content = document.importNode(template, true).content;
  const li = content.querySelector('li');
  li.textContent = phrase.code;
  li.dataset.hans = phrase.hans;
  return content;
}

$('#generator').addEventListener("submit", ev => {
  ev.preventDefault();
  generatePassphrase();
});
