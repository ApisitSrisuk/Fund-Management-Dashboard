import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { OrderStatus } from '../order-status';

export class ListOrdersQueryDto {
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  portfolioId?: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
