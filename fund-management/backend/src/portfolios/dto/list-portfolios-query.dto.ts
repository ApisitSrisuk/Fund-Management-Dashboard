import { IsUUID } from 'class-validator';

export class ListPortfoliosQueryDto {
  @IsUUID()
  customerId: string;
}
