import { useState, type FormEvent } from 'react';
import { AllocationBar } from '../../components/AllocationBar';
import { ErrorState, InlineError, Spinner } from '../../components/Feedback';
import { Modal } from '../../components/Modal';
import { RiskBadge } from '../../components/StatusBadge';
import { usePolicies } from '../../hooks/usePolicies';
import { useCreatePortfolio } from '../../hooks/usePortfolios';

interface CreatePortfolioModalProps {
  open: boolean;
  customerId: string;
  onClose: () => void;
}

export function CreatePortfolioModal({ open, customerId, onClose }: CreatePortfolioModalProps) {
  const policies = usePolicies();
  const createPortfolio = useCreatePortfolio();
  const [policyId, setPolicyId] = useState('');
  const [name, setName] = useState('');

  const close = () => {
    setPolicyId('');
    setName('');
    createPortfolio.reset();
    onClose();
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!policyId) return;
    createPortfolio.mutate(
      { customerId, policyId, name: name.trim() || undefined },
      { onSuccess: close },
    );
  };

  return (
    <Modal open={open} title="สร้าง Portfolio" onClose={close}>
      <form onSubmit={submit} className="form">
        <fieldset className="policy-options" disabled={createPortfolio.isPending}>
          <legend>เลือกนโยบาย (1 portfolio ผูกกับ 1 นโยบาย)</legend>
          {policies.isPending ? (
            <Spinner label="กำลังโหลดนโยบาย…" />
          ) : policies.error ? (
            <ErrorState error={policies.error} onRetry={() => void policies.refetch()} />
          ) : (
            policies.data.map((policy) => (
              <label key={policy.id} className={`policy-option${policyId === policy.id ? ' is-selected' : ''}`}>
                <input
                  type="radio"
                  name="policy"
                  value={policy.id}
                  checked={policyId === policy.id}
                  onChange={() => setPolicyId(policy.id)}
                />
                <span className="policy-option__body">
                  <span className="policy-option__head">
                    <strong>{policy.name}</strong>
                    <RiskBadge level={policy.riskLevel} />
                  </span>
                  <AllocationBar allocations={policy.allocations} showLegend={false} />
                </span>
              </label>
            ))
          )}
        </fieldset>

        <label className="field">
          <span className="field__label">ชื่อ Portfolio (ไม่บังคับ)</span>
          <input
            type="text"
            value={name}
            maxLength={120}
            placeholder="ถ้าไม่ระบุ จะใช้ชื่อนโยบาย"
            onChange={(e) => setName(e.target.value)}
            disabled={createPortfolio.isPending}
          />
        </label>

        <InlineError
          error={createPortfolio.error}
          overrides={{ notFound: 'ไม่พบลูกค้าหรือนโยบายที่เลือก (404) กรุณารีเฟรชแล้วลองใหม่' }}
        />

        <div className="form__actions">
          <button type="button" className="btn btn--ghost" onClick={close}>
            ยกเลิก
          </button>
          <button type="submit" className="btn btn--primary" disabled={!policyId || createPortfolio.isPending}>
            {createPortfolio.isPending ? 'กำลังสร้าง…' : 'สร้าง Portfolio'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
