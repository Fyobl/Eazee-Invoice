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

export const formatCurrency = (amount: number | string, currency: string): string => {
  const symbol = getCurrencySymbol(currency);
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${symbol}${numAmount.toFixed(2)}`;
};