import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Claim } from './entities/claim.entity';
import { ClaimService } from './claim.service';
import { ClaimController } from './claim.controller';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Claim]),
    TenantModule, // Import TenantModule for TenantService lookup
  ],
  controllers: [ClaimController],
  providers: [ClaimService],
})
export class ClaimModule {}
