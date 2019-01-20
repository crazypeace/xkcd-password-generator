"use strict";
const $ = selector => document.querySelector(selector);
const NUM_PHRASE = 4;
let dictpinyin = null;
let dictwubi = null;

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
    dictpinyin = await loadDict("pinyin8k.wordlist");
	dictwubi = await loadDict("wubi8k.wordlist");
  } catch (e) {
    alert("Fail to load dict: " + e);
    return;
  }
  console.log(`dictpinyin${dictpinyin.length} phrases loaded`);
  console.log(`dictwubi${dictwubi.length} phrases loaded`);
  generatePassphrase();
  $('#generator').classList.remove('loading');
  $('#generate').disabled = false;
})();

function generatePassphrase() {
  const listpinyin = $('#phrasespinyin');
  listpinyin.innerHTML = '';
 const listwubi = $('#phraseswubi');
 listwubi.innerHTML = '';
  let randoms = new Uint16Array(NUM_PHRASE);
  
  if (document.getElementById("randomarray").value == "")
  {
    window.crypto.getRandomValues(randoms);
  }
  else
  {
    var randomarray = document.getElementById("randomarray").value;
    randoms = randomarray.split('\t', 4);
  }
  
  Array.from(randoms)
  .map(n => dictpinyin[n % dictpinyin.length])
  .map(phraseToHTML)
  .forEach(html => listpinyin.appendChild(html));
  Array.from(randoms)
  .map(n => dictwubi[n % dictwubi.length])
  .map(phraseToHTML)
  .forEach(html => listwubi.appendChild(html)); 
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
