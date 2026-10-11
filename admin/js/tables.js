/*
  FILE: admin/js/tables.js
  PURPOSE: Everything tables.html does: list tables, add a new one (the
           server/demo mirror generates its QrToken - the admin never types
           one in, matching 06-QR-CODE-AND-TABLE-FLOW.md's "unguessable,
           not chosen by a human" design), toggle active/inactive, and show
           the QR code image.
  LOGIC:   GET /api/admin/tables/{id}/qr-code is a JWT-protected route, so
           it can't be used directly as an <img src> (a bare <img> tag
           can't attach an Authorization header). Instead getQrImageUrl()
           fetches it as a Blob via ApiClient (which does attach the
           header - see shared/js/api-client.js's isBlob option) and turns
           it into an object URL, which the <img> and the Download link
           both then use. Every object URL is revoked when the modal closes
           to avoid leaking memory across repeated opens.
*/

let allTables = [];
let currentObjectUrl = null;

// See admin/js/products.js header comment - same defensive-escaping fix
// applied here for the table-number field (both the board row and the
// print window below read it back out and re-inject it as markup).
function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderTablesTable() {
    document.getElementById("tables-table-body").innerHTML = allTables
        .map(
            (t) => `
        <tr data-id="${t.id}">
            <td>Table ${escapeHtml(t.tableNumber)}</td>
            <td>
                <label class="toggle-switch">
                    <input type="checkbox" class="active-toggle" data-id="${t.id}" ${t.isActive ? "checked" : ""}>
                    <span class="toggle-slider"></span>
                </label>
                <span class="badge ${t.isActive ? "badge-active" : "badge-inactive"}" style="margin-left:8px;">${t.isActive ? "Active" : "Inactive"}</span>
            </td>
            <td><button class="btn btn-secondary btn-sm view-qr-btn" data-id="${t.id}">View QR</button></td>
            <td></td>
        </tr>`
        )
        .join("");
}

async function handleAddTable(e) {
    e.preventDefault();
    const input = document.getElementById("new-table-number");
    const tableNumber = input.value.trim();
    if (!tableNumber) return;
    try {
        const table = await ApiClient.withFallback(
            () => TablesAdminApi.create(tableNumber),
            () => demoCreateTable(tableNumber),
            "POST /api/admin/tables unreachable"
        );
        allTables.push(table);
        renderTablesTable();
        input.value = "";
    } catch (err) {
        alert(`Couldn't create the table: ${err.message}`);
    }
}

async function handleActiveToggle(checkbox) {
    const id = Number(checkbox.dataset.id);
    const isActive = checkbox.checked;
    try {
        await ApiClient.withFallback(
            () => TablesAdminApi.setActive(id, isActive),
            () => demoSetTableActive(id, isActive),
            "PATCH /api/admin/tables/{id} unreachable"
        );
        const table = allTables.find((t) => t.id === id);
        if (table) table.isActive = isActive;
        renderTablesTable();
    } catch (err) {
        checkbox.checked = !isActive;
        alert(`Couldn't update the table: ${err.message}`);
    }
}

async function openQrModal(table) {
    document.getElementById("qr-modal-title").textContent = `Table ${table.tableNumber} — QR Code`;
    document.getElementById("qr-image-wrapper").innerHTML = "<span>Loading…</span>";
    document.getElementById("qr-demo-note").hidden = true;
    document.getElementById("qr-modal").hidden = false;

    try {
        const blob = await ApiClient.withFallback(
            () => TablesAdminApi.qrCode(table.id),
            () => demoQrPlaceholderBlob(table),
            "GET /api/admin/tables/{id}/qr-code unreachable"
        );
        if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
        currentObjectUrl = URL.createObjectURL(blob);

        document.getElementById("qr-image-wrapper").innerHTML = `<img src="${currentObjectUrl}" alt="QR code for Table ${escapeHtml(table.tableNumber)}">`;
        const downloadBtn = document.getElementById("qr-download-btn");
        downloadBtn.href = currentObjectUrl;
        downloadBtn.download = `table-${table.tableNumber}-qr.${DemoMode.isActive() ? "svg" : "png"}`;

        document.getElementById("qr-demo-note").hidden = !DemoMode.isActive();
    } catch (err) {
        document.getElementById("qr-image-wrapper").innerHTML = `<span>Couldn't load QR: ${escapeHtml(err.message)}</span>`;
    }
}

function closeQrModal() {
    document.getElementById("qr-modal").hidden = true;
    if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
        currentObjectUrl = null;
    }
}

window.addEventListener("DOMContentLoaded", async () => {
    if (!initAdminPage()) return;

    allTables = await ApiClient.withFallback(
        () => TablesAdminApi.list(),
        () => demoListTables(),
        "GET /api/admin/tables unreachable"
    );
    renderTablesTable();

    document.getElementById("add-table-form").addEventListener("submit", handleAddTable);

    document.getElementById("tables-table-body").addEventListener("change", (e) => {
        if (e.target.classList.contains("active-toggle")) handleActiveToggle(e.target);
    });

    document.getElementById("tables-table-body").addEventListener("click", (e) => {
        const btn = e.target.closest(".view-qr-btn");
        if (btn) openQrModal(allTables.find((t) => t.id === Number(btn.dataset.id)));
    });

    document.getElementById("qr-close-btn").addEventListener("click", closeQrModal);
    document.getElementById("qr-print-btn").addEventListener("click", () => {
        const img = document.querySelector("#qr-image-wrapper img");
        if (!img) return;
        const printWindow = window.open("", "_blank");
        // The title is read back from .textContent (always plain text, safe
        // to read) but then gets spliced into an HTML string that this new
        // window's document.write() DOES parse as markup - so it needs the
        // same escaping as any other admin-entered text rendered as HTML.
        const titleText = escapeHtml(document.getElementById("qr-modal-title").textContent);
        printWindow.document.write(`<html><head><title>Print QR</title></head><body style="text-align:center;margin-top:60px;">
            <img src="${img.src}" style="width:300px;height:300px;"><p>${titleText}</p>
            <script>window.onload = () => window.print();<\/script></body></html>`);
        printWindow.document.close();
    });
});
