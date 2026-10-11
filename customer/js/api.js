/*
  FILE: customer/js/api.js
  PURPOSE: The customer app's own API client. Deliberately smaller than
           shared/js/api-client.js: a customer never logs in and never calls
           an Admin/Staff route, so this file only implements the "Public -
           Customer-Facing" section of 08-API-CONTRACT.md (categories,
           products, best-sellers, offers, restaurant-info, POST /orders).
  LOGIC:   - request() is a trimmed copy of the same low-level fetch wrapper
             pattern used in shared/js/api-client.js (timeout + distinguishes
             "API unreachable" from "API returned an error"). It isn't
             literally shared with kitchen/admin because customer/ is meant
             to stay a fully independent, self-contained folder (see the
             header comment in customer/js/config.js) - but the request/
             response shapes below are identical to the contract, so there is
             no drift between this file and shared/js/api-client.js.
           - Every exported function tries the real backend first and only
             falls back to customer/js/demo-data.js if the backend is
             unreachable (ApiUnavailableError) - never on a real HTTP error,
             which is surfaced to the caller so the UI can show it honestly.
           - DEPLOYMENT PASS: that demo fallback now only exists on a
             developer machine (APP_CONFIG.DEMO_FALLBACK_ALLOWED, see
             config.js). On a real host an unreachable server is thrown as an
             error. Before, a brief outage during a real service made the app
             show the SAMPLE menu and answer "Demo order confirmed" for orders
             that never reached the kitchen.
*/

class ApiUnavailableError extends Error {
    constructor(message, cause) {
        super(message);
        this.name = "ApiUnavailableError";
        this.cause = cause;
    }
}

class ApiHttpError extends Error {
    constructor(status, message, body) {
        super(message);
        this.name = "ApiHttpError";
        this.status = status;
        this.body = body;
    }
}

// Fires listeners once, the first time we fall back to demo data, so app.js
// can show the "Demo mode" banner without polling for it.
const DemoMode = (() => {
    let active = false;
    const listeners = [];
    return {
        isActive: () => active,
        activate(reason) {
            if (active) return;
            active = true;
            listeners.forEach((cb) => cb(reason));
        },
        onActivate: (cb) => listeners.push(cb),
    };
})();

async function request(method, path, body) {
    // DEMO_ONLY (no BACKEND_URL configured): don't even try the network -
    // report it as "unreachable" so withFallback() serves the sample data
    // immediately, with no failed requests and no waiting for a timeout.
    if (APP_CONFIG.DEMO_ONLY) {
        throw new ApiUnavailableError("Demo mode: no backend is configured (BACKEND_URL is empty).", null);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), APP_CONFIG.REQUEST_TIMEOUT_MS);
    let res;
    try {
        res = await fetch(`${APP_CONFIG.API_BASE_URL}${path}`, {
            method,
            headers: body !== undefined ? { "Content-Type": "application/json" } : {},
            body: body !== undefined ? JSON.stringify(body) : undefined,
            signal: controller.signal,
        });
    } catch (err) {
        // User-facing wording (shown in toasts / the menu error box). The
        // technical detail stays on .cause and in the console.
        console.warn("[Scan&Eat] could not reach", `${APP_CONFIG.API_BASE_URL}${path}`, err);
        throw new ApiUnavailableError(
            "The server can't be reached right now. Please check your connection and try again.",
            err
        );
    } finally {
        clearTimeout(timer);
    }

    if (!res.ok) {
        let parsedBody = null;
        try {
            parsedBody = await res.json();
        } catch (_) {
            /* no JSON body on this error response */
        }
        throw new ApiHttpError(res.status, (parsedBody && parsedBody.message) || res.statusText, parsedBody);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
}

async function withFallback(apiCall, demoCall, reason) {
    try {
        return await apiCall();
    } catch (err) {
        if (err instanceof ApiUnavailableError && APP_CONFIG.DEMO_FALLBACK_ALLOWED) {
            DemoMode.activate(reason || err.message);
            return demoCall();
        }
        throw err;
    }
}

const MenuApi = {
    // GET /api/categories
    getCategories: () =>
        withFallback(
            () => request("GET", "/categories"),
            () => [...demoCategories],
            "GET /api/categories unreachable"
        ),

    // GET /api/products?category=&search=
    getProducts: ({ category, search } = {}) =>
        withFallback(
            () => {
                const params = new URLSearchParams();
                if (category && category !== "all") params.set("category", category);
                if (search) params.set("search", search);
                const qs = params.toString();
                return request("GET", `/products${qs ? "?" + qs : ""}`);
            },
            () => demoProductList({ category, search }),
            "GET /api/products unreachable"
        ),

    // GET /api/products/best-sellers?days=&count=
    getBestSellers: ({ days = 30, count = 5 } = {}) =>
        withFallback(
            () => request("GET", `/products/best-sellers?days=${days}&count=${count}`),
            () => demoBestSellers({ count }),
            "GET /api/products/best-sellers unreachable"
        ),

    // GET /api/offers
    getOffers: () =>
        withFallback(
            () => request("GET", "/offers"),
            () => [...demoOffers],
            "GET /api/offers unreachable"
        ),

    // GET /api/restaurant-info
    getRestaurantInfo: () =>
        withFallback(
            () => request("GET", "/restaurant-info"),
            () => demoRestaurantInfo,
            "GET /api/restaurant-info unreachable"
        ),
};

const OrdersApi = {
    // POST /api/orders -> 201 OrderResponseDto. Never falls back to fake
    // success on a real HTTP error (e.g. inactive/unknown table token) -
    // only a genuinely unreachable backend ON A DEVELOPER MACHINE triggers
    // the demo confirmation, and it's clearly labeled as such in the UI (see
    // app.js submitOrder()). On a real host an unreachable server just throws.
    submit: (createOrderDto) =>
        withFallback(
            () => request("POST", "/orders", createOrderDto),
            () => ({
                orderId: Math.floor(Math.random() * 9000) + 1000,
                status: "Pending",
                subtotal: createOrderDto.__demoSubtotal,
                tax: createOrderDto.__demoTax,
                total: createOrderDto.__demoTotal,
                demo: true,
            }),
            "POST /api/orders unreachable"
        ),
};
