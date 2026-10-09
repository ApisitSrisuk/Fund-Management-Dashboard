import { Link, useParams } from 'react-router-dom';
import { AllocationBar } from '../components/AllocationBar';
import { ErrorState, Spinner } from '../components/Feedback';
import { RiskBadge } from '../components/StatusBadge';
import { usePolicy } from '../hooks/usePolicies';
import { formatPercent } from '../utils/format';

export function PolicyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: policy, isPending, error, refetch } = usePolicy(id);

  return (
    <section>
      <Link to="/policies" className="back-link">
        ← กลับไปหน้านโยบาย
      </Link>

      {isPending ? (
        <Spinner />
      ) : error ? (
        <ErrorState
          error={error}
          onRetry={() => void refetch()}
          overrides={{ notFound: 'ไม่พบนโยบายนี้ (404) อาจถูกลบไปแล้วหรือลิงก์ไม่ถูกต้อง' }}
        />
      ) : (
        <>
          <header className="page__header">
            <div>
              <span className="eyebrow">{policy.code}</span>
              <h1>{policy.name}</h1>
              <p className="muted">{policy.description}</p>
            </div>
            <RiskBadge level={policy.riskLevel} />
          </header>

          <div className="panel">
            <h2 className="panel__title">สัดส่วนการลงทุน</h2>
            <AllocationBar allocations={policy.allocations} showLegend={false} />
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">หุ้น</th>
                  <th scope="col">ชื่อบริษัท</th>
                  <th scope="col" className="num">สัดส่วน</th>
                </tr>
              </thead>
              <tbody>
                {policy.allocations.map((a, i) => (
                  <tr key={a.id}>
                    <td>
                      <span className={`swatch series-${i % 6}`} aria-hidden="true" /> <strong>{a.symbol}</strong>
                    </td>
                    <td>{a.stockName}</td>
                    <td className="num">{formatPercent(a.percentage)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}>รวม</td>
                  <td className="num">
                    {formatPercent(policy.allocations.reduce((sum, a) => sum + a.percentage, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
