
/* Checkout wiring: set INKRAIL_CHECKOUT_URL to the live Lemon Squeezy checkout when ready. */
window.INKRAIL_CHECKOUT_URL = window.INKRAIL_CHECKOUT_URL || "";
document.addEventListener("DOMContentLoaded", function () {
  var btn = document.getElementById("cta-checkout");
  var note = document.getElementById("cta-checkout-note");
  if (!btn) return;
  if (window.INKRAIL_CHECKOUT_URL) {
    btn.setAttribute("href", window.INKRAIL_CHECKOUT_URL);
    btn.setAttribute("rel", "noopener noreferrer");
    btn.setAttribute("target", "_blank");
    if (note) note.textContent = "Secure checkout on Lemon Squeezy.";
  }
});
