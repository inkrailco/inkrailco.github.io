/**
 * Inkrail Flow Score v0 — client-side weighted rubric (teaser) + full report unlock (v1)
 * No secrets / no Lemon Squeezy API keys. Full report content: report-content.js.
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
    waitlistMsg: document.getElementById("waitlist-msg"),
    freeCard: document.getElementById("free-card"),
    lockedCard: document.getElementById("locked-card"),
    waitlistCard: document.getElementById("waitlist"),
    fullReport: document.getElementById("full-report"),
    reportBody: document.getElementById("report-body"),
    unlockStatus: document.getElementById("unlock-status"),
    unlockBanner: document.getElementById("unlock-banner"),
    restoreBox: document.getElementById("restore-box")
  };

  // GoatCounter events (no answers, scores, or emails are ever sent).
  // Event names: event-quiz-complete / event-cta-checkout, with "-gads" appended
  // when the browser session arrived from a Google Ads click (utm_source=google&utm_medium=cpc or gclid).
  function trafficSuffix() {
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.get("gclid") || ((p.get("utm_source") || "").toLowerCase() === "google" &&
          (p.get("utm_medium") || "").toLowerCase() === "cpc")) {
        sessionStorage.setItem("inkrail_src", "gads");
      }
      return sessionStorage.getItem("inkrail_src") === "gads" ? "-gads" : "";
    } catch (_) { return ""; }
  }
  const TRAFFIC_SUFFIX = trafficSuffix();
  function gcEvent(name) {
    try {
      if (window.goatcounter && typeof window.goatcounter.count === "function") {
        window.goatcounter.count({ path: "event-" + name + TRAFFIC_SUFFIX, title: name, event: true });
      }
    } catch (_) { /* analytics must never break the quiz */ }
  }

  let answers = {}; // id -> boolean
  let index = 0;

  /* ===================== Full report unlock (v1) =====================
   * Honest scope: this is a static site. The unlock is enforced only in this browser
   * (localStorage). ?unlocked=1 (the Lemon Squeezy post-purchase redirect) unlocks this
   * device on trust. A license key is checked against Lemon Squeezy's public License API
   * (validate only, no API key, never "activate"); if that call cannot be completed, a
   * well-formed key is accepted and marked unverified. Report content is not secret.
   */
  const UNLOCK_KEY = "inkrail_flow_unlock_v1";
  const LS_VALIDATE_URL = "https://api.lemonsqueezy.com/v1/licenses/validate";
  const LS_ALLOWED_PRODUCT_IDS = [1379493]; // live "Flow Score full report" product
  const SUPPORT_EMAIL = "inkrailco@gmail.com";
  const KEY_FORMAT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const REPORT = window.INKRAIL_REPORT_CONTENT || null;

  function readUnlock() {
    try {
      const u = JSON.parse(localStorage.getItem(UNLOCK_KEY) || "null");
      return u && u.unlocked === true ? u : null;
    } catch (_) { return null; }
  }

  function writeUnlock(patch) {
    const prev = readUnlock();
    const next = Object.assign({ unlocked: true, firstAt: new Date().toISOString() }, prev || {}, patch || {});
    try { localStorage.setItem(UNLOCK_KEY, JSON.stringify(next)); } catch (_) { /* ignore */ }
    if (!prev) onFirstUnlock(next);
    return next;
  }

  // GoatCounter: fire "event-unlock" once per device, the first time it unlocks (no key, email, or answers sent).
  // Fixed path (no "-gads" suffix): the checkout tab is opened with noopener, so session attribution
  // typically does not carry over into the post-purchase redirect tab. count.js loads async, so retry briefly.
  function onFirstUnlock(u) {
    let tries = 0;
    (function send() {
      try {
        if (window.goatcounter && typeof window.goatcounter.count === "function") {
          window.goatcounter.count({ path: "event-unlock", title: "unlock (" + (u.method || "unknown") + ")", event: true });
          return;
        }
      } catch (_) { return; /* analytics must never break the page */ }
      if (++tries < 40) setTimeout(send, 250);
    })();
  }

  function isUnlocked() { return !!readUnlock(); }

  // Handle ?unlocked=1 from the Lemon Squeezy redirect, then tidy the URL (other params kept).
  function consumeUnlockParam() {
    let p;
    try { p = new URLSearchParams(window.location.search); } catch (_) { return false; }
    if (p.get("unlocked") !== "1") return false;
    writeUnlock({ redirectAt: new Date().toISOString(), method: (readUnlock() || {}).method || "checkout-redirect" });
    try {
      p.delete("unlocked");
      const qs = p.toString();
      window.history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : "") + window.location.hash);
    } catch (_) { /* ignore */ }
    return true;
  }

  function validateLicenseRemote(key) {
    const ctrl = typeof AbortController === "function" ? new AbortController() : null;
    const timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 9000) : null;
    return fetch(LS_VALIDATE_URL, {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      body: "license_key=" + encodeURIComponent(key),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      return res.json().then(function (data) { return { http: res.status, data: data }; });
    }).finally(function () { if (timer) clearTimeout(timer); });
  }

  function setLicenseMsg(form, cls, text) {
    const msg = form.querySelector(".license-msg");
    if (msg) { msg.className = "license-msg " + cls; msg.textContent = text; }
  }

  function onLicenseSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.querySelector(".license-input");
    const btn = form.querySelector("button[type=submit]");
    const key = ((input && input.value) || "").trim();
    if (!key) { setLicenseMsg(form, "err", "Paste the license key from your Lemon Squeezy receipt email."); return; }
    if (btn) btn.disabled = true;
    setLicenseMsg(form, "", "Checking your key with Lemon Squeezy…");

    validateLicenseRemote(key).then(function (r) {
      const d = r.data || {};
      const pid = d.meta && Number(d.meta.product_id);
      if (d.valid === true && LS_ALLOWED_PRODUCT_IDS.indexOf(pid) !== -1) {
        writeUnlock({ method: "license-key", licenseKey: key, verified: true, verifiedAt: new Date().toISOString(), productId: pid });
        setLicenseMsg(form, "ok", "Key verified. Your full report is unlocked on this device.");
        refreshView();
      } else if (d.valid === true) {
        setLicenseMsg(form, "err", "That key is valid but belongs to a different product. Need help? Email " + SUPPORT_EMAIL + ".");
      } else {
        setLicenseMsg(form, "err", "Lemon Squeezy did not accept that key (" + (d.error || ("HTTP " + r.http)) + "). Check for typos, or email " + SUPPORT_EMAIL + " with your order number.");
      }
    }).catch(function () {
      // Network error, timeout, blocked request, or non-JSON response: honor-system fallback.
      if (KEY_FORMAT.test(key)) {
        writeUnlock({ method: "license-key", licenseKey: key, verified: false, storedAt: new Date().toISOString() });
        setLicenseMsg(form, "ok", "We couldn't reach the license server, so your key was saved without verification and this device is unlocked.");
        refreshView();
      } else {
        setLicenseMsg(form, "err", "We couldn't reach the license server and that doesn't look like a Lemon Squeezy key (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx). Try again or email " + SUPPORT_EMAIL + ".");
      }
    }).finally(function () { if (btn) btn.disabled = false; });
  }

  // Quietly upgrade a key saved during an outage to verified. Never auto-revokes.
  function recheckUnverifiedKey() {
    const u = readUnlock();
    if (!u || !u.licenseKey || u.verified) return;
    validateLicenseRemote(u.licenseKey).then(function (r) {
      const d = r.data || {};
      if (d.valid === true && LS_ALLOWED_PRODUCT_IDS.indexOf(Number(d.meta && d.meta.product_id)) !== -1) {
        writeUnlock({ verified: true, verifiedAt: new Date().toISOString() });
        renderUnlockStatus();
      }
    }).catch(function () { /* ignore */ });
  }

  // ---------- ranking (same weights and tie order as the free score) ----------
  function rankedChecks() {
    const gaps = QUESTIONS.filter(function (q) { return answers[q.id] === false; });
    const live = QUESTIONS.filter(function (q) { return answers[q.id] === true; });
    const byWeight = function (a, b) { return b.weight - a.weight; };
    gaps.sort(byWeight);
    live.sort(byWeight);
    return gaps.map(function (q) { return { q: q, gap: true }; })
      .concat(live.map(function (q) { return { q: q, gap: false }; }))
      .map(function (r, i) {
        r.rank = i + 1;
        r.c = (REPORT && REPORT.checks[r.q.id]) || null;
        return r;
      });
  }

  function sourceList(c) {
    return (c.sources || []).map(function (k) { return REPORT.sources[k]; }).filter(Boolean);
  }

  function todayStr() {
    const d = new Date();
    const pad = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function ulHtml(items) {
    return "<ul>" + items.map(function (t) { return "<li>" + escapeHtml(t) + "</li>"; }).join("") + "</ul>";
  }

  function renderFullReport() {
    const box = els.reportBody;
    if (!box) return;
    if (!REPORT) {
      box.innerHTML = '<p class="license-msg err">The report content failed to load. Reload the page; if it persists, email ' +
        escapeHtml(SUPPORT_EMAIL) + ".</p>";
      return;
    }
    const s = compute();
    const g = gradeFor(s.score);
    const rows = rankedChecks();
    const gapCount = rows.filter(function (r) { return r.gap; }).length;

    let html = '<p class="report-meta">Score <strong>' + s.score + "/100</strong> (" + escapeHtml(g.label) + ") · " +
      gapCount + " gap" + (gapCount === 1 ? "" : "s") + " · " + (rows.length - gapCount) + " in place · generated " + todayStr() + "</p>";
    html += '<p class="small muted">Gaps come first, ranked by the same weights as your free score. Flows you already have follow, so you can QA them. ' +
      "Work top-down: build gap #1, run its QA checklist, then move to the next.</p>";

    html += '<table class="report-table"><thead><tr><th>#</th><th>Flow</th><th>Status</th><th>Points</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return "<tr><td>" + r.rank + '</td><td><a href="#rf-' + r.q.id + '">' + escapeHtml(r.c ? r.c.name : r.q.fixTitle) + "</a></td><td>" +
          (r.gap ? '<span class="tag tag-gap">Gap</span>' : '<span class="tag tag-ok">In place</span>') + "</td><td>" +
          (r.gap ? "+" : "") + r.q.weight + "</td></tr>";
      }).join("") + "</tbody></table>";

    rows.forEach(function (r) {
      const c = r.c;
      if (!c) return;
      html += '<article class="report-item" id="rf-' + r.q.id + '">';
      html += '<div class="impact">#' + r.rank + " · " + (r.gap ? "Gap: fix · +" + r.q.weight + " pts" : "In place: verify · " + r.q.weight + " pts") + "</div>";
      html += "<h3>" + escapeHtml(c.name) + "</h3>";
      if (!r.gap) html += '<p class="small muted">You answered "yes". Use the QA checklist below to confirm it actually works as intended.</p>';
      html += "<h4>Why it matters</h4>" + c.why.map(function (p) { return "<p>" + escapeHtml(p) + "</p>"; }).join("");
      html += "<h4>Recommended structure</h4>" + ulHtml(c.structure);
      html += "<h4>Messages &amp; timing recipe</h4>" +
        '<table class="report-table"><thead><tr><th>Step</th><th>Timing</th><th>What it does</th></tr></thead><tbody>' +
        c.messages.map(function (m) {
          return "<tr><td>" + escapeHtml(m.step) + "</td><td>" + escapeHtml(m.timing) + "</td><td>" + escapeHtml(m.content) + "</td></tr>";
        }).join("") + "</tbody></table>" +
        '<p class="small muted">Timings are starting points to test, not guarantees.</p>';
      html += "<h4>Segmentation &amp; exclusions</h4>" + ulHtml(c.segmentation);
      html += '<h4>QA checklist</h4><ul class="qa-list">' +
        c.qa.map(function (t) { return "<li>" + escapeHtml(t) + "</li>"; }).join("") + "</ul>";
      html += "<h4>How to measure</h4><p>" + escapeHtml(c.measure) + "</p>";
      html += '<p class="small"><strong>Klaviyo-style setup (example; names vary by ESP):</strong> ' + escapeHtml(c.klaviyoTip) + "</p>";
      const src = sourceList(c);
      if (src.length) {
        html += '<p class="small sources">Sources: ' + src.map(function (x) {
          return '<a href="' + escapeHtml(x.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(x.label) + "</a>";
        }).join(" · ") + "</p>";
      }
      html += "</article>";
    });

    html += '<p class="small muted">Inkrail is independent and not affiliated with Klaviyo or any ESP. Guidance is general and based on your yes/no answers, not on your account data.</p>';
    box.innerHTML = html;
  }

  // ---------- exports ----------
  function buildMarkdown() {
    const s = compute();
    const g = gradeFor(s.score);
    const rows = rankedChecks();
    const L = [];
    L.push("# Inkrail Flow Score: Full Report", "");
    L.push("- Score: **" + s.score + "/100** (" + g.label + ")");
    L.push("- Generated: " + todayStr());
    L.push("- Gaps first, ranked by Flow Score weight; in-place flows follow for QA.", "");
    L.push("| # | Flow | Status | Points |", "|---|---|---|---|");
    rows.forEach(function (r) {
      L.push("| " + r.rank + " | " + (r.c ? r.c.name : r.q.fixTitle) + " | " + (r.gap ? "Gap" : "In place") + " | " + (r.gap ? "+" : "") + r.q.weight + " |");
    });
    L.push("");
    rows.forEach(function (r) {
      const c = r.c;
      if (!c) return;
      L.push("## " + r.rank + ". " + c.name + " (" + (r.gap ? "Gap, +" + r.q.weight + " pts" : "In place, verify") + ")", "");
      L.push("### Why it matters", "");
      c.why.forEach(function (p) { L.push(p, ""); });
      L.push("### Recommended structure", "");
      c.structure.forEach(function (t) { L.push("- " + t.replace(/^•\s*/, "")); });
      L.push("", "### Messages & timing recipe", "", "| Step | Timing | What it does |", "|---|---|---|");
      c.messages.forEach(function (m) { L.push("| " + m.step + " | " + m.timing + " | " + m.content.replace(/\|/g, "/") + " |"); });
      L.push("", "_Timings are starting points to test, not guarantees._", "", "### Segmentation & exclusions", "");
      c.segmentation.forEach(function (t) { L.push("- " + t); });
      L.push("", "### QA checklist", "");
      c.qa.forEach(function (t) { L.push("- [ ] " + t); });
      L.push("", "### How to measure", "", c.measure, "");
      L.push("**Klaviyo-style setup (example; names vary by ESP):** " + c.klaviyoTip, "");
      const src = sourceList(c);
      if (src.length) {
        L.push("Sources:");
        src.forEach(function (x) { L.push("- " + x.label + ": " + x.url); });
        L.push("");
      }
    });
    L.push("---", "Inkrail is independent and not affiliated with Klaviyo or any ESP. Support: " + SUPPORT_EMAIL);
    return L.join("\n") + "\n";
  }

  function csvCell(v) {
    const s = String(v == null ? "" : v);
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function buildCsv() {
    const out = [["rank", "check_id", "flow", "status", "points", "section", "step", "timing", "item"]];
    rankedChecks().forEach(function (r) {
      const c = r.c;
      if (!c) return;
      const base = [r.rank, r.q.id, c.name, r.gap ? "gap" : "in_place", r.q.weight];
      const add = function (section, step, timing, item) { out.push(base.concat([section, step, timing, item])); };
      c.why.forEach(function (t) { add("why", "", "", t); });
      c.structure.forEach(function (t) { add("structure", "", "", t.replace(/^•\s*/, "")); });
      c.messages.forEach(function (m) { add("message", m.step, m.timing, m.content); });
      c.segmentation.forEach(function (t) { add("segmentation", "", "", t); });
      c.qa.forEach(function (t) { add("qa", "", "", t); });
      add("measure", "", "", c.measure);
      add("klaviyo_style_example", "", "", c.klaviyoTip);
      sourceList(c).forEach(function (x) { add("source", "", "", x.label + " " + x.url); });
    });
    return "\uFEFF" + out.map(function (row) { return row.map(csvCell).join(","); }).join("\r\n") + "\r\n";
  }

  function download(filename, mime, text) {
    try {
      const blob = new Blob([text], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1000);
    } catch (_) {
      window.alert("Download failed in this browser. Use Print / Save as PDF instead, or email " + SUPPORT_EMAIL + ".");
    }
  }

  function renderUnlockStatus() {
    const el = els.unlockStatus;
    if (!el) return;
    const u = readUnlock();
    if (!u) { el.textContent = ""; return; }
    if (u.licenseKey && u.verified) {
      el.textContent = "Unlocked on this device · license key verified with Lemon Squeezy.";
    } else if (u.licenseKey) {
      el.textContent = "Unlocked on this device · license key saved (not yet verified; we'll re-check automatically).";
    } else {
      el.textContent = "Unlocked on this device after checkout. Add your license key below so you can open the report on other devices.";
    }
  }

  // Toggle locked / unlocked UI around the results view.
  function applyUnlockView() {
    const unlocked = isUnlocked();
    if (els.fullReport) els.fullReport.classList.toggle("hidden", !unlocked);
    if (els.lockedCard) els.lockedCard.classList.toggle("hidden", unlocked);
    if (els.waitlistCard) els.waitlistCard.classList.toggle("hidden", unlocked);
    if (els.freeCard) els.freeCard.classList.toggle("hidden", unlocked);
    if (unlocked) {
      renderUnlockStatus();
      renderFullReport();
    }
  }

  function refreshView() {
    if (index >= QUESTIONS.length && answeredCount() === QUESTIONS.length) {
      showResults();
    } else {
      renderQuestion();
    }
  }

  window.InkrailFlowReport = { buildMarkdown: buildMarkdown, buildCsv: buildCsv, isUnlocked: isUnlocked };
  /* =================== end full report unlock (v1) =================== */

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
    if (els.unlockBanner) els.unlockBanner.classList.toggle("hidden", !isUnlocked());
    if (els.restoreBox) els.restoreBox.classList.toggle("hidden", isUnlocked());

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
    if (els.unlockBanner) els.unlockBanner.classList.add("hidden");
    if (els.restoreBox) els.restoreBox.classList.add("hidden");

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
          fixWhy: "CSV/Markdown export, timing recipes, and segment rules — included in the full report."
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

    applyUnlockView();
    els.results.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function answer(yes) {
    const q = QUESTIONS[index];
    answers[q.id] = yes;
    index += 1;
    saveState();
    if (index === QUESTIONS.length && answeredCount() === QUESTIONS.length) {
      gcEvent("quiz-complete"); // fresh completion only; reload-resume does not fire
    }
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
    els.waitlistMsg.textContent = "Thanks — your email app should open with a prefilled message. Send it and we'll reply with the link.";

    // Also open mailto so operator receives intent (static hosting cannot POST)
    const subject = encodeURIComponent("Inkrail Flow Score: full report link");
    const body = encodeURIComponent(
      "Please send me the Flow Score full report link.\n\n" +
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
  const ctaCheckout = document.getElementById("cta-checkout");
  if (ctaCheckout) ctaCheckout.addEventListener("click", function () { gcEvent("cta-checkout"); });
  Array.prototype.forEach.call(document.querySelectorAll("form.license-form"), function (f) {
    f.addEventListener("submit", onLicenseSubmit);
  });
  const btnMd = document.getElementById("btn-export-md");
  const btnCsv = document.getElementById("btn-export-csv");
  const btnPrint = document.getElementById("btn-print");
  const btnRestart2 = document.getElementById("btn-restart-2");
  if (btnMd) btnMd.addEventListener("click", function () {
    download("inkrail-flow-report-" + todayStr() + ".md", "text/markdown;charset=utf-8", buildMarkdown());
  });
  if (btnCsv) btnCsv.addEventListener("click", function () {
    download("inkrail-flow-report-" + todayStr() + ".csv", "text/csv;charset=utf-8", buildCsv());
  });
  if (btnPrint) btnPrint.addEventListener("click", function () { window.print(); });
  if (btnRestart2) btnRestart2.addEventListener("click", restart);

  consumeUnlockParam();
  recheckUnverifiedKey();
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
