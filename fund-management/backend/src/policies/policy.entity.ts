import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PolicyAllocation } from './policy-allocation.entity';

@Entity('policies')
export class Policy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 30, unique: true })
  code: string;

  @Column({ length: 120 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  /** 1 (lowest) – 8 (highest), mirroring the SEC Thailand fund risk scale. */
  @Column({ name: 'risk_level', type: 'smallint' })
  riskLevel: number;

  @OneToMany(() => PolicyAllocation, (allocation) => allocation.policy, { cascade: true })
  allocations: PolicyAllocation[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
