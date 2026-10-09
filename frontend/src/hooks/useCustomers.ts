import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Customer } from '../types';
import { queryKeys } from './queryKeys';

export function useCustomers() {
  return useQuery({
    queryKey: queryKeys.customers,
    queryFn: ({ signal }) => api.get<Customer[]>('/customers', signal),
    staleTime: Infinity,
  });
}
