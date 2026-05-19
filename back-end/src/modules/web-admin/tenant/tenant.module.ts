import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { TenantVersion } from './entities/tenant-version.entity';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, TenantVersion])],
  controllers: [TenantController],
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}
