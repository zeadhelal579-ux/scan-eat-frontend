/*
  FILE: admin/js/nav.js
  PURPOSE: The one piece of setup every admin page (dashboard, products,
           categories, offers, tables) needs before it does anything
           page-specific: guard the page behind an Admin-role login,
           highlight the current page in the sidebar, wire the logout
           button, and show the demo-mode banner. Written once and loaded
           by all five pages, exactly as 05-FRONTEND-ARCHITECTURE.md
           section 4 specifies ("written once, not duplicated per page").
  LOGIC:   - Reads which page it's on from <body data-page="..."> rather
             than each page needing its own copy of this logic.
           - The demo banner sets text on a separate #demo-mode-banner-text
             span rather than the banner container itself - a bug caught in
             kitchen/js/kitchen.js during testing where overwriting a
             container's textContent silently deleted a button nested
             inside it (see the README's "Bugs Found & Fixed" section).
             There's no nested control in the admin banner today, but the
             pattern is kept consistent everywhere for that reason.
*/

function initAdminPage() {
    if (!Auth.guardPage({ requireRole: "Admin" })) return false;

    const currentPage = document.body.dataset.page;
    document.querySelectorAll(".sidebar-nav a").forEach((link) => {
        link.classList.toggle("active", link.dataset.page === currentPage);
    });

    const nameEl = document.getElementById("admin-name");
    if (nameEl) nameEl.textContent = Auth.getUsername() || Auth.getRole();

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) logoutBtn.addEventListener("click", () => Auth.logout());

    DemoMode.onActivate(() => {
        const banner = document.getElementById("demo-mode-banner");
        const textEl = document.getElementById("demo-mode-banner-text");
        if (!banner || !textEl) return;
        textEl.textContent = APP_CONFIG.DEMO_BANNER_TEXT;
        banner.hidden = false;
    });

    return true;
}
