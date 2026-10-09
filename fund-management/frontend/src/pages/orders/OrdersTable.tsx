import { EmptyState, ErrorState, InlineError, Spinner } from '../../components/Feedback';
import { StatusBadge } from '../../components/StatusBadge';
import { useCancelOrder, useOrders, useUpdateOrderStatus } from '../../hooks/useOrders';
import type { OrderStatus, OrderWithPortfolio, SystemOrderStatus } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/format';

const NEXT_SYSTEM_STATUSES: Record<OrderStatus, SystemOrderStatus[]> = {
  PENDING: ['PROCESSING'],
  PROCESSING: ['COMPLETED', 'FAILED'],
  COMPLETED: [],
  FAILED: [],
  CANCELLED: [],
};

interface OrdersTableProps {
  customerId: string;
  simulate: boolean;
}

export function OrdersTable({ customerId, simulate }: OrdersTableProps) {
  const orders = useOrders(customerId);
  const cancelOrder = useCancelOrder();
  const updateStatus = useUpdateOrderStatus();

  const cancel = (order: OrderWithPortfolio) => {
    if (!window.confirm(`ยืนยันยกเลิก order ${formatCurrency(order.amount)} ของ ${order.portfolio.name}?`)) return;
    updateStatus.reset();
    cancelOrder.mutate(order.id);
  };

  const advance = (id: string, status: SystemOrderStatus) => {
    cancelOrder.reset();
    updateStatus.mutate({ id, status });
  };

  if (orders.isPending) return <Spinner label="กำลังโหลดรายการ order…" />;
  if (orders.error) return <ErrorState error={orders.error} onRetry={() => void orders.refetch()} />;
  if (orders.data.length === 0) return <EmptyState>ยังไม่มี order</EmptyState>;

  const busyId = cancelOrder.isPending
    ? cancelOrder.variables
    : updateStatus.isPending
      ? updateStatus.variables.id
      : undefined;

  return (
    <div className="panel">
      <div className="panel__head">
        <h2 className="panel__title">รายการ Order</h2>
        {orders.isFetching && <span className="muted small">กำลังอัปเดต…</span>}
      </div>

      <InlineError
        error={cancelOrder.error}
        overrides={{
          conflict: 'ยกเลิกไม่ได้ — ยกเลิกได้เฉพาะ order ที่สถานะ PENDING เท่านั้น (สถานะอาจเปลี่ยนไปแล้ว รายการถูกรีเฟรชให้ล่าสุด)',
          notFound: 'ไม่พบ order นี้ (404)',
        }}
      />
      <InlineError error={updateStatus.error} />

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">วันที่</th>
              <th scope="col">Portfolio</th>
              <th scope="col" className="num">จำนวนเงิน</th>
              <th scope="col">สถานะ</th>
              <th scope="col" className="actions-col">
                <span className="sr-only">การดำเนินการ</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.data.map((order) => {
              const busy = busyId === order.id;
              return (
                <tr key={order.id} aria-busy={busy}>
                  <td className="nowrap">{formatDateTime(order.createdAt)}</td>
                  <td>
                    <div>{order.portfolio.name}</div>
                    <div className="muted small">{order.portfolio.policy.name}</div>
                  </td>
                  <td className="num">{formatCurrency(order.amount)}</td>
                  <td>
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="actions">
                    {order.status === 'PENDING' && (
                      <button type="button" className="btn btn--danger btn--sm" disabled={busy} onClick={() => cancel(order)}>
                        {busy && cancelOrder.isPending ? 'กำลังยกเลิก…' : 'ยกเลิก'}
                      </button>
                    )}
                    {simulate &&
                      NEXT_SYSTEM_STATUSES[order.status].map((next) => (
                        <button
                          key={next}
                          type="button"
                          className="btn btn--ghost btn--sm"
                          disabled={busy}
                          onClick={() => advance(order.id, next)}
                        >
                          → {next}
                        </button>
                      ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
