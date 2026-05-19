import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { TenantBranding, ClaimTypeConfig, ApprovalTier, NotificationRule, SlaConfig, CustomField } from '../interfaces/tenant-config.interface';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'logo_url', default: '' })
  logoUrl: string;

  @Column({ name: 'primary_color', default: '#6366f1' })
  primaryColor: string;

  @Column({ name: 'secondary_color', default: '#4f46e5' })
  secondaryColor: string;

  @Column('simple-json', { name: 'claim_types' })
  claimTypes: ClaimTypeConfig;

  @Column('simple-json', { name: 'approval_rules' })
  approvalRules: {
    autoApprovalThreshold: number;
    tiers: ApprovalTier[];
  };

  @Column('simple-json')
  notifications: NotificationRule[];

  @Column('simple-json')
  sla: SlaConfig;

  @Column('simple-json', { name: 'custom_fields' })
  customFields: CustomField[];

  @Column({ name: 'current_version', default: 1 })
  currentVersion: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
