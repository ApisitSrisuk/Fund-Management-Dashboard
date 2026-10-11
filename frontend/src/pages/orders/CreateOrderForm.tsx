import { useState, type FormEvent } from 'react';
import { isApiError } from '../../api/client';
import { ErrorState, InlineError } from '../../components/Feedback';
import { StatusBadge } from '../../components/StatusBadge';
import { useCreateOrder } from '../../hooks/useOrders';
import { usePortfolios } from '../../hooks/usePortfolios';
import { ACTIVE_ORDER_STATUSES, ORDER_STATUSES, type OrderStatus } from '../../types';

const MAX_AMOUNT = 1_000_000_000;

function validateAmount(raw: string): string | null {
  if (raw.trim() === '') return 'กรุณากรอกจำนวนเงิน';
  const value = Number(raw);
  if (!Number.isFinite(value)) return 'จำนวนเงินต้องเป็นตัวเลข';
  if (value <= 0) return 'จำนวนเงินต้องมากกว่า 0';
  if (value > MAX_AMOUNT) return 'จำนวนเงินสูงเกินกำหนด';
  if (!/^\d+(\.\d{1,2})?$/.test(raw.trim())) return 'ทศนิยมได้ไม่เกิน 2 ตำแหน่ง';
  return null;
}

function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === 'string' && (ORDER_STATUSES as readonly string[]).includes(value);
}

function conflictMessage(error: unknown): string {
  const status = isApiError(error) ? error.body?.activeOrderStatus : undefined;
  const suffix = isOrderStatus(status) ? ` (สถานะ ${status})` : '';
  return `Portfolio นี้มี order ที่ยังดำเนินการไม่เสร็จอยู่แล้ว${suffix} — ต้องรอให้เสร็จ หรือยกเลิก order ที่ยัง PENDING ก่อนจึงจะสร้างใหม่ได้`;
}

export function CreateOrderForm({ customerId }: { customerId: string }) {
  const portfolios = usePortfolios(customerId);
  const createOrder = useCreateOrder();
  const [portfolioId, setPortfolioId] = useState('');
  const [amount, setAmount] = useState('');
  const [touched, setTouched] = useState(false);

  const amountError = validateAmount(amount);
  const selected = portfolios.data?.find((p) => p.id === portfolioId);
  const selectedHasActive = selected?.latestOrder && ACTIVE_ORDER_STATUSES.includes(selected.latestOrder.status);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!portfolioId || amountError) return;
    createOrder.mutate(
      { portfolioId, amount: Number(amount) },
      {
        onSuccess: () => {
          setAmount('');
          setTouched(false);
        },
      },
    );
  };

  if (portfolios.error) return <ErrorState error={portfolios.error} onRetry={() => void portfolios.refetch()} />;

  const noPortfolios = portfolios.data?.length === 0;

  return (
    <form className="panel form" onSubmit={submit} noValidate>
      <h2 className="panel__title">สร้าง Order ใหม่</h2>
      <div className="form__row">
        <label className="field">
          <span className="field__label">Portfolio</span>
          <select
            value={portfolioId}
            onChange={(e) => {
              setPortfolioId(e.target.value);
              createOrder.reset();
            }}
            disabled={portfolios.isPending || noPortfolios || createOrder.isPending}
            aria-invalid={touched && !portfolioId}
          >
            <option value="">
              {portfolios.isPending ? 'กำลังโหลด…' : noPortfolios ? 'ยังไม่มี portfolio' : '— เลือก portfolio —'}
            </option>
            {portfolios.data?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.policy.name}
              </option>
            ))}
          </select>
          {touched && !portfolioId && <span className="field__error">กรุณาเลือก portfolio</span>}
        </label>

        <label className="field">
          <span className="field__label">จำนวนเงิน (บาท)</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="เช่น 10000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onBlur={() => setTouched(true)}
            disabled={createOrder.isPending}
            aria-invalid={touched && Boolean(amountError)}
          />
          {touched && amountError && <span className="field__error">{amountError}</span>}
        </label>

        <button type="submit" className="btn btn--primary form__submit" disabled={createOrder.isPending || noPortfolios}>
          {createOrder.isPending ? 'กำลังส่ง…' : 'ส่งคำสั่งซื้อ'}
        </button>
      </div>

      {selectedHasActive && selected.latestOrder && !createOrder.error && (
        <p className="hint">
          Portfolio นี้มี order <StatusBadge status={selected.latestOrder.status} /> อยู่ — ระบบจะไม่อนุญาตให้สร้าง order ใหม่
        </p>
      )}

      <InlineError error={createOrder.error} overrides={{ conflict: conflictMessage(createOrder.error), notFound: 'ไม่พบ portfolio นี้ (404) กรุณารีเฟรชหน้า' }} />
      {createOrder.isSuccess && <p className="inline-success">สร้าง order สำเร็จ สถานะเริ่มต้น PENDING</p>}
    </form>
  );
}
