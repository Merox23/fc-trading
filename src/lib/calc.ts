// EA-Steuer: 5 % vom Verkaufspreis. Alles in ganzen Coins.
// Bewusst Ganzzahl-Rechnung (x * 95 / 100) statt x * 0.95, damit es keine Gleitkomma-Fehler gibt.

/** Erlös netto = Verkaufspreis x 0,95, abgerundet auf ganze Coins */
export function netProceeds(salePrice: number): number {
  return Math.floor((salePrice * 95) / 100)
}

/** Steuerverlust = Verkaufspreis - Erlös netto */
export function taxLoss(salePrice: number): number {
  return salePrice - netProceeds(salePrice)
}

/** Gewinn = Erlös netto - Einkaufspreis */
export function profit(salePrice: number, buyPrice: number): number {
  return netProceeds(salePrice) - buyPrice
}
