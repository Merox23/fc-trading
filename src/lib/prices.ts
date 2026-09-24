/**
 * Gültige Preisstufen im Transfermarkt (EA FC 27). EA erlaubt keine beliebigen
 * Coin-Beträge, sondern nur Vielfache dieser Schrittweite je Preisbereich.
 * Unter 200 und über 100.000 ist uns keine gesicherte Tabelle bekannt, dort
 * wird nichts verändert.
 */
export interface PriceBracket {
  min: number
  max: number
  step: number
}

export const PRICE_BRACKETS: PriceBracket[] = [
  { min: 200, max: 1_000, step: 50 },
  { min: 1_000, max: 10_000, step: 100 },
  { min: 10_000, max: 50_000, step: 250 },
  { min: 50_000, max: 100_000, step: 500 },
]

function findBracket(value: number): PriceBracket | undefined {
  return PRICE_BRACKETS.find((b) => value >= b.min && value <= b.max)
}

/** Rundet auf die nächste gültige Preisstufe (auf oder ab). Werte außerhalb der Tabelle bleiben unverändert. */
export function snapToNearestValidPrice(value: number): number {
  if (value <= 0) return 0
  const bracket = findBracket(value)
  if (!bracket) return value
  const steps = Math.round((value - bracket.min) / bracket.step)
  return Math.min(bracket.max, bracket.min + steps * bracket.step)
}

/** Nächste gültige Stufe eine Position OBERHALB des Werts (für die Verknüpfung Gebot -> Sofortkauf) */
export function nextStepAbove(value: number): number {
  if (value <= 0) return 0
  const aligned = snapToNearestValidPrice(value)
  for (let i = 0; i < PRICE_BRACKETS.length; i++) {
    const b = PRICE_BRACKETS[i]
    if (aligned === b.max && PRICE_BRACKETS[i + 1]) return aligned + PRICE_BRACKETS[i + 1].step
    if (aligned >= b.min && aligned < b.max) return Math.min(b.max, aligned + b.step)
  }
  return aligned // außerhalb der Tabelle (< 200 oder > 100.000): unverändert lassen
}

/** Nächste gültige Stufe eine Position UNTERHALB des Werts (für die Verknüpfung Sofortkauf -> Gebot) */
export function nextStepBelow(value: number): number {
  if (value <= 0) return 0
  const aligned = snapToNearestValidPrice(value)
  for (let i = PRICE_BRACKETS.length - 1; i >= 0; i--) {
    const b = PRICE_BRACKETS[i]
    if (aligned === b.min && PRICE_BRACKETS[i - 1]) return aligned - PRICE_BRACKETS[i - 1].step
    if (aligned > b.min && aligned <= b.max) return Math.max(b.min, aligned - b.step)
  }
  return aligned // außerhalb der Tabelle (< 200 oder > 100.000): unverändert lassen
}

/** Rundet auf die nächste gültige Preisstufe nach OBEN (nie niedriger als value). Für den Rückwärts-Rechner, damit der Zielgewinn sicher erreicht wird. */
export function snapUpToValidPrice(value: number): number {
  if (value <= 0) return 0
  const last = PRICE_BRACKETS[PRICE_BRACKETS.length - 1]
  if (value > last.max) return value // oberhalb 100.000: keine gesicherte Tabelle
  const bracket = findBracket(value) ?? PRICE_BRACKETS[0] // unter 200: auf die unterste bekannte Stufe (200) runden
  if (value <= bracket.min) return bracket.min
  const steps = Math.ceil((value - bracket.min) / bracket.step)
  return Math.min(bracket.max, bracket.min + steps * bracket.step)
}
