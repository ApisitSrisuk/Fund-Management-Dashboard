import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, FindOptionsWhere, In, Repository } from 'typeorm';
import { isUniqueViolation } from '../common/pg-error';
import { Portfolio } from '../portfolios/portfolio.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { SystemSettableStatus } from './dto/update-order-status.dto';
import { ACTIVE_ORDER_UNIQUE_INDEX, Order } from './order.entity';
import { ACTIVE_ORDER_STATUSES, canTransition, OrderStatus } from './order-status';

export const OrderErrorCode = {
  ACTIVE_ORDER_EXISTS: 'ACTIVE_ORDER_EXISTS',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
} as const;

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  findAll(query: ListOrdersQueryDto): Promise<Order[]> {
    const where: FindOptionsWhere<Order> = {};
    if (query.portfolioId) where.portfolioId = query.portfolioId;
    if (query.status) where.status = query.status;
    if (query.customerId) where.portfolio = { customerId: query.customerId };

    return this.orders.find({
      where,
      relations: { portfolio: { policy: true } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orders.findOne({ where: { id }, relations: { portfolio: { policy: true } } });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  async create(dto: CreateOrderDto): Promise<Order> {
    const saved = await this.dataSource.transaction(async (manager) => {
      const portfolio = await manager.findOne(Portfolio, {
        where: { id: dto.portfolioId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!portfolio) throw new NotFoundException(`Portfolio ${dto.portfolioId} not found`);

      const activeOrder = await manager.findOne(Order, {
        where: { portfolioId: dto.portfolioId, status: In([...ACTIVE_ORDER_STATUSES]) },
      });
      if (activeOrder) throw this.activeOrderConflict(activeOrder);

      try {
        return await manager.save(
          manager.create(Order, { portfolioId: dto.portfolioId, amount: dto.amount, status: OrderStatus.PENDING }),
        );
      } catch (error) {
        if (isUniqueViolation(error, ACTIVE_ORDER_UNIQUE_INDEX)) {
          throw new ConflictException({
            code: OrderErrorCode.ACTIVE_ORDER_EXISTS,
            message: 'Portfolio already has an active (PENDING/PROCESSING) order',
          });
        }
        throw error;
      }
    });
    return this.findOne(saved.id);
  }

  cancel(id: string): Promise<Order> {
    return this.transition(id, OrderStatus.CANCELLED);
  }

  updateStatus(id: string, status: SystemSettableStatus): Promise<Order> {
    return this.transition(id, status);
  }

  private async transition(id: string, next: OrderStatus): Promise<Order> {
    await this.dataSource.transaction(async (manager: EntityManager) => {
      const order = await manager.findOne(Order, { where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!order) throw new NotFoundException(`Order ${id} not found`);

      if (!canTransition(order.status, next)) {
        const message =
          next === OrderStatus.CANCELLED
            ? `Only PENDING orders can be cancelled (current status: ${order.status})`
            : `Cannot change status from ${order.status} to ${next}`;
        throw new ConflictException({
          code: OrderErrorCode.INVALID_STATUS_TRANSITION,
          message,
          currentStatus: order.status,
        });
      }

      order.status = next;
      await manager.save(order);
    });
    return this.findOne(id);
  }

  private activeOrderConflict(activeOrder: Order): ConflictException {
    return new ConflictException({
      code: OrderErrorCode.ACTIVE_ORDER_EXISTS,
      message: `Portfolio already has an active order (status: ${activeOrder.status})`,
      activeOrderId: activeOrder.id,
      activeOrderStatus: activeOrder.status,
    });
  }
}
