import { processClaim } from './claim-processor';
import { Tenant } from '../../tenant/entities/tenant.entity';

describe('ClaimProcessor Engine Unit Tests', () => {
  // Setup a mock tenant configuration matching the dynamic engine specs
  const mockTenant: Partial<Tenant> = {
    name: 'SafeGuard Insurance',
    logoUrl: 'https://images.unsplash.com/photo-1599305445671-ac291c95aba9?w=150',
    primaryColor: '#6366f1',
    secondaryColor: '#4f46e5',
    claimTypes: {
      OUTPATIENT: {
        enabled: true,
        requiredDocuments: ['Consultation Receipt', 'Medical Record Summary'],
        optionalDocuments: ['Prescription Details'],
      },
      INPATIENT: {
        enabled: true,
        requiredDocuments: ['Hospitalization Invoice', 'Discharge Certificate'],
        optionalDocuments: ['Specialist Notes'],
      },
      DENTAL: {
        enabled: false,
        requiredDocuments: ['Dental Treatment Record'],
        optionalDocuments: [],
      },
      MATERNITY: {
        enabled: false,
        requiredDocuments: [],
        optionalDocuments: [],
      },
      OPTICAL: {
        enabled: false,
        requiredDocuments: [],
        optionalDocuments: [],
      },
    },
    approvalRules: {
      autoApprovalThreshold: 10000, // 10k VND auto-approval ceiling
      tiers: [
        { minAmount: 0, maxAmount: 10000, role: 'system', autoApprove: true },
        { minAmount: 10001, maxAmount: 500000, role: 'Assessor', autoApprove: false },
        { minAmount: 500001, maxAmount: -1, role: 'Manager', autoApprove: false },
      ],
    },
    notifications: [
      { event: 'claim_submitted', channels: ['email'] },
      { event: 'approved', channels: ['email', 'webhook'] },
      { event: 'rejected', channels: ['email'] },
    ],
    sla: {
      settings: [
        { claimType: 'OUTPATIENT', businessDays: 3 },
        { claimType: 'INPATIENT', businessDays: 7 },
      ],
      escalationEmail: 'compliance@safeguard.com',
    },
    customFields: [
      { name: 'policyNumber', label: 'Policy Number', type: 'string', required: true },
      { name: 'claimReason', label: 'Claim Reason', type: 'string', required: false },
      { name: 'ageOfPatient', label: 'Age of Patient', type: 'number', required: true },
    ],
  };

  describe('1. Claim Type Enablement & Document Mapping', () => {
    it('should fail validation if an disabled claim type is selected', () => {
      const result = processClaim(
        mockTenant as Tenant,
        { claimType: 'DENTAL', amount: 5000, customFieldsData: {} },
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Claim type DENTAL is not enabled for tenant SafeGuard Insurance');
    });

    it('should map required and optional documents correctly for enabled claim type', () => {
      const result = processClaim(
        mockTenant as Tenant,
        { 
          claimType: 'OUTPATIENT', 
          amount: 5000, 
          customFieldsData: { policyNumber: 'POL123', ageOfPatient: 28 } 
        },
      );

      expect(result.success).toBe(true);
      expect(result.requiredDocuments).toEqual(['Consultation Receipt', 'Medical Record Summary']);
      expect(result.optionalDocuments).toEqual(['Prescription Details']);
    });
  });

  describe('2. Custom Fields Schema Validation', () => {
    it('should reject claim if required custom fields are missing', () => {
      const result = processClaim(
        mockTenant as Tenant,
        { claimType: 'OUTPATIENT', amount: 5000, customFieldsData: { claimReason: 'Flu' } },
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Custom field "Policy Number" (policyNumber) is required');
      expect(result.errors).toContain('Custom field "Age of Patient" (ageOfPatient) is required');
    });

    it('should reject claim if custom fields type is mismatched', () => {
      const result = processClaim(
        mockTenant as Tenant,
        { 
          claimType: 'OUTPATIENT', 
          amount: 5000, 
          customFieldsData: { policyNumber: 'POL123', ageOfPatient: 'not-a-number' } 
        },
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Custom field "Age of Patient" must be a number');
    });
  });

  describe('3. Tiered Approval Routing', () => {
    it('should auto-approve claims below the auto-approval threshold', () => {
      const result = processClaim(
        mockTenant as Tenant,
        { 
          claimType: 'OUTPATIENT', 
          amount: 5000, 
          customFieldsData: { policyNumber: 'POL-AUTO', ageOfPatient: 30 } 
        },
      );

      expect(result.success).toBe(true);
      expect(result.approvalRoute).toEqual({
        tier: 'Auto-Approved',
        approverRole: 'system',
        requiresApproval: false,
        autoApproved: true,
      });
    });

    it('should route to Assessor if amount falls inside the middle tier range', () => {
      const result = processClaim(
        mockTenant as Tenant,
        { 
          claimType: 'OUTPATIENT', 
          amount: 150000, 
          customFieldsData: { policyNumber: 'POL-ASSESSOR', ageOfPatient: 30 } 
        },
      );

      expect(result.success).toBe(true);
      expect(result.approvalRoute).toEqual({
        tier: 'Range: 10001 - 500000',
        approverRole: 'Assessor',
        requiresApproval: true,
        autoApproved: false,
      });
    });

    it('should route to Manager if amount exceeds upper limits', () => {
      const result = processClaim(
        mockTenant as Tenant,
        { 
          claimType: 'OUTPATIENT', 
          amount: 750000, 
          customFieldsData: { policyNumber: 'POL-MANAGER', ageOfPatient: 30 } 
        },
      );

      expect(result.success).toBe(true);
      expect(result.approvalRoute).toEqual({
        tier: 'Range: 500001 - unlimited',
        approverRole: 'Manager',
        requiresApproval: true,
        autoApproved: false,
      });
    });
  });

  describe('4. Business Days SLA Calculation', () => {
    it('should calculate SLA deadline excluding weekends (Saturdays and Sundays)', () => {
      const result = processClaim(
        mockTenant as Tenant,
        { 
          claimType: 'OUTPATIENT', 
          amount: 5000, 
          customFieldsData: { policyNumber: 'POL-SLA', ageOfPatient: 30 } 
        },
      );

      expect(result.success).toBe(true);
      expect(result.businessDaysRemaining).toBe(3);
      
      const startDate = new Date();
      const deadlineDate = new Date(result.slaDeadline);

      // Verify that deadlineDate is at least 3 days after startDate
      const timeDiff = deadlineDate.getTime() - startDate.getTime();
      const dayDiff = timeDiff / (1000 * 3600 * 24);
      
      expect(dayDiff).toBeGreaterThanOrEqual(3);
      
      // Let's verify that the deadline date is not a Saturday (6) or Sunday (0)
      const dayOfWeek = deadlineDate.getDay();
      expect(dayOfWeek).not.toBe(0);
      expect(dayOfWeek).not.toBe(6);
    });
  });

  describe('5. Notification Pipeline Triggers', () => {
    it('should trigger correctly configured notifications for claim events', () => {
      const result = processClaim(
        mockTenant as Tenant,
        { 
          claimType: 'OUTPATIENT', 
          amount: 5000, 
          customFieldsData: { policyNumber: 'POL-NOTIF', ageOfPatient: 30 } 
        },
      );

      expect(result.success).toBe(true);
      expect(result.notificationsToSend).toEqual([
        { event: 'claim_submitted', channels: ['email'], templateUsed: 'Default email/sms template for claim_submitted' },
        { event: 'approved', channels: ['email', 'webhook'], templateUsed: 'Default email/sms template for approved' },
      ]);
    });
  });
});
