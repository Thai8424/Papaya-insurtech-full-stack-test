import React, { useState, useEffect } from 'react';
import type { 
  Tenant, 
  ClaimType, 
  ClaimTypeSetting, 
  ApprovalTier, 
  NotificationRule, 
  CustomField,
  NotificationEvent,
  NotificationChannel
} from '@/types';
import apiClient from '@/api/client';
import { 
  Settings, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  PlusCircle, 
  X, 
  Clock, 
  Sliders, 
  Palette, 
  ShieldCheck, 
  Bell 
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';

interface ClaimTypeCardProps {
  type: ClaimType;
  setting: ClaimTypeSetting;
  onToggleEnabled: (checked: boolean) => void;
  onAddDocument: (listType: 'required' | 'optional', docName: string) => void;
  onRemoveDocument: (listType: 'required' | 'optional', idx: number) => void;
}

const ClaimTypeCard: React.FC<ClaimTypeCardProps> = ({
  type,
  setting,
  onToggleEnabled,
  onAddDocument,
  onRemoveDocument
}) => {
  const [newDoc, setNewDoc] = useState('');
  const [newOptDoc, setNewOptDoc] = useState('');

  return (
    <div className={`p-5 rounded-2xl border transition-all ${setting.enabled ? 'bg-white border-rose-100 shadow-sm' : 'bg-slate-50/50 border-slate-100 opacity-60'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Switch
            checked={setting.enabled}
            onCheckedChange={onToggleEnabled}
          />
          <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">{type}</span>
        </div>
      </div>

      {setting.enabled && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-6 border-l border-slate-100 animate-slideDown">
          {/* Required Documents */}
          <div className="space-y-3">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Required Documents</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newDoc}
                onChange={(e) => setNewDoc(e.target.value)}
                placeholder="Add required document (e.g. Receipt)"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none text-[11px]"
              />
              <button
                type="button"
                onClick={() => { onAddDocument('required', newDoc); setNewDoc(''); }}
                className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl active:scale-95 transition-all cursor-pointer bg-white"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {setting.requiredDocuments.map((doc: string, idx: number) => (
                <span key={idx} className="flex items-center gap-1 text-[10px] bg-slate-50 border border-slate-200 text-slate-600 pl-2.5 pr-1 py-0.5 rounded-full font-medium">
                  {doc}
                  <button type="button" onClick={() => onRemoveDocument('required', idx)} className="p-0.5 text-slate-400 hover:text-rose-500 rounded-full cursor-pointer">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Optional Documents */}
          <div className="space-y-3">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Optional Documents</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newOptDoc}
                onChange={(e) => setNewOptDoc(e.target.value)}
                placeholder="Add optional document (e.g. Prescription)"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none text-[11px]"
              />
              <button
                type="button"
                onClick={() => { onAddDocument('optional', newOptDoc); setNewOptDoc(''); }}
                className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl active:scale-95 transition-all cursor-pointer bg-white"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {setting.optionalDocuments.map((doc: string, idx: number) => (
                <span key={idx} className="flex items-center gap-1 text-[10px] bg-slate-50 border border-slate-200 text-slate-600 pl-2.5 pr-1 py-0.5 rounded-full font-medium">
                  {doc}
                  <button type="button" onClick={() => onRemoveDocument('optional', idx)} className="p-0.5 text-slate-400 hover:text-rose-500 rounded-full cursor-pointer">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ConfigEditorProps {
  tenant: Tenant | null;
  onSave: (savedTenant: Tenant) => void;
  onCancel: () => void;
}

export const ConfigEditor: React.FC<ConfigEditorProps> = ({ tenant, onSave, onCancel }) => {
  const [activeTab, setActiveTab] = useState<'branding' | 'types' | 'approvals' | 'notifications' | 'slas' | 'fields'>('branding');

  // Form State
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#E52345');
  const [secondaryColor, setSecondaryColor] = useState('#F43F5E');

  // Claim Types
  const [claimTypes, setClaimTypes] = useState<Record<ClaimType, ClaimTypeSetting>>({
    OUTPATIENT: { enabled: true, requiredDocuments: [], optionalDocuments: [] },
    INPATIENT: { enabled: false, requiredDocuments: [], optionalDocuments: [] },
    DENTAL: { enabled: false, requiredDocuments: [], optionalDocuments: [] },
    MATERNITY: { enabled: false, requiredDocuments: [], optionalDocuments: [] },
    OPTICAL: { enabled: false, requiredDocuments: [], optionalDocuments: [] },
  });

  // Approval Rules
  const [autoApprovalThreshold, setAutoApprovalThreshold] = useState<number>(0);
  const [tiers, setTiers] = useState<ApprovalTier[]>([]);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationRule[]>([]);

  // SLA
  const [escalationEmail, setEscalationEmail] = useState('escalations@insurance.com');
  const [slaDays, setSlaDays] = useState<Record<ClaimType, number>>({
    OUTPATIENT: 5, INPATIENT: 10, DENTAL: 7, MATERNITY: 7, OPTICAL: 7
  });

  // Custom Fields
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  // Validation Errors
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize
  useEffect(() => {
    if (tenant) {
      setName(tenant.name);
      setLogoUrl(tenant.logoUrl);
      setPrimaryColor(tenant.primaryColor);
      setSecondaryColor(tenant.secondaryColor);
      setClaimTypes({ ...tenant.claimTypes });
      setAutoApprovalThreshold(tenant.approvalRules.autoApprovalThreshold);
      setTiers([...(tenant.approvalRules.tiers || [])]);
      setNotifications([...(tenant.notifications || [])]);
      setEscalationEmail(tenant.sla.escalationEmail || 'escalations@insurance.com');
      
      const newSlaDays: Record<ClaimType, number> = { OUTPATIENT: 5, INPATIENT: 10, DENTAL: 7, MATERNITY: 7, OPTICAL: 7 };
      tenant.sla.settings.forEach((s: any) => {
        newSlaDays[s.claimType as ClaimType] = s.businessDays;
      });
      setSlaDays(newSlaDays);
      setCustomFields([...(tenant.customFields || [])]);
      setValidationErrors([]);
    } else {
      // Setup fresh tenant creation template
      setName('');
      setLogoUrl('');
      setPrimaryColor('#E52345');
      setSecondaryColor('#F43F5E');
      setClaimTypes({
        OUTPATIENT: { enabled: true, requiredDocuments: ['Consultation Bill'], optionalDocuments: ['Referral'] },
        INPATIENT: { enabled: false, requiredDocuments: ['Hospital Invoice'], optionalDocuments: [] },
        DENTAL: { enabled: false, requiredDocuments: ['Dental Bill'], optionalDocuments: [] },
        MATERNITY: { enabled: false, requiredDocuments: [], optionalDocuments: [] },
        OPTICAL: { enabled: false, requiredDocuments: [], optionalDocuments: [] },
      });
      setAutoApprovalThreshold(5000);
      setTiers([
        { minAmount: 0, maxAmount: 5000, role: 'system', autoApprove: true },
        { minAmount: 5001, maxAmount: 100000, role: 'Assessor', autoApprove: false },
        { minAmount: 100001, maxAmount: -1, role: 'Manager', autoApprove: false }
      ]);
      setNotifications([
        { event: 'claim_submitted', channels: ['email'] },
        { event: 'approved', channels: ['email'] }
      ]);
      setEscalationEmail('sla-breach@newtenant.com');
      setSlaDays({ OUTPATIENT: 5, INPATIENT: 7, DENTAL: 7, MATERNITY: 10, OPTICAL: 5 });
      setCustomFields([]);
      setValidationErrors([]);
    }
  }, [tenant]);

  // Validations
  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!name.trim()) errors.push('Company/Tenant name is required.');
    
    // Auto-approval validation
    if (autoApprovalThreshold < 0) errors.push('Auto-approval threshold must be positive or equal to 0.');

    // Enabled types check
    const enabledTypes = Object.entries(claimTypes).filter(([_, config]) => config.enabled);
    if (enabledTypes.length === 0) errors.push('At least one claim type must be enabled.');

    // SLA validation
    enabledTypes.forEach(([type, _]) => {
      const days = slaDays[type as ClaimType];
      if (days <= 0) errors.push(`SLA processing days for ${type} must be greater than 0.`);
    });

    // Custom field validation
    const uniqueFields = new Set<string>();
    customFields.forEach(f => {
      if (!f.name.trim() || !f.label.trim()) {
        errors.push('Custom fields name and label cannot be empty.');
      }
      if (uniqueFields.has(f.name.trim())) {
        errors.push(`Custom field name "${f.name}" is defined multiple times.`);
      }
      uniqueFields.add(f.name.trim());
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setLoading(true);

    const formattedSlaSettings = Object.entries(slaDays)
      .filter(([type, _]) => claimTypes[type as ClaimType].enabled)
      .map(([type, days]) => ({
        claimType: type as ClaimType,
        businessDays: Number(days),
      }));

    const payload = {
      name,
      logoUrl,
      primaryColor,
      secondaryColor,
      claimTypes,
      approvalRules: {
        autoApprovalThreshold,
        tiers,
      },
      notifications,
      sla: {
        settings: formattedSlaSettings,
        escalationEmail,
      },
      customFields,
    };

    try {
      if (tenant) {
        const response = await apiClient.patch<Tenant>(`/api/tenants/${tenant.id}`, payload);
        onSave(response.data);
      } else {
        const response = await apiClient.post<Tenant>('/api/tenants', payload);
        onSave(response.data);
      }
    } catch (err: any) {
      console.error('Error saving tenant:', err);
    } finally {
      setLoading(false);
    }
  };

  const addDocument = (type: ClaimType, listType: 'required' | 'optional', docName: string) => {
    if (!docName.trim()) return;
    setClaimTypes(prev => {
      const config = { ...prev[type] };
      const list = listType === 'required' ? [...config.requiredDocuments] : [...config.optionalDocuments];
      if (!list.includes(docName.trim())) {
        list.push(docName.trim());
      }
      if (listType === 'required') {
        config.requiredDocuments = list;
      } else {
        config.optionalDocuments = list;
      }
      return { ...prev, [type]: config };
    });
  };

  const removeDocument = (type: ClaimType, listType: 'required' | 'optional', docIndex: number) => {
    setClaimTypes(prev => {
      const config = { ...prev[type] };
      if (listType === 'required') {
        config.requiredDocuments = config.requiredDocuments.filter((_: string, idx: number) => idx !== docIndex);
      } else {
        config.optionalDocuments = config.optionalDocuments.filter((_: string, idx: number) => idx !== docIndex);
      }
      return { ...prev, [type]: config };
    });
  };

  const addTier = () => {
    setTiers(prev => [
      ...prev,
      { minAmount: 0, maxAmount: -1, role: 'Assessor', autoApprove: false }
    ]);
  };

  const removeTier = (idx: number) => {
    setTiers(prev => prev.filter((_, index) => index !== idx));
  };

  const updateTierField = (idx: number, field: keyof ApprovalTier, value: any) => {
    setTiers(prev => prev.map((t, index) => index === idx ? { ...t, [field]: value } : t));
  };

  const addCustomField = () => {
    setCustomFields(prev => [
      ...prev,
      { name: 'newField', label: 'New Field', type: 'string', required: false }
    ]);
  };

  const removeCustomField = (idx: number) => {
    setCustomFields(prev => prev.filter((_, index) => index !== idx));
  };

  const updateCustomField = (idx: number, field: keyof CustomField, value: any) => {
    setCustomFields(prev => prev.map((f, index) => index === idx ? { ...f, [field]: value } : f));
  };

  return (
    <div className="bg-white border border-slate-200/80 p-6 rounded-2xl animate-fadeIn space-y-6 shadow-md shadow-slate-100/50">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 rounded-xl text-rose-500">
            <Settings size={22} className="animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-800">{tenant ? `Edit Tenant: ${tenant.name}` : 'Onboard New Tenant'}</h2>
            <p className="text-xs text-slate-400">{tenant ? 'Customize rules and properties dynamically.' : 'Fill out the details to spawn a 4th insurer.'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-5 py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 disabled:from-slate-200 disabled:to-slate-300 text-white font-extrabold text-xs rounded-xl shadow-md border border-rose-400/20 active:scale-95 transition-all cursor-pointer"
          >
            {loading ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* Validation Errors Header */}
      {validationErrors.length > 0 && (
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-xs text-rose-600 space-y-1.5 flex gap-3">
          <AlertTriangle size={18} className="text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold text-rose-800">Validation errors found:</span>
            <ul className="list-disc pl-4 mt-1 space-y-0.5 font-medium">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Editor Tabs Navigation */}
      <div className="flex border-b border-slate-100 overflow-x-auto no-scrollbar gap-1 pt-1">
        {[
          { id: 'branding', label: 'Branding', icon: Palette },
          { id: 'types', label: 'Claim Types', icon: Sliders },
          { id: 'approvals', label: 'Approvals', icon: ShieldCheck },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'slas', label: 'SLAs', icon: Clock },
          { id: 'fields', label: 'Custom Fields', icon: PlusCircle }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${activeTab === tab.id ? 'border-rose-500 text-rose-500' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {/* BRANDING TAB */}
        {activeTab === 'branding' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Company / Tenant Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Skyline Assurance"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Logo Image URL</label>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Primary Color</label>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-7 h-7 rounded border border-slate-200 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-full bg-transparent border-none text-slate-700 focus:outline-none text-[10px] font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Secondary Color</label>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-7 h-7 rounded border border-slate-200 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-full bg-transparent border-none text-slate-700 focus:outline-none text-[10px] font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Preview */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col items-center justify-center space-y-4">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Visual Branding Preview</h4>
              <div
                className="w-full max-w-sm p-6 rounded-2xl border text-center bg-white transition-all space-y-4 shadow-md"
                style={{
                  borderColor: primaryColor + '30',
                  boxShadow: `0 10px 20px -5px ${primaryColor}10`,
                }}
              >
                <div className="flex justify-center">
                  <div
                    className="w-16 h-16 rounded-2xl border flex items-center justify-center text-white font-bold bg-gradient-to-br overflow-hidden shadow-sm"
                    style={{ 
                      borderColor: primaryColor + '40',
                      backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` 
                    }}
                  >
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      name.substring(0, 2).toUpperCase() || 'P'
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">{name || 'Insurtech Tenant'}</h3>
                  <p className="text-xs text-slate-400 mt-1">Multi-tenant Claims System Dashboard</p>
                </div>

                <div className="pt-2">
                  <button
                    className="w-full py-2 text-white font-extrabold text-xs rounded-xl shadow-md border transition-all"
                    style={{
                      backgroundColor: primaryColor,
                      borderColor: secondaryColor,
                      boxShadow: `0 4px 10px ${primaryColor}20`,
                    }}
                  >
                    Dynamic Submission Portal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CLAIM TYPES TAB */}
        {activeTab === 'types' && (
          <div className="space-y-6">
            {(['OUTPATIENT', 'INPATIENT', 'DENTAL', 'MATERNITY', 'OPTICAL'] as ClaimType[]).map(type => {
              const setting = claimTypes[type];

              return (
                <ClaimTypeCard
                  key={type}
                  type={type}
                  setting={setting}
                  onToggleEnabled={(checked) => {
                    setClaimTypes(prev => ({
                      ...prev,
                      [type]: { ...prev[type], enabled: checked }
                    }));
                  }}
                  onAddDocument={(listType, docName) => addDocument(type, listType, docName)}
                  onRemoveDocument={(listType, idx) => removeDocument(type, listType, idx)}
                />
              );
            })}
          </div>
        )}

        {/* APPROVALS TAB */}
        {activeTab === 'approvals' && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Auto-Approval Threshold amount (VND)</label>
              <input
                type="number"
                value={autoApprovalThreshold}
                onChange={(e) => setAutoApprovalThreshold(Number(e.target.value))}
                className="w-full max-w-md bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all text-xs"
              />
              <p className="text-[10px] text-slate-400 mt-1">Claims under or equal to this amount are approved automatically by the system.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Manual Review Tiers</label>
                <button
                  onClick={addTier}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs active:scale-95 transition-all cursor-pointer"
                >
                  <Plus size={14} /> Add Tier
                </button>
              </div>

              {tiers.length === 0 ? (
                <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-slate-200 border-dashed text-xs font-medium">
                  No manual approval tiers configured. All claims above threshold will fall to default assessor.
                </div>
              ) : (
                <div className="space-y-3">
                  {tiers.map((tier, idx) => (
                    <div key={idx} className="grid grid-cols-4 gap-4 p-4 bg-white border border-slate-200 rounded-xl items-center animate-slideDown shadow-sm">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Min Amount (VND)</label>
                        <input
                          type="number"
                          value={tier.minAmount}
                          onChange={(e) => updateTierField(idx, 'minAmount', Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none text-[11px]"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Max Amount (-1 for Unlimited)</label>
                        <input
                          type="number"
                          value={tier.maxAmount}
                          onChange={(e) => updateTierField(idx, 'maxAmount', Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Approver Role</label>
                        <Select
                          value={tier.role}
                          onValueChange={(val) => updateTierField(idx, 'role', val)}
                        >
                          <SelectTrigger className="w-full bg-white border border-slate-200 rounded-lg text-xs h-9">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Assessor">Assessor</SelectItem>
                            <SelectItem value="Team Lead">Team Lead</SelectItem>
                            <SelectItem value="Manager">Manager</SelectItem>
                            <SelectItem value="Director">Director</SelectItem>
                            <SelectItem value="Committee">Committee</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex justify-end pt-5">
                        <button
                          onClick={() => removeTier(idx)}
                          className="p-2 border border-slate-200 hover:border-rose-100 hover:text-rose-500 bg-white hover:bg-slate-50 rounded-lg active:scale-95 transition-all text-slate-400 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            {(['claim_submitted', 'approved', 'rejected', 'payment_sent'] as NotificationEvent[]).map(event => {
              const rule = notifications.find(n => n.event === event);
              const isEnabled = !!rule;

              const toggleNotification = (checked: boolean) => {
                if (checked) {
                  setNotifications(prev => [...prev, { event, channels: ['email'], customTemplate: '' }]);
                } else {
                  setNotifications(prev => prev.filter(n => n.event !== event));
                }
              };

              const updateChannels = (channel: NotificationChannel, checked: boolean) => {
                setNotifications(prev => prev.map(n => {
                  if (n.event === event) {
                    const channels = checked
                      ? [...n.channels, channel]
                      : n.channels.filter((c: NotificationChannel) => c !== channel);
                    return { ...n, channels };
                  }
                  return n;
                }));
              };

              const updateTemplate = (val: string) => {
                setNotifications(prev => prev.map(n => n.event === event ? { ...n, customTemplate: val } : n));
              };

              return (
                <div key={event} className={`p-5 rounded-2xl border transition-all ${isEnabled ? 'bg-white border-rose-100 shadow-sm' : 'bg-slate-50/50 border-slate-100 opacity-60'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => toggleNotification(checked)}
                      />
                      <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">{event.replace('_', ' ')}</span>
                    </div>
                  </div>

                  {isEnabled && rule && (
                    <div className="space-y-4 pl-6 border-l border-slate-100 animate-slideDown">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Active Channels</label>
                        <div className="flex gap-6 pt-1">
                          {(['email', 'SMS', 'webhook'] as NotificationChannel[]).map(channel => (
                            <div key={channel} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${event}-${channel}`}
                                checked={rule.channels.includes(channel)}
                                onCheckedChange={(checked) => updateChannels(channel, !!checked)}
                              />
                              <label
                                htmlFor={`${event}-${channel}`}
                                className="text-xs font-bold leading-none text-slate-600 cursor-pointer"
                              >
                                {channel}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Custom Notification / Email Template</label>
                        <textarea
                          value={rule.customTemplate || ''}
                          onChange={(e) => updateTemplate(e.target.value)}
                          placeholder="e.g. Hello, your claim of {amount} has been approved."
                          rows={3}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* SLAs TAB */}
        {activeTab === 'slas' && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Escalation Alert Email</label>
              <input
                type="email"
                value={escalationEmail}
                onChange={(e) => setEscalationEmail(e.target.value)}
                placeholder="compliance@insurer.com"
                className="w-full max-w-md bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all text-xs"
              />
              <p className="text-[10px] text-slate-400 mt-1">If SLA processing time limit is breached, this address receives automated breach escalation notifications.</p>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Processing Days (Business Days) per Claim Type</label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['OUTPATIENT', 'INPATIENT', 'DENTAL', 'MATERNITY', 'OPTICAL'] as ClaimType[]).map(type => {
                  const isEnabled = claimTypes[type].enabled;
                  if (!isEnabled) return null;

                  return (
                    <div key={type} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600">{type}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={slaDays[type]}
                          onChange={(e) => setSlaDays(prev => ({ ...prev, [type]: Number(e.target.value) }))}
                          className="w-20 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 text-center text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        />
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Days</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* CUSTOM FIELDS TAB */}
        {activeTab === 'fields' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Dynamic Claim Form Fields</h3>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">Define custom schema variables that applicants must provide during claim submission.</p>
              </div>
              <button
                onClick={addCustomField}
                className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs active:scale-95 transition-all cursor-pointer"
              >
                <Plus size={14} /> Add Field
              </button>
            </div>

            {customFields.length === 0 ? (
              <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-slate-200 border-dashed text-xs font-medium">
                No custom fields required. Standard claim submissions only.
              </div>
            ) : (
              <div className="space-y-3 animate-slideDown">
                {customFields.map((field, idx) => (
                  <div key={idx} className="grid grid-cols-4 gap-4 p-4 bg-white border border-slate-200 rounded-xl items-center shadow-sm">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Field Key (JSON ID)</label>
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => updateCustomField(idx, 'name', e.target.value)}
                        placeholder="e.g. employeeId"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none text-[11px]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Field Label (UI Text)</label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateCustomField(idx, 'label', e.target.value)}
                        placeholder="e.g. Employee ID"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none text-[11px]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Data Type</label>
                      <Select
                        value={field.type}
                        onValueChange={(val) => updateCustomField(idx, 'type', val)}
                      >
                        <SelectTrigger className="w-full bg-white border border-slate-200 rounded-lg text-xs h-9">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="string">String (Text)</SelectItem>
                          <SelectItem value="number">Number (Decimal)</SelectItem>
                          <SelectItem value="boolean">Boolean (Yes/No)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-between items-center pt-5 pl-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase">Required</span>
                        <Switch
                          checked={field.required}
                          onCheckedChange={(checked) => updateCustomField(idx, 'required', checked)}
                        />
                      </div>
                      
                      <button
                        onClick={() => removeCustomField(idx)}
                        className="p-2 border border-slate-200 hover:border-rose-100 hover:text-rose-500 bg-white hover:bg-slate-50 rounded-lg active:scale-95 transition-all text-slate-400 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
