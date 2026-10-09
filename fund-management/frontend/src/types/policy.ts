export interface PolicyAllocation {
  id: string;
  policyId: string;
  symbol: string;
  stockName: string;
  /** 0–100 */
  percentage: number;
}

export interface Policy {
  id: string;
  code: string;
  name: string;
  description: string;
  /** 1 (lowest) – 8 (highest) */
  riskLevel: number;
  createdAt: string;
}

export interface PolicyWithAllocations extends Policy {
  allocations: PolicyAllocation[];
}
