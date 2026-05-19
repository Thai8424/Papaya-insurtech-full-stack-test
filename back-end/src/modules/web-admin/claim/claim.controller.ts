import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { ClaimService } from './claim.service';
import { Claim } from './entities/claim.entity';
import { ProcessClaimDto, ProcessClaimResult } from './engine/claim-processor';

@Controller('api/claims')
export class ClaimController {
  constructor(private readonly claimService: ClaimService) {}

  @Get()
  async findAll(): Promise<Claim[]> {
    return this.claimService.findAll();
  }

  @Get('tenant/:tenantId')
  async findByTenant(@Param('tenantId') tenantId: string): Promise<Claim[]> {
    return this.claimService.findByTenant(tenantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Claim> {
    return this.claimService.findOne(id);
  }

  @Post('process/:tenantId')
  async processClaimPreview(
    @Param('tenantId') tenantId: string,
    @Body() dto: ProcessClaimDto,
  ): Promise<ProcessClaimResult> {
    return this.claimService.processClaimPreview(tenantId, dto);
  }

  @Post('submit/:tenantId')
  async submitClaim(
    @Param('tenantId') tenantId: string,
    @Body() dto: ProcessClaimDto,
  ): Promise<{ claim: Claim; metadata: ProcessClaimResult }> {
    return this.claimService.submitClaim(tenantId, dto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'APPROVED' | 'REJECTED' },
  ): Promise<Claim> {
    return this.claimService.updateStatus(id, body.status);
  }
}
