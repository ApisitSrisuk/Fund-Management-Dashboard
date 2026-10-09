import { useState } from 'react';
import { EmptyState, ErrorState, Spinner } from '../../components/Feedback';
import { useCurrentCustomer } from '../../context/CustomerContext';
import { CreateOrderForm } from './CreateOrderForm';
import { OrdersTable } from './OrdersTable';

export function OrdersPage() {
  const { customer, isLoading, error } = useCurrentCustomer();
  const [simulate, setSimulate] = useState(false);

  return (
    <section>
      <header className="page__header">
        <div>
          <h1>คำสั่งซื้อ</h1>
          <p className="muted">สร้าง order ใหม่ และติดตามสถานะ PENDING → PROCESSING → COMPLETED / FAILED</p>
        </div>
        <label className="toggle" title="แสดงปุ่มจำลองฝั่งระบบประมวลผล เพื่อเดโม workflow">
          <input type="checkbox" checked={simulate} onChange={(e) => setSimulate(e.target.checked)} />
          <span>โหมดจำลองระบบหลังบ้าน</span>
        </label>
      </header>

      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorState error={error} />
      ) : !customer ? (
        <EmptyState>ยังไม่มีลูกค้าในระบบ</EmptyState>
      ) : (
        <div className="stack">
          <CreateOrderForm customerId={customer.id} />
          <OrdersTable customerId={customer.id} simulate={simulate} />
        </div>
      )}
    </section>
  );
}
