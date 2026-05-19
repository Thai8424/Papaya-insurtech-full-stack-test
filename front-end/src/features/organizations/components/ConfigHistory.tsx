import React, { useEffect, useState } from 'react';
import type { Tenant, TenantVersion } from '@/types';
import apiClient from '@/api/client';
import { History, Check, Loader2, Palette, FolderOpen, Scale, Braces, Undo2 } from 'lucide-react';

interface ConfigHistoryProps {
  tenant: Tenant | null;
  onRollback: (updatedTenant: Tenant) => void;
}

export const ConfigHistory: React.FC<ConfigHistoryProps> = ({ tenant, onRollback }) => {
  const [versions, setVersions] = useState<TenantVersion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [rollbackId, setRollbackId] = useState<number | null>(null);

  const fetchVersions = async () => {
    if (!tenant) return;
    setLoading(true);
    try {
      const response = await apiClient.get<TenantVersion[]>(`/api/tenants/${tenant.id}/versions`);
      setVersions(response.data);
    } catch (err) {
      console.error('Error fetching tenant versions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [tenant]);

  const handleRollback = async (versionNumber: number) => {
    if (!tenant) return;
    setRollbackId(versionNumber);
    try {
      const response = await apiClient.post<Tenant>(`/api/tenants/${tenant.id}/versions/${versionNumber}/rollback`);
      onRollback(response.data);
      await fetchVersions();
    } catch (err) {
      console.error('Error rolling back version:', err);
    } finally {
      setRollbackId(null);
    }
  };

  if (!tenant) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <History size={44} className="mb-3 text-slate-300 animate-pulse" />
        <p className="text-xs font-bold text-slate-500">Please select a tenant from the dashboard to view config history logs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 rounded-xl text-rose-500">
              <History size={22} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">Configuration Version Logs</h2>
              <p className="text-xs text-slate-400">Revert or rollback {tenant.name}'s configuration safely to any historical commit.</p>
            </div>
          </div>
          <div className="text-[10px] px-3 py-1 bg-rose-50 border border-rose-100 rounded-full font-extrabold text-rose-600 uppercase tracking-wider">
            Active: v{tenant.currentVersion}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 text-rose-500 animate-spin mb-2" />
            <span className="text-xs font-semibold ml-3 text-slate-500">Loading version history...</span>
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-slate-200 border-dashed text-xs font-bold">
            No save versions recorded yet.
          </div>
        ) : (
          <div className="relative border-l border-slate-200 ml-4 pl-6 space-y-6 py-2">
            {versions.map((ver) => {
              const date = new Date(ver.createdAt);
              const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const isActive = ver.version === tenant.currentVersion;

              return (
                <div key={ver.id} className="relative group animate-fadeIn">
                  {/* Timeline bullet */}
                  <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 transition-all ${isActive ? 'bg-rose-500 border-rose-500 ring-4 ring-rose-500/20' : 'bg-white border-slate-350 group-hover:border-rose-500'}`}></div>

                  <div className={`p-4 bg-white border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all shadow-sm ${isActive ? 'border-rose-300 bg-rose-50/10' : 'border-slate-200/80 hover:border-slate-300'}`}>
                    <div className="space-y-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="font-extrabold text-slate-800 text-sm">Version {ver.version}</span>
                        {isActive && (
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-rose-600 px-2 py-0.5 bg-rose-50 border border-rose-100 rounded-full flex items-center gap-1">
                            <Check size={10} /> Active Version
                          </span>
                        )}
                        {ver.config.meta?.rolledBackFrom && (
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-teal-600 px-2 py-0.5 bg-teal-50 border border-teal-100 rounded-full flex items-center gap-1">
                            <Undo2 size={10} /> Reverted to v{ver.config.meta.rolledBackFrom}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium">Committed on {formattedDate}</p>
                      
                      {/* Short config summary */}
                      <div className="flex flex-wrap gap-2 mt-2.5 font-bold">
                        <span className="text-[9px] px-2 py-1 bg-slate-50 border border-slate-100 text-slate-550 rounded flex items-center gap-1">
                          <Palette size={11} className="text-slate-400" /> {ver.config.branding.primaryColor}
                        </span>
                        <span className="text-[9px] px-2 py-1 bg-slate-50 border border-slate-100 text-slate-550 rounded flex items-center gap-1">
                          <FolderOpen size={11} className="text-slate-400" /> {(Object.values(ver.config.claimTypes) as any[]).filter(t => t.enabled).length} Enabled Types
                        </span>
                        <span className="text-[9px] px-2 py-1 bg-slate-50 border border-slate-100 text-slate-550 rounded flex items-center gap-1">
                          <Scale size={11} className="text-slate-400" /> SLA: {ver.config.sla.settings.length} settings
                        </span>
                        <span className="text-[9px] px-2 py-1 bg-slate-50 border border-slate-100 text-slate-550 rounded flex items-center gap-1">
                          <Braces size={11} className="text-slate-400" /> Fields: {ver.config.customFields.length} Custom Fields
                        </span>
                      </div>
                    </div>

                    {!isActive && (
                      <button
                        onClick={() => handleRollback(ver.version)}
                        disabled={rollbackId !== null}
                        className="px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 disabled:from-slate-200 disabled:to-slate-350 text-white font-extrabold text-xs rounded-xl shadow-md border border-rose-400/20 active:scale-95 transition-all w-full md:w-auto cursor-pointer"
                      >
                        {rollbackId === ver.version ? 'Rolling back...' : 'Rollback to this version'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
