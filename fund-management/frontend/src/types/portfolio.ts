import type { Order } from './order';
import type { Policy } from './policy';

export interface Portfolio {
  id: string;
  name: string;
  customerId: string;
  policyId: string;
  policy: Policy;
  createdAt: string;
  latestOrder: Order | null;
}

export interface CreatePortfolioInput {
  customerId: string;
  policyId: string;
  name?: string;
}
