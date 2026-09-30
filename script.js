// ============================================================
// 1. CONFIG — paste your Google Apps Script Web App URL here
// ============================================================
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyxInIhvSZhFY2FbRtKlB6V0Pr7lj6PE6gmy8r3ec53faV4iAk1YWAhC_SZ98SAiyH1/exec";

// ============================================================
// 2. GAME DATA — must match the 4 segments in the CSS conic-gradient
//    (each segment is 90deg, starting at 0deg / top, going clockwise)
// ============================================================
const GAMES = [
  { name: "Risk-o-meter",     start: 0,   theme: "brass", tagline: "Let's map out how much risk you're really comfortable with." },
  { name: "The Pyramid Game", start: 90,  theme: "coral", tagline: "Build your wealth, one block at a time." },
  { name: "Investors Idol",   start: 180, theme: "teal",  tagline: "Show us your investor instincts." },
  { name: "Money Talks",      start: 270, theme: "navy",  tagline: "Let's talk money, plainly." }
];
const SEGMENT = 360 / GAMES.length; // 90deg each

// Shared rotation order — the same for every visitor on every device.
// Spin #1 (anyone) -> Risk-o-meter, #2 -> Investors Idol, #3 -> Money Talks,
// #4 -> The Pyramid Game, then it repeats from #5.
const SEQUENCE = ["Risk-o-meter", "Investors Idol", "Money Talks", "The Pyramid Game"];

// Asks the Google Sheet backend for the next slot in the shared sequence.
// The backend keeps one global counter, so two people spinning on different
// phones can never get the same slot. Falls back to random only if offline.
async function getNextGameIndex() {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(SCRIPT_URL + "?action=next", { signal: ctrl.signal });
    clearTimeout(timer);
    const data = await res.json();
    if (typeof data.slot === "number") {
      const name = SEQUENCE[data.slot % SEQUENCE.length];
      return GAMES.findIndex(g => g.name === name);
    }
  } catch (err) {
    console.warn("Could not reach the counter, picking randomly instead.", err);
  }
  return Math.floor(Math.random() * GAMES.length);
}

// ============================================================
// 3. STATE + ELEMENT REFERENCES
// ============================================================
let visitor = { name: "", phone: "", email: "", age: "" };
let currentRotation = 0;
let spinning = false;

const screenForm = document.getElementById("screen-form");
const screenWheel = document.getElementById("screen-wheel");
const screenResult = document.getElementById("screen-result");

const detailsForm = document.getElementById("detailsForm");
const nameInput = document.getElementById("nameInput");
const phoneInput = document.getElementById("phoneInput");
const emailInput = document.getElementById("emailInput");
const ageInput = document.getElementById("ageInput");
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
  const email = emailInput.value.trim();
  const age = ageInput.value.trim();

  if (!name) {
    formError.textContent = "Please enter your name.";
    return;
  }
  if (!/^[0-9]{10}$/.test(phone)) {
    formError.textContent = "Please enter a valid 10-digit phone number.";
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    formError.textContent = "Please enter a valid email address.";
    return;
  }
  if (!age || Number(age) < 1 || Number(age) > 120) {
    formError.textContent = "Please enter a valid age.";
    return;
  }

  formError.textContent = "";
  visitor.name = name;
  visitor.phone = phone;
  visitor.email = email;
  visitor.age = age;

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
async function spin() {
  if (spinning) return;
  spinning = true;
  spinBtn.disabled = true;
  pointerEl.classList.add("ticking");

  const idx = await getNextGameIndex();
  const game = GAMES[idx];

  // pick a random landing point inside the segment, away from the edges
  const edgeMargin = 12;
  const within = edgeMargin + Math.random() * (SEGMENT - edgeMargin * 2);
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
  screenResult.classList.remove("theme-brass", "theme-coral", "theme-teal", "theme-navy");
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
    email: visitor.email,
    age: visitor.age,
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
  visitor = { name: "", phone: "", email: "", age: "" };
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
