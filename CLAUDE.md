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

## Sheet status updates (Applied / Reviewed)

The popup for each home has three buttons — **Applied**, **Reviewed**, **Clear** — that write the row's `reviewed_or_applied` column in the Google Sheet. The scraper backend treats that column as protected, so writes from the frontend are not overwritten by scrape runs.

The write path is a Google Apps Script Web App bound to the listings spreadsheet. The frontend POSTs `{listing_id, status}` and the script writes the cell.

### One-time setup

1. Open the listings Google Sheet → **Extensions → Apps Script**.
2. Replace the default `Code.gs` with the contents of `apps-script/Code.gs` and save.
3. **Deploy → New deployment** → Type: **Web app** → Execute as: **Me** → Who has access: **Anyone** → Deploy.
4. Copy the deployment URL (ends in `/exec`).
5. In the unencrypted `index.html`, set `const SHEET_UPDATE_URL = '...';` to that URL.
6. Re-run staticrypt and push `docs/` (see "To update the app" above).

Empty `SHEET_UPDATE_URL` keeps the app in read-only mode (status buttons hidden).

### Updating the script

Edit `apps-script/Code.gs` here, paste into the Apps Script editor, then **Deploy → Manage deployments → edit → New version**. Same `/exec` URL keeps working.

## Future improvements

- **Shared-secret auth on status writes.** Today `SHEET_UPDATE_URL` is the only thing protecting the sheet from writes — anyone with the URL can write. The URL only ships inside the staticrypt-encrypted bundle, so exposure is limited to people with the password, which is enough for a private tool. To harden: add a constant `const SHEET_UPDATE_SECRET = '...';` to `index.html`, send it in the POST body, and check it in `Code.gs` before writing. Then someone who exfiltrates the URL alone (e.g. from browser network logs) still cannot write.
