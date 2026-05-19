import React, { useState } from 'react';
import type { Tenant } from '@/types';
import { Layers } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TenantLogo } from '@/components/ui/tenant-logo';

interface ConfigDiffProps {
  tenants: Tenant[];
}

export const ConfigDiff: React.FC<ConfigDiffProps> = ({ tenants }) => {
  const [tenantId1, setTenantId1] = useState<string>('');
  const [tenantId2, setTenantId2] = useState<string>('');

  const tenant1 = tenants.find(t => t.id === tenantId1);
  const tenant2 = tenants.find(t => t.id === tenantId2);

  const getDiffClass = (val1: any, val2: any) => {
    const string1 = JSON.stringify(val1);
    const string2 = JSON.stringify(val2);
    return string1 !== string2 ? 'bg-amber-50 text-amber-700 border-amber-200 font-extrabold shadow-sm' : 'border-slate-100 text-slate-600 font-semibold';
  };

  const renderClaimTypesDiff = () => {
    if (!tenant1 || !tenant2) return null;
    const types: ('OUTPATIENT' | 'INPATIENT' | 'DENTAL' | 'MATERNITY' | 'OPTICAL')[] = [
      'OUTPATIENT', 'INPATIENT', 'DENTAL', 'MATERNITY', 'OPTICAL'
    ];

    return (
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Claim Types & Documents</h4>
        <div className="grid grid-cols-2 gap-6">
          {/* Tenant 1 */}
          <div className="space-y-3 p-4 bg-slate-50/50 rounded-xl border border-slate-200/60">
            <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">{tenant1.name}</h5>
            {types.map(t => {
              const config = tenant1.claimTypes[t];
              return (
                <div key={t} className={`p-3 rounded-lg border transition-all ${config?.enabled ? 'bg-white border-rose-100 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-extrabold text-xs text-slate-700">{t}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${config?.enabled ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400'}`}>
                      {config?.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  {config?.enabled && (
                    <div className="text-[10px] text-slate-500 space-y-1 mt-2 font-medium">
                      <div><strong className="text-slate-700">Req:</strong> {config.requiredDocuments.join(', ') || 'None'}</div>
                      <div><strong className="text-slate-700">Opt:</strong> {config.optionalDocuments.join(', ') || 'None'}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tenant 2 */}
          <div className="space-y-3 p-4 bg-slate-50/50 rounded-xl border border-slate-200/60">
            <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">{tenant2.name}</h5>
            {types.map(t => {
              const config = tenant2.claimTypes[t];
              const otherConfig = tenant1.claimTypes[t];
              const isDifferent = JSON.stringify(config) !== JSON.stringify(otherConfig);
              return (
                <div key={t} className={`p-3 rounded-lg border transition-all ${isDifferent ? 'ring-1 ring-amber-400 bg-amber-50/20' : ''} ${config?.enabled ? 'bg-white border-rose-100 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-extrabold text-xs text-slate-700">{t}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${config?.enabled ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400'}`}>
                      {config?.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  {config?.enabled && (
                    <div className="text-[10px] text-slate-500 space-y-1 mt-2 font-medium">
                      <div><strong className="text-slate-700">Req:</strong> {config.requiredDocuments.join(', ') || 'None'}</div>
                      <div><strong className="text-slate-700">Opt:</strong> {config.optionalDocuments.join(', ') || 'None'}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-rose-50 rounded-xl text-rose-500">
            <Layers size={22} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-800">Compare Tenant Configurations</h2>
            <p className="text-xs text-slate-400">Select two tenants side-by-side to highlight difference vectors instantly.</p>
          </div>
        </div>

        {/* Tenant Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200/60 mb-6">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tenant A</label>
            <Select
              value={tenantId1}
              onValueChange={(val) => setTenantId1(val)}
            >
              <SelectTrigger className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 h-11 text-xs font-semibold">
                <SelectValue placeholder="-- Select Tenant A --" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map(t => (
                  <SelectItem key={t.id} value={t.id} disabled={t.id === tenantId2}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tenant B</label>
            <Select
              value={tenantId2}
              onValueChange={(val) => setTenantId2(val)}
            >
              <SelectTrigger className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 h-11 text-xs font-semibold">
                <SelectValue placeholder="-- Select Tenant B --" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map(t => (
                  <SelectItem key={t.id} value={t.id} disabled={t.id === tenantId1}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!tenant1 || !tenant2 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <Layers size={44} className="mb-3 text-slate-300 animate-pulse" />
            <p className="text-xs font-bold text-slate-500">Select two different tenants from the drop-downs above to begin comparison.</p>
          </div>
        ) : (
          <div className="space-y-8 animate-fadeIn">
            {/* 1. Branding & Color Comparison */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Branding & Identity</h4>
              <div className="grid grid-cols-2 gap-6">
                {/* Tenant 1 Card */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50/50 border border-slate-200/60 shadow-sm">
                  <TenantLogo 
                    src={tenant1.logoUrl} 
                    name={tenant1.name} 
                    className="w-12 h-12"
                  />
                  <div>
                    <h3 className="font-extrabold text-slate-850 text-sm leading-snug">{tenant1.name}</h3>
                    <div className="flex items-center gap-3 mt-1.5 font-bold">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <span className="w-3 h-3 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: tenant1.primaryColor }}></span>
                        <span>Primary</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <span className="w-3 h-3 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: tenant1.secondaryColor }}></span>
                        <span>Secondary</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tenant 2 Card */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50/50 border border-slate-200/60 shadow-sm">
                  <TenantLogo 
                    src={tenant2.logoUrl} 
                    name={tenant2.name} 
                    className="w-12 h-12"
                  />
                  <div>
                    <h3 className="font-extrabold text-slate-850 text-sm leading-snug">{tenant2.name}</h3>
                    <div className="flex items-center gap-3 mt-1.5 font-bold">
                      <div className={`flex items-center gap-1.5 text-[10px] px-1.5 py-0.5 rounded border ${getDiffClass(tenant1.primaryColor, tenant2.primaryColor)}`}>
                        <span className="w-3 h-3 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: tenant2.primaryColor }}></span>
                        <span>Primary</span>
                      </div>
                      <div className={`flex items-center gap-1.5 text-[10px] px-1.5 py-0.5 rounded border ${getDiffClass(tenant1.secondaryColor, tenant2.secondaryColor)}`}>
                        <span className="w-3 h-3 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: tenant2.secondaryColor }}></span>
                        <span>Secondary</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Claim Types Section */}
            {renderClaimTypesDiff()}

            {/* 3. Approval Tiers Comparison */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Approval Rules & Tiers</h4>
              <div className="grid grid-cols-2 gap-6">
                {/* Tenant 1 Approval Tiers */}
                <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/60 space-y-3 shadow-sm">
                  <div className="flex justify-between items-center border-b border-slate-200/60 pb-2 mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Auto-Approval Threshold:</span>
                    <span className="text-xs font-extrabold text-emerald-600">{tenant1.approvalRules.autoApprovalThreshold.toLocaleString()} VND</span>
                  </div>
                  {tenant1.approvalRules.tiers.length === 0 ? (
                    <div className="text-[10px] text-slate-400 italic">No manual approval tiers configured.</div>
                  ) : (
                    tenant1.approvalRules.tiers.map((tier: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-2.5 bg-white border border-slate-100 rounded-lg text-[11px] font-medium shadow-sm">
                        <span className="text-slate-500">
                          {tier.minAmount.toLocaleString()} - {tier.maxAmount === -1 ? 'unlimited' : tier.maxAmount.toLocaleString()}
                        </span>
                        <span className="font-bold text-rose-500 px-2 py-0.5 bg-rose-50 border border-rose-100 rounded">
                          {tier.role}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Tenant 2 Approval Tiers */}
                <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/60 space-y-3 shadow-sm">
                  <div className={`flex justify-between items-center border-b border-slate-200/60 pb-2 mb-2 px-1.5 py-0.5 rounded border ${getDiffClass(tenant1.approvalRules.autoApprovalThreshold, tenant2.approvalRules.autoApprovalThreshold)}`}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Auto-Approval Threshold:</span>
                    <span className="text-xs font-extrabold text-emerald-600">{tenant2.approvalRules.autoApprovalThreshold.toLocaleString()} VND</span>
                  </div>
                  {tenant2.approvalRules.tiers.length === 0 ? (
                    <div className="text-[10px] text-slate-400 italic">No manual approval tiers configured.</div>
                  ) : (
                    tenant2.approvalRules.tiers.map((tier: any, idx: number) => {
                      const matchedOther = tenant1.approvalRules.tiers.find((t: any) => t.role === tier.role);
                      const isDifferent = !matchedOther || matchedOther.minAmount !== tier.minAmount || matchedOther.maxAmount !== tier.maxAmount;
                      return (
                        <div key={idx} className={`flex justify-between items-center p-2.5 bg-white rounded-lg text-[11px] font-medium shadow-sm border ${isDifferent ? 'border-amber-250 bg-amber-50/30 text-amber-700 ring-1 ring-amber-400/10' : 'border-slate-100'}`}>
                          <span className="text-slate-500">
                            {tier.minAmount.toLocaleString()} - {tier.maxAmount === -1 ? 'unlimited' : tier.maxAmount.toLocaleString()}
                          </span>
                          <span className="font-bold text-rose-500 px-2 py-0.5 bg-rose-50 border border-rose-100 rounded">
                            {tier.role}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* 4. SLA Comparison */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">SLA Processing Deadlines</h4>
              <div className="grid grid-cols-2 gap-6">
                {/* Tenant A SLA */}
                <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/60 space-y-2 shadow-sm">
                  <div className="text-[10px] text-slate-400 font-bold uppercase mb-2 border-b border-slate-200/60 pb-1.5 truncate">
                    <strong>Escalation Contact:</strong> {tenant1.sla.escalationEmail}
                  </div>
                  {tenant1.sla.settings.map((s: any) => (
                    <div key={s.claimType} className="flex justify-between items-center text-[11px] p-2 bg-white border border-slate-100 rounded-lg font-medium shadow-sm">
                      <span className="text-slate-500">{s.claimType}</span>
                      <span className="font-extrabold text-slate-700">{s.businessDays} business days</span>
                    </div>
                  ))}
                </div>

                {/* Tenant B SLA */}
                <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/60 space-y-2 shadow-sm">
                  <div className={`text-[10px] text-slate-400 font-bold uppercase mb-2 border-b border-slate-200/60 pb-1.5 px-1.5 py-0.5 rounded border truncate ${getDiffClass(tenant1.sla.escalationEmail, tenant2.sla.escalationEmail)}`}>
                    <strong>Escalation Contact:</strong> {tenant2.sla.escalationEmail}
                  </div>
                  {tenant2.sla.settings.map((s: any) => {
                    const otherSla = tenant1.sla.settings.find((os: any) => os.claimType === s.claimType);
                    const isDifferent = !otherSla || otherSla.businessDays !== s.businessDays;
                    return (
                      <div key={s.claimType} className={`flex justify-between items-center text-[11px] p-2 bg-white rounded-lg border font-medium shadow-sm ${isDifferent ? 'border-amber-250 bg-amber-50/30 text-amber-700' : 'border-slate-100'}`}>
                        <span className="text-slate-500">{s.claimType}</span>
                        <span className="font-extrabold text-slate-700">{s.businessDays} business days</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 5. Custom Fields */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Custom Schema Fields</h4>
              <div className="grid grid-cols-2 gap-6">
                {/* Tenant 1 Custom Fields */}
                <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/60 space-y-2 shadow-sm">
                  {tenant1.customFields.length === 0 ? (
                    <span className="text-slate-400 text-xs italic font-medium">No custom fields required.</span>
                  ) : (
                    tenant1.customFields.map((field: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-[11px] p-2 bg-white border border-slate-100 rounded-lg font-medium shadow-sm">
                        <span className="font-bold text-slate-700">{field.label} ({field.name})</span>
                        <span className="text-[10px] text-slate-400 px-1.5 py-0.5 bg-slate-50 rounded font-bold border border-slate-100">
                          {field.type} {field.required ? '• Required' : ''}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Tenant 2 Custom Fields */}
                <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/60 space-y-2 shadow-sm">
                  {tenant2.customFields.length === 0 ? (
                    <span className="text-slate-400 text-xs italic font-medium">No custom fields required.</span>
                  ) : (
                    tenant2.customFields.map((field: any, idx: number) => {
                      const otherField = tenant1.customFields.find((f: any) => f.name === field.name);
                      const isDifferent = !otherField || otherField.required !== field.required || otherField.type !== field.type;
                      return (
                        <div key={idx} className={`flex justify-between items-center text-[11px] p-2 bg-white rounded-lg border font-medium shadow-sm ${isDifferent ? 'border-amber-250 bg-amber-50/30 text-amber-700 ring-1 ring-amber-400/10' : 'border-slate-100'}`}>
                          <span className="font-bold text-slate-700">{field.label} ({field.name})</span>
                          <span className="text-[10px] text-slate-400 px-1.5 py-0.5 bg-slate-50 rounded font-bold border border-slate-100">
                            {field.type} {field.required ? '• Required' : ''}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
