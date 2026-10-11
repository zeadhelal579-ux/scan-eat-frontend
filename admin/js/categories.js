/*
  FILE: admin/js/categories.js
  PURPOSE: Everything categories.html does: load + render the category
           table (sorted by DisplayOrder, matching how the customer app's
           horizontal scroller orders them - see 03-DATABASE-SCHEMA.md),
           and the add/edit/delete modal form.
*/

let allCategories = [];

// See admin/js/products.js header comment - same defensive-escaping fix
// applied here for the name/image fields this table renders via innerHTML.
function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// security-test-report.md F6 - see the matching helper + comment in
// customer/js/app.js: escaping alone stops attribute-breakout, this also
// rules out a non-http(s) scheme in an image src.
function safeImageUrl(url) {
    return /^https?:\/\//i.test(String(url || "")) ? url : "";
}

function renderCategoriesTable() {
    const sorted = [...allCategories].sort((a, b) => a.displayOrder - b.displayOrder);
    document.getElementById("categories-empty-msg").hidden = sorted.length !== 0;
    document.getElementById("categories-table-body").innerHTML = sorted
        .map(
            (c) => `
        <tr data-id="${c.id}">
            <td>${c.displayOrder}</td>
            <td>${escapeHtml(c.name)}</td>
            <td><img src="${escapeHtml(safeImageUrl(c.imageUrl))}" alt="${escapeHtml(c.name)}" style="width:40px;height:40px;border-radius:8px;object-fit:cover;"></td>
            <td class="row-actions">
                <button class="btn btn-secondary btn-sm edit-category-btn" data-id="${c.id}">Edit</button>
                <button class="btn btn-danger btn-sm delete-category-btn" data-id="${c.id}">Delete</button>
            </td>
        </tr>`
        )
        .join("");
}

function openCategoryModal(category) {
    document.getElementById("category-modal-title").textContent = category ? "Edit Category" : "Add Category";
    document.getElementById("category-id").value = category ? category.id : "";
    document.getElementById("category-name").value = category ? category.name : "";
    document.getElementById("category-image").value = category ? category.imageUrl : "";
    document.getElementById("category-order").value = category ? category.displayOrder : allCategories.length + 1;
    document.getElementById("category-modal").hidden = false;
}

function closeCategoryModal() {
    document.getElementById("category-modal").hidden = true;
}

async function handleCategoryFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById("category-id").value;
    const dto = {
        name: document.getElementById("category-name").value.trim(),
        imageUrl: document.getElementById("category-image").value.trim() || "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=300",
        displayOrder: Number(document.getElementById("category-order").value),
    };

    const saveBtn = document.getElementById("category-save-btn");
    saveBtn.disabled = true;
    try {
        if (id) {
            const updated = await ApiClient.withFallback(
                () => CategoriesAdminApi.update(Number(id), dto),
                () => demoUpdateCategory(Number(id), dto),
                "PUT /api/admin/categories/{id} unreachable"
            );
            const idx = allCategories.findIndex((c) => c.id === Number(id));
            allCategories[idx] = { ...allCategories[idx], ...updated };
        } else {
            const created = await ApiClient.withFallback(
                () => CategoriesAdminApi.create(dto),
                () => demoCreateCategory(dto),
                "POST /api/admin/categories unreachable"
            );
            allCategories.push(created);
        }
        closeCategoryModal();
        renderCategoriesTable();
    } catch (err) {
        alert(`Couldn't save the category: ${err.message}`);
    } finally {
        saveBtn.disabled = false;
    }
}

async function handleDeleteCategory(id) {
    if (!confirm("Delete this category? Products inside it should be moved first.")) return;
    try {
        await ApiClient.withFallback(
            () => CategoriesAdminApi.remove(id),
            () => demoDeleteCategory(id),
            "DELETE /api/admin/categories/{id} unreachable"
        );
        allCategories = allCategories.filter((c) => c.id !== id);
        renderCategoriesTable();
    } catch (err) {
        alert(`Couldn't delete the category: ${err.message}`);
    }
}

window.addEventListener("DOMContentLoaded", async () => {
    if (!initAdminPage()) return;

    allCategories = await ApiClient.withFallback(
        () => CategoriesApi.list(),
        () => [...demoAdminCategories],
        "GET /api/categories unreachable"
    );
    renderCategoriesTable();

    document.getElementById("add-category-btn").addEventListener("click", () => openCategoryModal(null));
    document.getElementById("category-cancel-btn").addEventListener("click", closeCategoryModal);
    document.getElementById("category-form").addEventListener("submit", handleCategoryFormSubmit);

    document.getElementById("categories-table-body").addEventListener("click", (e) => {
        const editBtn = e.target.closest(".edit-category-btn");
        if (editBtn) {
            openCategoryModal(allCategories.find((c) => c.id === Number(editBtn.dataset.id)));
            return;
        }
        const deleteBtn = e.target.closest(".delete-category-btn");
        if (deleteBtn) handleDeleteCategory(Number(deleteBtn.dataset.id));
    });
});
