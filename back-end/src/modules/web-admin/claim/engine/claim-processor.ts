import { Tenant } from '../../tenant/entities/tenant.entity';
import { ClaimType } from '../../tenant/interfaces/tenant-config.interface';

export interface ProcessClaimDto {
  claimType: string;
  amount: number;
  customFieldsData: Record<string, any>;
  submissionDate?: string; // ISO string, defaults to today
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
  slaDeadline: string; // ISO string
  businessDaysRemaining: number;
}

export function processClaim(tenant: Tenant, data: ProcessClaimDto): ProcessClaimResult {
  const errors: string[] = [];
  const claimType = data.claimType as ClaimType;
  const amount = Number(data.amount) || 0;
  const customFieldsData = data.customFieldsData || {};
  const submissionDate = data.submissionDate ? new Date(data.submissionDate) : new Date();

  // 1. Check if Claim Type is enabled
  const typeSetting = tenant.claimTypes[claimType];
  if (!typeSetting || !typeSetting.enabled) {
    return {
      success: false,
      errors: [`Claim type ${claimType} is not enabled for tenant ${tenant.name}`],
      requiredDocuments: [],
      optionalDocuments: [],
      approvalRoute: { tier: 'N/A', approverRole: 'N/A', requiresApproval: false, autoApproved: false },
      notificationsToSend: [],
      slaDeadline: new Date().toISOString(),
      businessDaysRemaining: 0,
    };
  }

  // 2. Validate Custom Fields
  const tenantFields = tenant.customFields || [];
  for (const field of tenantFields) {
    const value = customFieldsData[field.name];

    if (field.required) {
      if (value === undefined || value === null || value === '') {
        errors.push(`Custom field "${field.label}" (${field.name}) is required`);
        continue;
      }
    }

    if (value !== undefined && value !== null && value !== '') {
      if (field.type === 'number') {
        const numVal = Number(value);
        if (isNaN(numVal)) {
          errors.push(`Custom field "${field.label}" must be a number`);
        }
      } else if (field.type === 'boolean') {
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
          errors.push(`Custom field "${field.label}" must be a boolean`);
        }
      }
    }
  }

  if (errors.length > 0) {
    return {
      success: false,
      errors,
      requiredDocuments: typeSetting.requiredDocuments || [],
      optionalDocuments: typeSetting.optionalDocuments || [],
      approvalRoute: { tier: 'N/A', approverRole: 'N/A', requiresApproval: false, autoApproved: false },
      notificationsToSend: [],
      slaDeadline: new Date().toISOString(),
      businessDaysRemaining: 0,
    };
  }

  // 3. Resolve Documents
  const requiredDocuments = typeSetting.requiredDocuments || [];
  const optionalDocuments = typeSetting.optionalDocuments || [];

  // 4. Resolve Approval Routing
  let requiresApproval = true;
  let autoApproved = false;
  let approverRole = 'Assessor';
  let tierName = 'Standard Review';

  const rules = tenant.approvalRules;
  if (amount <= rules.autoApprovalThreshold) {
    requiresApproval = false;
    autoApproved = true;
    approverRole = 'system';
    tierName = 'Auto-Approved';
  } else {
    // Find the correct manual tier
    const sortedTiers = [...(rules.tiers || [])].sort((a, b) => a.minAmount - b.minAmount);
    const matchingTier = sortedTiers.find(tier => {
      const minMatch = amount >= tier.minAmount;
      const maxMatch = tier.maxAmount === -1 || amount <= tier.maxAmount;
      return minMatch && maxMatch && !tier.autoApprove;
    });

    if (matchingTier) {
      requiresApproval = true;
      autoApproved = false;
      approverRole = matchingTier.role;
      tierName = `Range: ${matchingTier.minAmount} - ${matchingTier.maxAmount === -1 ? 'unlimited' : matchingTier.maxAmount}`;
    } else {
      // Default to highest tier role or just Director/Assessor
      requiresApproval = true;
      autoApproved = false;
      approverRole = sortedTiers.length > 0 ? sortedTiers[sortedTiers.length - 1].role : 'Manager';
      tierName = 'Fallback Review Tier';
    }
  }

  const approvalRoute = {
    tier: tierName,
    approverRole,
    requiresApproval,
    autoApproved,
  };

  // 5. Calculate SLA
  const slaSettings = tenant.sla?.settings || [];
  const typeSla = slaSettings.find(s => s.claimType === claimType);
  const slaDays = typeSla ? typeSla.businessDays : 5; // Default 5 business days SLA
  const deadlineDate = addBusinessDays(submissionDate, slaDays);

  // 6. Map Notifications to send
  const notificationsToSend: Array<{ event: string; channels: string[]; templateUsed: string }> = [];

  // Trigger claim_submitted notification
  const submitRule = (tenant.notifications || []).find(n => n.event === 'claim_submitted');
  if (submitRule) {
    notificationsToSend.push({
      event: 'claim_submitted',
      channels: submitRule.channels,
      templateUsed: submitRule.customTemplate || `Default email/sms template for claim_submitted`,
    });
  }

  // If auto-approved, also trigger approved & payment_sent notifications immediately
  if (autoApproved) {
    const approvedRule = (tenant.notifications || []).find(n => n.event === 'approved');
    if (approvedRule) {
      notificationsToSend.push({
        event: 'approved',
        channels: approvedRule.channels,
        templateUsed: approvedRule.customTemplate || `Default email/sms template for approved`,
      });
    }

    const paymentRule = (tenant.notifications || []).find(n => n.event === 'payment_sent');
    if (paymentRule) {
      notificationsToSend.push({
        event: 'payment_sent',
        channels: paymentRule.channels,
        templateUsed: paymentRule.customTemplate || `Default email/sms template for payment_sent`,
      });
    }
  }

  return {
    success: true,
    requiredDocuments,
    optionalDocuments,
    approvalRoute,
    notificationsToSend,
    slaDeadline: deadlineDate.toISOString(),
    businessDaysRemaining: slaDays,
  };
}

// Utility helper to add business days (excluding Saturday and Sunday)
function addBusinessDays(startDate: Date, days: number): Date {
  const date = new Date(startDate.getTime());
  let addedDays = 0;
  while (addedDays < days) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) { // Not Sunday (0) and not Saturday (6)
      addedDays++;
    }
  }
  return date;
}
