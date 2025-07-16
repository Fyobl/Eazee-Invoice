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
  try {
    const symbol = getCurrencySymbol(currency);
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) {
      console.error('Invalid amount for currency formatting:', amount);
      return `${symbol}0.00`;
    }
    return `${symbol}${numAmount.toFixed(2)}`;
  } catch (error) {
    console.error('Error formatting currency:', error);
    const symbol = getCurrencySymbol(currency);
    return `${symbol}0.00`;
  }
};