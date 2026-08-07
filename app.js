import { HorselitAudio } from "./audio.js";
import { HORSES, HorselitGame, horseById } from "./game.js";

const audio = new HorselitAudio();
const game = new HorselitGame();
globalThis.__horselit = game;

const creditsEl = document.getElementById("credits");
const statusEl = document.getElementById("status");
const tracksEl = document.getElementById("tracks");
const betGrid = document.getElementById("bet-grid");
const btnStart = document.getElementById("btn-start");
const btnClear = document.getElementById("btn-clear");
const btnCredit = document.getElementById("btn-credit");
const btnMute = document.getElementById("btn-mute");
const totalBetEl = document.getElementById("total-bet");

/** @type {HTMLElement[]} */
let laneEls = [];
/** @type {HTMLElement[]} */
let horseEls = [];

const RACE_MS = 4200;
const TICK_MS = 90;

function setStatus(msg, tone = "") {
  statusEl.textContent = msg;
  statusEl.dataset.tone = tone;
}

function renderCredits() {
  creditsEl.textContent = String(game.credits);
  totalBetEl.textContent = String(game.totalBet());
}

function setHorseProgress(i, t) {
  const el = horseEls[i];
  if (!el) return;
  // t: 0..1 → leave a little room at start/end of rail (left % is vs. rail)
  const pct = Math.max(0, Math.min(1, t)) * 88;
  el.style.left = `${pct}%`;
}

function clearRaceVisual() {
  laneEls.forEach((lane, i) => {
    lane.classList.remove("winner");
    setHorseProgress(i, 0);
  });
}

function renderBets() {
  for (const horse of HORSES) {
    const el = betGrid.querySelector(`[data-bet="${horse.id}"] .bet-count`);
    if (el) el.textContent = String(game.bets[horse.id]);
    const lane = laneEls[horse.id - 1];
    if (lane) lane.classList.toggle("bet-on", game.bets[horse.id] > 0);
  }
  renderCredits();
  const busy = game.running;
  btnStart.disabled = busy || game.totalBet() === 0;
  btnClear.disabled = busy || game.totalBet() === 0;
  btnCredit.disabled = busy;
  betGrid.querySelectorAll("button").forEach((btn) => {
    btn.disabled = busy || game.credits <= 0;
  });
}

function buildTracks() {
  tracksEl.innerHTML = "";
  laneEls = [];
  horseEls = [];

  for (const horse of HORSES) {
    const lane = document.createElement("div");
    lane.className = "lane";
    lane.dataset.horse = String(horse.id);
    lane.style.setProperty("--hue", String(horse.hue));
    lane.innerHTML = `
      <div class="lane-tag">
        <span class="num">${horse.id}</span>
        <span>${horse.label}</span>
        <span class="odds">×${horse.odds}</span>
      </div>
      <div class="rail" aria-hidden="true">
        <div class="horse"></div>
      </div>
      <div class="finish-mark">終</div>
    `;
    tracksEl.appendChild(lane);
    laneEls.push(lane);
    horseEls.push(/** @type {HTMLElement} */ (lane.querySelector(".horse")));
  }
}

function buildBetGrid() {
  betGrid.innerHTML = "";
  for (const horse of HORSES) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "bet-card";
    card.dataset.bet = String(horse.id);
    card.style.setProperty("--hue", String(horse.hue));
    card.innerHTML = `
      <span class="bet-num">${horse.id}</span>
      <span class="bet-label">${horse.label}</span>
      <span class="bet-odds">×${horse.odds}</span>
      <span class="bet-count">0</span>
    `;
    card.setAttribute("aria-label", `押注 ${horse.id} 號 ${horse.label}`);
    card.addEventListener("click", async () => {
      await audio.unlock();
      if (!game.bet(horse.id)) {
        if (game.credits <= 0) setStatus("娛樂幣不足，請加幣。", "warn");
        return;
      }
      audio.bet();
      renderBets();
      setStatus(`已押 ${horse.id} 號「${horse.label}」（目前 ${game.bets[horse.id]}）`);
    });
    betGrid.appendChild(card);
  }
}

/**
 * Animate horses with staggered random speeds; winner reaches 1 first.
 * @param {number[]} speeds
 * @param {number} winnerId
 */
function runRace(speeds, winnerId) {
  return new Promise((resolve) => {
    const start = performance.now();
    let lastTick = 0;
    // Normalize so winner progress hits 1 at RACE_MS; others stay behind.
    const winnerIdx = winnerId - 1;
    const winnerSpeed = speeds[winnerIdx];

    const frame = (now) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / RACE_MS);

      for (let i = 0; i < HORSES.length; i++) {
        // Ease-out curve with per-horse relative speed
        const rel = speeds[i] / winnerSpeed;
        let p = Math.pow(t, 0.85) * rel;
        if (i !== winnerIdx) {
          // Cap losers just short of finish
          p = Math.min(p, 0.92 - (i % 3) * 0.02);
        } else {
          p = Math.min(1, Math.pow(t, 0.9));
        }
        setHorseProgress(i, p);
      }

      if (elapsed - lastTick >= TICK_MS) {
        lastTick = elapsed;
        audio.tick(t);
      }

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        setHorseProgress(winnerIdx, 1);
        resolve();
      }
    };

    requestAnimationFrame(frame);
  });
}

async function startRound() {
  await audio.unlock();
  if (game.running || game.totalBet() === 0) return;

  let result;
  try {
    result = game.spin();
  } catch {
    setStatus("請先押注。", "warn");
    return;
  }

  clearRaceVisual();
  renderBets();
  btnStart.disabled = true;
  btnClear.disabled = true;
  btnCredit.disabled = true;
  setStatus("開跑！燈光賽道進行中…", "run");
  audio.startBeep();

  await runRace(result.speeds, result.winnerId);

  audio.finish();
  const winLane = laneEls[result.winnerId - 1];
  if (winLane) winLane.classList.add("winner");

  game.settle(result.payout);
  renderCredits();

  const horse = horseById(result.winnerId);
  if (result.payout > 0) {
    audio.win(horse.odds);
    setStatus(
      `${horse.id} 號「${horse.label}」先到！押 ${result.betOn} × ${horse.odds} = +${result.payout}`,
      "win",
    );
  } else {
    audio.lose();
    setStatus(`${horse.id} 號「${horse.label}」先到 — 沒押中，再來。`, "lose");
  }

  btnCredit.disabled = false;
  renderBets();
}

btnStart.addEventListener("click", () => {
  void startRound();
});

btnClear.addEventListener("click", async () => {
  await audio.unlock();
  if (game.clearBets()) {
    audio.clear();
    renderBets();
    setStatus("已撤銷押注，娛樂幣已退回。");
  }
});

btnCredit.addEventListener("click", async () => {
  await audio.unlock();
  if (game.addCredits(50)) {
    audio.coin();
    renderCredits();
    setStatus("加了 50 枚娛樂幣。");
  }
});

btnMute.addEventListener("click", async () => {
  await audio.unlock();
  audio.setEnabled(!audio.enabled);
  btnMute.textContent = audio.enabled ? "音效開" : "音效關";
  btnMute.setAttribute("aria-pressed", audio.enabled ? "true" : "false");
  if (audio.enabled) audio.idle();
});

document.body.addEventListener(
  "pointerdown",
  () => {
    void audio.unlock();
  },
  { once: true },
);

buildTracks();
buildBetGrid();
renderBets();
setStatus("加幣 → 點馬號押注 → 開跑。純娛樂，無真實金錢。");
