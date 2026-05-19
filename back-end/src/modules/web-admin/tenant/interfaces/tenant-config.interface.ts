export interface TenantBranding {
  name: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface ClaimTypeSetting {
  enabled: boolean;
  requiredDocuments: string[];
  optionalDocuments: string[];
}

export type ClaimType = 'OUTPATIENT' | 'INPATIENT' | 'DENTAL' | 'MATERNITY' | 'OPTICAL';

export type ClaimTypeConfig = Record<ClaimType, ClaimTypeSetting>;

export interface ApprovalTier {
  minAmount: number;
  maxAmount: number; // Use -1 or Infinity for unlimited
  role: string; // 'assessor' | 'team_lead' | 'manager' | 'director' | 'committee' etc.
  autoApprove: boolean;
}

export type NotificationEvent = 'claim_submitted' | 'approved' | 'rejected' | 'payment_sent';
export type NotificationChannel = 'email' | 'SMS' | 'webhook';

export interface NotificationRule {
  event: NotificationEvent;
  channels: NotificationChannel[];
  customTemplate?: string;
}

export interface SlaSetting {
  claimType: ClaimType;
  businessDays: number;
}

export interface SlaConfig {
  settings: SlaSetting[];
  escalationEmail: string;
}

export interface CustomField {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
}

export interface TenantConfig {
  branding: TenantBranding;
  claimTypes: ClaimTypeConfig;
  approvalRules: {
    autoApprovalThreshold: number;
    tiers: ApprovalTier[];
  };
  notifications: NotificationRule[];
  sla: SlaConfig;
  customFields: CustomField[];
  meta?: {
    rolledBackFrom?: number;
  };
}
