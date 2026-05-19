import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { TenantVersion } from './entities/tenant-version.entity';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
import { TenantConfig, ClaimTypeConfig, SlaConfig } from './interfaces/tenant-config.interface';

@Injectable()
export class TenantService implements OnModuleInit {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(TenantVersion)
    private readonly versionRepository: Repository<TenantVersion>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultTenants();
  }

  async findAll(): Promise<Tenant[]> {
    return this.tenantRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOneBy({ id });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return tenant;
  }

  async create(dto: CreateTenantDto): Promise<Tenant> {
    // Default configs if not provided
    const claimTypes = dto.claimTypes || this.getDefaultClaimTypes();
    const approvalRules = dto.approvalRules || { autoApprovalThreshold: 0, tiers: [] };
    const notifications = dto.notifications || [];
    const sla = dto.sla || { settings: [], escalationEmail: 'alerts@insurance.com' };
    const customFields = dto.customFields || [];

    const tenant = this.tenantRepository.create({
      name: dto.name,
      logoUrl: dto.logoUrl || '',
      primaryColor: dto.primaryColor || '#6366f1',
      secondaryColor: dto.secondaryColor || '#4f46e5',
      claimTypes,
      approvalRules,
      notifications,
      sla,
      customFields,
      currentVersion: 1,
    });

    const savedTenant = await this.tenantRepository.save(tenant);

    // Save initial version
    await this.saveVersionHistory(savedTenant);

    return savedTenant;
  }

  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findOne(id);

    if (dto.name !== undefined) tenant.name = dto.name;
    if (dto.logoUrl !== undefined) tenant.logoUrl = dto.logoUrl;
    if (dto.primaryColor !== undefined) tenant.primaryColor = dto.primaryColor;
    if (dto.secondaryColor !== undefined) tenant.secondaryColor = dto.secondaryColor;
    if (dto.claimTypes !== undefined) tenant.claimTypes = dto.claimTypes;
    if (dto.approvalRules !== undefined) tenant.approvalRules = dto.approvalRules;
    if (dto.notifications !== undefined) tenant.notifications = dto.notifications;
    if (dto.sla !== undefined) tenant.sla = dto.sla;
    if (dto.customFields !== undefined) tenant.customFields = dto.customFields;

    tenant.currentVersion += 1;
    const updatedTenant = await this.tenantRepository.save(tenant);

    // Save history
    await this.saveVersionHistory(updatedTenant);

    return updatedTenant;
  }

  async remove(id: string): Promise<void> {
    const tenant = await this.findOne(id);
    await this.tenantRepository.remove(tenant);
    await this.versionRepository.delete({ tenantId: id });
  }

  async getVersions(tenantId: string): Promise<TenantVersion[]> {
    await this.findOne(tenantId); // Check if exists
    return this.versionRepository.find({
      where: { tenantId },
      order: { version: 'DESC' },
    });
  }

  async rollback(tenantId: string, versionNumber: number): Promise<Tenant> {
    const tenant = await this.findOne(tenantId);
    
    const historicalVersion = await this.versionRepository.findOneBy({
      tenantId,
      version: versionNumber,
    });

    if (!historicalVersion) {
      throw new NotFoundException(`Version ${versionNumber} for tenant ${tenantId} not found`);
    }

    const config = historicalVersion.config;

    // Apply configuration back
    tenant.name = config.branding.name;
    tenant.logoUrl = config.branding.logoUrl;
    tenant.primaryColor = config.branding.primaryColor;
    tenant.secondaryColor = config.branding.secondaryColor;
    tenant.claimTypes = config.claimTypes;
    tenant.approvalRules = config.approvalRules;
    tenant.notifications = config.notifications;
    tenant.sla = config.sla;
    tenant.customFields = config.customFields;

    // Increment currentVersion to signify a rollback commit
    tenant.currentVersion += 1;

    const savedTenant = await this.tenantRepository.save(tenant);
    await this.saveVersionHistory(savedTenant, versionNumber);

    return savedTenant;
  }

  private async saveVersionHistory(tenant: Tenant, rolledBackFrom?: number): Promise<void> {
    const config: TenantConfig = {
      branding: {
        name: tenant.name,
        logoUrl: tenant.logoUrl,
        primaryColor: tenant.primaryColor,
        secondaryColor: tenant.secondaryColor,
      },
      claimTypes: tenant.claimTypes,
      approvalRules: tenant.approvalRules,
      notifications: tenant.notifications,
      sla: tenant.sla,
      customFields: tenant.customFields,
    };

    if (rolledBackFrom !== undefined) {
      config.meta = { rolledBackFrom };
    }

    const versionRecord = this.versionRepository.create({
      tenantId: tenant.id,
      version: tenant.currentVersion,
      config,
    });

    await this.versionRepository.save(versionRecord);
  }

  private getDefaultClaimTypes(): ClaimTypeConfig {
    return {
      OUTPATIENT: { enabled: true, requiredDocuments: ['Medical Invoice'], optionalDocuments: ['Prescription'] },
      INPATIENT: { enabled: false, requiredDocuments: [], optionalDocuments: [] },
      DENTAL: { enabled: false, requiredDocuments: [], optionalDocuments: [] },
      MATERNITY: { enabled: false, requiredDocuments: [], optionalDocuments: [] },
      OPTICAL: { enabled: false, requiredDocuments: [], optionalDocuments: [] },
    };
  }

  async seedDefaultTenants() {
    const count = await this.tenantRepository.count();
    if (count > 0) {
      return; // Already seeded
    }

    console.log('Seeding default tenants...');

    // 1. Tenant A — "SafeGuard Insurance" (Corporate)
    const safeguardClaimTypes = this.getDefaultClaimTypes();
    safeguardClaimTypes.OUTPATIENT = {
      enabled: true,
      requiredDocuments: ['Medical Report', 'Official Receipt'],
      optionalDocuments: ['Referral Letter'],
    };
    safeguardClaimTypes.INPATIENT = {
      enabled: true,
      requiredDocuments: ['Discharge Summary', 'Hospital Bill Receipt', 'Itemized Breakdown'],
      optionalDocuments: [],
    };
    safeguardClaimTypes.DENTAL = {
      enabled: true,
      requiredDocuments: ['Dental Treatment Record', 'Payment Invoice'],
      optionalDocuments: ['X-Ray Film'],
    };

    const safeguardSla: SlaConfig = {
      settings: [
        { claimType: 'OUTPATIENT', businessDays: 5 },
        { claimType: 'INPATIENT', businessDays: 10 },
        { claimType: 'DENTAL', businessDays: 7 },
      ],
      escalationEmail: 'escalations@safeguard.com',
    };

    await this.create({
      name: 'SafeGuard Insurance',
      logoUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=150&auto=format&fit=crop&q=60',
      primaryColor: '#0f766e', // Teal
      secondaryColor: '#115e59',
      claimTypes: safeguardClaimTypes,
      approvalRules: {
        autoApprovalThreshold: 20000,
        tiers: [
          { minAmount: 0, maxAmount: 20000, role: 'system', autoApprove: true },
          { minAmount: 20001, maxAmount: 100000, role: 'Assessor', autoApprove: false },
          { minAmount: 100001, maxAmount: 500000, role: 'Team Lead', autoApprove: false },
          { minAmount: 500001, maxAmount: -1, role: 'Director', autoApprove: false },
        ],
      },
      notifications: [
        { event: 'claim_submitted', channels: ['email'] },
        { event: 'approved', channels: ['email'] },
        { event: 'rejected', channels: ['email'] },
        { event: 'payment_sent', channels: ['email'] },
      ],
      sla: safeguardSla,
      customFields: [
        { name: 'employeeId', label: 'Employee ID', type: 'string', required: true },
      ],
    });

    // 2. Tenant B — "HealthFirst" (Retail)
    const healthfirstClaimTypes = this.getDefaultClaimTypes();
    healthfirstClaimTypes.OUTPATIENT = {
      enabled: true,
      requiredDocuments: ['Medical Invoice'],
      optionalDocuments: ['Prescription'],
    };
    healthfirstClaimTypes.INPATIENT = {
      enabled: true,
      requiredDocuments: ['Discharge Summary', 'Hospital Receipt'],
      optionalDocuments: [],
    };
    healthfirstClaimTypes.DENTAL = {
      enabled: true,
      requiredDocuments: ['Dental Bill'],
      optionalDocuments: [],
    };
    healthfirstClaimTypes.MATERNITY = {
      enabled: true,
      requiredDocuments: ['Birth Certificate', 'Maternity Claim Form', 'Hospital Receipt'],
      optionalDocuments: [],
    };
    healthfirstClaimTypes.OPTICAL = {
      enabled: true,
      requiredDocuments: ['Optometrist Prescription', 'Invoice Receipt'],
      optionalDocuments: [],
    };

    const healthfirstSla: SlaConfig = {
      settings: [
        { claimType: 'OUTPATIENT', businessDays: 7 },
        { claimType: 'INPATIENT', businessDays: 7 },
        { claimType: 'DENTAL', businessDays: 7 },
        { claimType: 'MATERNITY', businessDays: 7 },
        { claimType: 'OPTICAL', businessDays: 7 },
      ],
      escalationEmail: 'escalations@healthfirst.com',
    };

    await this.create({
      name: 'HealthFirst',
      logoUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=150&auto=format&fit=crop&q=60',
      primaryColor: '#2563eb', // Indigo / Blue
      secondaryColor: '#1d4ed8',
      claimTypes: healthfirstClaimTypes,
      approvalRules: {
        autoApprovalThreshold: 5000,
        tiers: [
          { minAmount: 0, maxAmount: 5000, role: 'system', autoApprove: true },
          { minAmount: 5001, maxAmount: 50000, role: 'Assessor', autoApprove: false },
          { minAmount: 50001, maxAmount: -1, role: 'Manager', autoApprove: false },
        ],
      },
      notifications: [
        { event: 'claim_submitted', channels: ['email', 'SMS'] },
        { event: 'approved', channels: ['email', 'SMS'] },
        { event: 'rejected', channels: ['email', 'SMS'] },
        { event: 'payment_sent', channels: ['email'] },
      ],
      sla: healthfirstSla,
      customFields: [],
    });

    // 3. Tenant C — "GovHealth" (Government)
    const govClaimTypes = this.getDefaultClaimTypes();
    govClaimTypes.OUTPATIENT = {
      enabled: true,
      requiredDocuments: ['Official Government Receipt', 'Doctor Consultation Report'],
      optionalDocuments: ['Medicine Prescriptions'],
    };
    govClaimTypes.INPATIENT = {
      enabled: true,
      requiredDocuments: ['Official Discharge Summary', 'National Hospital Invoice'],
      optionalDocuments: [],
    };

    const govSla: SlaConfig = {
      settings: [
        { claimType: 'OUTPATIENT', businessDays: 15 },
        { claimType: 'INPATIENT', businessDays: 15 },
      ],
      escalationEmail: 'gov-sla-compliance@govhealth.gov',
    };

    await this.create({
      name: 'GovHealth',
      logoUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop&q=60',
      primaryColor: '#b91c1c', // Dark Red
      secondaryColor: '#991b1b',
      claimTypes: govClaimTypes,
      approvalRules: {
        autoApprovalThreshold: 0, // No auto-approval
        tiers: [
          { minAmount: 0, maxAmount: -1, role: 'Committee', autoApprove: false },
        ],
      },
      notifications: [
        { event: 'claim_submitted', channels: ['email', 'webhook'] },
        { event: 'approved', channels: ['email', 'webhook'] },
        { event: 'rejected', channels: ['email', 'webhook'] },
        { event: 'payment_sent', channels: ['email', 'webhook'] },
      ],
      sla: govSla,
      customFields: [
        { name: 'department', label: 'Department', type: 'string', required: true },
        { name: 'budgetCode', label: 'Budget Code', type: 'string', required: true },
      ],
    });

    console.log('Seeding completed successfully!');
  }
}
