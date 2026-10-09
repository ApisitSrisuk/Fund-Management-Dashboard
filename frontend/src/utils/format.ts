const currency = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 2 });
const dateTime = new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' });

export const formatCurrency = (value: number): string => currency.format(value);
export const formatDateTime = (iso: string): string => dateTime.format(new Date(iso));
export const formatPercent = (value: number): string => `${value.toFixed(value % 1 === 0 ? 0 : 2)}%`;
