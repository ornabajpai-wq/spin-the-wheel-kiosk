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
    sheet.appendRow(["Timestamp", "Name", "Phone", "Email", "Age", "Game"]);
  }

  var data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    data.timestamp || new Date().toISOString(),
    data.name || "",
    data.phone || "",
    data.email || "",
    data.age || "",
    data.game || ""
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ status: "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// GET ?action=next  -> hands out the next slot number in the shared rotation.
// One global counter (stored in Script Properties) is advanced under a lock,
// so every spin from every device gets a unique, consecutive slot.
// GET (no action)   -> just confirms the deployment is live.
function doGet(e) {
  var action = e && e.parameter && e.parameter.action;

  if (action === "next") {
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var props = PropertiesService.getScriptProperties();
      var slot = Number(props.getProperty("SPIN_COUNT") || 0);
      props.setProperty("SPIN_COUNT", String(slot + 1));
      return ContentService
        .createTextOutput(JSON.stringify({ slot: slot }))
        .setMimeType(ContentService.MimeType.JSON);
    } finally {
      lock.releaseLock();
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: "Spin wheel backend is running" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Run this once from the Apps Script editor if you ever want the rotation
// to start again from Risk-o-meter (e.g. before the event begins).
function resetRotation() {
  PropertiesService.getScriptProperties().setProperty("SPIN_COUNT", "0");
}
