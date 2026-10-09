import type { OrderStatus } from '../types';

const LABELS: Record<OrderStatus, string> = {
  PENDING: 'รอดำเนินการ',
  PROCESSING: 'กำลังดำเนินการ',
  COMPLETED: 'สำเร็จ',
  FAILED: 'ล้มเหลว',
  CANCELLED: 'ยกเลิกแล้ว',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`badge badge--${status.toLowerCase()}`} title={status}>
      <span className="badge__dot" aria-hidden="true" />
      {LABELS[status]}
    </span>
  );
}

export function RiskBadge({ level }: { level: number }) {
  const tone = level <= 4 ? 'low' : level <= 6 ? 'mid' : 'high';
  return <span className={`risk risk--${tone}`}>ความเสี่ยง {level}/8</span>;
}
