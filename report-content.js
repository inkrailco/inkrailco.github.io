/**
 * Inkrail Flow Score — full report content (v1)
 * Static guidance for the 8 Flow Score checks. Ids and weights MUST match QUESTIONS in score.js.
 * ESP-agnostic. Event/metric names in "Klaviyo tip" lines are examples only; names vary by
 * ESP and store integration. Inkrail is not affiliated with Klaviyo or any ESP.
 * Timings are starting-point recipes to test, not benchmarks or guarantees.
 */
window.INKRAIL_REPORT_CONTENT = {
  version: "2026-09-25",
  sources: {
    klaviyoAudit: { label: "Klaviyo blog: The complete checklist to audit your flows (Mar 2026)", url: "https://www.klaviyo.com/blog/the-complete-checklist-audit-your-flows" },
    baymard: { label: "Baymard Institute: Cart abandonment rate statistics", url: "https://baymard.com/lists/cart-abandonment-rate" },
    gmailSenders: { label: "Google: Email sender guidelines (Gmail)", url: "https://support.google.com/a/answer/81126" },
    yahooSenders: { label: "Yahoo Sender Hub: Sender best practices", url: "https://senders.yahooinc.com/best-practices/" },
    appleMpp: { label: "Apple: Mail Privacy Protection & Privacy", url: "https://www.apple.com/legal/privacy/data/en/mail-privacy-protection/" },
    canSpam: { label: "FTC: CAN-SPAM Act compliance guide for business", url: "https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business" },
    ftcReviews: { label: "FTC: Consumer Reviews and Testimonials Rule Q&A", url: "https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers" }
  },
  checks: {
    abandoned_cart: {
      weight: 20,
      name: "Abandoned cart / checkout recovery",
      why: [
        "Shoppers who start checkout or add to cart have shown the strongest buying intent short of ordering, and most carts are abandoned: Baymard Institute's average across 50 published studies is roughly 70% (see source).",
        "A recovery series reaches only people who just acted, so it is relevant by design and rarely feels like a blast. Klaviyo's own audit checklist ranks checkout abandonment as the highest-intent flow to build first."
      ],
      structure: [
        "Trigger: 'checkout started' as the primary flow. If you also capture 'added to cart' for known profiles, run it as a separate, lower-priority flow that exits anyone who then starts checkout.",
        "Exit rule (flow filter): placed an order since entering the flow. Re-check before every message, not just at entry.",
        "Content: a dynamic block with the abandoned items (image, name, variant, price) and a button that returns to the restored cart or checkout.",
        "Optional split: first-time shoppers vs. returning customers (different tone and offer)."
      ],
      messages: [
        { step: "Email 1", timing: "30–60 min after trigger", content: "Simple reminder: items, return-to-cart button, a line on how to get help. No discount." },
        { step: "Email 2", timing: "~24 h after trigger", content: "Handle objections: shipping cost and speed, returns policy, reviews or FAQs for the product in the cart." },
        { step: "Email 3", timing: "~48–72 h after trigger", content: "Last reminder. If you test an incentive, put it here, for first-time buyers only, single-use and expiring. Only mention low stock if it is true." }
      ],
      segmentation: [
        "Exclude anyone who ordered since the flow started (checked before each email).",
        "Limit re-entry (e.g. once per 7–14 days) so frequent abandoners don't learn to wait for a code.",
        "Returning customers: skip the incentive branch; lead with reassurance or reorder convenience.",
        "Optional: only offer an incentive above a cart-value floor that your margins can support.",
        "Send SMS or push steps only to profiles with that channel's own consent.",
        "Exclude internal, test, and staff addresses."
      ],
      qa: [
        "Run a real test checkout with your own email. Does the flow trigger within minutes?",
        "Dynamic block renders correctly for 1 item and for 3+ items (images, variants, prices).",
        "Return-to-cart link restores the cart on mobile and desktop (not an empty cart).",
        "Place a test order mid-flow and confirm the remaining emails are skipped.",
        "If you use a discount code: it applies at checkout, is single-use, and expires.",
        "Delays are set in hours/minutes as intended (a common slip is days instead of hours).",
        "Unsubscribe link and physical postal address present; sends from your authenticated domain."
      ],
      measure: "Track recovered revenue per recipient and placed-order rate. Open rates are unreliable (see Sunset notes).",
      klaviyoTip: "In Klaviyo-style setups this is usually a metric-triggered flow on 'Started Checkout' with the filter 'Placed Order zero times since starting this flow'. Klaviyo's checklist suggests a first send around 30–45 minutes after abandonment.",
      sources: ["baymard", "klaviyoAudit"]
    },
    welcome: {
      weight: 15,
      name: "Welcome series",
      why: [
        "A new subscriber is paying the most attention right after they sign up. A welcome series uses that window to deliver any promised signup offer, set expectations (what you send, how often), and introduce the brand before regular campaigns start.",
        "One email has to do all of that at once and usually does it poorly. Klaviyo's audit checklist lists welcome as a core flow that should be live."
      ],
      structure: [
        "Trigger: joined your main newsletter list/form (or a 'subscribed' event). Use one welcome flow per real entry point; don't let a person enter two parallel welcome flows.",
        "Exit rule: placed an order since entering → exit, or branch into a short 'thanks for your first order' path.",
        "Arc: deliver the promise → brand story/why you exist → best sellers & social proof → soft conversion nudge."
      ],
      messages: [
        { step: "Email 1", timing: "Immediately", content: "Deliver what the form promised (code, guide, early access). Say what to expect and how often. One clear shop CTA." },
        { step: "Email 2", timing: "Day 1–2", content: "Brand story: who's behind it, what makes the product different, how it's made or sourced." },
        { step: "Email 3", timing: "Day 3–4", content: "Best sellers or the 'start here' product, with real reviews/UGC." },
        { step: "Email 4 (optional)", timing: "Day 6–8", content: "Objection handling: shipping, returns, guarantee, sizing/FAQ. If a signup code was given, a reminder before it expires." }
      ],
      segmentation: [
        "Exclude existing customers who sign up to the newsletter later. Send them a short 'glad you're here' variant or nothing.",
        "Exit on first purchase (checked before every email).",
        "If you collect a preference (category, skin type, etc.) at signup, split email 3 by that preference.",
        "Don't also send full promotional campaigns to someone in their first few days unless you've decided to on purpose (e.g. a sitewide sale)."
      ],
      qa: [
        "Sign up with a fresh test address through every live form/popup. Each one triggers exactly one welcome flow.",
        "The signup code in email 1 matches what the form promised and actually applies at checkout.",
        "Double opt-in (if used): welcome triggers after confirmation, not before.",
        "Test purchase mid-series → remaining welcome emails skip.",
        "Links, images, and dark-mode rendering checked on mobile.",
        "Sender name and reply-to are monitored; replies reach a human."
      ],
      measure: "Placed-order rate and revenue per recipient for the whole flow; unsubscribe rate per email (a spike means that message or timing needs work).",
      klaviyoTip: "Usually a list-triggered flow ('added to list') with a 'Placed Order zero times since starting this flow' filter. Check that your popup tool and your main form aren't both triggering separate welcome flows.",
      sources: ["klaviyoAudit"]
    },
    winback: {
      weight: 15,
      name: "Lapsed-buyer winback",
      why: [
        "People who have bought from you before already trust you, and they are usually cheaper to bring back than a new customer is to acquire. Without a winback, buyers who drift away just stop hearing from you in any targeted way.",
        "Winback also tells you who is truly gone, which feeds your sunset/suppression rules."
      ],
      structure: [
        "Trigger: last order date. Start at a point clearly past your normal repurchase cycle (e.g. 60–120 days for consumables, longer for durable goods). If you can, base it on your own median time between orders.",
        "Exit rule: placed an order since entering.",
        "Arc: check-in / what's new → reason to come back (new products, bestsellers, reorder) → final offer (optional) → hand off to sunset if no engagement."
      ],
      messages: [
        { step: "Email 1", timing: "Day 0 (lapse threshold reached)", content: "'It's been a while': what's new since their last order, their last-purchased category, easy reorder link." },
        { step: "Email 2", timing: "+5–7 days", content: "Social proof and bestsellers; for consumables, a replenishment angle ('running low?')." },
        { step: "Email 3", timing: "+7–10 days", content: "Optional incentive (test vs. no incentive). Make it clearly time-limited." },
        { step: "Email 4 (optional)", timing: "+7 days", content: "Preference check: 'want fewer emails?' link to preference center / pause options; non-clickers then feed sunset." }
      ],
      segmentation: [
        "Only past purchasers (at least 1 order), whose last order is older than the threshold.",
        "Exclude people with an open order, a recent refund dispute, or an active subscription (if you sell subscriptions, they need a different flow).",
        "Split one-time buyers and repeat buyers: repeat buyers often come back with lighter prompting, so test no incentive first.",
        "Limit re-entry (e.g. once per 180 days)."
      ],
      qa: [
        "Preview the segment/trigger: does the count of 'lapsed' buyers look plausible against your order history?",
        "Profiles with a recent order do NOT qualify (spot-check 3 real customers).",
        "Dynamic 'last purchased' content falls back gracefully when data is missing.",
        "Incentive code works, is unique or limited, and expires.",
        "Final email's preference/pause link works and is honored."
      ],
      measure: "Reactivation rate (share of recipients who order within e.g. 30 days of entering) and revenue per recipient. Compare with a small holdout if your ESP supports it.",
      klaviyoTip: "A common pattern is a flow triggered by 'Placed Order' with a long time delay and the filter 'Placed Order zero times since starting this flow', or a date-property trigger on last order date. Klaviyo's checklist groups win-back/sunset as core coverage.",
      sources: ["klaviyoAudit"]
    },
    post_purchase: {
      weight: 12,
      name: "Post-purchase nurture",
      why: [
        "The time right after a first order is when a customer decides whether you were a one-off or a brand they'll buy from again. Useful follow-up (how to use it, what to expect, what goes with it) can cut support questions and lead to a second order.",
        "The transactional receipt/shipping emails are not a nurture sequence. Keep them transactional and run nurture separately."
      ],
      structure: [
        "Trigger: order placed (or fulfilled/shipped if you want timing tied to delivery).",
        "Split: first-time customers vs. repeat customers. First-timers get onboarding; repeat customers get a shorter thank-you/loyalty path.",
        "Optional: split by product category so the usage tips match what they actually bought.",
        "Coordinate with the review-request flow so the two don't collide."
      ],
      messages: [
        { step: "Email 1", timing: "Day 0–1 after order", content: "Thank you + what happens next (shipping timeline, where to track, who to contact). No hard sell." },
        { step: "Email 2", timing: "Around expected delivery", content: "How to get the most from the product: setup, usage, care tips, short video/FAQ." },
        { step: "Email 3", timing: "~7–14 days after delivery", content: "Complementary products or refills that genuinely pair with what they bought." },
        { step: "Email 4 (optional)", timing: "~21–30 days", content: "Loyalty/referral program or community invite; replenishment reminder if relevant to usage cycle." }
      ],
      segmentation: [
        "Branch by first vs. repeat purchase.",
        "Exclude orders that were cancelled or fully refunded (and pause for open support tickets if you can see them).",
        "Don't cross-sell items the customer already bought in the same order.",
        "Wholesale/B2B or gift orders may need exclusion or a different path."
      ],
      qa: [
        "Place a test order: correct branch fires (first-time vs. repeat).",
        "Timing roughly matches real delivery times for your main shipping zones.",
        "Cross-sell block excludes purchased items and shows in-stock products only.",
        "Cancelled/refunded test order exits the flow.",
        "Marketing emails in this flow include unsubscribe; keep the transactional receipt purely transactional (see FTC CAN-SPAM guide)."
      ],
      measure: "Second-order rate within 60–90 days for flow recipients vs. history; support tickets about 'how do I use / where is my order'.",
      klaviyoTip: "Typically triggered on 'Placed Order' (or 'Fulfilled Order' from your store integration) with a conditional split on the customer's order count.",
      sources: ["canSpam", "klaviyoAudit"]
    },
    sunset: {
      weight: 12,
      name: "Sunset / unengaged suppression",
      why: [
        "Mailbox providers watch how recipients react. Sending over and over to people who never engage, or who mark you as spam, can push your mail toward spam folders for everyone, including your best customers. Gmail and Yahoo both publish sender requirements, including keeping reported spam rates below 0.3% and supporting easy unsubscribe.",
        "Opens alone are no longer a reliable engagement signal: Apple Mail Privacy Protection preloads remote content, which can register 'opens' that never happened. Build engagement definitions on clicks, site activity, and orders as well."
      ],
      structure: [
        "Define 'unengaged': e.g. no clicks, no site visits, no orders in 90–180 days AND on your list for longer than that window (don't sunset new subscribers).",
        "Sunset flow: triggered when a profile enters the unengaged segment.",
        "After the flow, anyone who still hasn't engaged is suppressed from campaigns (keep them in your records; don't delete purchase history)."
      ],
      messages: [
        { step: "Email 1", timing: "Day 0 (enters unengaged segment)", content: "'Still want to hear from us?' One big 'Yes, keep me subscribed' button (a click = re-engaged), plus a preference/frequency link." },
        { step: "Email 2", timing: "+4–7 days", content: "Best content or current bestseller, and the same keep-me-subscribed button." },
        { step: "Email 3", timing: "+4–7 days", content: "Clear last notice: 'we'll stop emailing unless you click'. Then suppress non-clickers." }
      ],
      segmentation: [
        "Campaign audiences should default to an 'engaged' segment (e.g. clicked, visited, or ordered in the last 90–180 days, plus recent signups), not the whole list.",
        "Treat Apple MPP 'opens' with caution: don't let opens alone keep someone 'engaged'.",
        "Exclude recent purchasers and recent signups from sunset.",
        "Suppress (don't just skip) hard bounces, spam complainers, and people who finished the sunset flow without engaging."
      ],
      qa: [
        "SPF, DKIM, and DMARC set up for your sending domain; From domain aligned (see Gmail/Yahoo sender requirements).",
        "One-click unsubscribe header present on marketing emails, and a visible unsubscribe link in the body.",
        "Spam complaint rate checked in Google Postmaster Tools (or your ESP's deliverability report).",
        "Engaged segment count is sensible; newest subscribers are included.",
        "A test profile that clicks 'keep me subscribed' leaves the unengaged segment.",
        "Non-engagers after the final email are actually suppressed from the next campaign's audience."
      ],
      measure: "Spam complaint rate, bounce rate, inbox placement signals, and click rate on campaigns sent to the engaged segment. List size will shrink. That's intended.",
      klaviyoTip: "Most ESPs (Klaviyo included) let you build this as a segment-triggered flow plus a suppression step. Check how your ESP counts Apple MPP opens before relying on 'opened' conditions.",
      sources: ["gmailSenders", "yahooSenders", "appleMpp"]
    },
    segments: {
      weight: 10,
      name: "Core purchaser / non-purchaser segments",
      why: [
        "Every other fix depends on sending the right message to the right people. Without basic segments, customers get 'first order' discounts, new subscribers get loyalty messages, and unengaged contacts drag down deliverability.",
        "A few well-defined segments make campaigns and flow exclusions simpler to set up, and you can reuse them everywhere."
      ],
      structure: [
        "Build these core segments (names are suggestions):",
        "• Engaged (e.g. clicked, visited site, or ordered in the last 90–180 days, plus signups in the last 30 days)",
        "• Purchasers (at least 1 order ever) and Repeat purchasers (2+ orders)",
        "• Never purchased (subscribed, 0 orders)",
        "• Recent purchasers (ordered in last 14–30 days), mainly for exclusions",
        "• Lapsed purchasers (last order older than your winback threshold)",
        "• Unengaged (sunset input) and Suppressed"
      ],
      messages: [
        { step: "Not a flow", timing: "One-time setup, then review quarterly", content: "Segments feed campaigns and flow filters. Put 'Engaged' as the default campaign audience and use the rest as includes/excludes." }
      ],
      segmentation: [
        "First-order discount campaigns → Never purchased only.",
        "Loyalty/VIP/early access → Repeat purchasers.",
        "Exclude Recent purchasers from promotional pushes for the item they just bought.",
        "Exclude Unengaged/Suppressed from all regular campaigns.",
        "Keep definitions written down (one line each) so everyone on the team uses the same meaning."
      ],
      qa: [
        "Spot-check 5 real profiles: do they land in the segments you'd expect?",
        "Purchaser counts roughly match your store's customer count (big gaps suggest the store integration is not syncing).",
        "Default campaign audience = Engaged segment, with Suppressed excluded.",
        "Each flow's filters reference these segments consistently (no stale one-off segments).",
        "Refunded/test orders don't inflate purchaser segments."
      ],
      measure: "Campaign click rate and unsubscribe rate by segment; whether discount codes are going to people who have already bought.",
      klaviyoTip: "Most ESPs support these as dynamic segments on order count, last order date, and engagement. Klaviyo's audit guidance also recommends conditional splits (first-time vs. repeat, engagement level) inside flows.",
      sources: ["klaviyoAudit"]
    },
    browse_abandon: {
      weight: 8,
      name: "Browse abandonment",
      why: [
        "Product viewers who didn't add to cart are showing interest but lower intent than cart abandoners. A light reminder can move some of them forward.",
        "Klaviyo's checklist ranks browse abandonment below checkout and cart abandonment by intent. That's why it carries less weight here. Once site tracking works, it costs little to run."
      ],
      structure: [
        "Requires on-site tracking that ties product views to a known email profile (your ESP's tracking script/integration).",
        "Trigger: viewed product. Exit if they add to cart, start checkout, or order since entering (those are handled by higher-intent flows).",
        "Keep it short and helpful. The tone should be 'here's more info', not 'we saw you'."
      ],
      messages: [
        { step: "Email 1", timing: "2–4 h after last product view", content: "The viewed product(s) with key benefits, reviews, and a link back. No discount." },
        { step: "Email 2 (optional)", timing: "~24–48 h", content: "Related/alternative products or the category bestsellers; answer common questions." }
      ],
      segmentation: [
        "Exclude anyone who added to cart, started checkout, or ordered since entering.",
        "Limit re-entry (e.g. once per 7–14 days) so frequent browsers aren't emailed constantly.",
        "Exclude people currently in the abandoned cart or welcome flow if messages would stack the same day.",
        "Optional: only trigger for engaged profiles, or for products above a price floor."
      ],
      qa: [
        "Confirm product-view tracking is firing for identified visitors (check a test profile's activity feed).",
        "Test: view a product while identified → flow triggers; add to cart → browse flow exits.",
        "Product block shows the viewed item with the correct image, price, and URL.",
        "Re-entry limit is active.",
        "Unsubscribe link and footer present."
      ],
      measure: "Placed-order rate and revenue per recipient; watch unsubscribes. If they're high, reduce frequency or tighten the trigger.",
      klaviyoTip: "Commonly a 'Viewed Product' metric-triggered flow with filters: 'Added to Cart zero times', 'Started Checkout zero times', and 'Placed Order zero times since starting this flow' (per Klaviyo's audit checklist).",
      sources: ["klaviyoAudit"]
    },
    review_request: {
      weight: 8,
      name: "Post-delivery review / UGC request",
      why: [
        "Reviews and customer photos help future shoppers decide, and the request opens a conversation that can lead to a second purchase or surface a problem early.",
        "Keep it honest: the FTC's Consumer Reviews and Testimonials Rule prohibits things like offering incentives conditioned on a particular sentiment and suppressing negative reviews. Ask everyone, and reward (if at all) regardless of star rating."
      ],
      structure: [
        "Trigger: delivered (if your shipping data supports it) or fulfilled/shipped + an estimated delivery delay.",
        "One ask per email, one clear CTA (e.g. star rating link to your reviews tool).",
        "Route unhappy responses to support quickly. Don't filter them out of public reviews."
      ],
      messages: [
        { step: "Email 1", timing: "~5–10 days after delivery (longer for products that take time to evaluate)", content: "Ask for a quick review; 1-click star rating if your review tool supports it." },
        { step: "Email 2 (optional)", timing: "+5–7 days, only if no review yet", content: "Short reminder; optionally invite a photo/video (UGC)." }
      ],
      segmentation: [
        "Exclude orders that were refunded, returned, or have an open support ticket (resolve first).",
        "Exclude people who already reviewed that product.",
        "One review request per order, even for multi-item orders (ask about the main item or let them pick).",
        "Any incentive must be offered for an honest review of any rating and disclosed as required."
      ],
      qa: [
        "Timing tested against actual delivery times for your main shipping regions.",
        "Review link opens the right product and works on mobile without login friction.",
        "Negative reviews still publish (no sentiment gating).",
        "Flow exits when a review is submitted.",
        "Doesn't land the same day as post-purchase cross-sell emails."
      ],
      measure: "Review submission rate per recipient, share of reviews with photos, and any support issues it surfaces.",
      klaviyoTip: "If your review app integrates with your ESP, trigger on its 'review submitted' events for exits; otherwise trigger on fulfilled order + delay.",
      sources: ["ftcReviews"]
    }
  }
};
