/*
  FILE: landing.js
  PURPOSE: Fills in the status badge on the launcher page (index.html) so it
           is obvious whether the apps are running on sample data (demo
           preview) or talking to a real backend.
  LOGIC:   Reads APP_CONFIG from shared/js/config.js (loaded just before this
           file). An external file rather than an inline <script> because the
           site's Content-Security-Policy (vercel.json) forbids inline scripts.
*/
(function () {
    var badge = document.getElementById("mode-badge");
    if (!badge || typeof APP_CONFIG === "undefined") return;

    if (APP_CONFIG.DEMO_ONLY) {
        badge.textContent = "Demo preview \u00b7 sample data";
        badge.classList.add("demo");
    } else {
        badge.textContent = "Connected to the backend";
    }
})();
