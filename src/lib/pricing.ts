export type Condition = "WORKING" | "NOT_WORKING" | "DAMAGED";

const CONDITION_MULTIPLIER: Record<Condition, number> = {
  WORKING: 1,
  NOT_WORKING: 0.65,
  DAMAGED: 0.4,
};

export function estimateItemValue(
  basePricePerKg: number,
  estimatedWeightKg: number,
  condition: Condition,
  quantity: number
) {
  const unit = basePricePerKg * estimatedWeightKg * CONDITION_MULTIPLIER[condition];
  const total = unit * quantity;
  return { min: Math.round(total * 0.85), max: Math.round(total * 1.15) };
}

export function sumEstimates(items: { min: number; max: number }[]) {
  return items.reduce(
    (acc, it) => ({ min: acc.min + it.min, max: acc.max + it.max }),
    { min: 0, max: 0 }
  );
}
