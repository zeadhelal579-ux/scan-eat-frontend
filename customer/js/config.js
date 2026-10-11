/*
  FILE: customer/js/config.js
  PURPOSE: The customer app's own copy of the backend address. It does NOT
           load shared/js/config.js on purpose: a customer's phone should only
           ever download what the customer app needs, nothing staff-related,
           and this folder should stay runnable on its own.
  THE ONE SETTING YOU EDIT: BACKEND_URL (keep it identical to the one in
           shared/js/config.js).
           ""                         -> NO BACKEND (default in this
                                         frontend-only package): demo mode on
                                         sample data, orders are simulated and
                                         NOT sent to any kitchen.
           "https://api.example.com"  -> the deployed ASP.NET Core backend
                                         (no trailing slash, no "/api").
           "same-origin"              -> served by the backend's own wwwroot.
  LOGIC:   With a backend configured an unreachable server is a visible error
           (the cart is kept so the customer can retry) - never a fake "order
           confirmed" for an order that did not reach the kitchen. The sample
           fallback only exists on a developer machine or in DEMO_ONLY mode.
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
        DEMO_ONLY: demoOnly,
        API_BASE_URL: demoOnly ? "" : `${backendOrigin}/api`,
        REQUEST_TIMEOUT_MS: isLocalDev ? 6000 : 15000,
        DEMO_FALLBACK_ALLOWED: demoOnly || isLocalDev,
        DEMO_BANNER_TEXT: demoOnly
            ? "Demo preview — sample menu data. Orders placed here are simulated and are NOT sent to any kitchen."
            : "Demo mode — showing sample menu data because the backend isn't reachable. " +
              "Everything below (browsing, cart, checkout) works the same way it will once the API is live.",
    };
})();
