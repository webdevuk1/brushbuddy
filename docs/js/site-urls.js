(function (root) {
  "use strict";

  const ORIGIN = "https://brushbuddy-roan.vercel.app";

  root.BrushSiteUrls = {
    origin: ORIGIN,
    home: ORIGIN + "/",
    privacy: ORIGIN + "/privacy.html",
    terms: ORIGIN + "/terms.html",
    cookies: ORIGIN + "/cookies.html",
    bugReport: ORIGIN + "/api/bug-report",
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
