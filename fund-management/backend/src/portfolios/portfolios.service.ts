import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CustomersService } from '../customers/customers.service';
import { Order } from '../orders/order.entity';
import { PoliciesService } from '../policies/policies.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { Portfolio } from './portfolio.entity';

export type PortfolioWithLatestOrder = Portfolio & { latestOrder: Order | null };

@Injectable()
export class PortfoliosService {
  constructor(
    @InjectRepository(Portfolio) private readonly portfolios: Repository<Portfolio>,
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    private readonly customersService: CustomersService,
    private readonly policiesService: PoliciesService,
  ) {}

  async findAllByCustomer(customerId: string): Promise<PortfolioWithLatestOrder[]> {
    await this.customersService.findOne(customerId); // 404 for unknown customer instead of an empty list
    const portfolios = await this.portfolios.find({
      where: { customerId },
      relations: { policy: true },
      order: { createdAt: 'DESC' },
    });
    const latestByPortfolio = await this.findLatestOrders(portfolios.map((p) => p.id));
    return portfolios.map((p) => ({ ...p, latestOrder: latestByPortfolio.get(p.id) ?? null }));
  }

  async findOne(id: string): Promise<PortfolioWithLatestOrder> {
    const portfolio = await this.portfolios.findOne({ where: { id }, relations: { policy: true } });
    if (!portfolio) throw new NotFoundException(`Portfolio ${id} not found`);
    const latest = await this.findLatestOrders([id]);
    return { ...portfolio, latestOrder: latest.get(id) ?? null };
  }

  async create(dto: CreatePortfolioDto): Promise<PortfolioWithLatestOrder> {
    await this.customersService.findOne(dto.customerId);
    const policy = await this.policiesService.findOne(dto.policyId);

    const saved = await this.portfolios.save(
      this.portfolios.create({
        customerId: dto.customerId,
        policyId: policy.id,
        name: dto.name?.trim() || policy.name,
      }),
    );
    return this.findOne(saved.id);
  }

  /** One query for all portfolios: Postgres DISTINCT ON keeps the newest order per portfolio. */
  private async findLatestOrders(portfolioIds: string[]): Promise<Map<string, Order>> {
    if (portfolioIds.length === 0) return new Map();
    const latest = await this.orders
      .createQueryBuilder('o')
      .distinctOn(['o.portfolio_id'])
      .where({ portfolioId: In(portfolioIds) })
      .orderBy('o.portfolio_id')
      .addOrderBy('o.created_at', 'DESC')
      .getMany();
    return new Map(latest.map((order) => [order.portfolioId, order]));
  }
}
