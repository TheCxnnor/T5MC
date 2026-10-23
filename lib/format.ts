export function formatNumber(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function formatHours(value: number) {
  return `${Number.isInteger(value) ? value : formatNumber(value)}h`;
}

export function formatMaterialValue(material: string, amount: number) {
  const suffix = material === "coinsQd" ? "Qd" : material === "coinsT" ? "T" : "";

  return `${formatNumber(amount)}${suffix}`;
}
