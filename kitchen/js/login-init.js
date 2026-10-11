/*
  FILE: kitchen/js/login-init.js
  PURPOSE: Wires kitchen/login.html's form to shared/js/login-form.js.
  LOGIC:   Previously an inline <script> block directly in login.html -
           moved to its own file (security-test-report.md F2) so the site
           can run under a Content-Security-Policy with no 'unsafe-inline'
           for script-src, which blocks inline <script> blocks by design.
           Behavior is unchanged; only the location of this code moved.
*/
Auth.redirectIfAuthenticated("index.html");
initLoginForm({
    formEl: document.getElementById("login-form"),
    errorEl: document.getElementById("login-error"),
    // SHA-256 digest of the documented demo password (see README) - never the plaintext.
    demoUsers: [{ username: "kitchen", passwordSha256: "27184a7b6ad3bc1de21e0f1670e1300a8c6bed894bf9b14f7a87087ae57f8afa", role: "Staff" }],
    targetPageUrl: "index.html",
});
