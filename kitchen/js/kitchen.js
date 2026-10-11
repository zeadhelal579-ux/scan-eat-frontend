/*
  FILE: kitchen/js/kitchen.js
  PURPOSE: Everything the Kitchen Display page (index.html) does: guard the
           page behind staff login, load whatever orders are already open,
           connect to the live order feed, render order cards, and handle
           the status buttons kitchen staff tap as they cook.
  LOGIC:   - Boot sequence matches 05-FRONTEND-ARCHITECTURE.md section 3
             exactly: (1) GET /api/staff/orders?status=... on page load so a
             refresh never loses in-progress orders, THEN (2) open the
             SignalR connection and start listening for NewOrder /
             OrderStatusChanged.
           - orders is a Map<orderId, order> - the single source of truth
             the board is rendered from, so a NewOrder push, a status-button
             tap, and an OrderStatusChanged push all go through the exact
             same renderBoard() path instead of three different DOM-patching
             code paths that could drift out of sync with each other.
           - The initial GET query intentionally includes "Ready" in
             addition to the "Pending,InPreparation" the contract's example
             shows, because a KDS needs to keep showing an order until it's
             actually delivered, not just until it's cooked (see the
             README's "Deliberate Extensions" section).
*/

const STATUS_META = {
    Pending: { label: "New", next: "InPreparation", nextLabel: "Start Preparing" },
    InPreparation: { label: "Cooking", next: "Ready", nextLabel: "Mark Ready" },
    Ready: { label: "Ready", next: "Delivered", nextLabel: "Mark Delivered" },
    Delivered: { label: "Delivered", next: null, nextLabel: null },
    Cancelled: { label: "Cancelled", next: null, nextLabel: null },
};

const orders = new Map();
let activeFilter = "All";

// orderId -> Date.now() of the last change that came from a live source (a
// NewOrder / OrderStatusChanged push, or a button tapped on THIS screen).
// A re-read of GET /api/staff/orders (loadInitialOrders) may have been built by
// the server a moment BEFORE such a change; without this registry its stale
// answer could delete a ticket that had just arrived by push, or revert a
// status that had just changed, until the next resync (which, while the hub is
// connected, may be never). See loadInitialOrders().
const lastTouchedAt = new Map();
function touchOrder(orderId) {
    lastTouchedAt.set(orderId, Date.now());
}

function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function minutesAgo(isoString) {
    return Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / 60000));
}

function renderBoard() {
    const board = document.getElementById("orders-board");
    const visible = [...orders.values()]
        .filter((o) => o.status !== "Delivered" && o.status !== "Cancelled")
        .filter((o) => activeFilter === "All" || o.status === activeFilter)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    document.getElementById("board-empty-msg").hidden = visible.length !== 0;

    board.innerHTML = visible.map(renderCard).join("");
}

function renderCard(order) {
    const meta = STATUS_META[order.status] || { label: order.status, next: null };
    const itemsHtml = order.items
        .map(
            (i) => `
            <li>
                <span class="item-qty">${i.quantity}×</span>
                <span class="item-name">${escapeHtml(i.itemNameSnapshot)}</span>
                ${i.notes ? `<span class="item-notes">"${escapeHtml(i.notes)}"</span>` : ""}
            </li>`
        )
        .join("");

    const actionsHtml = `
        ${
            meta.next
                ? `<button class="advance-btn" data-order-id="${order.id}" data-next-status="${meta.next}">${meta.nextLabel}</button>`
                : ""
        }
        ${
            order.status === "Pending" || order.status === "InPreparation"
                ? `<button class="cancel-btn" data-order-id="${order.id}">Cancel</button>`
                : ""
        }
    `;

    return `
        <article class="order-card status-${order.status}" data-order-id="${order.id}">
            <header class="order-card-header">
                <span class="table-number">Table ${escapeHtml(order.tableNumber)}</span>
                <span class="status-pill">${meta.label}</span>
            </header>
            <div class="order-meta">
                <span>#${order.id}</span>
                <span class="elapsed" data-created-at="${order.createdAt}">${minutesAgo(order.createdAt)} min ago</span>
            </div>
            <ul class="order-items">${itemsHtml}</ul>
            <footer class="order-card-actions">${actionsHtml}</footer>
        </article>
    `;
}

function tickElapsedTimes() {
    document.querySelectorAll(".elapsed").forEach((el) => {
        el.textContent = `${minutesAgo(el.dataset.createdAt)} min ago`;
    });
}

// Loads (or re-loads) every open order from GET /api/staff/orders and makes the
// board match it. Called on page load, after every hub (re)connect and by the
// polling safety net (see signalr-client.js) - so it never throws: a failure
// just leaves the board as it is and the next attempt tries again.
async function loadInitialOrders() {
    const requestStartedAt = Date.now();
    // true when a live push / local action touched this order AFTER the request
    // went out - the server's answer may predate that change, so it must not win.
    const changedMeanwhile = (id) => (lastTouchedAt.get(id) || 0) >= requestStartedAt;

    try {
        const list = await ApiClient.withFallback(
            () => StaffOrdersApi.listOpen("Pending,InPreparation,Ready"),
            () => demoListOpenOrders(),
            "GET /api/staff/orders unreachable"
        );

        // Live mode only: forget tickets the server no longer lists as open
        // (delivered/cancelled from another screen while we were offline). In
        // demo mode the local simulation is the source of truth, so keep it.
        if (!DemoMode.isActive()) {
            const openIds = new Set(list.map((o) => o.id));
            for (const id of [...orders.keys()]) {
                if (!openIds.has(id) && !changedMeanwhile(id)) orders.delete(id);
            }
        }

        list.forEach((o) => {
            if (!changedMeanwhile(o.id)) orders.set(o.id, o);
        });
        renderBoard();
    } catch (err) {
        // A 401 has already sent the user to the login page (api-client.js).
        console.warn("[Scan&Eat] could not load the open orders:", err);
    }
}

async function handleAdvance(orderId, nextStatus) {
    try {
        await ApiClient.withFallback(
            () => StaffOrdersApi.updateStatus(orderId, nextStatus),
            () => advanceDemoOrderStatus(orderId, nextStatus),
            "PATCH /api/staff/orders/{id}/status unreachable"
        );
        applyStatusChange(orderId, nextStatus);
    } catch (err) {
        // 401 = expired session; api-client.js is already redirecting to login.
        if (err.status === 401) return;
        alert(`Couldn't update order #${orderId}: ${err.message}`);
    }
}

function applyStatusChange(orderId, newStatus) {
    touchOrder(orderId);
    const order = orders.get(orderId);
    if (!order) return;
    order.status = newStatus;
    order.updatedAt = new Date().toISOString();
    renderBoard();
}

function setConnectionIndicator(stateLabel) {
    const el = document.getElementById("connection-indicator");
    el.textContent =
        stateLabel === "connected"
            ? "🟢 Live"
            : stateLabel === "reconnecting"
            ? "🟡 Reconnecting…"
            : stateLabel === "demo"
            ? "🟠 Demo simulation"
            : "🔴 Disconnected - retrying…";
}

window.addEventListener("DOMContentLoaded", async () => {
    if (!Auth.guardPage({ requireRole: "Staff" })) return;

    document.getElementById("staff-name").textContent = Auth.getUsername() || Auth.getRole();
    document.getElementById("logout-btn").addEventListener("click", () => Auth.logout());

    document.querySelectorAll(".filter-tab").forEach((tab) => {
        tab.addEventListener("click", () => {
            activeFilter = tab.dataset.status;
            document.querySelectorAll(".filter-tab").forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");
            renderBoard();
        });
    });

    document.getElementById("orders-board").addEventListener("click", (e) => {
        const advanceBtn = e.target.closest(".advance-btn");
        if (advanceBtn) {
            handleAdvance(Number(advanceBtn.dataset.orderId), advanceBtn.dataset.nextStatus);
            return;
        }
        const cancelBtn = e.target.closest(".cancel-btn");
        if (cancelBtn && confirm("Cancel this order?")) {
            handleAdvance(Number(cancelBtn.dataset.orderId), "Cancelled");
        }
    });

    DemoMode.onActivate((reason) => {
        const banner = document.getElementById("demo-mode-banner");
        document.getElementById("demo-mode-banner-text").textContent = APP_CONFIG.DEMO_BANNER_TEXT;
        banner.hidden = false;
        document.getElementById("simulate-order-btn").hidden = false;
    });

    document.getElementById("simulate-order-btn").addEventListener("click", () => {
        if (typeof window.simulateIncomingDemoOrder === "function") {
            const order = window.simulateIncomingDemoOrder();
            if (order) {
                orders.set(order.id, order);
                renderBoard();
            } else {
                alert("No more demo orders queued.");
            }
        }
    });

    await loadInitialOrders();

    connectOrderHub({
        onNewOrder: (order) => {
            touchOrder(order.id);
            orders.set(order.id, order);
            renderBoard();
        },
        onStatusChanged: (orderId, newStatus) => applyStatusChange(Number(orderId), newStatus),
        onConnectionStateChange: setConnectionIndicator,
        // Re-read the open orders after a (re)connect and, on a real host,
        // every 10 s while the live connection is down (see signalr-client.js).
        onResync: loadInitialOrders,
    });

    setInterval(tickElapsedTimes, 30000);
});
