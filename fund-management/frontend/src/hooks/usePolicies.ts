import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { PolicyWithAllocations } from '../types';
import { queryKeys } from './queryKeys';

export function usePolicies() {
  return useQuery({
    queryKey: queryKeys.policies,
    queryFn: ({ signal }) => api.get<PolicyWithAllocations[]>('/policies', signal),
  });
}

export function usePolicy(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.policy(id ?? ''),
    queryFn: ({ signal }) => api.get<PolicyWithAllocations>(`/policies/${id}`, signal),
    enabled: Boolean(id),
  });
}
