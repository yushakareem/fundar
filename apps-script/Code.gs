/**
 * Dar Finder — Sheet status updater.
 *
 * Bound to the listings spreadsheet. Receives POST {listing_id, status}
 * from the frontend and writes `status` into the row's `reviewed_or_applied`
 * column. Identifies columns by header name so column order can shift safely.
 *
 * Allowed statuses: "applied", "reviewed", "" (clear).
 *
 * Deploy: Extensions → Apps Script → paste this file → Deploy → New deployment
 *   → Type: Web app → Execute as: Me → Who has access: Anyone
 *   → Copy the /exec URL into index.html as SHEET_UPDATE_URL.
 *
 * Re-deploy after edits: Deploy → Manage deployments → edit → New version.
 */

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const { listing_id, status } = body;

    if (!listing_id) return _json({ ok: false, error: 'missing listing_id' });

    const allowed = ['applied', 'reviewed', ''];
    if (!allowed.includes(status)) {
      return _json({ ok: false, error: 'invalid status' });
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    const lastCol = sheet.getLastColumn();
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return _json({ ok: false, error: 'empty sheet' });

    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const idCol = headers.indexOf('listing_id') + 1;
    const statusCol = headers.indexOf('reviewed_or_applied') + 1;
    if (!idCol || !statusCol) {
      return _json({ ok: false, error: 'required columns not found' });
    }

    const ids = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(listing_id)) {
        sheet.getRange(i + 2, statusCol).setValue(status);
        return _json({ ok: true, listing_id, status });
      }
    }
    return _json({ ok: false, error: 'listing_id not found' });
  } catch (err) {
    return _json({ ok: false, error: String(err) });
  }
}

function doGet() {
  return _json({ ok: true, service: 'dar-finder status updater' });
}

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
