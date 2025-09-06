(function () {
  "use strict";

  const elements = {
    length: document.getElementById("length"),
    lengthValue: document.getElementById("length-value"),
    lowercase: document.getElementById("lowercase"),
    uppercase: document.getElementById("uppercase"),
    numbers: document.getElementById("numbers"),
    symbols: document.getElementById("symbols"),
    excludeSimilar: document.getElementById("exclude-similar"),
    requireEach: document.getElementById("require-each"),
    output: document.getElementById("password-output"),
    generateBtn: document.getElementById("generate-btn"),
    regenerateBtn: document.getElementById("regenerate-btn"),
    copyBtn: document.getElementById("copy-btn"),
    strengthFill: document.getElementById("strength-fill"),
    strengthText: document.getElementById("strength-text"),
    toast: document.getElementById("toast"),
  };

  const BASE_SETS = {
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    numbers: "0123456789",
    symbols: "!@#$%^&*()-_=+[]{};:,.<>/?|~",
  };

  const SIMILAR = new Set(["0", "O", "o", "1", "l", "I"]);

  function getActiveSets(options) {
    const sets = [];
    if (options.lowercase) sets.push("lowercase");
    if (options.uppercase) sets.push("uppercase");
    if (options.numbers) sets.push("numbers");
    if (options.symbols) sets.push("symbols");
    return sets;
  }

  function buildCharset(options) {
    const active = getActiveSets(options);
    if (active.length === 0) return "";
    let charset = "";
    for (const key of active) {
      charset += BASE_SETS[key];
    }
    if (options.excludeSimilar) {
      charset = [...charset].filter((ch) => !SIMILAR.has(ch)).join("");
    }
    return charset;
  }

  function secureRandomInt(maxExclusive) {
    // Return integer in [0, maxExclusive)
    if (maxExclusive <= 0) return 0;
    const array = new Uint32Array(1);
    const limit = Math.floor(0xffffffff / maxExclusive) * maxExclusive;
    let r;
    do {
      crypto.getRandomValues(array);
      r = array[0];
    } while (r >= limit);
    return r % maxExclusive;
  }

  function generatePassword(options) {
    const charset = buildCharset(options);
    if (!charset) return "";
    const length = options.length;
    const requireEach = !!options.requireEach;

    if (!requireEach) {
      let result = "";
      for (let i = 0; i < length; i++) {
        const idx = secureRandomInt(charset.length);
        result += charset.charAt(idx);
      }
      return result;
    }

    // Ensure at least one character from each selected set
    const active = getActiveSets(options);
    if (active.length > length) {
      // Adjust: if too many required sets, fallback to no-requireEach
      return generatePassword({ ...options, requireEach: false });
    }

    const chosen = [];
    for (const key of active) {
      const set = options.excludeSimilar
        ? [...BASE_SETS[key]].filter((ch) => !SIMILAR.has(ch)).join("")
        : BASE_SETS[key];
      if (set.length === 0) continue;
      chosen.push(set.charAt(secureRandomInt(set.length)));
    }

    for (let i = chosen.length; i < length; i++) {
      const idx = secureRandomInt(charset.length);
      chosen.push(charset.charAt(idx));
    }

    // Shuffle (Fisher-Yates using secure RNG)
    for (let i = chosen.length - 1; i > 0; i--) {
      const j = secureRandomInt(i + 1);
      const tmp = chosen[i];
      chosen[i] = chosen[j];
      chosen[j] = tmp;
    }

    return chosen.join("");
  }

  function log2(n) {
    return Math.log(n) / Math.log(2);
  }

  function estimateEntropy(bitsPerChar, length) {
    return bitsPerChar * length;
  }

  function calcBitsPerChar(options) {
    const charset = buildCharset(options);
    return charset ? log2(charset.length) : 0;
  }

  function strengthFromEntropy(entropyBits) {
    // Rough guidance
    if (entropyBits < 28) return { label: "很弱", color: "var(--danger)", pct: 15 };
    if (entropyBits < 36) return { label: "弱", color: "var(--danger)", pct: 30 };
    if (entropyBits < 60) return { label: "中等", color: "#f59e0b", pct: 55 };
    if (entropyBits < 128) return { label: "强", color: "#22c55e", pct: 80 };
    return { label: "极强", color: "#10b981", pct: 100 };
  }

  function updateStrengthUI(options, previewValue) {
    const bitsPerChar = calcBitsPerChar(options);
    const entropy = estimateEntropy(bitsPerChar, options.length);
    const s = strengthFromEntropy(entropy);
    elements.strengthFill.style.width = s.pct + "%";
    elements.strengthFill.style.background = s.color;
    elements.strengthText.textContent = `${s.label} · 估算熵 ${entropy.toFixed(1)} bit`;
    if (previewValue != null) elements.output.value = previewValue;
  }

  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-1000px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      showToast("已复制到剪贴板");
    } catch (e) {
      showToast("复制失败，请手动复制");
    }
  }

  let toastTimer = null;
  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      elements.toast.hidden = true;
    }, 1500);
  }

  function readOptions() {
    return {
      length: parseInt(elements.length.value, 10),
      lowercase: elements.lowercase.checked,
      uppercase: elements.uppercase.checked,
      numbers: elements.numbers.checked,
      symbols: elements.symbols.checked,
      excludeSimilar: elements.excludeSimilar.checked,
      requireEach: elements.requireEach.checked,
    };
  }

  function refreshPreview() {
    const opts = readOptions();
    updateStrengthUI(opts, "");
  }

  function generateAndShow() {
    const opts = readOptions();
    const pwd = generatePassword(opts);
    elements.output.value = pwd;
    updateStrengthUI(opts);
  }

  // Wire events
  elements.length.addEventListener("input", () => {
    elements.lengthValue.textContent = String(elements.length.value);
    refreshPreview();
  });

  [
    elements.lowercase,
    elements.uppercase,
    elements.numbers,
    elements.symbols,
    elements.excludeSimilar,
    elements.requireEach,
  ].forEach((el) => el.addEventListener("change", refreshPreview));

  elements.generateBtn.addEventListener("click", generateAndShow);
  elements.regenerateBtn.addEventListener("click", generateAndShow);
  elements.copyBtn.addEventListener("click", () => {
    const value = elements.output.value || "";
    if (!value) {
      showToast("没有可复制的密码");
      return;
    }
    copyToClipboard(value);
  });

  // Initial
  elements.lengthValue.textContent = String(elements.length.value);
  refreshPreview();
  generateAndShow();
})();




