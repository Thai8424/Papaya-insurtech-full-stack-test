import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Claim } from './entities/claim.entity';
import { TenantService } from '../tenant/tenant.service';
import { processClaim, ProcessClaimDto, ProcessClaimResult } from './engine/claim-processor';

@Injectable()
export class ClaimService {
  constructor(
    @InjectRepository(Claim)
    private readonly claimRepository: Repository<Claim>,
    private readonly tenantService: TenantService,
  ) {}

  async findAll(): Promise<Claim[]> {
    return this.claimRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findByTenant(tenantId: string): Promise<Claim[]> {
    return this.claimRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Claim> {
    const claim = await this.claimRepository.findOneBy({ id });
    if (!claim) {
      throw new NotFoundException(`Claim with ID ${id} not found`);
    }
    return claim;
  }

  async processClaimPreview(tenantId: string, dto: ProcessClaimDto): Promise<ProcessClaimResult> {
    const tenant = await this.tenantService.findOne(tenantId);
    return processClaim(tenant, dto);
  }

  async submitClaim(tenantId: string, dto: ProcessClaimDto): Promise<{ claim: Claim; metadata: ProcessClaimResult }> {
    const tenant = await this.tenantService.findOne(tenantId);
    
    // Process the claim
    const result = processClaim(tenant, dto);
    
    if (!result.success) {
      throw new BadRequestException({
        message: 'Claim processing validation failed',
        errors: result.errors,
      });
    }

    // Determine initial status based on routing
    const initialStatus = result.approvalRoute.autoApproved ? 'AUTO_APPROVED' : 'PENDING_REVIEW';

    const claim = this.claimRepository.create({
      tenantId,
      claimType: dto.claimType,
      amount: dto.amount,
      customFieldsData: dto.customFieldsData,
      status: initialStatus,
      approvalRoute: result.approvalRoute,
      notificationsSent: result.notificationsToSend,
      slaDeadline: new Date(result.slaDeadline),
      businessDaysRemaining: result.businessDaysRemaining,
    });

    const savedClaim = await this.claimRepository.save(claim);

    return {
      claim: savedClaim,
      metadata: result,
    };
  }

  async updateStatus(id: string, status: 'APPROVED' | 'REJECTED'): Promise<Claim> {
    const claim = await this.findOne(id);
    
    if (claim.status !== 'PENDING_REVIEW') {
      throw new BadRequestException(`Claim ${id} has already been processed with status ${claim.status}`);
    }

    claim.status = status;

    // Simulate sending notifications on status update
    const tenant = await this.tenantService.findOne(claim.tenantId);
    const event = status === 'APPROVED' ? 'approved' : 'rejected';
    const rule = (tenant.notifications || []).find(n => n.event === event);
    
    if (rule) {
      const newNotification = {
        event,
        channels: rule.channels,
        templateUsed: rule.customTemplate || `Default email/sms template for ${event}`,
      };
      claim.notificationsSent = [...claim.notificationsSent, newNotification];
    }

    return this.claimRepository.save(claim);
  }
}
