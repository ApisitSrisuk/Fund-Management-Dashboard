import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { PoliciesService } from './policies.service';
import { Policy } from './policy.entity';

@Controller('policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get()
  findAll(): Promise<Policy[]> {
    return this.policiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Policy> {
    return this.policiesService.findOne(id);
  }
}
