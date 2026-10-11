/*
  FILE: admin/js/products.js
  PURPOSE: Everything products.html does: load + render the product table,
           filter it by the search box, toggle Sold Out per row, and the
           add/edit modal form.
  LOGIC:   - allProducts / allCategories are kept in memory after the
             initial load and re-rendered locally on search/toggle, rather
             than re-fetching the whole list from the server on every
             keystroke or toggle - the toggle/save calls still go to the
             real endpoint (or its demo mirror), this only avoids
             unnecessary GETs for what's already in memory.
           - The Sold Out switch calls
             PATCH /api/admin/products/{id}/availability directly (matching
             08-API-CONTRACT.md exactly - a dedicated endpoint, not a full
             product PUT), and optimistically reverts the switch if the
             call fails so the UI never shows a state that didn't actually
             save.
*/

let allProducts = [];
let allCategories = [];
let searchTerm = "";

// Defensive HTML escaping for admin-entered text rendered via innerHTML
// (product/category names) - mirrors the same helper already used in
// customer/js/app.js and kitchen/js/kitchen.js, added here because this
// file previously interpolated admin-entered strings unescaped (a stored-
// markup risk if a name ever contains "<"/">"/quote characters - see the
// testing report's "Bugs Found & Fixed" section for the full reasoning).
function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function money(n) {
    return `EGP ${n}`;
}

function categoryName(id) {
    const cat = allCategories.find((c) => c.id === id);
    return cat ? cat.name : "—";
}

function renderProductsTable() {
    const term = searchTerm.toLowerCase().trim();
    const filtered = allProducts.filter((p) => !term || p.name.toLowerCase().includes(term));

    document.getElementById("products-empty-msg").hidden = filtered.length !== 0;

    document.getElementById("products-table-body").innerHTML = filtered
        .map(
            (p) => `
        <tr data-id="${p.id}">
            <td>${escapeHtml(p.name)}</td>
            <td>${escapeHtml(categoryName(p.categoryId))}</td>
            <td>${money(p.price)}</td>
            <td>
                <label class="toggle-switch">
                    <input type="checkbox" class="availability-toggle" data-id="${p.id}" ${p.isAvailable ? "checked" : ""}>
                    <span class="toggle-slider"></span>
                </label>
            </td>
            <td class="row-actions">
                <button class="btn btn-secondary btn-sm edit-product-btn" data-id="${p.id}">Edit</button>
                <button class="btn btn-danger btn-sm delete-product-btn" data-id="${p.id}">Delete</button>
            </td>
        </tr>`
        )
        .join("");
}

function populateCategoryDropdown() {
    // security-test-report.md F6 - c.name was missing escapeHtml here (the
    // earlier XSS-hardening pass covered the products table below but
    // missed this <select>; the security-test skill run caught it).
    document.getElementById("product-category").innerHTML = allCategories
        .map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`)
        .join("");
}

function openProductModal(product) {
    document.getElementById("product-modal-title").textContent = product ? "Edit Product" : "Add Product";
    document.getElementById("product-id").value = product ? product.id : "";
    document.getElementById("product-name").value = product ? product.name : "";
    document.getElementById("product-category").value = product ? product.categoryId : allCategories[0]?.id ?? "";
    document.getElementById("product-price").value = product ? product.price : "";
    document.getElementById("product-description").value = product ? product.description : "";
    document.getElementById("product-image").value = product ? product.imageUrl : "";
    document.getElementById("product-modal").hidden = false;
}

function closeProductModal() {
    document.getElementById("product-modal").hidden = true;
}

async function handleProductFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById("product-id").value;
    const dto = {
        name: document.getElementById("product-name").value.trim(),
        categoryId: Number(document.getElementById("product-category").value),
        price: Number(document.getElementById("product-price").value),
        description: document.getElementById("product-description").value.trim(),
        imageUrl: document.getElementById("product-image").value.trim() || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300",
    };

    const saveBtn = document.getElementById("product-save-btn");
    saveBtn.disabled = true;
    try {
        if (id) {
            const updated = await ApiClient.withFallback(
                () => ProductsAdminApi.update(Number(id), dto),
                () => demoUpdateProduct(Number(id), dto),
                "PUT /api/admin/products/{id} unreachable"
            );
            const idx = allProducts.findIndex((p) => p.id === Number(id));
            allProducts[idx] = { ...allProducts[idx], ...updated };
        } else {
            const created = await ApiClient.withFallback(
                () => ProductsAdminApi.create(dto),
                () => demoCreateProduct(dto),
                "POST /api/admin/products unreachable"
            );
            allProducts.push(created);
        }
        closeProductModal();
        renderProductsTable();
    } catch (err) {
        alert(`Couldn't save the product: ${err.message}`);
    } finally {
        saveBtn.disabled = false;
    }
}

async function handleAvailabilityToggle(checkbox) {
    const id = Number(checkbox.dataset.id);
    const isAvailable = checkbox.checked;
    try {
        await ApiClient.withFallback(
            () => ProductsAdminApi.setAvailability(id, isAvailable),
            () => demoSetProductAvailability(id, isAvailable),
            "PATCH .../availability unreachable"
        );
        const product = allProducts.find((p) => p.id === id);
        if (product) product.isAvailable = isAvailable;
    } catch (err) {
        checkbox.checked = !isAvailable; // revert - the save didn't actually happen
        alert(`Couldn't update availability: ${err.message}`);
    }
}

async function handleDeleteProduct(id) {
    if (!confirm("Delete this product? This can't be undone.")) return;
    try {
        await ApiClient.withFallback(
            () => ProductsAdminApi.remove(id),
            () => demoDeleteProduct(id),
            "DELETE /api/admin/products/{id} unreachable"
        );
        allProducts = allProducts.filter((p) => p.id !== id);
        renderProductsTable();
    } catch (err) {
        alert(`Couldn't delete the product: ${err.message}`);
    }
}

window.addEventListener("DOMContentLoaded", async () => {
    if (!initAdminPage()) return;

    allCategories = await ApiClient.withFallback(
        () => CategoriesApi.list(),
        () => [...demoAdminCategories],
        "GET /api/categories unreachable"
    );
    allProducts = await ApiClient.withFallback(
        () => ProductsApi.list(),
        () => [...demoAdminProducts],
        "GET /api/products unreachable"
    );
    populateCategoryDropdown();
    renderProductsTable();

    document.getElementById("product-search").addEventListener("input", (e) => {
        searchTerm = e.target.value;
        renderProductsTable();
    });

    document.getElementById("add-product-btn").addEventListener("click", () => openProductModal(null));
    document.getElementById("product-cancel-btn").addEventListener("click", closeProductModal);
    document.getElementById("product-form").addEventListener("submit", handleProductFormSubmit);

    document.getElementById("products-table-body").addEventListener("click", (e) => {
        const editBtn = e.target.closest(".edit-product-btn");
        if (editBtn) {
            openProductModal(allProducts.find((p) => p.id === Number(editBtn.dataset.id)));
            return;
        }
        const deleteBtn = e.target.closest(".delete-product-btn");
        if (deleteBtn) handleDeleteProduct(Number(deleteBtn.dataset.id));
    });

    document.getElementById("products-table-body").addEventListener("change", (e) => {
        if (e.target.classList.contains("availability-toggle")) {
            handleAvailabilityToggle(e.target);
        }
    });
});
