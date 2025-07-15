// Currency utility functions
export const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    'GBP': '£',
    'USD': '$',
    'EUR': '€',
    'CAD': '$'
  };
  return symbols[currency] || currency;
};

export const formatCurrency = (amount: number, currency: string): string => {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${amount.toFixed(2)}`;
};