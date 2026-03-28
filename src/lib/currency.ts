export function getCurrencySymbol(currency: string | null | undefined) {
  switch (currency) {
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "ILS":
    default:
      return "₪";
  }
}

export function formatCurrencyAmount(
  amount: number | string | null | undefined,
  currency: string | null | undefined
) {
  const numericAmount = Number(amount || 0);
  return `${getCurrencySymbol(currency)}${numericAmount.toFixed(0)}`;
}