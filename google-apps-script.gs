/**
 * SETUP INSTRUCTIONS
 * ------------------
 * 1. Go to https://sheets.google.com and create a new blank spreadsheet.
 *    Name it something like "Spin the Wheel — Responses".
 * 2. In the sheet, go to Extensions > Apps Script.
 * 3. Delete anything in the editor and paste this entire file in.
 * 4. Click Deploy > New deployment.
 *    - Click the gear icon next to "Select type" and choose "Web app".
 *    - Description: anything you like.
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Click Deploy. The first time, Google will ask you to authorize
 *    the script — click through the "unsafe" warning (this is your own
 *    script, so it's safe) and allow it.
 * 6. Copy the "Web app URL" it gives you — it looks like:
 *    https://script.google.com/macros/s/XXXXXXX/exec
 * 7. Paste that URL into SCRIPT_URL at the top of script.js
 *
 * Every submission will now be appended as a new row: Timestamp, Name,
 * Phone, Game. You can open the sheet at any time and use
 * File > Download > Microsoft Excel (.xlsx) to export it.
 */

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // Add header row the first time the sheet is used
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Timestamp", "Name", "Phone", "Game"]);
  }

  var data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    data.timestamp || new Date().toISOString(),
    data.name || "",
    data.phone || "",
    data.game || ""
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ status: "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Optional: lets you visit the web app URL directly in a browser to
// confirm the deployment is live.
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "Spin wheel backend is running" }))
    .setMimeType(ContentService.MimeType.JSON);
}
