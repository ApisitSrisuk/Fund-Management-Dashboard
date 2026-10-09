import type { Policy } from './policy';

export const ORDER_STATUSES = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ACTIVE_ORDER_STATUSES: readonly OrderStatus[] = ['PENDING', 'PROCESSING'];

/** Statuses the processing side may set via PATCH /orders/:id/status. */
export type SystemOrderStatus = Extract<OrderStatus, 'PROCESSING' | 'COMPLETED' | 'FAILED'>;

export interface Order {
  id: string;
  portfolioId: string;
  amount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrderWithPortfolio extends Order {
  portfolio: {
    id: string;
    name: string;
    customerId: string;
    policyId: string;
    policy: Policy;
  };
}

export interface CreateOrderInput {
  portfolioId: string;
  amount: number;
}

export interface UpdateOrderStatusInput {
  id: string;
  status: SystemOrderStatus;
}
