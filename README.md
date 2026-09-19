# Inkrail site — Flow Score v0 teaser

Static files for **inkrailco.github.io** (GitHub Pages).

## Open locally

```bash
cd /workspace/company-os/inkrail/site
python3 -m http.server 8765
```

Then visit:

- Home: http://127.0.0.1:8765/index.html  
- Flow Score: http://127.0.0.1:8765/score.html  

Or open `index.html` / `score.html` directly in a browser (file:// works; mailto + localStorage still function).

## What’s included

| File | Role |
|------|------|
| `index.html` | Landing — leads with Flow Score teaser; Mini-Kit demoted to backlog |
| `score.html` | Interactive 8-question quiz → 0–100 score + top 3 fixes; locks rest + export behind CTA |
| `score.js` | Weighted rubric, ranking, localStorage resume, waitlist mailto |
| `styles.css` | Mobile-friendly Inkrail UI |
| `waitlist.jsonl` | Stub only (browsers cannot write here on static host) |
| `README.md` | This file |

## Waitlist behavior (static)

- Visible email field + button on home and results.
- Saves intent to `localStorage` (`inkrail_waitlist_intents`).
- Opens prefilled `mailto:inkrailco@gmail.com`.
- **Parent / ops:** for real POSTs later, wire Formspree (or similar). Do **not** put Lemon Squeezy API keys in the frontend.

## Unlock CTA

Copy is fixed: **“Unlock full report — coming via Lemon Squeezy”**. No LS secrets in this repo folder.

## Publish

Preferred remote: `inkrailco/inkrailco.github.io`.

If `gh` is not authenticated on this box, copy the contents of this `site/` folder to that repo (root or `/docs` per Pages settings) via browser/local git and push.

## Brand

- Brand: Inkrail  
- Contact: inkrailco@gmail.com  
- Language: English  
