import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError } from 'typeorm';
import { Portfolio } from '../portfolios/portfolio.entity';
import { ACTIVE_ORDER_UNIQUE_INDEX, Order } from './order.entity';
import { OrderStatus } from './order-status';
import { OrderErrorCode, OrdersService } from './orders.service';

const PORTFOLIO_ID = '11111111-1111-4111-8111-111111111111';
const ORDER_ID = '22222222-2222-4222-8222-222222222222';

function buildOrder(overrides: Partial<Order> = {}): Order {
  return Object.assign(new Order(), {
    id: ORDER_ID,
    portfolioId: PORTFOLIO_ID,
    amount: 1000,
    status: OrderStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

describe('OrdersService', () => {
  let service: OrdersService;
  const manager = {
    findOne: jest.fn(),
    create: jest.fn((_entity: unknown, data: Partial<Order>) => buildOrder(data)),
    save: jest.fn((entity: Order) => Promise.resolve(entity)),
  };
  const dataSource = {
    transaction: jest.fn((work: (m: typeof manager) => Promise<unknown>) => work(manager)),
  };
  const orderRepository = { findOne: jest.fn(), find: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: orderRepository },
        { provide: getDataSourceToken(), useValue: dataSource },
      ],
    }).compile();
    service = moduleRef.get(OrdersService);
  });

  describe('create — duplicate order rule', () => {
    const portfolio = Object.assign(new Portfolio(), { id: PORTFOLIO_ID });

    it.each([OrderStatus.PENDING, OrderStatus.PROCESSING])(
      'rejects with 409 when the portfolio already has a %s order',
      async (activeStatus) => {
        manager.findOne
          .mockResolvedValueOnce(portfolio) // portfolio lookup (locked)
          .mockResolvedValueOnce(buildOrder({ status: activeStatus })); // active order lookup

        const promise = service.create({ portfolioId: PORTFOLIO_ID, amount: 5000 });

        await expect(promise).rejects.toBeInstanceOf(ConflictException);
        await promise.catch((error: ConflictException) => {
          expect(error.getStatus()).toBe(409);
          expect(error.getResponse()).toMatchObject({
            code: OrderErrorCode.ACTIVE_ORDER_EXISTS,
            activeOrderStatus: activeStatus,
          });
        });
        expect(manager.save).not.toHaveBeenCalled();
      },
    );

    it('locks the portfolio row and only counts PENDING/PROCESSING as active', async () => {
      manager.findOne.mockResolvedValueOnce(portfolio).mockResolvedValueOnce(buildOrder());

      await expect(service.create({ portfolioId: PORTFOLIO_ID, amount: 5000 })).rejects.toThrow(ConflictException);

      expect(manager.findOne).toHaveBeenNthCalledWith(1, Portfolio, {
        where: { id: PORTFOLIO_ID },
        lock: { mode: 'pessimistic_write' },
      });
      const activeLookup = manager.findOne.mock.calls[1][1] as { where: { status: { value: OrderStatus[] } } };
      expect(activeLookup.where.status.value).toEqual([OrderStatus.PENDING, OrderStatus.PROCESSING]);
    });

    it('maps a unique-index violation (concurrent request race) to 409', async () => {
      manager.findOne.mockResolvedValueOnce(portfolio).mockResolvedValueOnce(null);
      manager.save.mockRejectedValueOnce(
        new QueryFailedError('INSERT ...', [], Object.assign(new Error('duplicate key'), {
          code: '23505',
          constraint: ACTIVE_ORDER_UNIQUE_INDEX,
        })),
      );

      await expect(service.create({ portfolioId: PORTFOLIO_ID, amount: 5000 })).rejects.toThrow(ConflictException);
    });

    it('creates a PENDING order when there is no active order', async () => {
      manager.findOne.mockResolvedValueOnce(portfolio).mockResolvedValueOnce(null);
      orderRepository.findOne.mockResolvedValueOnce(buildOrder({ amount: 5000 }));

      const order = await service.create({ portfolioId: PORTFOLIO_ID, amount: 5000 });

      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({ portfolioId: PORTFOLIO_ID, amount: 5000, status: OrderStatus.PENDING }),
      );
      expect(order.status).toBe(OrderStatus.PENDING);
    });

    it('returns 404 when the portfolio does not exist', async () => {
      manager.findOne.mockResolvedValueOnce(null);

      await expect(service.create({ portfolioId: PORTFOLIO_ID, amount: 5000 })).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('cancels a PENDING order', async () => {
      manager.findOne.mockResolvedValueOnce(buildOrder({ status: OrderStatus.PENDING }));
      orderRepository.findOne.mockResolvedValueOnce(buildOrder({ status: OrderStatus.CANCELLED }));

      const order = await service.cancel(ORDER_ID);

      expect(manager.save).toHaveBeenCalledWith(expect.objectContaining({ status: OrderStatus.CANCELLED }));
      expect(order.status).toBe(OrderStatus.CANCELLED);
    });

    it.each([OrderStatus.PROCESSING, OrderStatus.COMPLETED, OrderStatus.FAILED, OrderStatus.CANCELLED])(
      'rejects with 409 when the order is %s',
      async (status) => {
        manager.findOne.mockResolvedValueOnce(buildOrder({ status }));

        await expect(service.cancel(ORDER_ID)).rejects.toThrow(ConflictException);
        expect(manager.save).not.toHaveBeenCalled();
      },
    );
  });

  describe('updateStatus — workflow', () => {
    it('rejects skipping PROCESSING (PENDING → COMPLETED)', async () => {
      manager.findOne.mockResolvedValueOnce(buildOrder({ status: OrderStatus.PENDING }));

      await expect(service.updateStatus(ORDER_ID, OrderStatus.COMPLETED)).rejects.toThrow(ConflictException);
    });

    it('allows PROCESSING → FAILED', async () => {
      manager.findOne.mockResolvedValueOnce(buildOrder({ status: OrderStatus.PROCESSING }));
      orderRepository.findOne.mockResolvedValueOnce(buildOrder({ status: OrderStatus.FAILED }));

      await expect(service.updateStatus(ORDER_ID, OrderStatus.FAILED)).resolves.toMatchObject({
        status: OrderStatus.FAILED,
      });
    });
  });
});
