import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Policy } from './policy.entity';

@Injectable()
export class PoliciesService {
  constructor(@InjectRepository(Policy) private readonly policies: Repository<Policy>) {}

  findAll(): Promise<Policy[]> {
    return this.policies.find({
      relations: { allocations: true },
      order: { riskLevel: 'ASC', allocations: { percentage: 'DESC' } },
    });
  }

  async findOne(id: string): Promise<Policy> {
    const policy = await this.policies.findOne({
      where: { id },
      relations: { allocations: true },
      order: { allocations: { percentage: 'DESC' } },
    });
    if (!policy) throw new NotFoundException(`Policy ${id} not found`);
    return policy;
  }
}
