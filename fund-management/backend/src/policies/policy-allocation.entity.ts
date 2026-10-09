import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { numericTransformer } from '../common/numeric.transformer';
import { Policy } from './policy.entity';

@Entity('policy_allocations')
@Unique('UQ_policy_allocations_symbol', ['policyId', 'symbol'])
export class PolicyAllocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'policy_id', type: 'uuid' })
  policyId: string;

  @ManyToOne(() => Policy, (policy) => policy.allocations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'policy_id' })
  policy: Policy;

  @Column({ length: 20 })
  symbol: string;

  @Column({ name: 'stock_name', length: 120 })
  stockName: string;

  /** Percentage of the policy (0–100, 2 decimals). Allocations of one policy sum to 100. */
  @Column({ type: 'numeric', precision: 5, scale: 2, transformer: numericTransformer })
  percentage: number;
}
