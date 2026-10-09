import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoliciesController } from './policies.controller';
import { PoliciesService } from './policies.service';
import { PolicyAllocation } from './policy-allocation.entity';
import { Policy } from './policy.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Policy, PolicyAllocation])],
  controllers: [PoliciesController],
  providers: [PoliciesService],
  exports: [PoliciesService],
})
export class PoliciesModule {}
