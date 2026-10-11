/*
  FILE: kitchen/js/kitchen-demo-data.js
  PURPOSE: Stand-in for the real order data the Kitchen Display would get
           from GET /api/staff/orders and the OrderHub SignalR events
           (NewOrder / OrderStatusChanged - see 07-REALTIME-ORDER-FLOW.md),
           used only when kitchen.js/signalr-client.js can't reach the
           backend.
  LOGIC:   - kitchenDemoOrders is a small in-memory array shaped exactly
             like OrderDetailDto so kitchen.js's rendering code needs zero
             branching between "real" and "demo" data.
           - advanceDemoOrderStatus() mirrors what
             PATCH /api/staff/orders/{id}/status does: moves an order
             forward one step and stamps updatedAt, matching the state
             machine in 07-REALTIME-ORDER-FLOW.md section 4.
           - demoIncomingOrderQueue + popNextDemoOrder() is what lets
             signalr-client.js simulate a "NewOrder" push arriving live when
             there's no real SignalR hub to connect to, so the "a new ticket
             appears on the board without a refresh" behaviour can actually
             be demonstrated end-to-end (see the README's testing section
             for how this was used to verify it).
*/

let nextDemoOrderId = 481;

const kitchenDemoOrders = [
    {
        id: 478,
        tableNumber: "04",
        status: "Pending",
        items: [
            { itemNameSnapshot: "Monster Double Smash", quantity: 1, unitPrice: 260, notes: "No pickles" },
            { itemNameSnapshot: "Classic Cheeseburger", quantity: 2, unitPrice: 150, notes: null },
        ],
        subtotal: 560,
        tax: 78.4,
        total: 638.4,
        createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    },
    {
        id: 479,
        tableNumber: "09",
        status: "InPreparation",
        items: [
            { itemNameSnapshot: "Chicken Ranch Pizza", quantity: 1, unitPrice: 180, notes: null },
            { itemNameSnapshot: "Golden Dragon Roll (4 Pcs)", quantity: 1, unitPrice: 205, notes: null },
        ],
        subtotal: 385,
        tax: 53.9,
        total: 438.9,
        createdAt: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    },
    {
        id: 480,
        tableNumber: "12",
        status: "Ready",
        items: [{ itemNameSnapshot: "Twin Burger Pack", quantity: 1, unitPrice: 300, notes: null }],
        subtotal: 300,
        tax: 42,
        total: 342,
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    },
];

// Orders that "arrive" one at a time when demo-mode simulates the OrderHub
// pushing a NewOrder event (see signalr-client.js). Not exhaustive - just
// enough to demonstrate the live-update behaviour during testing/demoing.
const demoIncomingOrderQueue = [
    {
        tableNumber: "07",
        items: [
            { itemNameSnapshot: "Chicken Alfredo Fettuccine", quantity: 1, unitPrice: 140, notes: null },
            { itemNameSnapshot: "Chocolate Molten Lava Cake", quantity: 1, unitPrice: 120, notes: "Extra scoop of ice cream" },
        ],
    },
    {
        tableNumber: "15",
        items: [{ itemNameSnapshot: "Mega Dessert Carnival", quantity: 1, unitPrice: 380, notes: null }],
    },
];

function popNextDemoOrder() {
    const template = demoIncomingOrderQueue.shift();
    if (!template) return null;
    const subtotal = template.items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
    const tax = Math.round(subtotal * 0.14 * 100) / 100;
    const order = {
        id: nextDemoOrderId++,
        tableNumber: template.tableNumber,
        status: "Pending",
        items: template.items,
        subtotal,
        tax,
        total: Math.round((subtotal + tax) * 100) / 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    kitchenDemoOrders.push(order);
    return order;
}

// Mirrors PATCH /api/staff/orders/{id}/status against the in-memory list.
function advanceDemoOrderStatus(orderId, newStatus) {
    const order = kitchenDemoOrders.find((o) => o.id === orderId);
    if (!order) return null;
    order.status = newStatus;
    order.updatedAt = new Date().toISOString();
    return order;
}

// Mirrors GET /api/staff/orders?status=Pending,InPreparation,Ready
function demoListOpenOrders() {
    return kitchenDemoOrders.filter((o) => o.status !== "Delivered" && o.status !== "Cancelled");
}
