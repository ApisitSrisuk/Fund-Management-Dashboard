import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersModule } from './customers/customers.module';
import { HealthController } from './health.controller';
import { OrdersModule } from './orders/orders.module';
import { PoliciesModule } from './policies/policies.module';
import { PortfoliosModule } from './portfolios/portfolios.module';
import { SeedService } from './seed/seed.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<string>('DB_PORT', '5432')),
        username: config.get<string>('DB_USER', 'fund'),
        password: config.get<string>('DB_PASSWORD', 'fund'),
        database: config.get<string>('DB_NAME', 'fund_management'),
        autoLoadEntities: true,
        synchronize: config.get<string>('DB_SYNCHRONIZE', 'true') === 'true',
      }),
    }),
    CustomersModule,
    PoliciesModule,
    PortfoliosModule,
    OrdersModule,
  ],
  controllers: [HealthController],
  providers: [SeedService],
})
export class AppModule {}
