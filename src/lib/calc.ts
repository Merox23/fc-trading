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

/** Rückwärts-Rechner: kleinster Verkaufspreis, der mindestens den gewünschten Gewinn bringt */
export function requiredSellPrice(buyPrice: number, desiredProfit: number): number {
  const targetNet = buyPrice + desiredProfit
  if (targetNet <= 0) return 0
  // netProceeds(x) = floor(x*95/100) >= targetNet  =>  x >= targetNet*100/95
  let price = Math.ceil((targetNet * 100) / 95)
  // Sicherheitsnetz gegen Gleitkomma-Randfälle, damit das Ergebnis garantiert stimmt und minimal ist
  while (netProceeds(price) < targetNet) price++
  while (price > 0 && netProceeds(price - 1) >= targetNet) price--
  return price
}
