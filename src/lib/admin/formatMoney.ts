export function formatMoney(amount: number): string {
  return amount.toLocaleString("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }) + " ₽";
}
