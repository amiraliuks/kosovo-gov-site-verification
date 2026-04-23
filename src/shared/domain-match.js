(function (global) {
  function extractDomain(value) {
    if (typeof value === "string") return value;
    if (value && typeof value === "object" && typeof value.domain === "string") {
      return value.domain;
    }
    return "";
  }

  function normalizeDomain(value) {
    const extracted = extractDomain(value);
    if (!extracted) return "";

    const raw = String(extracted).toLowerCase().trim().replace(/\.+$/, "");
    if (!raw) return "";

    const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw);
    const candidate = hasScheme ? raw : `http://${raw}`;

    try {
      // URL.hostname returns canonical ASCII form, which makes IDN matching
      // safe and consistent (e.g. unicode domains become punycode).
      return new URL(candidate).hostname.toLowerCase().replace(/\.+$/, "");
    } catch {
      // Fallback for malformed inputs: strip path/query/fragment and port.
      let host = raw.split(/[/?#]/, 1)[0] || "";
      host = host.replace(/\.+$/, "");

      if (host.startsWith("[")) {
        const endBracket = host.indexOf("]");
        if (endBracket >= 0) {
          return host.slice(1, endBracket).toLowerCase().replace(/\.+$/, "");
        }
      }

      const firstColon = host.indexOf(":");
      if (firstColon >= 0) {
        host = host.slice(0, firstColon);
      }

      return host.toLowerCase().replace(/\.+$/, "");
    }
  }

  function matchesHost(host, domainEntry) {
    const h = normalizeDomain(host);
    const d = normalizeDomain(extractDomain(domainEntry));
    if (!h || !d) return false;
    if (h === d) return true;
    return h.endsWith("." + d);
  }

  function findMatchedDomain(host, domainList) {
    if (!Array.isArray(domainList)) return null;

    for (const domainEntry of domainList) {
      if (matchesHost(host, domainEntry)) {
        return normalizeDomain(extractDomain(domainEntry));
      }
    }

    return null;
  }

  function isOfficialHost(host, domainList) {
    return Boolean(findMatchedDomain(host, domainList));
  }

  global.KSGovDomain = {
    extractDomain,
    normalizeDomain,
    matchesHost,
    findMatchedDomain,
    isOfficialHost
  };
})(globalThis);
