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
  maxAmount: number;
  role: string;
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

export interface Tenant {
  id: string;
  name: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  claimTypes: ClaimTypeConfig;
  approvalRules: {
    autoApprovalThreshold: number;
    tiers: ApprovalTier[];
  };
  notifications: NotificationRule[];
  sla: SlaConfig;
  customFields: CustomField[];
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface TenantVersion {
  id: number;
  tenantId: string;
  version: number;
  config: TenantConfig;
  createdAt: string;
}

export interface Claim {
  id: string;
  tenantId: string;
  claimType: string;
  amount: number;
  customFieldsData: Record<string, any>;
  status: string;
  approvalRoute: {
    tier: string;
    approverRole: string;
    requiresApproval: boolean;
    autoApproved: boolean;
  };
  notificationsSent: Array<{
    event: string;
    channels: string[];
    templateUsed: string;
  }>;
  slaDeadline: string;
  businessDaysRemaining: number;
  createdAt: string;
}

export interface ProcessClaimResult {
  success: boolean;
  errors?: string[];
  requiredDocuments: string[];
  optionalDocuments: string[];
  approvalRoute: {
    tier: string;
    approverRole: string;
    requiresApproval: boolean;
    autoApproved: boolean;
  };
  notificationsToSend: Array<{
    event: string;
    channels: string[];
    templateUsed: string;
  }>;
  slaDeadline: string;
  businessDaysRemaining: number;
}
