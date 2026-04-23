(function (global) {
  function normalizeDomain(value) {
    if (!value) return "";
    return String(value).toLowerCase().trim().replace(/\.+$/, "");
  }

  function matchesHost(host, domainEntry) {
    const h = normalizeDomain(host);
    const d = normalizeDomain(domainEntry);
    if (!h || !d) return false;
    if (h === d) return true;
    return h.endsWith("." + d);
  }

  function findMatchedDomain(host, domainList) {
    if (!Array.isArray(domainList)) return null;

    for (const domainEntry of domainList) {
      if (matchesHost(host, domainEntry)) {
        return normalizeDomain(domainEntry);
      }
    }

    return null;
  }

  function isOfficialHost(host, domainList) {
    return Boolean(findMatchedDomain(host, domainList));
  }

  global.KSGovDomain = {
    normalizeDomain,
    matchesHost,
    findMatchedDomain,
    isOfficialHost
  };
})(globalThis);
