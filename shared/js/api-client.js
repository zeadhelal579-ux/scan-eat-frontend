/*
  FILE: shared/js/api-client.js
  PURPOSE: The single, typed mirror of 08-API-CONTRACT.md that the Kitchen
           Display and Admin Dashboard call instead of writing raw fetch()
           calls in every page script. Every function name, HTTP method,
           route and request/response shape below matches that document
           exactly, so this file (not any individual page) is the one place
           that needs updating if the backend's contract ever changes.
  LOGIC:   - request() is the one low-level fetch wrapper: it builds the
             full URL from APP_CONFIG.API_BASE_URL, attaches the staff JWT
             (via Auth.getToken()) when auth:true is passed, applies a
             timeout, and turns a network failure into an ApiUnavailableError
             that callers can catch and recover from - as opposed to an
             ApiHttpError, which means the backend WAS reached and returned
             a real 4xx/5xx that should be shown to the user, not hidden.
           - withFallback() is what lets every page work today, before the
             ASP.NET Core backend exists (see 01-PROJECT-OVERVIEW.md #7,
             "Backend API: Not started"): if request() throws
             ApiUnavailableError, withFallback() flips DemoMode on and calls
             a same-shaped local function from *-demo-data.js instead. A
             real ApiHttpError is never swallowed this way - only true
             unreachability is.
           - DEPLOYMENT PASS: demo fallback only exists on a developer machine
             (APP_CONFIG.DEMO_FALLBACK_ALLOWED, see config.js). On a real host
             an unreachable server is thrown as an error, so the kitchen can
             never be shown sample orders and the admin can never "save"
             changes that went nowhere.
           - DEPLOYMENT PASS: a 401 on a protected call means the staff JWT
             expired (Jwt:ExpiryHours) or was rejected - the session is cleared
             and the browser is sent to that app's login page instead of
             showing a cryptic "HTTP 401" alert on every button.
           - Everything below this point is organized by resource, in the
             same order as 08-API-CONTRACT.md's sections 1-6.
  WHY SHARED: Kitchen and Admin both talk to overlapping parts of the same
           API (staff order list, login). Centralizing it here means the two
           apps can never drift out of sync with each other or with the
           contract document. The customer app intentionally does NOT load
           this file; it has its own smaller customer/js/api.js with only
           the public + order-submission endpoints it actually needs.
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

// Tracks whether we've fallen back to demo data, and lets any page subscribe
// to that happening so it can show a "Demo mode" banner the moment it does.
const DemoMode = (() => {
    let active = false;
    let reason = "";
    const listeners = [];

    function activate(why) {
        if (active) return;
        active = true;
        reason = why || "";
        listeners.forEach((cb) => cb(reason));
    }

    return {
        isActive: () => active,
        getReason: () => reason,
        activate,
        onActivate: (cb) => listeners.push(cb),
    };
})();

const ApiClient = (() => {
    // Low-level fetch wrapper shared by every resource call below.
    async function request(method, path, { body, auth = false, isBlob = false } = {}) {
        // DEMO_ONLY (no BACKEND_URL configured): don't even try the network -
        // report it as "unreachable" so withFallback() serves the sample data
        // immediately, with no failed requests and no waiting for a timeout.
        if (APP_CONFIG.DEMO_ONLY) {
            throw new ApiUnavailableError("Demo mode: no backend is configured (BACKEND_URL is empty).", null);
        }

        const controller = new AbortController();
        const timeoutMs = (typeof APP_CONFIG !== "undefined" && APP_CONFIG.REQUEST_TIMEOUT_MS) || 6000;
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        const headers = {};
        if (body !== undefined) headers["Content-Type"] = "application/json";
        if (auth) {
            const token = typeof Auth !== "undefined" ? Auth.getToken() : null;
            if (token) headers["Authorization"] = `Bearer ${token}`;
        }

        let res;
        try {
            res = await fetch(`${APP_CONFIG.API_BASE_URL}${path}`, {
                method,
                headers,
                body: body !== undefined ? JSON.stringify(body) : undefined,
                signal: controller.signal,
            });
        } catch (err) {
            // User-facing wording; the technical detail stays on .cause and in the console.
            console.warn("[Scan&Eat] could not reach", `${APP_CONFIG.API_BASE_URL}${path}`, err);
            throw new ApiUnavailableError(
                "The server can't be reached right now. Please check the connection and try again.",
                err
            );
        } finally {
            clearTimeout(timer);
        }

        if (res.status === 204) return null;

        // Expired/invalid staff session on a protected call -> back to login.
        // (Not for the login call itself: there a 401 just means wrong credentials.)
        if (res.status === 401 && auth && typeof Auth !== "undefined") {
            Auth.logout();
            // The browser is already on its way to the login page. Returning a
            // promise that never settles (instead of throwing) means no caller
            // flashes an error message or runs follow-up code in the meantime,
            // and nothing ends up as an "Uncaught (in promise)" console error.
            return new Promise(() => {});
        }

        if (!res.ok) {
            let parsedBody = null;
            try {
                parsedBody = await res.json();
            } catch (_) {
                /* body wasn't JSON - fine, keep parsedBody null */
            }
            throw new ApiHttpError(
                res.status,
                (parsedBody && parsedBody.message) || res.statusText || `HTTP ${res.status}`,
                parsedBody
            );
        }

        if (isBlob) return res.blob();
        const text = await res.text();
        return text ? JSON.parse(text) : null;
    }

    // Runs apiCall(); if the API is unreachable, activates demo mode and
    // runs demoCall() instead. A genuine HTTP error from a live backend is
    // re-thrown so the calling page can show it (never silently hidden).
    async function withFallback(apiCall, demoCall, reason) {
        try {
            return await apiCall();
        } catch (err) {
            if (err instanceof ApiUnavailableError && APP_CONFIG.DEMO_FALLBACK_ALLOWED) {
                DemoMode.activate(reason || err.message);
                return await demoCall();
            }
            throw err;
        }
    }

    return { request, withFallback };
})();

/* ---------------------------------------------------------------------- *
 * 1. Public - Customer-Facing (kitchen/admin only read these for display)
 * ---------------------------------------------------------------------- */

const CategoriesApi = {
    // GET /api/categories
    list: () => ApiClient.request("GET", "/categories"),
};

const ProductsApi = {
    // GET /api/products?category=&search=
    list: ({ category, search } = {}) => {
        const params = new URLSearchParams();
        if (category && category !== "all") params.set("category", category);
        if (search) params.set("search", search);
        const qs = params.toString();
        return ApiClient.request("GET", `/products${qs ? "?" + qs : ""}`);
    },
    // GET /api/products/{id}
    get: (id) => ApiClient.request("GET", `/products/${id}`),
    // GET /api/products/best-sellers?days=&count=
    bestSellers: ({ days = 30, count = 5 } = {}) =>
        ApiClient.request("GET", `/products/best-sellers?days=${days}&count=${count}`),
};

const OffersApi = {
    // GET /api/offers
    list: () => ApiClient.request("GET", "/offers"),
};

const RestaurantInfoApi = {
    // GET /api/restaurant-info
    get: () => ApiClient.request("GET", "/restaurant-info"),
};

const OrdersApi = {
    // POST /api/orders  (CreateOrderDto -> OrderResponseDto, 201)
    submit: (createOrderDto) => ApiClient.request("POST", "/orders", { body: createOrderDto }),
};

/* ---------------------------------------------------------------------- *
 * 2. Auth
 * ---------------------------------------------------------------------- */

const AuthApi = {
    // POST /api/auth/login -> { token, role }
    login: (username, password) =>
        ApiClient.request("POST", "/auth/login", { body: { username, password } }),
};

/* ---------------------------------------------------------------------- *
 * 3. Admin - Catalog Management
 * ---------------------------------------------------------------------- */

const CategoriesAdminApi = {
    create: (categoryDto) => ApiClient.request("POST", "/admin/categories", { body: categoryDto, auth: true }),
    update: (id, categoryDto) => ApiClient.request("PUT", `/admin/categories/${id}`, { body: categoryDto, auth: true }),
    remove: (id) => ApiClient.request("DELETE", `/admin/categories/${id}`, { auth: true }),
};

const ProductsAdminApi = {
    create: (productDto) => ApiClient.request("POST", "/admin/products", { body: productDto, auth: true }),
    update: (id, productDto) => ApiClient.request("PUT", `/admin/products/${id}`, { body: productDto, auth: true }),
    setAvailability: (id, isAvailable) =>
        ApiClient.request("PATCH", `/admin/products/${id}/availability`, { body: { isAvailable }, auth: true }),
    remove: (id) => ApiClient.request("DELETE", `/admin/products/${id}`, { auth: true }),
};

const OffersAdminApi = {
    create: (offerDto) => ApiClient.request("POST", "/admin/offers", { body: offerDto, auth: true }),
    update: (id, offerDto) => ApiClient.request("PUT", `/admin/offers/${id}`, { body: offerDto, auth: true }),
    remove: (id) => ApiClient.request("DELETE", `/admin/offers/${id}`, { auth: true }),
};

/* ---------------------------------------------------------------------- *
 * 4. Admin - Tables & QR Codes
 * ---------------------------------------------------------------------- */

const TablesAdminApi = {
    list: () => ApiClient.request("GET", "/admin/tables", { auth: true }),
    create: (tableNumber) => ApiClient.request("POST", "/admin/tables", { body: { tableNumber }, auth: true }),
    // Returns a PNG Blob (protected route - can't be used as a bare <img src>,
    // must be fetched with the Authorization header then turned into an
    // object URL; see admin/js/tables.js).
    qrCode: (id) => ApiClient.request("GET", `/admin/tables/${id}/qr-code`, { auth: true, isBlob: true }),
    setActive: (id, isActive) => ApiClient.request("PATCH", `/admin/tables/${id}`, { body: { isActive }, auth: true }),
};

/* ---------------------------------------------------------------------- *
 * 5. Staff - Orders (Kitchen/Cashier)
 * ---------------------------------------------------------------------- */

const StaffOrdersApi = {
    // GET /api/staff/orders?status=Pending,InPreparation,Ready
    listOpen: (statusCsv = "Pending,InPreparation,Ready") =>
        ApiClient.request("GET", `/staff/orders?status=${encodeURIComponent(statusCsv)}`, { auth: true }),
    // PATCH /api/staff/orders/{id}/status
    updateStatus: (id, status) =>
        ApiClient.request("PATCH", `/staff/orders/${id}/status`, { body: { status }, auth: true }),
};

/* ---------------------------------------------------------------------- *
 * 6. Admin - Reports
 * ---------------------------------------------------------------------- */

const ReportsApi = {
    bestSellers: (days = 30) => ApiClient.request("GET", `/admin/reports/best-sellers?days=${days}`, { auth: true }),
    // Phase 2 per 08-API-CONTRACT.md - callers must handle a 404 gracefully
    // until the backend implements it.
    salesSummary: (from, to) =>
        ApiClient.request("GET", `/admin/reports/sales-summary?from=${from}&to=${to}`, { auth: true }),
};
