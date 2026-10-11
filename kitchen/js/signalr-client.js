/*
  FILE: kitchen/js/signalr-client.js
  PURPOSE: Wraps the connection to OrderHub (/hubs/orders) described in
           07-REALTIME-ORDER-FLOW.md, so kitchen.js just registers a few
           callbacks (onNewOrder, onStatusChanged, onResync...) without
           knowing whether they're being fed by a real SignalR connection, a
           polling safety net, or the offline demo simulation.
  LOGIC:   - connectOrderHub() builds a real signalR.HubConnectionBuilder
             connection, exactly as illustrated in 05-FRONTEND-ARCHITECTURE.md
             section 3's code sketch (accessTokenFactory supplies the staff
             JWT, withAutomaticReconnect handles flaky wifi).
           - DEVELOPER MACHINE (APP_CONFIG.DEMO_FALLBACK_ALLOWED): if the hub
             can't be reached, DemoMode is activated and
             startDemoOrderSimulation() pops sample orders off
             kitchen-demo-data.js's queue, so "a ticket appears on the board
             without a refresh" can be seen before a backend exists. It is a
             *simulation*, never presented as a real connection (the
             demo-mode banner explains it).
           - REAL HOST (DEPLOYMENT PASS): sample orders must NEVER appear on a
             real kitchen screen, so the simulation is not available. Instead:
               * a failed first connection is retried every few seconds
                 (SignalR's withAutomaticReconnect only covers connections that
                 were ALREADY established - a first start() failure used to
                 leave the screen dead until someone refreshed it);
               * after SignalR gives up reconnecting (onclose) it is started
                 again the same way;
               * while the hub is not connected - including when the CDN script
                 for the SignalR client itself could not be loaded - the open
                 orders are re-read from GET /api/staff/orders every 10 seconds
                 (onResync) so tickets keep arriving, just a few seconds late;
               * every (re)connect triggers one onResync() too, which picks up
                 anything that was sent while the connection was down;
               * an expired staff token sends the user to the login page
                 instead of retrying forever with a token the server rejects.
*/

const HUB_RETRY_DELAY_MS = 5000;
const HUB_POLL_INTERVAL_MS = 10000;

function connectOrderHub({ onNewOrder, onStatusChanged, onConnectionStateChange, onResync }) {
    const demoAllowed = APP_CONFIG.DEMO_FALLBACK_ALLOWED;
    let hubConnected = false;

    // Safety net for real hosts: poll while the live connection is down.
    function startPollingSafetyNet() {
        if (demoAllowed || typeof onResync !== "function") return;
        setInterval(() => {
            if (!hubConnected) onResync();
        }, HUB_POLL_INTERVAL_MS);
    }

    function fallBackToDemo(reason) {
        DemoMode.activate(reason);
        startDemoOrderSimulation({ onNewOrder });
        onConnectionStateChange("demo");
    }

    // No backend configured at all (frontend-only preview): go straight to the
    // sample-order simulation, without loading or contacting anything.
    if (APP_CONFIG.DEMO_ONLY) {
        fallBackToDemo("No backend configured (BACKEND_URL is empty)");
        return;
    }

    if (typeof signalR === "undefined") {
        // The <script> tag for the SignalR client library itself failed to load
        // (CDN unreachable, blocked...).
        if (demoAllowed) {
            fallBackToDemo("SignalR client library did not load");
        } else {
            console.error("[Scan&Eat] SignalR client library did not load - using polling only.");
            onConnectionStateChange("disconnected");
            if (typeof onResync === "function") onResync();
            startPollingSafetyNet();
        }
        return;
    }

    const connection = new signalR.HubConnectionBuilder()
        // withCredentials:false - the staff JWT travels in the token factory
        // (header / access_token), never in cookies. The client's default
        // (true) makes the browser demand "Access-Control-Allow-Credentials"
        // on the negotiate call, which breaks as soon as the frontend (e.g.
        // Vercel) and the API live on different origins.
        .withUrl(APP_CONFIG.HUB_URL, { accessTokenFactory: () => Auth.getToken(), withCredentials: false })
        .withAutomaticReconnect()
        .build();

    connection.on("NewOrder", onNewOrder);
    connection.on("OrderStatusChanged", (orderId, newStatus) => onStatusChanged(orderId, newStatus));

    function startWithRetry() {
        // A token the server will reject can never reconnect - go to login.
        if (!demoAllowed && !Auth.isAuthenticated()) {
            Auth.logout();
            return;
        }

        connection
            .start()
            .then(() => {
                hubConnected = true;
                onConnectionStateChange("connected");
                // Anything sent while we were offline is picked up here.
                if (typeof onResync === "function" && !demoAllowed) onResync();
            })
            .catch((err) => {
                hubConnected = false;
                if (demoAllowed) {
                    fallBackToDemo("Could not connect to " + APP_CONFIG.HUB_URL);
                    return;
                }
                console.warn("[Scan&Eat] could not connect to", APP_CONFIG.HUB_URL, "- retrying", err);
                onConnectionStateChange("disconnected");
                setTimeout(startWithRetry, HUB_RETRY_DELAY_MS);
            });
    }

    connection.onreconnecting(() => {
        hubConnected = false;
        onConnectionStateChange("reconnecting");
    });
    connection.onreconnected(() => {
        hubConnected = true;
        onConnectionStateChange("connected");
        if (typeof onResync === "function" && !demoAllowed) onResync();
    });
    connection.onclose(() => {
        hubConnected = false;
        onConnectionStateChange("disconnected");
        // Automatic reconnect gave up (long outage / server restart): start over.
        if (!demoAllowed) setTimeout(startWithRetry, HUB_RETRY_DELAY_MS);
    });

    startPollingSafetyNet();
    startWithRetry();
}

// Simulates the hub pushing a NewOrder event every ~18s until the small
// demo queue in kitchen-demo-data.js is empty. Also exposes a manual
// trigger (window.simulateIncomingDemoOrder) used by the "Simulate Order"
// button in the demo banner, so this can be exercised deterministically
// in tests instead of waiting on the timer. Developer machines only.
function startDemoOrderSimulation({ onNewOrder }) {
    function pushNext() {
        const order = popNextDemoOrder();
        if (order) onNewOrder(order);
        return order;
    }

    window.simulateIncomingDemoOrder = pushNext;

    const interval = setInterval(() => {
        const order = pushNext();
        if (!order) clearInterval(interval);
    }, 18000);
}
