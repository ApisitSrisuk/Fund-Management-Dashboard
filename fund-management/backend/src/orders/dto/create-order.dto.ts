import { IsNumber, IsPositive, IsUUID, Max } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  portfolioId: string;

  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @IsPositive()
  @Max(1_000_000_000)
  amount: number;
}
