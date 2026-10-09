import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreatePortfolioDto {
  @IsUUID()
  customerId: string;

  @IsUUID()
  policyId: string;

  /** Defaults to the policy name when omitted. */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;
}
