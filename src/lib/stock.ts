/**
 * Stock valuation calculation functions.
 * PMP (Prix Moyen Pondéré / Weighted Average Cost) is fully implemented.
 * FIFO/LIFO enum values exist in schema for future use; cost calculations use PMP for now.
 */

export interface StockLot {
  quantity: number;
  unitCost: number;
}

/**
 * Calculate new PMP (Weighted Average Cost) after adding stock.
 * Formula: (currentQty * currentCostPrice + addedQty * addedUnitCost) / (currentQty + addedQty)
 */
export function calculatePMP(
  currentQty: number,
  currentCostPrice: number,
  addedQty: number,
  addedUnitCost: number
): number {
  const totalQty = currentQty + addedQty;
  if (totalQty <= 0) return 0;
  return (currentQty * currentCostPrice + addedQty * addedUnitCost) / totalQty;
}

/**
 * Calculate FIFO cost of goods sold (consume oldest lots first).
 * Returns total cost for the given sale quantity.
 */
export function calculateFIFOCost(lots: StockLot[], saleQty: number): number {
  let remaining = saleQty;
  let totalCost = 0;

  for (const lot of lots) {
    if (remaining <= 0) break;
    const consumed = Math.min(lot.quantity, remaining);
    totalCost += consumed * lot.unitCost;
    remaining -= consumed;
  }

  return totalCost;
}

/**
 * Calculate LIFO cost of goods sold (consume newest lots first).
 * Returns total cost for the given sale quantity.
 */
export function calculateLIFOCost(lots: StockLot[], saleQty: number): number {
  let remaining = saleQty;
  let totalCost = 0;

  for (let i = lots.length - 1; i >= 0; i--) {
    if (remaining <= 0) break;
    const consumed = Math.min(lots[i].quantity, remaining);
    totalCost += consumed * lots[i].unitCost;
    remaining -= consumed;
  }

  return totalCost;
}
