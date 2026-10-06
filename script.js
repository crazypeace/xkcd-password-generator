"use strict";
const $ = selector => document.querySelector(selector);
const NUM_PHRASE = 4;

let dictPinyin = null;
let dictWubi = null;
let dictEnglish = null;

// 本次生成的原始词（小写）。
// 切换选项时复用同一组词，只重排格式，不重新选词。
let current = null;

async function loadDict(url) {
  // const resp = await fetch("https://crazypeace.github.io/xkcd-password-generator/" + url);
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

  document.getElementById('generate').addEventListener('click', function () {
    generatePassphrase();
  });

  // 切换任一选项：同一组词重排格式，不重新选词
  document.querySelectorAll('#options input[type=radio]').forEach(radio => {
    radio.addEventListener('change', renderAll);
  });

  document.querySelectorAll('.copyPassword').forEach(button => {
    button.addEventListener('click', function () {
      const ul = this.parentElement.querySelector('ul.phrases');
      navigator.clipboard.writeText(ul.dataset.password || '');
    });
  });

  document.querySelectorAll('.copyMnemonic').forEach(button => {
    button.addEventListener('click', function () {
      // 数字节没有 data-hans，助记词里自动跳过
      const items = this.parentElement.querySelectorAll('ul.phrases li[data-hans]');
      const textToCopy = Array.from(items).map(item => item.getAttribute('data-hans')).join('');
      navigator.clipboard.writeText(textToCopy);
    });
  });

})();

function getOptions() {
  const checked = name => document.querySelector(`input[name="${name}"]:checked`).value;
  return {
    caseMode: checked('opt-case'), // lower | capital
    sep: checked('opt-sep'),       // none | dash
    digit: checked('opt-digit'),   // none | tail
  };
}

function applyCase(words, mode) {
  if (mode === 'capital') {
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  }
  return words.map(w => w.toLowerCase());
}

// 尾部数字节：取原密码（4 个词）最后 2 个字母，按字母表顺序转成 2 位数字，共 4 位。
// 如 a=01, z=26。完全由密码派生，不增加熵，只为满足"须含数字"的口令策略。
function derivedDigitSection(words) {
  const letters = words.join('').toLowerCase().replace(/[^a-z]/g, '');
  const last2 = letters.slice(-2).padStart(2, 'a');
  return [...last2].map(ch => String(ch.charCodeAt(0) - 96).padStart(2, '0')).join('');
}

// 把词组装成待显示的“节”数组；数字节没有 hans
function buildSections(phrases) {
  const { caseMode, digit } = getOptions();
  const words = applyCase(phrases.map(p => p.code), caseMode);
  const sections = words.map((text, i) => ({ text, hans: phrases[i].hans }));
  if (digit === 'tail') {
    sections.push({ text: derivedDigitSection(phrases.map(p => p.code)), hans: null });
  }
  return sections;
}

function renderGroup(ul, phrases) {
  ul.innerHTML = '';
  const { sep } = getOptions();
  const dash = sep === 'dash';
  const sections = buildSections(phrases);
  sections.forEach((s, i) => {
    // 分隔符做成独立的 li（而非 li::before 或文本节点）：
    // 词与助记词都顶着各自 li 的左沿，两排自然对齐；复制助记词时按 data-hans 过滤，sep li 自动跳过
    if (i > 0 && dash) {
      const sepLi = document.createElement('li');
      sepLi.className = 'sep';
      sepLi.textContent = '-';
      ul.appendChild(sepLi);
    }
    const li = document.createElement('li');
    li.textContent = s.text;
    if (s.hans) {
      li.dataset.hans = s.hans;
    } else {
      li.className = 'digits';
    }
    ul.appendChild(li);
  });
  // 复制密码时用的最终字符串（含分隔符与数字节）
  ul.dataset.password = sections.map(s => s.text).join(dash ? '-' : '');
}

function renderAll() {
  if (!current) return;
  renderGroup($('#phrasespinyin'), current.py);
  renderGroup($('#phraseswubi'), current.wb);
  renderGroup($('#phrasesen'), current.en);
  updateEntropy();
}

// 在选项面板下显示当前组合的估计熵
function updateEntropy() {
  const el = $('#entropy');
  if (!el || !current) return;
  const { digit } = getOptions();
  const note = digit === 'tail'
    ? '尾部 4 位数字由密码最后 2 个字母派生，不增加熵'
    : '无数字节';
  el.textContent = `${note}：拼音/五笔约 52.0 bit 熵，英文约 48.0 bit 熵。`;
}

function generatePassphrase() {
  let randoms_py = new Uint16Array(NUM_PHRASE);
  let randoms_wb = new Uint16Array(NUM_PHRASE);
  let randoms_en = new Uint16Array(NUM_PHRASE);
  let randoms = new Uint16Array(NUM_PHRASE * 3);

  if (document.getElementById("randomarray").value == "") {
    window.crypto.getRandomValues(randoms_py);
    window.crypto.getRandomValues(randoms_wb);
    window.crypto.getRandomValues(randoms_en);
  }
  else {
    var randomarray = document.getElementById("randomarray").value;
    randoms = randomarray.split(/\s+/, NUM_PHRASE * 3);
    randoms_py = randoms.slice(0, 4)
    randoms_wb = randoms.slice(4, 8)
    randoms_en = randoms.slice(8, 12)
  }

  const pick = (dict, arr) => Array.from(arr).map(n => dict[n % dict.length]);
  current = {
    py: pick(dictPinyin, randoms_py),
    wb: pick(dictWubi, randoms_wb),
    en: pick(dictEnglish, randoms_en),
  };
  renderAll();
}
