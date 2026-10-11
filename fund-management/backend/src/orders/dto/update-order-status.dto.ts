import { IsIn } from 'class-validator';
import { OrderStatus } from '../order-status';

export const SYSTEM_SETTABLE_STATUSES = [OrderStatus.PROCESSING, OrderStatus.COMPLETED, OrderStatus.FAILED] as const;
export type SystemSettableStatus = (typeof SYSTEM_SETTABLE_STATUSES)[number];

export class UpdateOrderStatusDto {
  @IsIn(SYSTEM_SETTABLE_STATUSES)
  status: SystemSettableStatus;
}
