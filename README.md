# Spin the Wheel — QR Kiosk

A phone-friendly spin-the-wheel page: scan a QR code → enter name & phone →
spin a wheel with **Risk-o-meter / Financial Health Checkup / Rapid Fire** →
see the result full-screen → the entry is logged to a Google Sheet
(which you can export as Excel any time).

## Files

| File | Purpose |
|---|---|
| `index.html` | The three screens (details form, wheel, full-screen result) |
| `style.css` | All styling |
| `script.js` | Form validation, wheel spin logic, sends data to Google Sheets |
| `google-apps-script.gs` | Backend code — paste this into Google Apps Script |

## 1. Set up the Google Sheet backend (free, ~5 minutes)

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank
   spreadsheet, e.g. **"Spin the Wheel — Responses"**.
2. In the sheet: **Extensions → Apps Script**.
3. Delete any placeholder code, and paste in the contents of
   `google-apps-script.gs`.
4. Click **Deploy → New deployment → (gear icon) → Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**, then **Authorize access** (click through the "unsafe"
   warning — it's your own script, so this is expected and safe).
6. Copy the **Web app URL** — it looks like:
   `https://script.google.com/macros/s/XXXXXXXXXXXXXXXX/exec`

Every time someone finishes a spin, a new row (Timestamp, Name, Phone, Game)
is appended automatically. Open the sheet any time, or go to
**File → Download → Microsoft Excel (.xlsx)** to get an Excel copy.

> If you ever need to change something in the script after deploying, use
> **Deploy → Manage deployments → Edit (pencil icon) → New version** —
> just saving the code isn't enough to update a live deployment.

## 2. Connect the frontend to the backend

Open `script.js` and paste your Web app URL into the top:

```js
const SCRIPT_URL = "https://script.google.com/macros/s/XXXXXXXXXXXXXXXX/exec";
```

## 3. Host it for free on GitHub Pages

1. Create a new GitHub repository (public or private both work).
2. Upload `index.html`, `style.css`, and `script.js` to the root of the repo
   (you don't need to upload `google-apps-script.gs` or this README —
   they're just for setup, not part of the live site).
3. Go to the repo's **Settings → Pages**.
4. Under "Build and deployment", set **Source: Deploy from a branch**, then
   **Branch: main**, folder **/(root)**, and click **Save**.
5. After a minute or two, GitHub will show your live URL, something like:

   `https://your-username.github.io/your-repo-name/`

That URL is what your QR code should point to.

## 4. Generate the QR code

Once you have the GitHub Pages URL, send it back to me and I'll generate a
QR code image for you — or use any free QR generator (e.g.
[qr-code-generator.com](https://www.qr-code-generator.com/)) and paste in
your URL.

## Notes

- The wheel gives each of the 3 options an equal (1-in-3) chance every spin.
- Phone number is validated as a 10-digit number before the person can
  continue — adjust the `pattern="[0-9]{10}"` in `index.html` and the regex
  in `script.js` if you need a different format (e.g. with country code).
- The "Start again" button on the result screen resets the flow, so the
  same device/kiosk can be reused for the next visitor without reloading
  the page.
- All data (name, phone, game, timestamp) is sent directly from the
  visitor's browser to your Google Sheet — nothing passes through GitHub.
