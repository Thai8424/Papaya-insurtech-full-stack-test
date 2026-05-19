import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('claims')
export class Claim {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'claim_type' })
  claimType: string;

  @Column('double precision', { default: 0 })
  amount: number;

  @Column('simple-json', { name: 'custom_fields_data' })
  customFieldsData: Record<string, any>;

  @Column({ default: 'PENDING_REVIEW' })
  status: string; // 'AUTO_APPROVED' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'

  @Column('simple-json', { name: 'approval_route' })
  approvalRoute: {
    tier: string;
    approverRole: string;
    requiresApproval: boolean;
    autoApproved: boolean;
  };

  @Column('simple-json', { name: 'notifications_sent' })
  notificationsSent: Array<{
    event: string;
    channels: string[];
    templateUsed: string;
  }>;

  @Column({ name: 'sla_deadline' })
  slaDeadline: Date;

  @Column({ name: 'business_days_remaining' })
  businessDaysRemaining: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
