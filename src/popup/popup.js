// popup.js - fixed, robust, auto-check + translations + animations
const translations = {
  en: {
    title: "Kosovo Government Domain Checker",
    button: "Check Current Website",
    checking: "Checking...",
    official: "✅ This is an official Kosovo government domain.",
    unofficial: "❌ This is NOT an official Kosovo government domain.",
    source: "View Source Code",
    disclaimer: "This extension is a personal project and is not affiliated with the Government of Kosovo or any of its institutions."
  },
  sq: {
    title: "Kontrolluesi i Domenve të Qeverisë së Kosovës",
    button: "Kontrollo Faqen Aktuale",
    checking: "Duke kontrolluar...",
    official: "✅ Ky është një domen zyrtar i institucioneve të Kosovës.",
    unofficial: "❌ Ky NUK është domen zyrtar i institucioneve të Kosovës.",
    source: "Shiko kodin burimor",
    disclaimer: "Ky extension është projekt personal dhe nuk është i lidhur me Qeverinë e Kosovës ose ndonjë institucion të saj."
  },
  sr: {
    title: "Provera Domenа Vlade Kosova",
    button: "Proveri Trenutni Sajt",
    checking: "Proveravanje...",
    official: "✅ Ovo je zvaničan domen institucija Kosova.",
    unofficial: "❌ Ovo NIJE zvaničan domen institucija Kosova.",
    source: "Pogledaj izvorni kod",
    disclaimer: "Ovo proširenje je lični projekat i nije povezano sa Vladom Kosova ili bilo kojom njenom institucijom."
  }
};

function getLang() {
  const lang = (navigator.language || "en").toLowerCase();
  if (lang.startsWith("sq")) return "sq";
  if (lang.startsWith("sr")) return "sr";
  return "en";
}

const lang = getLang();
const t = translations[lang];

const titleEl = document.getElementById("title");
const statusTextEl = document.getElementById("statusText");
const checkBtn = document.getElementById("checkBtn");
const sourceLink = document.getElementById("sourceLink");
const disclaimerEl = document.getElementById("disclaimer");
const autoCheckToggle = document.getElementById("autocheckToggle");
const statusBox = document.getElementById("domainStatus");
const AUTO_CHECK_KEY = "autoCheckOnOpen";

if (titleEl) titleEl.textContent = t.title;
if (checkBtn) checkBtn.textContent = t.button;
if (sourceLink) { sourceLink.textContent = t.source; sourceLink.href = "https://github.com/AmirAliuA/kosovo-gov-site-verification"; }
if (disclaimerEl) disclaimerEl.textContent = t.disclaimer;

let officialDomains = [];
async function loadDomains() {
  try {
    const res = await fetch(chrome.runtime.getURL("src/data/domains.json"));
    if (!res.ok) throw new Error("domains.json load failed: " + res.status);
    officialDomains = await res.json();
  } catch (err) {
    console.error("Failed to load domains.json", err);
    officialDomains = [];
  }
}

function getAutoCheckEnabled() {
  return new Promise(resolve => {
    if (!chrome.storage?.sync) return resolve(true);

    chrome.storage.sync.get({ [AUTO_CHECK_KEY]: true }, items => {
      if (chrome.runtime.lastError) return resolve(true);
      resolve(Boolean(items[AUTO_CHECK_KEY]));
    });
  });
}

function setAutoCheckEnabled(enabled) {
  return new Promise(resolve => {
    if (!chrome.storage?.sync) return resolve();

    chrome.storage.sync.set({ [AUTO_CHECK_KEY]: Boolean(enabled) }, () => {
      resolve();
    });
  });
}

function setStatusText(text, kind = null) {
  if (!statusTextEl) return;
  statusTextEl.textContent = text;

  statusTextEl.classList.remove("fade");
  void statusTextEl.offsetWidth;
  statusTextEl.classList.add("fade");

  if (statusBox) {
    statusBox.classList.remove("ks-ok", "ks-bad");
    if (kind === "ok") statusBox.classList.add("ks-ok");
    if (kind === "bad") statusBox.classList.add("ks-bad");
  }
}

function getCurrentHost() {
  return new Promise(resolve => {
    try {
      chrome.runtime.sendMessage({ action: "getCurrentHost" }, response => {
        if (!response) return resolve(null);
        resolve(response.host || null);
      });
    } catch (e) {
      resolve(null);
    }
  });
}

async function checkDomain() {
  setStatusText(t.checking);

  if (!officialDomains || officialDomains.length === 0) {
    await loadDomains();
  }

  const host = await getCurrentHost();
  if (!host) {
    setStatusText(t.unofficial, "bad");
    return;
  }

  const matched = KSGovDomain.isOfficialHost(host, officialDomains);

  if (matched) {
    setStatusText(t.official, "ok");
  } else {
    setStatusText(t.unofficial, "bad");
  }
}

if (checkBtn) checkBtn.addEventListener("click", checkDomain);
if (autoCheckToggle) {
  autoCheckToggle.addEventListener("change", () => {
    void setAutoCheckEnabled(autoCheckToggle.checked);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadDomains();

  let shouldAutoCheck = false;
  if (autoCheckToggle) {
    shouldAutoCheck = await getAutoCheckEnabled();
    autoCheckToggle.checked = shouldAutoCheck;
  }

  if (autoCheckToggle && shouldAutoCheck) {
    // small delay so UI paints nicely
    setTimeout(() => checkDomain(), 160);
  }
});
