// Returns the hostname of the active tab when the popup requests it
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action !== "getCurrentHost") return;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs && tabs[0];
    if (!activeTab || !activeTab.url) {
      sendResponse({ host: null, status: "unavailable" });
      return;
    }

    try {
      const parsedUrl = new URL(activeTab.url);
      const protocol = (parsedUrl.protocol || "").toLowerCase();

      if (protocol !== "http:" && protocol !== "https:") {
        sendResponse({ host: null, status: "unsupported" });
        return;
      }

      sendResponse({ host: parsedUrl.hostname || null, status: "ok" });
    } catch {
      sendResponse({ host: null, status: "unsupported" });
    }
  });

  return true; // keep the message channel open
});