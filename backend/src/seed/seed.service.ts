import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Customer } from '../customers/customer.entity';
import { Policy } from '../policies/policy.entity';

type SeedPolicy = Pick<Policy, 'code' | 'name' | 'description' | 'riskLevel'> & {
  allocations: { symbol: string; stockName: string; percentage: number }[];
};

const POLICIES: SeedPolicy[] = [
  {
    code: 'CONSERVATIVE',
    name: 'Conservative Dividend',
    description: 'เน้นหุ้นขนาดใหญ่ที่จ่ายปันผลสม่ำเสมอ ความผันผวนต่ำ เหมาะกับผู้ลงทุนที่ต้องการกระแสเงินสด',
    riskLevel: 5,
    allocations: [
      { symbol: 'PTT', stockName: 'PTT Public Company Limited', percentage: 25 },
      { symbol: 'ADVANC', stockName: 'Advanced Info Service', percentage: 25 },
      { symbol: 'SCB', stockName: 'SCB X', percentage: 20 },
      { symbol: 'KBANK', stockName: 'Kasikornbank', percentage: 15 },
      { symbol: 'BBL', stockName: 'Bangkok Bank', percentage: 15 },
    ],
  },
  {
    code: 'BALANCED',
    name: 'Balanced Growth',
    description: 'กระจายลงทุนหลายอุตสาหกรรม ทั้งค้าปลีก การบิน พลังงาน และสุขภาพ สมดุลระหว่างการเติบโตและความเสี่ยง',
    riskLevel: 6,
    allocations: [
      { symbol: 'CPALL', stockName: 'CP ALL', percentage: 20 },
      { symbol: 'AOT', stockName: 'Airports of Thailand', percentage: 20 },
      { symbol: 'PTTEP', stockName: 'PTT Exploration and Production', percentage: 15 },
      { symbol: 'DELTA', stockName: 'Delta Electronics (Thailand)', percentage: 15 },
      { symbol: 'GULF', stockName: 'Gulf Development', percentage: 15 },
      { symbol: 'BDMS', stockName: 'Bangkok Dusit Medical Services', percentage: 15 },
    ],
  },
  {
    code: 'AGGRESSIVE',
    name: 'Aggressive Tech',
    description: 'เน้นหุ้นเทคโนโลยีและอิเล็กทรอนิกส์ที่มีศักยภาพเติบโตสูง ผันผวนสูง เหมาะกับการลงทุนระยะยาว',
    riskLevel: 7,
    allocations: [
      { symbol: 'DELTA', stockName: 'Delta Electronics (Thailand)', percentage: 30 },
      { symbol: 'HANA', stockName: 'Hana Microelectronics', percentage: 20 },
      { symbol: 'KCE', stockName: 'KCE Electronics', percentage: 20 },
      { symbol: 'COM7', stockName: 'Com7', percentage: 15 },
      { symbol: 'JMART', stockName: 'Jaymart Group Holdings', percentage: 15 },
    ],
  },
];

const CUSTOMERS: Pick<Customer, 'name' | 'email'>[] = [
  { name: 'สมชาย ใจดี', email: 'somchai@example.com' },
  { name: 'สมหญิง รักออม', email: 'somying@example.com' },
];

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onApplicationBootstrap(): Promise<void> {
    if (process.env.SEED_ON_BOOT === 'false') return;

    await this.dataSource.transaction(async (manager) => {
      if ((await manager.count(Policy)) === 0) {
        await manager.save(Policy, POLICIES.map((p) => manager.create(Policy, p)));
        this.logger.log(`Seeded ${POLICIES.length} policies`);
      }
      if ((await manager.count(Customer)) === 0) {
        await manager.save(Customer, CUSTOMERS.map((c) => manager.create(Customer, c)));
        this.logger.log(`Seeded ${CUSTOMERS.length} customers`);
      }
    });
  }
}
