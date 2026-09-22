/**
 * Inkrail Flow Score v0 — client-side weighted rubric (teaser)
 * No secrets / no Lemon Squeezy API keys.
 */
(function () {
  "use strict";

  const QUESTIONS = [
    {
      id: "welcome",
      weight: 15,
      title: "Welcome series live?",
      hint: "New subscribers get a 2–3+ email welcome sequence (brand story → value → soft CTA), not a single dump.",
      fixTitle: "Stand up a multi-email welcome series",
      fixWhy: "Welcome is usually your highest-ROI automated revenue. A single blast leaves new list members cold.",
      impact: "High impact · +15 pts"
    },
    {
      id: "abandoned_cart",
      weight: 20,
      title: "Abandoned cart flow live?",
      hint: "Cart abandoners get 2–3 timed emails with product reminder (and optional incentive on the last step).",
      fixTitle: "Launch abandoned cart (2–3 emails)",
      fixWhy: "Highest-intent recovery channel for DTC. Missing this is the #1 silent revenue leak.",
      impact: "Critical · +20 pts"
    },
    {
      id: "post_purchase",
      weight: 12,
      title: "Post-purchase flow live?",
      hint: "After order: shipping/use tips, cross-sell, and loyalty nudge — not just the transactional receipt.",
      fixTitle: "Add a post-purchase nurture sequence",
      fixWhy: "Turns one-time buyers into repeaters and reduces support tickets with proactive guidance.",
      impact: "High impact · +12 pts"
    },
    {
      id: "winback",
      weight: 15,
      title: "Winback for lapsed buyers?",
      hint: "Purchasers who have not bought in ~60–120 days get a dedicated winback series.",
      fixTitle: "Build a lapsed-buyer winback flow",
      fixWhy: "Cheaper than acquiring new customers. Without it, your best past buyers quietly go dark.",
      impact: "High impact · +15 pts"
    },
    {
      id: "browse_abandon",
      weight: 8,
      title: "Browse abandonment tracked?",
      hint: "Viewed-product / no-cart visitors get a light reminder (if your ESP + site tracking support it).",
      fixTitle: "Enable browse abandonment",
      fixWhy: "Captures mid-funnel interest before cart. Smaller lift than cart, but cheap once tracking works.",
      impact: "Medium · +8 pts"
    },
    {
      id: "review_request",
      weight: 8,
      title: "Review / UGC request after delivery?",
      hint: "Timed ask for a review or photo after estimated delivery — one clear CTA.",
      fixTitle: "Add a post-delivery review request",
      fixWhy: "Feeds social proof and SEO; also re-opens the conversation for a second purchase.",
      impact: "Medium · +8 pts"
    },
    {
      id: "sunset",
      weight: 12,
      title: "Sunset / suppress unengaged?",
      hint: "You suppress or sunset contacts with no opens/clicks for ~90–120 days before blasting.",
      fixTitle: "Implement sunset + unengaged suppress",
      fixWhy: "Protects deliverability and inbox placement. Ignoring this slowly poisons every other flow.",
      impact: "High impact · +12 pts"
    },
    {
      id: "segments",
      weight: 10,
      title: "Purchaser vs non-purchaser segments?",
      hint: "Core segments exist (engaged, purchasers, non-purchasers) and flows exclude wrong audiences.",
      fixTitle: "Define core buyer / non-buyer segments",
      fixWhy: "Wrong-audience sends tank CTR and unsubscribes. Segments make every other fix sharper.",
      impact: "High impact · +10 pts"
    }
  ];

  const STORAGE_KEY = "inkrail_flow_score_v0";
  const WAITLIST_KEY = "inkrail_waitlist_intents";

  const els = {
    quiz: document.getElementById("quiz"),
    results: document.getElementById("results"),
    progressFill: document.getElementById("progress-fill"),
    qMeta: document.getElementById("q-meta"),
    qTitle: document.getElementById("q-title"),
    qHint: document.getElementById("q-hint"),
    btnYes: document.getElementById("btn-yes"),
    btnNo: document.getElementById("btn-no"),
    btnBack: document.getElementById("btn-back"),
    btnRestart: document.getElementById("btn-restart"),
    scoreNum: document.getElementById("score-num"),
    scoreRing: document.getElementById("score-ring"),
    gradeEl: document.getElementById("grade"),
    scoreBlurb: document.getElementById("score-blurb"),
    freeFixes: document.getElementById("free-fixes"),
    lockedFixes: document.getElementById("locked-fixes"),
    waitlistForm: document.getElementById("waitlist-form"),
    waitlistEmail: document.getElementById("waitlist-email"),
    waitlistMsg: document.getElementById("waitlist-msg")
  };

  let answers = {}; // id -> boolean
  let index = 0;

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data && typeof data === "object" && data.answers) {
        answers = data.answers;
        index = Math.min(data.index || 0, QUESTIONS.length);
      }
    } catch (_) { /* ignore */ }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, index }));
    } catch (_) { /* ignore */ }
  }

  function answeredCount() {
    return QUESTIONS.filter((q) => typeof answers[q.id] === "boolean").length;
  }

  function compute() {
    let score = 0;
    const missing = [];
    QUESTIONS.forEach((q) => {
      if (answers[q.id] === true) {
        score += q.weight;
      } else if (answers[q.id] === false) {
        missing.push(q);
      }
    });
    missing.sort((a, b) => b.weight - a.weight);
    return { score, missing };
  }

  function gradeFor(score) {
    if (score >= 80) return { label: "Strong", cls: "grade-a", blurb: "Solid lifecycle backbone. Tighten the gaps below to push past 90." };
    if (score >= 55) return { label: "Growing", cls: "grade-b", blurb: "You have pieces in place — the ranked fixes will move revenue fastest." };
    return { label: "Leaking", cls: "grade-c", blurb: "High-intent money is on the table. Start with the top three fixes." };
  }

  function renderQuestion() {
    if (index >= QUESTIONS.length) {
      showResults();
      return;
    }
    els.quiz.classList.remove("hidden");
    els.results.classList.add("hidden");

    const q = QUESTIONS[index];
    const done = answeredCount();
    const pct = Math.round((done / QUESTIONS.length) * 100);
    els.progressFill.style.width = pct + "%";
    els.qMeta.textContent = "Question " + (index + 1) + " of " + QUESTIONS.length;
    els.qTitle.textContent = q.title;
    els.qHint.textContent = q.hint;

    els.btnYes.classList.toggle("selected-yes", answers[q.id] === true);
    els.btnNo.classList.toggle("selected-no", answers[q.id] === false);
    els.btnBack.disabled = index === 0;
  }

  function renderFixItem(q) {
    return (
      '<li><div class="impact">' + escapeHtml(q.impact) + "</div>" +
      '<p class="fix-title">' + escapeHtml(q.fixTitle) + "</p>" +
      '<p class="fix-why">' + escapeHtml(q.fixWhy) + "</p></li>"
    );
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function showResults() {
    const { score, missing } = compute();
    const g = gradeFor(score);

    els.quiz.classList.add("hidden");
    els.results.classList.remove("hidden");
    els.progressFill.style.width = "100%";

    els.scoreNum.textContent = String(score);
    els.scoreRing.style.setProperty("--pct", String(score));
    els.gradeEl.textContent = g.label;
    els.gradeEl.className = "grade " + g.cls;
    els.scoreBlurb.textContent = g.blurb;

    const free = missing.slice(0, 3);
    const locked = missing.slice(3);

    if (free.length === 0) {
      els.freeFixes.innerHTML =
        '<li><p class="fix-title">No critical gaps from this checklist</p>' +
        '<p class="fix-why">Unlock the full report for export, timing recipes, and deeper QA checks.</p></li>';
    } else {
      els.freeFixes.innerHTML = free.map(renderFixItem).join("");
    }

    if (locked.length === 0) {
      // Still show lock UI for export + full report CTA even if few gaps
      els.lockedFixes.innerHTML =
        renderFixItem({
          impact: "Export · locked",
          fixTitle: "Full ranked fix list + printable export",
          fixWhy: "CSV/Markdown export, timing recipes, and segment rules — available when checkout goes live."
        }) +
        renderFixItem({
          impact: "Playbook · locked",
          fixTitle: "Per-flow QA checklist",
          fixWhy: "Trigger, delay, exclusion, and deliverability checks for each lifecycle flow."
        });
    } else {
      els.lockedFixes.innerHTML = locked.map(renderFixItem).join("") +
        renderFixItem({
          impact: "Export · locked",
          fixTitle: "One-click report export",
          fixWhy: "Download your scored gaps as Markdown/CSV for your ESP backlog."
        });
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        answers,
        index: QUESTIONS.length,
        lastScore: score,
        completedAt: new Date().toISOString()
      }));
    } catch (_) { /* ignore */ }

    els.results.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function answer(yes) {
    const q = QUESTIONS[index];
    answers[q.id] = yes;
    index += 1;
    saveState();
    renderQuestion();
  }

  function goBack() {
    if (index > 0) {
      index -= 1;
      saveState();
      renderQuestion();
    }
  }

  function restart() {
    answers = {};
    index = 0;
    saveState();
    renderQuestion();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function saveWaitlistIntent(email) {
    const entry = {
      email: email,
      source: "flow-score-teaser",
      score: compute().score,
      at: new Date().toISOString(),
      tz: "Asia/Taipei"
    };
    let list = [];
    try {
      list = JSON.parse(localStorage.getItem(WAITLIST_KEY) || "[]");
      if (!Array.isArray(list)) list = [];
    } catch (_) {
      list = [];
    }
    list.push(entry);
    try {
      localStorage.setItem(WAITLIST_KEY, JSON.stringify(list));
    } catch (_) { /* ignore */ }
    return entry;
  }

  function onWaitlistSubmit(e) {
    e.preventDefault();
    const email = (els.waitlistEmail.value || "").trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      els.waitlistMsg.className = "waitlist-msg err";
      els.waitlistMsg.textContent = "Enter a valid email.";
      return;
    }
    const entry = saveWaitlistIntent(email);
    els.waitlistMsg.className = "waitlist-msg ok";
    els.waitlistMsg.textContent = "Thanks — we'll follow up. Intent saved on this device.";

    // Also open mailto so operator receives intent (static hosting cannot POST)
    const subject = encodeURIComponent("Inkrail Flow Score waitlist");
    const body = encodeURIComponent(
      "Please add me to the Flow Score waitlist.\n\n" +
      "Email: " + entry.email + "\n" +
      "Teaser score: " + entry.score + "\n" +
      "Time: " + entry.at + "\n"
    );
    // Delay slightly so the thanks message is visible before mail client opens
    setTimeout(function () {
      window.location.href = "mailto:inkrailco@gmail.com?subject=" + subject + "&body=" + body;
    }, 250);
  }

  // Wire events
  if (!els.quiz) return;

  els.btnYes.addEventListener("click", function () { answer(true); });
  els.btnNo.addEventListener("click", function () { answer(false); });
  els.btnBack.addEventListener("click", goBack);
  if (els.btnRestart) els.btnRestart.addEventListener("click", restart);
  if (els.waitlistForm) els.waitlistForm.addEventListener("submit", onWaitlistSubmit);

  loadState();
  // If previously completed, show results; else resume quiz
  if (index >= QUESTIONS.length && answeredCount() === QUESTIONS.length) {
    showResults();
  } else {
    if (index > answeredCount()) index = answeredCount();
    renderQuestion();
  }
})();

/* Checkout wiring: set INKRAIL_CHECKOUT_URL to the live Lemon Squeezy checkout when ready. */
window.INKRAIL_CHECKOUT_URL = window.INKRAIL_CHECKOUT_URL || "https://inkrail.lemonsqueezy.com/checkout/buy/baf7f0ed-9ced-4757-bfb7-f11e23b7a844";
(function wireCheckout() {
  function apply() {
    var btn = document.getElementById("cta-checkout");
    var note = document.getElementById("cta-checkout-note");
    if (!btn) return;
    if (window.INKRAIL_CHECKOUT_URL) {
      btn.setAttribute("href", window.INKRAIL_CHECKOUT_URL);
      btn.setAttribute("rel", "noopener noreferrer");
      btn.setAttribute("target", "_blank");
      if (note) note.textContent = "Secure checkout on Lemon Squeezy.";
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply);
  } else {
    apply();
  }
})();
