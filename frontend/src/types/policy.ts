export interface PolicyAllocation {
  id: string;
  policyId: string;
  symbol: string;
  stockName: string;
  percentage: number;
}

export interface Policy {
  id: string;
  code: string;
  name: string;
  description: string;
  riskLevel: number;
  createdAt: string;
}

export interface PolicyWithAllocations extends Policy {
  allocations: PolicyAllocation[];
}
