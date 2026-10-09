import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { numericTransformer } from '../common/numeric.transformer';
import { Portfolio } from '../portfolios/portfolio.entity';
import { OrderStatus } from './order-status';

export const ACTIVE_ORDER_UNIQUE_INDEX = 'UQ_orders_one_active_per_portfolio';

@Entity('orders')
// DB-level guarantee for "max 1 PENDING/PROCESSING order per portfolio" — the service check gives a
// friendly 409, this partial unique index closes the race window between concurrent requests.
@Index(ACTIVE_ORDER_UNIQUE_INDEX, ['portfolioId'], {
  unique: true,
  where: `"status" IN ('PENDING', 'PROCESSING')`,
})
@Index('IDX_orders_portfolio_created', ['portfolioId', 'createdAt'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'portfolio_id', type: 'uuid' })
  portfolioId: string;

  @ManyToOne(() => Portfolio, (portfolio) => portfolio.orders, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'portfolio_id' })
  portfolio: Portfolio;

  @Column({ type: 'numeric', precision: 18, scale: 2, transformer: numericTransformer })
  amount: number;

  @Column({ type: 'enum', enum: OrderStatus, enumName: 'order_status', default: OrderStatus.PENDING })
  status: OrderStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
