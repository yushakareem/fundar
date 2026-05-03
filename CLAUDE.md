# dar-finder (frontend)

Private project. Hosted on GitHub Pages at `https://yushakareem.github.io/dar-finder/`.

## Repo structure

```
/
├── docs/
│   └── index.html       # staticrypt-encrypted app — this is what gets served
├── apps-script/
│   └── Code.gs          # Apps Script for sheet status updates (deploy in Apps Script editor)
├── .staticrypt.json     # staticrypt config (salt, algorithm settings — no password)
├── .gitignore
├── .secrets/            # local only, never committed — stores the password
└── index.html           # original unencrypted source — local only, never committed
```

## Password protection

The app is encrypted with [staticrypt](https://github.com/robinmoisson/staticrypt). The encrypted output lives in `docs/` and is what GitHub Pages serves.

GitHub Pages is configured to serve from `/docs`.

## To update the app

1. Edit `index.html` (the unencrypted source)
2. Re-run staticrypt to regenerate `docs/index.html`:
   ```sh
   npx staticrypt index.html -o docs/index.html
   ```
3. Commit and push only `docs/`:
   ```sh
   git add docs/ && git commit -m "update app" && git push
   ```

## Constraints

- Never commit root `index.html` — it is gitignored (`/index.html`)
- Never commit `.secrets/` — gitignored (`/.secrets`)
- `.staticrypt.json` is safe to commit (contains salt only, no password)

## Google Sheet integration

A single Apps Script Web App (`apps-script/Code.gs`) bound to the listings spreadsheet handles **both** reads and writes:

- `GET /exec` → returns all listings as JSON. The frontend uses this for the live dataset on page load. No publish-cache lag, so writes are visible on next reload.
- `POST /exec {listing_id, status}` → writes the row's `reviewed_or_applied` cell. Driven by the Applied / Reviewed / Clear buttons in each home's popup. The scraper backend treats `reviewed_or_applied` as protected, so frontend writes survive scrape runs.

### One-time setup

1. Open the listings Google Sheet → **Extensions → Apps Script**.
2. Replace the default `Code.gs` with the contents of `apps-script/Code.gs` and save.
3. **Deploy → New deployment** → Type: **Web app** → Execute as: **Me** → Who has access: **Anyone** → Deploy.
4. Copy the deployment URL (ends in `/exec`).
5. In the unencrypted `index.html`, set `const SHEET_API_URL = '...';` to that URL.
6. Re-run staticrypt and push `docs/` (see "To update the app" above).

Empty `SHEET_API_URL` falls back to reading the published-to-web CSV (with publish-cache lag) and hides the status buttons.

### Updating the script

Edit `apps-script/Code.gs` here, paste into the Apps Script editor, then **Deploy → Manage deployments → edit → New version**. Same `/exec` URL keeps working.

## Proximity tier system

Card and map-pin colour is driven by the **`closest_mosque_status` column** written by the backend scraper — the frontend does not recalculate it. The frontend falls back to its own calculation only if the column is missing.

| Tier | Colour | Meaning |
|---|---|---|
| `green` | Green | Mosque within 10 min walk, 6 min cycle, or 6 min drive |
| `orange` | Orange | Mosque within 15 min walk, 9 min cycle, or 9 min drive |
| `red` | Red | Mosque found but beyond all thresholds |
| `blue` | Blue | No mosque found within the search radius — check manually |

Thresholds are defined in `backend/home-scrape-nl/config.yaml` under `mosque_status_thresholds`. If you change them there, update this table and the legend text in `index.html`.

The proximity filter is **multi-select** — Sarah can toggle any combination of tiers. No buttons active = show all.

## Future improvements

- **Shared-secret auth on status writes.** Today `SHEET_API_URL` is the only thing protecting the sheet from writes — anyone with the URL can write (and read). The URL only ships inside the staticrypt-encrypted bundle, so exposure is limited to people with the password, which is enough for a private tool. To harden: add a constant `const SHEET_API_SECRET = '...';` to `index.html`, send it in the POST body, and check it in `Code.gs` before writing. Then someone who exfiltrates the URL alone (e.g. from browser network logs) still cannot write. Reads can stay open or be similarly gated.
