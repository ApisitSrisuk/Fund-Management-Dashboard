import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, toQueryString } from '../api/client';
import type { CreatePortfolioInput, Portfolio } from '../types';
import { queryKeys } from './queryKeys';

export function usePortfolios(customerId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.portfolios(customerId ?? ''),
    queryFn: ({ signal }) => api.get<Portfolio[]>(`/portfolios${toQueryString({ customerId })}`, signal),
    enabled: Boolean(customerId),
  });
}

export function useCreatePortfolio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePortfolioInput) => api.post<Portfolio>('/portfolios', input),
    onSuccess: (portfolio) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolios(portfolio.customerId) }),
  });
}
