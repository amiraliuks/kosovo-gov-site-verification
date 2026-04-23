const translations = {
  en: {
    title: "Kosovo Government Domain Checker",
    button: "Check Current Website",
    checking: "Checking...",
    official: "Verified: This is an official Kosovo government domain.",
    unofficial: "Warning: This is NOT an official Kosovo government domain.",
    unsupported: "This page cannot be verified (internal browser page or unsupported protocol).",
    unavailable: "Could not read the active tab. Try reloading the page.",
    source: "View Source Code",
    disclaimer:
      "This extension is a personal project and is not affiliated with the Government of Kosovo or any of its institutions."
  },
  sq: {
    title: "Kontrolluesi i Domenëve të Qeverisë së Kosovës",
    button: "Kontrollo Faqen Aktuale",
    checking: "Duke kontrolluar...",
    official: "Verifikuar: Ky është një domen zyrtar i institucioneve të Kosovës.",
    unofficial: "Paralajmërim: Ky NUK është domen zyrtar i institucioneve të Kosovës.",
    unsupported: "Kjo faqe nuk mund të verifikohet (faqe e brendshme e shfletuesit ose protokoll i pambështetur).",
    unavailable: "Nuk mund të lexohet faqja aktive. Provo ta rifreskosh faqen.",
    source: "Shiko kodin burimor",
    disclaimer:
      "Ky extension është projekt personal dhe nuk është i lidhur me Qeverinë e Kosovës ose ndonjë institucion të saj."
  },
  sr: {
    title: "Provera Domena Vlade Kosova",
    button: "Proveri Trenutni Sajt",
    checking: "Proveravanje...",
    official: "Potvrđeno: Ovo je zvaničan domen institucija Kosova.",
    unofficial: "Upozorenje: Ovo NIJE zvaničan domen institucija Kosova.",
    unsupported: "Ova stranica ne može da se proveri (interna stranica pregledača ili nepodržan protokol).",
    unavailable: "Aktivna kartica nije dostupna. Pokušajte ponovo.",
    source: "Pogledaj izvorni kod",
    disclaimer:
      "Ovo proširenje je lični projekat i nije povezano sa Vladom Kosova ili bilo kojom njenom institucijom."
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
if (sourceLink) {
  sourceLink.textContent = t.source;
  sourceLink.href = "https://github.com/AmirAliuA/kosovo-gov-site-verification";
}
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
    statusBox.classList.remove("ks-ok", "ks-bad", "ks-info");
    if (kind === "ok") statusBox.classList.add("ks-ok");
    if (kind === "bad") statusBox.classList.add("ks-bad");
    if (kind === "info") statusBox.classList.add("ks-info");
  }
}

function getCurrentHost() {
  return new Promise(resolve => {
    try {
      chrome.runtime.sendMessage({ action: "getCurrentHost" }, response => {
        if (!response) {
          return resolve({ host: null, status: "unavailable" });
        }
        resolve({
          host: response.host || null,
          status: response.status || (response.host ? "ok" : "unavailable")
        });
      });
    } catch (e) {
      resolve({ host: null, status: "unavailable" });
    }
  });
}

async function checkDomain() {
  setStatusText(t.checking);

  if (!officialDomains || officialDomains.length === 0) {
    await loadDomains();
  }

  const current = await getCurrentHost();
  if (current.status === "unsupported") {
    setStatusText(t.unsupported, "info");
    return;
  }

  const host = current.host;
  if (!host) {
    setStatusText(t.unavailable, "info");
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
    setTimeout(() => checkDomain(), 160);
  }
});
