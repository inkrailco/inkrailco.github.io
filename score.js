/**
 * Inkrail Flow Score v0 — free client-side weighted rubric + full report.
 * Full report content: report-content.js.
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
    freeCard: document.getElementById("free-card"),
    fullReport: document.getElementById("full-report"),
    reportBody: document.getElementById("report-body"),
  };

  // GoatCounter events (no answers, scores, or emails are ever sent).
  // Event name: event-quiz-complete, with "-gads" appended when the browser
  // session arrived from a Google Ads click (utm_source=google&utm_medium=cpc or gclid).
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

  const SUPPORT_EMAIL = "inkrailco@gmail.com";
  const REPORT = window.INKRAIL_REPORT_CONTENT || null;

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
      box.innerHTML = '<p class="report-error err">The report content failed to load. Reload the page; if it persists, email ' +
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

  window.InkrailFlowReport = { buildMarkdown: buildMarkdown, buildCsv: buildCsv };

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

    if (missing.length === 0) {
      els.freeFixes.innerHTML =
        '<li><p class="fix-title">No gaps from this checklist</p>' +
        '<p class="fix-why">Use the full report below to QA every flow and keep the system healthy.</p></li>';
    } else {
      els.freeFixes.innerHTML = missing.slice(0, 3).map(renderFixItem).join("");
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        answers,
        index: QUESTIONS.length,
        lastScore: score,
        completedAt: new Date().toISOString()
      }));
    } catch (_) { /* ignore */ }

    els.fullReport.classList.remove("hidden");
    renderFullReport();
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

  // Wire events
  if (!els.quiz) return;

  els.btnYes.addEventListener("click", function () { answer(true); });
  els.btnNo.addEventListener("click", function () { answer(false); });
  els.btnBack.addEventListener("click", goBack);
  if (els.btnRestart) els.btnRestart.addEventListener("click", restart);
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

  loadState();
  // If previously completed, show results; else resume quiz
  if (index >= QUESTIONS.length && answeredCount() === QUESTIONS.length) {
    showResults();
  } else {
    if (index > answeredCount()) index = answeredCount();
    renderQuestion();
  }
})();
