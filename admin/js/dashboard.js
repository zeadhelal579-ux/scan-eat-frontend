/*
  FILE: admin/js/dashboard.js
  PURPOSE: Populates the dashboard's summary tiles and best-sellers table.
  LOGIC:   - Best sellers: GET /api/admin/reports/best-sellers?days=30, with
             a demo fallback that mirrors it exactly.
           - Sales summary (orders/revenue/avg today): calls
             GET /api/admin/reports/sales-summary, which 08-API-CONTRACT.md
             marks "Phase 2". Real backends that haven't built it yet will
             return 404 - handled gracefully below (tiles show "—" instead
             of the page breaking), rather than assuming it always exists.
           - Active table count: GET /api/admin/tables, counting isActive.
*/

// See admin/js/products.js header comment - same defensive-escaping fix
// applied here for the product/category name text this table renders via
// innerHTML.
function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatEGP(n) {
    return `EGP ${Math.round(n).toLocaleString()}`;
}

async function loadSummaryTiles() {
    try {
        const summary = await ApiClient.withFallback(
            () => ReportsApi.salesSummary(new Date().toISOString().slice(0, 10), new Date().toISOString().slice(0, 10)),
            () => demoSalesSummary(),
            "GET /api/admin/reports/sales-summary unreachable"
        );
        document.getElementById("tile-orders-today").textContent = summary.ordersToday;
        document.getElementById("tile-revenue-today").textContent = formatEGP(summary.revenueToday);
        document.getElementById("tile-avg-order").textContent = formatEGP(summary.averageOrderValue);
    } catch (err) {
        // Phase 2 endpoint not implemented yet on a real backend (404) -
        // degrade gracefully rather than breaking the whole dashboard.
        ["tile-orders-today", "tile-revenue-today", "tile-avg-order"].forEach((id) => {
            document.getElementById(id).textContent = "—";
        });
    }

    try {
        const tables = await ApiClient.withFallback(
            () => TablesAdminApi.list(),
            () => demoListTables(),
            "GET /api/admin/tables unreachable"
        );
        document.getElementById("tile-active-tables").textContent = tables.filter((t) => t.isActive).length;
    } catch (err) {
        document.getElementById("tile-active-tables").textContent = "—";
    }
}

async function loadBestSellers() {
    const products = await ApiClient.withFallback(
        () => ReportsApi.bestSellers(30),
        () => demoBestSellersReport(5),
        "GET /api/admin/reports/best-sellers unreachable"
    );
    const categories = await ApiClient.withFallback(
        () => CategoriesApi.list(),
        () => [...demoAdminCategories],
        "GET /api/categories unreachable"
    );
    const catName = (id) => (categories.find((c) => c.id === id) || {}).name || "—";

    document.getElementById("best-sellers-body").innerHTML = products
        .map(
            (p) => `<tr>
                <td>${escapeHtml(p.name)}</td>
                <td>${escapeHtml(catName(p.categoryId))}</td>
                <td>${p.orderCount ?? "—"}</td>
                <td>EGP ${p.price}</td>
            </tr>`
        )
        .join("");
}

window.addEventListener("DOMContentLoaded", async () => {
    if (!initAdminPage()) return;
    await Promise.all([loadSummaryTiles(), loadBestSellers()]);
});
