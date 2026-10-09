import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersModule } from '../customers/customers.module';
import { Order } from '../orders/order.entity';
import { PoliciesModule } from '../policies/policies.module';
import { Portfolio } from './portfolio.entity';
import { PortfoliosController } from './portfolios.controller';
import { PortfoliosService } from './portfolios.service';

@Module({
  imports: [TypeOrmModule.forFeature([Portfolio, Order]), CustomersModule, PoliciesModule],
  controllers: [PortfoliosController],
  providers: [PortfoliosService],
})
export class PortfoliosModule {}
