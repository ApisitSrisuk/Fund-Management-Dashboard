import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Customer } from '../customers/customer.entity';
import { Order } from '../orders/order.entity';
import { Policy } from '../policies/policy.entity';

@Entity('portfolios')
@Index('IDX_portfolios_customer', ['customerId'])
export class Portfolio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  name: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer, (customer) => customer.portfolios, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  /**
   * Business rule: 1 portfolio ↔ exactly 1 policy. Enforced by a single NOT NULL FK column
   * (no join table) and by not exposing any endpoint that changes it after creation.
   */
  @Column({ name: 'policy_id', type: 'uuid' })
  policyId: string;

  @ManyToOne(() => Policy, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'policy_id' })
  policy: Policy;

  @OneToMany(() => Order, (order) => order.portfolio)
  orders: Order[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
