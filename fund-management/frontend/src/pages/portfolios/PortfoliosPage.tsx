import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, Spinner } from '../../components/Feedback';
import { RiskBadge, StatusBadge } from '../../components/StatusBadge';
import { useCurrentCustomer } from '../../context/CustomerContext';
import { usePortfolios } from '../../hooks/usePortfolios';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { CreatePortfolioModal } from './CreatePortfolioModal';

export function PortfoliosPage() {
  const { customer, isLoading: customerLoading, error: customerError } = useCurrentCustomer();
  const portfolios = usePortfolios(customer?.id);
  const [modalOpen, setModalOpen] = useState(false);

  const renderBody = () => {
    if (customerLoading || (customer && portfolios.isPending)) return <Spinner />;
    if (customerError) return <ErrorState error={customerError} />;
    if (!customer) return <EmptyState>ยังไม่มีลูกค้าในระบบ</EmptyState>;
    if (portfolios.error)
      return (
        <ErrorState
          error={portfolios.error}
          onRetry={() => void portfolios.refetch()}
          overrides={{ notFound: 'ไม่พบข้อมูลลูกค้า (404)' }}
        />
      );

    const list = portfolios.data ?? [];
    if (list.length === 0)
      return <EmptyState>ยังไม่มี portfolio — กด “สร้าง Portfolio” เพื่อเริ่มต้น</EmptyState>;

    return (
      <div className="grid">
        {list.map((p) => (
          <article key={p.id} className="card">
            <div className="card__head">
              <div>
                <span className="eyebrow">{p.policy.code}</span>
                <h2 className="card__title">{p.name}</h2>
              </div>
              <RiskBadge level={p.policy.riskLevel} />
            </div>
            <dl className="meta">
              <div>
                <dt>นโยบาย</dt>
                <dd>
                  <Link to={`/policies/${p.policy.id}`}>{p.policy.name}</Link>
                </dd>
              </div>
              <div>
                <dt>สร้างเมื่อ</dt>
                <dd>{formatDateTime(p.createdAt)}</dd>
              </div>
            </dl>
            <div className="latest-order">
              <span className="latest-order__label">Order ล่าสุด</span>
              {p.latestOrder ? (
                <span className="latest-order__value">
                  <StatusBadge status={p.latestOrder.status} />
                  <span className="num">{formatCurrency(p.latestOrder.amount)}</span>
                </span>
              ) : (
                <span className="muted">ยังไม่มี order</span>
              )}
            </div>
          </article>
        ))}
      </div>
    );
  };

  return (
    <section>
      <header className="page__header">
        <div>
          <h1>พอร์ตของฉัน</h1>
          <p className="muted">{customer ? `Portfolio ทั้งหมดของ ${customer.name}` : 'Portfolio ทั้งหมดของลูกค้า'}</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setModalOpen(true)} disabled={!customer}>
          + สร้าง Portfolio
        </button>
      </header>

      {renderBody()}

      {customer && (
        <CreatePortfolioModal open={modalOpen} customerId={customer.id} onClose={() => setModalOpen(false)} />
      )}
    </section>
  );
}
