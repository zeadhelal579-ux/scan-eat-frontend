/*
  FILE: shared/js/auth.js
  PURPOSE: Everything the Kitchen Display and Admin Dashboard need to manage
           a staff login session: store the JWT returned by
           POST /api/auth/login, check whether it's still valid, enforce the
           Staff-vs-Admin role split from 08-API-CONTRACT.md, and log out.
  LOGIC:   - The JWT is kept in localStorage (survives a refresh, cleared on
             logout or expiry) under keys namespaced with "scanEat" so this
             never collides with anything else stored in the same browser.
           - isAuthenticated() decodes the token's own "exp" claim rather
             than trusting a separate "logged in" flag, so a token that
             quietly expired is treated as logged-out without an extra
             network call.
           - guardPage() is the one function every protected kitchen/*.html
             and admin/*.html page calls first: it sends the browser back to
             that app's login.html if there's no valid session, and enforces
             role (Admin pages reject a Staff-only token; Staff pages accept
             both, since 08-API-CONTRACT.md defines Admin as a superset).
  WHY SHARED: Both apps need byte-for-byte identical session logic. Rather
           than maintaining two copies that can drift, this one file is
           loaded by both kitchen/*.html and admin/*.html via a relative
           "../shared/js/auth.js" <script> tag. The customer app never loads
           this file (customers never authenticate), which keeps the "no
           staff code on a customer's phone" property from
           02-SYSTEM-ARCHITECTURE.md intact.
*/

const Auth = (() => {
    const TOKEN_KEY = "scanEatStaffToken";
    const ROLE_KEY = "scanEatStaffRole";
    const USERNAME_KEY = "scanEatStaffUsername";

    // Decodes a JWT's payload segment without verifying the signature (the
    // backend is the only party that needs to verify it - the frontend only
    // needs to read the role/exp claims to decide what UI to show).
    function decodeToken(token) {
        try {
            const payload = token.split(".")[1];
            const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
            const json = decodeURIComponent(
                atob(base64)
                    .split("")
                    .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
                    .join("")
            );
            return JSON.parse(json);
        } catch (err) {
            return null;
        }
    }

    // Persists a successful POST /api/auth/login response.
    function setSession({ token, role, username }) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(ROLE_KEY, role);
        if (username) localStorage.setItem(USERNAME_KEY, username);
    }

    function getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    function getRole() {
        return localStorage.getItem(ROLE_KEY);
    }

    function getUsername() {
        return localStorage.getItem(USERNAME_KEY) || "";
    }

    // True while a token exists and (if it carries an "exp" claim) hasn't
    // expired yet. Demo-mode tokens (see shared/js/login-form.js) always
    // carry an "exp" so they naturally expire too.
    function isAuthenticated() {
        const token = getToken();
        if (!token) return false;
        const payload = decodeToken(token);
        if (!payload || !payload.exp) return true;
        return Date.now() < payload.exp * 1000;
    }

    function clearSession() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ROLE_KEY);
        localStorage.removeItem(USERNAME_KEY);
    }

    function logout(loginPageUrl = "login.html") {
        clearSession();
        window.location.href = loginPageUrl;
    }

    // Call at the very top of every protected staff page.
    // requireRole "Staff" accepts a Staff OR Admin token (Admin is a
    // superset - matches the Auth column in 08-API-CONTRACT.md).
    // requireRole "Admin" accepts only an Admin token.
    function guardPage({ requireRole, loginPageUrl = "login.html" } = {}) {
        if (!isAuthenticated()) {
            window.location.href = loginPageUrl;
            return false;
        }
        const role = getRole();
        const roleOk = !requireRole || role === requireRole || role === "Admin";
        if (!roleOk) {
            clearSession();
            window.location.href = loginPageUrl;
            return false;
        }
        return true;
    }

    // Call at the top of login.html so an already-signed-in staff member
    // skips straight past the form.
    function redirectIfAuthenticated(targetPageUrl = "index.html") {
        if (isAuthenticated()) {
            window.location.href = targetPageUrl;
            return true;
        }
        return false;
    }

    return {
        setSession,
        getToken,
        getRole,
        getUsername,
        isAuthenticated,
        clearSession,
        logout,
        guardPage,
        redirectIfAuthenticated,
        decodeToken,
    };
})();
