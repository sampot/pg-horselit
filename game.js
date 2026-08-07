/**
 * Pure-entertainment parallel light-track race (genre homage).
 * Odds and horse names are original — not copied from any commercial cabinet.
 */

/** @typedef {{ id: number, label: string, odds: number, hue: number }} Horse */

/** @type {Horse[]} */
export const HORSES = [
  { id: 1, label: "春風", odds: 2, hue: 12 },
  { id: 2, label: "曉星", odds: 3, hue: 45 },
  { id: 3, label: "雷影", odds: 4, hue: 200 },
  { id: 4, label: "青嵐", odds: 5, hue: 160 },
  { id: 5, label: "金穗", odds: 6, hue: 38 },
  { id: 6, label: "夜行", odds: 8, hue: 265 },
];

export function horseById(id) {
  return HORSES.find((h) => h.id === id) ?? HORSES[0];
}

export class HorselitGame {
  constructor() {
    this.credits = 100;
    /** @type {Record<number, number>} */
    this.bets = Object.fromEntries(HORSES.map((h) => [h.id, 0]));
    this.running = false;
    this.lastWinner = 0;
    this.lastWin = 0;
  }

  totalBet() {
    return Object.values(this.bets).reduce((a, b) => a + b, 0);
  }

  canBet() {
    return !this.running && this.credits > 0;
  }

  addCredits(n) {
    if (this.running) return false;
    this.credits += n;
    return true;
  }

  /** Place one credit on a horse. */
  bet(horseId) {
    if (!this.canBet()) return false;
    if (this.credits < 1) return false;
    if (!(horseId in this.bets)) return false;
    this.credits -= 1;
    this.bets[horseId] += 1;
    return true;
  }

  clearBets() {
    if (this.running) return false;
    const refund = this.totalBet();
    for (const id of Object.keys(this.bets)) this.bets[Number(id)] = 0;
    this.credits += refund;
    return refund > 0;
  }

  /**
   * Fair random winner (uniform among 6; not weighted by bets).
   * Payout = betOnWinner × odds.
   * @returns {{ winnerId: number, payout: number, betOn: number, speeds: number[] }}
   */
  spin() {
    if (this.running) throw new Error("already running");
    const betSum = this.totalBet();
    if (betSum <= 0) throw new Error("no bets");

    const winnerId = 1 + Math.floor(Math.random() * HORSES.length);
    const horse = horseById(winnerId);
    const betOn = this.bets[winnerId] || 0;
    const payout = betOn * horse.odds;

    // Per-horse base speeds; winner gets a slight edge so animation matches result.
    const speeds = HORSES.map((h) => {
      const base = 0.55 + Math.random() * 0.45;
      return h.id === winnerId ? base + 0.35 + Math.random() * 0.2 : base;
    });

    this.running = true;
    this.lastWinner = winnerId;
    this.lastWin = payout;

    // Clear bets for next round; credits updated after animation.
    for (const id of Object.keys(this.bets)) this.bets[Number(id)] = 0;

    return { winnerId, payout, betOn, speeds };
  }

  settle(payout) {
    this.credits += payout;
    this.running = false;
  }
}
