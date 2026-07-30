https://script.google.com/macros/s/AKfycbyxInIhvSZhFY2FbRtKlB6V0Pr7lj6PE6gmy8r3ec53faV4iAk1YWAhC_SZ98SAiyH1/exec
// ============================================================
// 1. CONFIG — paste your Google Apps Script Web App URL here
// ============================================================
const SCRIPT_URL = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";

// ============================================================
// 2. GAME DATA — must match the 3 segments in the CSS conic-gradient
//    (each segment is 120deg, starting at 0deg / top, going clockwise)
// ============================================================
const GAMES = [
  {
    name: "Risk-o-meter",
    start: 0,
    theme: "brass",
    tagline: "Let's map out how much risk you're really comfortable with."
  },
  {
    name: "Financial Health Checkup",
    start: 120,
    theme: "coral",
    tagline: "A quick, honest check-up for your money."
  },
  {
    name: "Rapid Fire",
    start: 240,
    theme: "teal",
    tagline: "Quick questions. Quicker answers."
  }
];

// ============================================================
// 3. STATE + ELEMENT REFERENCES
// ============================================================
let visitor = { name: "", phone: "" };
let currentRotation = 0;
let spinning = false;

const screenForm = document.getElementById("screen-form");
const screenWheel = document.getElementById("screen-wheel");
const screenResult = document.getElementById("screen-result");

const detailsForm = document.getElementById("detailsForm");
const nameInput = document.getElementById("nameInput");
const phoneInput = document.getElementById("phoneInput");
const formError = document.getElementById("formError");

const wheelHeadline = document.getElementById("wheelHeadline");
const wheelEl = document.getElementById("wheel");
const pointerEl = document.getElementById("pointer");
const hubEl = document.getElementById("hub");
const spinBtn = document.getElementById("spinBtn");

const resultEyebrow = document.getElementById("resultEyebrow");
const resultText = document.getElementById("resultText");
const resultSub = document.getElementById("resultSub");
const restartBtn = document.getElementById("restartBtn");

// ============================================================
// 4. SCREEN NAVIGATION
// ============================================================
function showScreen(el) {
  [screenForm, screenWheel, screenResult].forEach(s => s.classList.remove("active"));
  el.classList.add("active");
}

// ============================================================
// 5. STEP 1 — DETAILS FORM
// ============================================================
detailsForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();

  if (!name) {
    formError.textContent = "Please enter your name.";
    return;
  }
  if (!/^[0-9]{10}$/.test(phone)) {
    formError.textContent = "Please enter a valid 10-digit phone number.";
    return;
  }

  formError.textContent = "";
  visitor.name = name;
  visitor.phone = phone;

  wheelHeadline.innerHTML = `Give it a spin,<br>${escapeHtml(firstName(name))}`;
  showScreen(screenWheel);
});

function firstName(fullName) {
  return fullName.split(" ")[0];
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ============================================================
// 6. STEP 2 — SPIN THE WHEEL
// ============================================================
function spin() {
  if (spinning) return;
  spinning = true;
  spinBtn.disabled = true;
  pointerEl.classList.add("ticking");

  const idx = Math.floor(Math.random() * GAMES.length);
  const game = GAMES[idx];

  // pick a random landing point inside the segment, away from the edges
  const edgeMargin = 14;
  const within = edgeMargin + Math.random() * (120 - edgeMargin * 2);
  const targetAngle = game.start + within;

  // extra full spins for effect
  const extraSpins = 6 + Math.floor(Math.random() * 3); // 6-8 turns
  const rotationNeeded = extraSpins * 360 + ((360 - targetAngle) % 360);

  currentRotation += rotationNeeded;

  wheelEl.style.transition = "transform 4.2s cubic-bezier(0.12,0.84,0.22,1)";
  wheelEl.style.transform = `rotate(${currentRotation}deg)`;

  setTimeout(() => {
    pointerEl.classList.remove("ticking");
    revealResult(game);
    spinning = false;
  }, 4300);
}

spinBtn.addEventListener("click", spin);
hubEl.addEventListener("click", spin);

// ============================================================
// 7. STEP 3 — FULL SCREEN RESULT + LOG TO GOOGLE SHEET
// ============================================================
function revealResult(game) {
  screenResult.classList.remove("theme-brass", "theme-coral", "theme-teal");
  screenResult.classList.add("theme-" + game.theme);

  resultEyebrow.textContent = "YOUR GAME IS";
  resultText.textContent = game.name;
  resultSub.textContent = game.tagline;

  showScreen(screenResult);
  logSubmission(game.name);
}

function logSubmission(gameName) {
  if (!SCRIPT_URL || SCRIPT_URL.indexOf("PASTE_YOUR") === 0) {
    console.warn("SCRIPT_URL is not configured yet — submission was not logged.");
    return;
  }

  const payload = {
    name: visitor.name,
    phone: visitor.phone,
    game: gameName,
    timestamp: new Date().toISOString()
  };

  // Using text/plain avoids a CORS pre-flight request against Apps Script.
  // We use mode: 'no-cors' since Apps Script web apps don't return
  // CORS headers for simple deployments — this is fire-and-forget.
  fetch(SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  }).catch(err => {
    console.error("Could not log submission:", err);
  });
}

// ============================================================
// 8. RESTART (resets the kiosk for the next visitor)
// ============================================================
restartBtn.addEventListener("click", function () {
  visitor = { name: "", phone: "" };
  currentRotation = 0;

  wheelEl.style.transition = "none";
  wheelEl.style.transform = "rotate(0deg)";
  // force reflow so the next spin's transition re-applies cleanly
  void wheelEl.offsetHeight;

  detailsForm.reset();
  formError.textContent = "";
  spinBtn.disabled = false;

  showScreen(screenForm);
});
