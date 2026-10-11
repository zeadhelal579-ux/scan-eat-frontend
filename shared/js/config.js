/*
  FILE: shared/js/config.js
  PURPOSE: Single source of truth for where the backend lives, used by every
           script in kitchen/ and admin/ (loaded before api-client.js and
           auth.js on every staff page).
  THE ONE SETTING YOU EDIT: BACKEND_URL (just below).
           ""                         -> NO BACKEND (the default in this
                                         frontend-only package). The apps run
                                         in DEMO MODE: sample menu, sample
                                         kitchen tickets, sample admin data,
                                         all inside the browser. Nothing is
                                         sent anywhere and no network call is
                                         even attempted. Right for a
                                         frontend-only preview (Vercel,
                                         GitHub Pages ...).
           "https://api.example.com"  -> the deployed ASP.NET Core backend
                                         (no trailing slash, no "/api").
           "same-origin"              -> this folder is being served by the
                                         backend itself (its wwwroot).
  LOGIC:   - With a backend configured, EVERY request goes to it and an
             unreachable server is shown as an error. The sample-data
             fallback only exists on a developer machine (localhost / file://),
             so real customers and staff can never be shown sample data or a
             fake "order sent" confirmation.
           - DEMO_ONLY is the explicit "no backend" mode described above.
           - The customer app keeps its own copy of this file
             (customer/js/config.js) so it stays fully self-contained; keep
             the BACKEND_URL line in both files identical.
*/

const APP_CONFIG = (() => {
    // ======================= THE ONE SETTING TO EDIT =======================
    const BACKEND_URL = "";
    // =======================================================================

    const { hostname, protocol, origin } = window.location;
    const isLocalDev =
        ["localhost", "127.0.0.1", "::1", "[::1]", "0.0.0.0"].includes(hostname) || protocol === "file:";

    const configured = BACKEND_URL.trim().replace(/\/+$/, "");
    const demoOnly = configured === "";
    const backendOrigin = configured === "same-origin" ? origin : configured;

    return {
        // true = no backend at all: run the whole app on sample data.
        DEMO_ONLY: demoOnly,

        // Base URL for every REST call in 08-API-CONTRACT.md ("/api/..."
        // routes are appended to this by shared/js/api-client.js).
        API_BASE_URL: demoOnly ? "" : `${backendOrigin}/api`,

        // SignalR hub URL ("OrderHub" mapped at /hubs/orders). Used only by
        // kitchen/js/signalr-client.js.
        HUB_URL: demoOnly ? "" : `${backendOrigin}/hubs/orders`,

        // How long a request waits for the backend before it counts as
        // "unreachable". Short on a developer machine, longer on a real host
        // because restaurant wifi and mobile data are slower than localhost.
        REQUEST_TIMEOUT_MS: isLocalDev ? 6000 : 15000,

        // May the apps fall back to sample data? Always in DEMO_ONLY; with a
        // backend configured only on a developer machine.
        DEMO_FALLBACK_ALLOWED: demoOnly || isLocalDev,

        // Shown in the demo-mode banner so nobody mistakes sample data for a
        // real connection.
        DEMO_BANNER_TEXT: demoOnly
            ? "Demo preview — sample data only, running entirely in your browser. " +
              "Nothing you do here is sent anywhere. Set BACKEND_URL in " +
              "shared/js/config.js to connect the real backend."
            : "Demo mode — the backend isn't reachable at " + backendOrigin +
              ", so you're viewing sample data. Every screen still works; " +
              "real orders/products will appear the moment the API is reachable.",
    };
})();
