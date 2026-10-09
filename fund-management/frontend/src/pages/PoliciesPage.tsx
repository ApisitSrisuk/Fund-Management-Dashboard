import { Link } from 'react-router-dom';
import { AllocationBar } from '../components/AllocationBar';
import { EmptyState, ErrorState, Spinner } from '../components/Feedback';
import { RiskBadge } from '../components/StatusBadge';
import { usePolicies } from '../hooks/usePolicies';

export function PoliciesPage() {
  const { data: policies, isPending, error, refetch } = usePolicies();

  return (
    <section>
      <header className="page__header">
        <div>
          <h1>นโยบายการลงทุน</h1>
          <p className="muted">นโยบายทั้งหมดพร้อมสัดส่วนหุ้น เลือกดูรายละเอียดแต่ละนโยบายได้</p>
        </div>
      </header>

      {isPending ? (
        <Spinner />
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : policies.length === 0 ? (
        <EmptyState>ยังไม่มีนโยบายในระบบ</EmptyState>
      ) : (
        <div className="grid">
          {policies.map((policy) => (
            <article key={policy.id} className="card">
              <div className="card__head">
                <div>
                  <span className="eyebrow">{policy.code}</span>
                  <h2 className="card__title">{policy.name}</h2>
                </div>
                <RiskBadge level={policy.riskLevel} />
              </div>
              <p className="card__desc">{policy.description}</p>
              <AllocationBar allocations={policy.allocations} />
              <Link to={`/policies/${policy.id}`} className="btn btn--ghost card__action">
                ดูรายละเอียด →
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
