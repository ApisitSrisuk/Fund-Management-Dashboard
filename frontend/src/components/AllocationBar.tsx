import type { PolicyAllocation } from '../types';
import { formatPercent } from '../utils/format';

const SERIES = 6;

interface AllocationBarProps {
  allocations: PolicyAllocation[];
  showLegend?: boolean;
}

export function AllocationBar({ allocations, showLegend = true }: AllocationBarProps) {
  return (
    <div className="allocation">
      <div
        className="allocation__bar"
        role="img"
        aria-label={allocations.map((a) => `${a.symbol} ${formatPercent(a.percentage)}`).join(', ')}
      >
        {allocations.map((a, i) => (
          <span
            key={a.id}
            className={`allocation__segment series-${i % SERIES}`}
            style={{ flexGrow: a.percentage }}
            title={`${a.symbol} ${formatPercent(a.percentage)}`}
          />
        ))}
      </div>
      {showLegend && (
        <ul className="allocation__legend">
          {allocations.map((a, i) => (
            <li key={a.id}>
              <span className={`swatch series-${i % SERIES}`} aria-hidden="true" />
              <span className="allocation__symbol">{a.symbol}</span>
              <span className="allocation__pct">{formatPercent(a.percentage)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
