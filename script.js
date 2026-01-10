/**
 * =========================
 *  TEACHER EDIT SECTION
 * =========================
 * 1) Edit CATEGORIES to change categories, questions, and answers.
 * 2) Choose which tile is the Star Burst tile by setting STAR_BURST_INDEX (0–8).
 *    Index order is left-to-right, top-to-bottom across the 3x3 question tiles:
 *    Row 1: 0 1 2
 *    Row 2: 3 4 5
 *    Row 3: 6 7 8
 *
 * Notes:
 * - Keep 3 categories with 3 questions each (for a 3x3 grid).
 * - Emojis for each tile are assigned from TILE_EMOJIS in order (0–8).
 */

// 9 tile emojis (one per question tile)
const TILE_EMOJIS = [
  "🌖", // Waning Gibbous
  "⭐", // Star
  "🪐", // Ringed Planet
  "🚀", // Rocket
  "🛰️", // Satellite
  "🧑‍🚀", // Astronaut
  "🔭", // Telescope
  "☄️", // Comet
  "🌍", // Earth
];

// Pick which question tile becomes "Star Burst" (bonus question)
const STAR_BURST_INDEX = 1; // easy to change: 0–8

// Your categories + questions.
// Make it obvious: each category has a name and an array of {q, a}.
const CATEGORIES = [
  {
    name: "Space Science",
    qa: [
      { q: "What is the name of our galaxy?", a: "The Milky Way." },
      { q: "What force keeps planets in orbit around the Sun?", a: "Gravity." },
      { q: "What is a comet mostly made of?", a: "Ice, dust, and rocky material." },
    ],
  },
  {
    name: "Computer Science",
    qa: [
      { q: "What does 'CPU' stand for?", a: "Central Processing Unit." },
      { q: "In binary, what does 101 equal in base 10?", a: "5." },
      { q: "What is an algorithm?", a: "A step-by-step set of instructions to solve a problem." },
    ],
  },
  {
    name: "Business / IT",
    qa: [
      { q: "What is a 'budget'?", a: "A plan for how money will be earned and spent." },
      { q: "What does 'profit' mean?", a: "Money earned after costs/expenses are subtracted." },
      { q: "Name one way to stay safe online.", a: "Use strong passwords, enable MFA, avoid suspicious links, etc." },
    ],
  },
];

/* =========================
   END TEACHER EDIT SECTION
   ========================= */

/**
 * Internals:
 * We flatten the 3 categories × 3 questions into 9 tiles, row-based:
 * Row 0 uses qa[0] from each category
 * Row 1 uses qa[1] from each category
 * Row 2 uses qa[2] from each category
 */
const boardEl = document.getElementById("board");
const resetBtn = document.getElementById("resetBtn");

const starburstOverlayEl = document.getElementById("starburstOverlay");
const qaOverlayEl = document.getElementById("qaOverlay");

const questionTitleEl = document.getElementById("questionTitle");
const questionMetaEl = document.getElementById("questionMeta");
const questionTextEl = document.getElementById("questionText");
const answerBlockEl = document.getElementById("answerBlock");
const answerTextEl = document.getElementById("answerText");

const showAnswerBtn = document.getElementById("showAnswerBtn");
const exitBtn = document.getElementById("exitBtn");

// Tracks which tiles have been used (true/false for indices 0–8)
let used = new Array(9).fill(false);

// Which tile is currently open in the modal
let activeTileIndex = null;

function validateConfig() {
  if (CATEGORIES.length !== 3) {
    console.warn("GalaxyGrid: Expected exactly 3 categories for a 3x3 board.");
  }
  for (const c of CATEGORIES) {
    if (!c.qa || c.qa.length !== 3) {
      console.warn("GalaxyGrid: Each category should have exactly 3 questions for a 3x3 board.");
    }
  }
  if (STAR_BURST_INDEX < 0 || STAR_BURST_INDEX > 8) {
    console.warn("GalaxyGrid: STAR_BURST_INDEX should be between 0 and 8.");
  }
}

function buildBoard() {
  boardEl.innerHTML = "";

  // Category headers (3 columns)
  for (let col = 0; col < 3; col++) {
    const header = document.createElement("div");
    header.className = "category";
    header.textContent = CATEGORIES[col]?.name ?? `Category ${col + 1}`;
    boardEl.appendChild(header);
  }

  // Question tiles: 3 rows * 3 cols = 9 tiles
  let tileIndex = 0;

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "tile";
      tile.dataset.index = String(tileIndex);

      const emoji = document.createElement("div");
      emoji.className = "emoji";
      emoji.textContent = TILE_EMOJIS[tileIndex] ?? "✨";
      tile.appendChild(emoji);

      // Mark the Star Burst tile visually (subtle border)
      if (tileIndex === STAR_BURST_INDEX) {
        tile.classList.add("starburst");
        tile.title = "Star Burst tile!";
      } else {
        tile.title = "Click to reveal question";
      }

      // If already used (after reset? normally false), render as used
      if (used[tileIndex]) {
        tile.classList.add("used");
      }

      tile.addEventListener("click", () => onTileClick(tileIndex));

      boardEl.appendChild(tile);
      tileIndex++;
    }
  }
}

function getTileQuestion(tileIndex) {
  // tileIndex mapping to row/col
  const row = Math.floor(tileIndex / 3);
  const col = tileIndex % 3;

  const category = CATEGORIES[col];
  const qa = category?.qa?.[row];

  return {
    categoryName: category?.name ?? `Category ${col + 1}`,
    rowNumber: row + 1,
    question: qa?.q ?? "(Missing question text)",
    answer: qa?.a ?? "(Missing answer text)",
  };
}

function setTileUsed(tileIndex) {
  used[tileIndex] = true;
  const tile = boardEl.querySelector(`.tile[data-index="${tileIndex}"]`);
  if (!tile) return;
  tile.classList.add("used");

  // Remove emoji (blank tile)
  const emoji = tile.querySelector(".emoji");
  if (emoji) emoji.textContent = "";
}

function showStarburstThenQuestion(tileIndex) {
  // Show starburst overlay briefly, then open question modal
  starburstOverlayEl.classList.add("show");
  starburstOverlayEl.setAttribute("aria-hidden", "false");

  // After the animation time, hide and open question
  window.setTimeout(() => {
    starburstOverlayEl.classList.remove("show");
    starburstOverlayEl.setAttribute("aria-hidden", "true");
    openQuestionModal(tileIndex);
  }, 1500);
}

function onTileClick(tileIndex) {
  if (used[tileIndex]) return;

  activeTileIndex = tileIndex;

  // Star Burst behavior
  if (tileIndex === STAR_BURST_INDEX) {
    showStarburstThenQuestion(tileIndex);
    return;
  }

  openQuestionModal(tileIndex);
}

function openQuestionModal(tileIndex) {
  const data = getTileQuestion(tileIndex);

  // Reset answer state each time
  answerBlockEl.classList.add("hidden");
  showAnswerBtn.textContent = "Show Answer";

  questionTitleEl.textContent = "Question";
  questionMetaEl.textContent = `${data.categoryName} • Q${data.rowNumber}`;
  questionTextEl.textContent = data.question;
  answerTextEl.textContent = data.answer;

  qaOverlayEl.classList.add("show");
  qaOverlayEl.setAttribute("aria-hidden", "false");
}

function closeQuestionModalAndConsumeTile() {
  if (activeTileIndex === null) return;

  // Mark tile used when exiting
  setTileUsed(activeTileIndex);

  // Close modal
  qaOverlayEl.classList.remove("show");
  qaOverlayEl.setAttribute("aria-hidden", "true");

  activeTileIndex = null;
}

function toggleAnswer() {
  const isHidden = answerBlockEl.classList.contains("hidden");
  if (isHidden) {
    answerBlockEl.classList.remove("hidden");
    showAnswerBtn.textContent = "Hide Answer";
  } else {
    answerBlockEl.classList.add("hidden");
    showAnswerBtn.textContent = "Show Answer";
  }
}

function resetBoard() {
  used = new Array(9).fill(false);
  activeTileIndex = null;

  // Close overlays if open
  qaOverlayEl.classList.remove("show");
  qaOverlayEl.setAttribute("aria-hidden", "true");
  starburstOverlayEl.classList.remove("show");
  starburstOverlayEl.setAttribute("aria-hidden", "true");

  buildBoard();
}

/* ---------- Event wiring ---------- */
showAnswerBtn.addEventListener("click", toggleAnswer);
exitBtn.addEventListener("click", closeQuestionModalAndConsumeTile);
resetBtn.addEventListener("click", resetBoard);

// Click outside modal closes & consumes tile (optional convenience)
qaOverlayEl.addEventListener("click", (e) => {
  if (e.target === qaOverlayEl) closeQuestionModalAndConsumeTile();
});

// Esc key closes & consumes tile (teacher-friendly during live play)
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && qaOverlayEl.classList.contains("show")) {
    closeQuestionModalAndConsumeTile();
  }
});

/* ---------- Init ---------- */
validateConfig();
buildBoard();
