import { IsUUID } from 'class-validator';

export class ListPortfoliosQueryDto {
  /** Required: portfolios are always listed per customer. */
  @IsUUID()
  customerId: string;
}
