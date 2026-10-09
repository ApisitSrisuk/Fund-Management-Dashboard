/** Centralised query keys so mutations can invalidate exactly what they affect. */
export const queryKeys = {
  customers: ['customers'] as const,
  policies: ['policies'] as const,
  policy: (id: string) => ['policies', id] as const,
  portfolios: (customerId: string) => ['portfolios', { customerId }] as const,
  portfoliosAll: ['portfolios'] as const,
  orders: (customerId: string) => ['orders', { customerId }] as const,
  ordersAll: ['orders'] as const,
};
