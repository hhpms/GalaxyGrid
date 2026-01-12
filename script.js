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
  "👩🏽‍🚀", // Astronaut
  "🔭", // Telescope
  "☄️", // Comet
  "🌍", // Earth
];

// Pick which question tile becomes "Star Burst" (bonus question)
const STAR_BURST_INDEX = 3; // easy to change: 0–8

//Set class size number for Pick Random student button
const studentCount = 26;   

// Your categories + questions.
// Each category has a name and an array of {q, a}.
const CATEGORIES = [
  {
    name: "Solving Problems",
    qa: [
      { q: "What are the four steps of the problem solving process? (DPTR)", a: "Define, Prepare, Try, Reflect" },
      { q: "What does 'decomposing' a problem mean?", a: "Breaking it into to smaller, more manageable parts (or 'subcomponents')." },
      { q: "What is troubleshooting?", a: "Problem solving issues with technology." },
    ],
  },
  {
    name: "Techy",
    qa: [
      { q: "What is the screen connected to your lab computer called?", a: "A monitor" },
      { q: "True or False: Your computer and your monitor are the same device.", a: "False: on desktop computers, the monitor and the computer are separate." },
      { q: "If your computer is not turning on, what's the first thing you should do?", a: "Check that both the computer and the monitor are actually on." },
    ],
  },
  {
    name: "All hail Ms. Donaldson 🫡",
    qa: [
      { q: "This is something you can only do next to the trash can or three feet away from your desk.", a: "Eat" },
      { q: "What are the four steps you must do before leaving my classroom?", a: "1) Sign out. 2) Hang your headphones up. 3) Push your chair in. 4) Stand behind your chair and wait." },
      { q: "What are two things you are not allowed to touch in my classroom?", a: "Other people and other people's computers!" },
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

const pickStudentBtn = document.getElementById("pickStudentBtn");
const studentResult = document.getElementById("studentResult");


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

  // Category headers
  for (let col = 0; col < 3; col++) {
    const header = document.createElement("div");
    header.className = "category";
    header.textContent = CATEGORIES[col]?.name ?? `Category ${col + 1}`;
    boardEl.appendChild(header);
  }

  // Question tiles
  let tileIndex = 0;

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {

      const currentIndex = tileIndex; // ✅ capture a stable value

      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "tile";
      tile.dataset.index = String(currentIndex);

      const emoji = document.createElement("div");
      emoji.className = "emoji";
      emoji.textContent = TILE_EMOJIS[currentIndex] ?? "✨";
      tile.appendChild(emoji);

      if (currentIndex === STAR_BURST_INDEX) {
        tile.classList.add("starburst");
        tile.title = "Star Burst tile!";
      } else {
        tile.title = "Click to reveal question";
      }

      if (used[currentIndex]) {
        tile.classList.add("used");
      }

      tile.addEventListener("click", () => onTileClick(currentIndex)); // ✅ use currentIndex

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
  }, 2500);
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

function pickRandomStudent(){
  if (studentCount <= 0) return;

  const number = Math.floor(Math.random() * studentCount) + 1;

  studentResult.textContent = `Student #${number}`;
  studentResult.classList.add("flash");

  setTimeout(() => {
    studentResult.classList.remove("flash");
  }, 400);
}


/* ---------- Event wiring ---------- */
showAnswerBtn.addEventListener("click", toggleAnswer);
exitBtn.addEventListener("click", closeQuestionModalAndConsumeTile);
resetBtn.addEventListener("click", resetBoard);
pickStudentBtn.addEventListener("click", pickRandomStudent);


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
