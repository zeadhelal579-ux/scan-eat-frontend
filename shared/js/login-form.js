/*
  FILE: shared/js/login-form.js
  PURPOSE: The login submit handler shared by kitchen/login.html and
           admin/login.html. Both pages have the identical structure (a
           <form id="login-form"> with #username/#password inputs and an
           #login-error message box) and identical behaviour, so the logic
           lives here once instead of being copy-pasted per app.
  LOGIC:   - On submit, calls AuthApi.login() (POST /api/auth/login).
           - If the backend is unreachable (ApiUnavailableError), falls back
             to a small, clearly-documented list of demo credentials passed
             in by the calling page, and mints a LOCAL, unsigned pseudo-JWT
             carrying the same {role, sub, exp} claims a real one would -
             this is what lets Auth.isAuthenticated()/guardPage() exercise
             the exact same code path in demo mode as in production. It is
             never sent anywhere and never mistaken for a real credential
             check: DemoMode.activate() fires and every page shows the
             "Demo mode" banner.
           - On a real ApiHttpError (bad credentials against a live
             backend), shows the backend's own message.
  SECURITY (security-test-report.md F5): the demo-fallback credentials are
           no longer printed on the login pages themselves (that put them
           in front of every visitor, not just developers testing locally -
           see the project README for what they are). This fallback is also
           now restricted to localhost/127.0.0.1: if this build ever ends up
           served from a real domain with SeedDemoAccounts left on and the
           API happens to be briefly unreachable, a stranger hitting the
           login page over the internet can no longer log in with the
           well-known demo credentials just because the fallback still
           existed in the shipped JS.
*/

// The demo-login fallback is allowed only where config.js says sample data is
// allowed: always in DEMO_ONLY mode (no backend configured), otherwise only on
// a developer machine. With a real backend configured on a real host, wrong or
// unreachable simply means "can't sign in".
function isDemoLoginAllowed() {
    return APP_CONFIG.DEMO_FALLBACK_ALLOWED;
}

// DEPLOYMENT PASS: the demo fallback used to compare against PLAINTEXT demo
// passwords sitting in login-init.js, which is a public file on a deployed
// site (anyone could read the demo credentials from view-source). The
// calling pages now pass SHA-256 digests (`passwordSha256`) instead and this
// helper hashes what was typed. It only ever runs on a developer machine (see
// isDemoLoginAllowed above); https pages and localhost are secure contexts, so crypto.subtle exists.
async function sha256Hex(text) {
    if (!window.crypto || !window.crypto.subtle) return "";
    const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

function initLoginForm({ formEl, errorEl, demoUsers, targetPageUrl }) {
    // Builds a local, unsigned "JWT-shaped" string: header.payload.signature,
    // base64url-encoded, with just enough of a payload for Auth.decodeToken()
    // to read {role, sub, exp} the same way it would from a real token.
    function mintDemoToken(username, role) {
        const header = { alg: "none", typ: "DEMO" };
        const payload = {
            sub: username,
            role,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8, // 8-hour demo session
        };
        const b64 = (obj) =>
            btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        return `${b64(header)}.${b64(payload)}.demo-signature`;
    }

    formEl.addEventListener("submit", async (event) => {
        event.preventDefault();
        errorEl.hidden = true;
        errorEl.textContent = "";

        const username = formEl.querySelector("#username").value.trim();
        const password = formEl.querySelector("#password").value;
        const submitBtn = formEl.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = "Signing in...";

        try {
            let session;
            try {
                const result = await AuthApi.login(username, password);
                session = { token: result.token, role: result.role, username };
            } catch (err) {
                if (!(err instanceof ApiUnavailableError)) throw err;
                if (!isDemoLoginAllowed()) {
                    throw new Error(
                        "The server can't be reached right now. Please try again shortly."
                    );
                }

                // Sample data is allowed here (demo preview with no backend, or
                // a developer machine) - fall back to the page's demo users
                // (see the file header + F5 above).
                DemoMode.activate(
                    APP_CONFIG.DEMO_ONLY ? "Demo preview - no backend configured" : "Backend unreachable during login"
                );
                const passwordDigest = await sha256Hex(password);
                if (passwordDigest === "") {
                    // crypto.subtle only exists on https pages and on localhost.
                    throw new Error("Demo sign-in needs a secure (https) connection.");
                }
                const match = demoUsers.find(
                    (u) => u.username === username && u.passwordSha256 === passwordDigest
                );
                if (!match) {
                    throw new Error(
                        APP_CONFIG.DEMO_ONLY
                            ? "Demo preview: that isn't a demo account. Use the demo username and password you were given."
                            : "Backend unreachable. If you're testing locally, check the demo credentials in the project README."
                    );
                }
                session = { token: mintDemoToken(username, match.role), role: match.role, username };
            }

            Auth.setSession(session);
            window.location.href = targetPageUrl;
        } catch (err) {
            errorEl.textContent = err.message || "Sign-in failed. Please try again.";
            errorEl.hidden = false;
            submitBtn.disabled = false;
            submitBtn.textContent = "Sign In";
        }
    });
}
