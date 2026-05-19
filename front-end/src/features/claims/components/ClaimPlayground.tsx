import React, { useState, useEffect } from 'react';
import type { Tenant, Claim, ProcessClaimResult } from '@/types';
import apiClient from '@/api/client';
import { 
  Play, 
  Check, 
  X, 
  FileText, 
  Mail, 
  Shield, 
  AlertCircle, 
  Clock, 
  Loader2, 
  ArrowRight,
  Inbox
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TenantLogo } from '@/components/ui/tenant-logo';

interface ClaimPlaygroundProps {
  tenants: Tenant[];
}

export const ClaimPlayground: React.FC<ClaimPlaygroundProps> = ({ tenants }) => {
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const tenant = tenants.find(t => t.id === selectedTenantId) || null;

  // Form inputs
  const [claimType, setClaimType] = useState<string>('OUTPATIENT');
  const [amount, setAmount] = useState<number>(10000);
  const [customFieldsData, setCustomFieldsData] = useState<Record<string, any>>({});
  
  // Real-time Preview Result
  const [preview, setPreview] = useState<ProcessClaimResult | null>(null);
  const [previewErrors, setPreviewErrors] = useState<string[]>([]);
  
  // Claims Database log
  const [claimsLog, setClaimsLog] = useState<Claim[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Initialize form default fields when tenant changes
  useEffect(() => {
    if (tenant) {
      // Find first enabled type
      const enabledTypes = (Object.entries(tenant.claimTypes) as [any, any][])
        .filter(([_, config]) => config.enabled)
        .map(([type, _]) => type);
      
      if (enabledTypes.length > 0) {
        setClaimType(enabledTypes[0]);
      } else {
        setClaimType('OUTPATIENT');
      }

      // Initialize empty custom fields
      const fields: Record<string, any> = {};
      tenant.customFields.forEach((f: any) => {
        fields[f.name] = f.type === 'boolean' ? false : f.type === 'number' ? 0 : '';
      });
      setCustomFieldsData(fields);
      setPreviewErrors([]);
      fetchTenantClaims(tenant.id);
    } else {
      setPreview(null);
    }
  }, [selectedTenantId]);

  // Run on-the-fly preview processing as form state changes!
  useEffect(() => {
    if (!tenant) return;

    const runPreview = async () => {
      try {
        const response = await apiClient.post<ProcessClaimResult>(`/api/claims/process/${tenant.id}`, {
          claimType,
          amount,
          customFieldsData,
        });

        if (response.data.success) {
          setPreview(response.data);
          setPreviewErrors([]);
        } else {
          setPreview(null);
          setPreviewErrors(response.data.errors || []);
        }
      } catch (err: any) {
        console.error('Error running claim preview:', err);
        if (err.response?.data?.errors) {
          setPreviewErrors(err.response.data.errors);
        } else {
          setPreviewErrors(['Invalid fields format']);
        }
        setPreview(null);
      }
    };

    const debounceTimer = setTimeout(runPreview, 250); // Debounce to prevent rapid network calls
    return () => clearTimeout(debounceTimer);
  }, [claimType, amount, customFieldsData, tenant]);

  const fetchTenantClaims = async (tenantId: string) => {
    setLoadingClaims(true);
    try {
      const response = await apiClient.get<Claim[]>(`/api/claims/tenant/${tenantId}`);
      setClaimsLog(response.data);
    } catch (err) {
      console.error('Error fetching tenant claims:', err);
    } finally {
      setLoadingClaims(false);
    }
  };

  const handleCustomFieldChange = (name: string, value: any, type: string) => {
    setCustomFieldsData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    setSubmitting(true);
    try {
      await apiClient.post<{ claim: Claim; metadata: ProcessClaimResult }>(`/api/claims/submit/${tenant.id}`, {
        claimType,
        amount,
        customFieldsData,
      });
      
      // Clear form amount/custom fields and reload claims log
      setAmount(10000);
      const clearedFields: Record<string, any> = {};
      tenant.customFields.forEach((f: any) => {
        clearedFields[f.name] = f.type === 'boolean' ? false : f.type === 'number' ? 0 : '';
      });
      setCustomFieldsData(clearedFields);
      
      // Fetch fresh logs
      await fetchTenantClaims(tenant.id);
    } catch (err: any) {
      console.error('Error submitting claim:', err);
      const errors = err.response?.data?.errors || [err.response?.data?.message || 'Submission failed'];
      setPreviewErrors(errors);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (claimId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await apiClient.patch(`/api/claims/${claimId}/status`, { status });
      if (tenant) {
        await fetchTenantClaims(tenant.id);
      }
    } catch (err) {
      console.error('Error updating claim status:', err);
    }
  };

  const formatSlaDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-8">
      {/* Selector banner */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 rounded-xl text-rose-500">
              <Play size={22} className="fill-rose-500/10" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">Claims Engine Playground</h2>
              <p className="text-xs text-slate-400">Select a tenant insurer and simulate claim submissions instantly.</p>
            </div>
          </div>

          <div className="w-full sm:w-64">
            <Select
              value={selectedTenantId}
              onValueChange={(val) => setSelectedTenantId(val)}
            >
              <SelectTrigger className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 h-11 text-xs font-semibold">
                <SelectValue placeholder="-- Choose Tenant Insurer --" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {!tenant ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/80">
          <Play size={44} className="mb-4 text-slate-300 animate-pulse" />
          <p className="text-xs font-bold text-slate-500">Choose an active insurer tenant from the select box above to start the simulator.</p>
        </div>
      ) : (
        <div 
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn"
          style={{
            ['--tenant-primary' as any]: tenant.primaryColor,
            ['--tenant-secondary' as any]: tenant.secondaryColor,
          }}
        >
          {/* Form Side - Left */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md relative overflow-hidden">
              {/* Dynamic Branding Ribbon */}
              <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: 'var(--tenant-primary)' }}></div>

              <div className="flex items-center gap-3 mb-6">
                <TenantLogo 
                  src={tenant.logoUrl} 
                  name={tenant.name} 
                  className="w-10 h-10"
                />
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">{tenant.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Claims Submission Form</p>
                </div>
              </div>

              <form onSubmit={handleSubmitClaim} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Claim Type</label>
                  <Select
                    value={claimType}
                    onValueChange={(val) => setClaimType(val)}
                  >
                    <SelectTrigger className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 h-10 text-slate-800 text-xs">
                      <SelectValue placeholder="Select claim type" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(tenant.claimTypes) as [any, any][])
                        .filter(([_, config]) => config.enabled)
                        .map(([type, _]) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Claim Amount (VND)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--tenant-primary)]/20 focus:border-[var(--tenant-primary)]/50 transition-all text-xs"
                  />
                </div>

                {/* Dynamic Custom Fields Rendering */}
                {tenant.customFields.map((field: any) => (
                  <div key={field.name} className="animate-slideDown">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>

                    {field.type === 'boolean' ? (
                      <Select
                        value={customFieldsData[field.name] !== undefined ? String(customFieldsData[field.name]) : 'false'}
                        onValueChange={(val) => handleCustomFieldChange(field.name, val === 'true', 'boolean')}
                      >
                        <SelectTrigger className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 h-10 text-slate-800 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="false">No / False</SelectItem>
                          <SelectItem value="true">Yes / True</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        value={customFieldsData[field.name] !== undefined ? customFieldsData[field.name] : ''}
                        onChange={(e) => handleCustomFieldChange(field.name, e.target.value, field.type)}
                        placeholder={`Provide ${field.label.toLowerCase()}`}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--tenant-primary)]/20 focus:border-[var(--tenant-primary)]/50 transition-all text-xs"
                      />
                    )}
                  </div>
                ))}

                <button
                  type="submit"
                  disabled={submitting || previewErrors.length > 0}
                  className="w-full py-3 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-98 border select-none disabled:bg-slate-100 disabled:border-slate-100 disabled:text-slate-400 cursor-pointer"
                  style={{
                    backgroundColor: previewErrors.length > 0 ? '#f1f5f9' : 'var(--tenant-primary)',
                    borderColor: previewErrors.length > 0 ? '#e2e8f0' : 'var(--tenant-secondary)',
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Claim'}
                </button>
              </form>
            </div>
          </div>

          {/* Engine Processing Preview - Right */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md h-full flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 mb-6 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Shield size={18} className="text-rose-500" />
                  Real-time Processing Engine Preview
                </h3>

                {/* Form Errors Block */}
                {previewErrors.length > 0 ? (
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-xs text-rose-600 space-y-2 flex gap-3">
                    <AlertCircle size={18} className="text-rose-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold text-rose-800">Validation Errors:</span>
                      <ul className="list-disc pl-4 mt-1.5 space-y-1 font-medium">
                        {previewErrors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : !preview ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Loader2 className="w-8 h-8 text-rose-500 animate-spin mb-3" />
                    <span className="text-xs font-semibold text-slate-500">Processing claim calculations...</span>
                  </div>
                ) : (
                  <div className="space-y-6 animate-fadeIn">
                    {/* Stepper routing */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approval Route Routing</label>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between gap-4">
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Reviewer Channel</div>
                          <div className="text-xs font-extrabold text-slate-800 mt-0.5">{preview.approvalRoute.approverRole.toUpperCase()}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300" />
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Trigger Rule</div>
                          <div className="text-xs font-extrabold text-slate-800 mt-0.5">{preview.approvalRoute.tier}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300" />
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Status</div>
                          <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full inline-block mt-0.5 ${preview.approvalRoute.autoApproved ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                            {preview.approvalRoute.autoApproved ? 'Auto-Approved' : 'Requires Review'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Required Documents checklist */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Required Document Guidelines</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 space-y-2.5">
                          <div className="text-[10px] font-extrabold text-slate-500 flex items-center gap-1.5 uppercase">
                            <FileText size={14} className="text-rose-500" /> Required ({preview.requiredDocuments.length})
                          </div>
                          {preview.requiredDocuments.length === 0 ? (
                            <div className="text-[10px] text-slate-400 italic">No required documents.</div>
                          ) : (
                            preview.requiredDocuments.map((doc: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                                {doc}
                              </div>
                            ))
                          )}
                        </div>

                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 space-y-2.5">
                          <div className="text-[10px] font-extrabold text-slate-500 flex items-center gap-1.5 uppercase">
                            <FileText size={14} className="text-indigo-500" /> Optional ({preview.optionalDocuments.length})
                          </div>
                          {preview.optionalDocuments.length === 0 ? (
                            <div className="text-[10px] text-slate-400 italic">No optional documents.</div>
                          ) : (
                            preview.optionalDocuments.map((doc: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                                {doc}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* SLA and Email alert triggers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">SLA Processing Deadline</label>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
                          <div className="text-[9px] text-slate-400 font-bold uppercase">Deadline (+{preview.businessDaysRemaining} business days)</div>
                          <div className="text-xs font-extrabold text-rose-500 flex items-center gap-1">
                            <Clock size={12} />
                            {formatSlaDate(preview.slaDeadline)}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Breach Alert Escalation</label>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
                          <div className="text-[9px] text-slate-400 font-bold uppercase">Escalation Recipient</div>
                          <div className="text-xs font-bold text-slate-700 truncate">{tenant.sla.escalationEmail || 'compliance@insurance.com'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Notification Alerts triggers */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Simulated Notification Pipelines</label>
                      <div className="space-y-2">
                        {preview.notificationsToSend.map((notif: any, idx: number) => (
                          <div key={idx} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between text-xs font-medium">
                            <span className="text-slate-700 flex items-center gap-1.5">
                              <Mail size={14} className="text-emerald-500" />
                              Event: {notif.event.replace('_', ' ')}
                            </span>
                            <div className="flex gap-1.5">
                              {notif.channels.map((chan: string) => (
                                <span key={chan} className="text-[9px] font-extrabold bg-indigo-50 border border-indigo-100 text-indigo-600 px-2 py-0.5 rounded uppercase">
                                  {chan}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Claims DB History Log */}
      {tenant && (
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl space-y-4 shadow-sm animate-fadeIn">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-sm font-extrabold text-slate-800">Active Insurer Claims DB Log</h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">Historical ledger of all claims processed or submitted to {tenant.name}.</p>
          </div>

          {loadingClaims ? (
            <div className="flex items-center justify-center py-10 text-slate-400 text-xs font-bold">
              <Loader2 className="w-5 h-5 text-rose-500 animate-spin mr-2" />
              Loading claims log ledger...
            </div>
          ) : claimsLog.length === 0 ? (
            <div className="text-center py-12 text-slate-400 bg-slate-50/50 rounded-xl border border-slate-200 border-dashed text-xs font-bold flex flex-col items-center justify-center gap-2">
              <Inbox size={28} className="text-slate-300" />
              No claims submitted yet to {tenant.name}. Use the form above to submit your first claim.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <Table>
                <TableHeader className="bg-slate-50/75">
                  <TableRow>
                    <TableHead className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider h-10">Claim ID</TableHead>
                    <TableHead className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider h-10">Type</TableHead>
                    <TableHead className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider h-10">Amount</TableHead>
                    <TableHead className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider h-10">Custom Fields</TableHead>
                    <TableHead className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider h-10">SLA Deadline</TableHead>
                    <TableHead className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider h-10">Status</TableHead>
                    <TableHead className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider h-10 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {claimsLog.map((claim) => (
                    <TableRow key={claim.id} className="hover:bg-slate-50/40 text-slate-600 font-medium">
                      <TableCell className="font-mono text-[10px] text-slate-400 truncate max-w-[120px]">{claim.id}</TableCell>
                      <TableCell className="font-extrabold text-slate-700">{claim.claimType}</TableCell>
                      <TableCell className="font-extrabold text-emerald-600">{claim.amount.toLocaleString()} VND</TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          {Object.entries(claim.customFieldsData).map(([key, val]) => (
                            <div key={key} className="text-[10px] text-slate-400 font-medium">
                              <strong className="text-slate-500">{key}:</strong> {String(val)}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-rose-500 font-bold">{formatSlaDate(claim.slaDeadline)}</TableCell>
                      <TableCell>
                        <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          claim.status === 'AUTO_APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          claim.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          claim.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                          'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {claim.status.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {claim.status === 'PENDING_REVIEW' ? (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleUpdateStatus(claim.id, 'APPROVED')}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-600 rounded-lg active:scale-90 transition-all cursor-pointer"
                              title="Approve claim"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(claim.id, 'REJECTED')}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 rounded-lg active:scale-90 transition-all cursor-pointer"
                              title="Reject claim"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[10px] font-medium">Settled</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
