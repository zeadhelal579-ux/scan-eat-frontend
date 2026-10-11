/*
  FILE: admin/js/offers.js
  PURPOSE: Everything offers.html does: render the offers table, and the
           add/edit/delete modal form - including the IsFeatured checkbox,
           which the demo mirror (demoUpdateOffer in admin-demo-data.js)
           enforces as mutually exclusive across offers, matching
           03-DATABASE-SCHEMA.md's "Marks the ONE offer" rule.
*/

let allOffers = [];

// See admin/js/products.js header comment - same defensive-escaping fix
// applied here for the title field this table renders via innerHTML.
function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderOffersTable() {
    document.getElementById("offers-empty-msg").hidden = allOffers.length !== 0;
    document.getElementById("offers-table-body").innerHTML = allOffers
        .map(
            (o) => `
        <tr data-id="${o.id}">
            <td>${escapeHtml(o.title)}</td>
            <td>EGP ${o.newPrice} <span style="text-decoration:line-through;color:var(--brand-text-muted);font-size:11px;">EGP ${o.oldPrice}</span></td>
            <td><span class="badge ${o.isActive ? "badge-active" : "badge-inactive"}">${o.isActive ? "Active" : "Inactive"}</span></td>
            <td>${o.isFeatured ? '<span class="badge badge-featured">★ Featured</span>' : ""}</td>
            <td class="row-actions">
                <button class="btn btn-secondary btn-sm edit-offer-btn" data-id="${o.id}">Edit</button>
                <button class="btn btn-danger btn-sm delete-offer-btn" data-id="${o.id}">Delete</button>
            </td>
        </tr>`
        )
        .join("");
}

function openOfferModal(offer) {
    document.getElementById("offer-modal-title").textContent = offer ? "Edit Offer" : "Add Offer";
    document.getElementById("offer-id").value = offer ? offer.id : "";
    document.getElementById("offer-title").value = offer ? offer.title : "";
    document.getElementById("offer-description").value = offer ? offer.description : "";
    document.getElementById("offer-old-price").value = offer ? offer.oldPrice : "";
    document.getElementById("offer-new-price").value = offer ? offer.newPrice : "";
    document.getElementById("offer-active").checked = offer ? offer.isActive : true;
    document.getElementById("offer-featured").checked = offer ? offer.isFeatured : false;
    document.getElementById("offer-modal").hidden = false;
}

function closeOfferModal() {
    document.getElementById("offer-modal").hidden = true;
}

async function handleOfferFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById("offer-id").value;
    const dto = {
        title: document.getElementById("offer-title").value.trim(),
        description: document.getElementById("offer-description").value.trim(),
        oldPrice: Number(document.getElementById("offer-old-price").value),
        newPrice: Number(document.getElementById("offer-new-price").value),
        isActive: document.getElementById("offer-active").checked,
        isFeatured: document.getElementById("offer-featured").checked,
    };

    const saveBtn = document.getElementById("offer-save-btn");
    saveBtn.disabled = true;
    try {
        if (id) {
            const updated = await ApiClient.withFallback(
                () => OffersAdminApi.update(Number(id), dto),
                () => demoUpdateOffer(Number(id), dto),
                "PUT /api/admin/offers/{id} unreachable"
            );
            if (dto.isFeatured) allOffers.forEach((o) => (o.isFeatured = false));
            const idx = allOffers.findIndex((o) => o.id === Number(id));
            allOffers[idx] = { ...allOffers[idx], ...updated };
        } else {
            const created = await ApiClient.withFallback(
                () => OffersAdminApi.create(dto),
                () => demoCreateOffer(dto),
                "POST /api/admin/offers unreachable"
            );
            if (dto.isFeatured) allOffers.forEach((o) => (o.isFeatured = false));
            allOffers.push(created);
        }
        closeOfferModal();
        renderOffersTable();
    } catch (err) {
        alert(`Couldn't save the offer: ${err.message}`);
    } finally {
        saveBtn.disabled = false;
    }
}

async function handleDeleteOffer(id) {
    if (!confirm("Delete this offer?")) return;
    try {
        await ApiClient.withFallback(
            () => OffersAdminApi.remove(id),
            () => demoDeleteOffer(id),
            "DELETE /api/admin/offers/{id} unreachable"
        );
        allOffers = allOffers.filter((o) => o.id !== id);
        renderOffersTable();
    } catch (err) {
        alert(`Couldn't delete the offer: ${err.message}`);
    }
}

window.addEventListener("DOMContentLoaded", async () => {
    if (!initAdminPage()) return;

    allOffers = await ApiClient.withFallback(
        () => OffersApi.list(),
        () => [...demoAdminOffers],
        "GET /api/offers unreachable"
    );
    renderOffersTable();

    document.getElementById("add-offer-btn").addEventListener("click", () => openOfferModal(null));
    document.getElementById("offer-cancel-btn").addEventListener("click", closeOfferModal);
    document.getElementById("offer-form").addEventListener("submit", handleOfferFormSubmit);

    document.getElementById("offers-table-body").addEventListener("click", (e) => {
        const editBtn = e.target.closest(".edit-offer-btn");
        if (editBtn) {
            openOfferModal(allOffers.find((o) => o.id === Number(editBtn.dataset.id)));
            return;
        }
        const deleteBtn = e.target.closest(".delete-offer-btn");
        if (deleteBtn) handleDeleteOffer(Number(deleteBtn.dataset.id));
    });
});
