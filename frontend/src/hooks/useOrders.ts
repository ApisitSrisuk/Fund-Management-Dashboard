import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, toQueryString } from '../api/client';
import { ACTIVE_ORDER_STATUSES } from '../types';
import type { CreateOrderInput, OrderWithPortfolio, UpdateOrderStatusInput } from '../types';
import { queryKeys } from './queryKeys';

const ACTIVE_POLL_MS = 5_000;

export function useOrders(customerId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.orders(customerId ?? ''),
    queryFn: ({ signal }) => api.get<OrderWithPortfolio[]>(`/orders${toQueryString({ customerId })}`, signal),
    enabled: Boolean(customerId),
    // Poll only while something can still change, so "current status" stays current.
    refetchInterval: (query) =>
      query.state.data?.some((order) => ACTIVE_ORDER_STATUSES.includes(order.status)) ? ACTIVE_POLL_MS : false,
  });
}

/** Orders affect the portfolio list too (latest order status), so invalidate both. */
function useInvalidateOrderViews() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.ordersAll }),
      queryClient.invalidateQueries({ queryKey: queryKeys.portfoliosAll }),
    ]);
}

export function useCreateOrder() {
  const invalidate = useInvalidateOrderViews();
  return useMutation({
    mutationFn: (input: CreateOrderInput) => api.post<OrderWithPortfolio>('/orders', input),
    onSettled: invalidate,
  });
}

export function useCancelOrder() {
  const invalidate = useInvalidateOrderViews();
  return useMutation({
    mutationFn: (orderId: string) => api.post<OrderWithPortfolio>(`/orders/${orderId}/cancel`),
    // Also refresh on error: a 409 means our list is stale (status moved on server-side).
    onSettled: invalidate,
  });
}

/** Demo-only: simulates the processing side advancing the workflow. */
export function useUpdateOrderStatus() {
  const invalidate = useInvalidateOrderViews();
  return useMutation({
    mutationFn: ({ id, status }: UpdateOrderStatusInput) =>
      api.patch<OrderWithPortfolio>(`/orders/${id}/status`, { status }),
    onSettled: invalidate,
  });
}
