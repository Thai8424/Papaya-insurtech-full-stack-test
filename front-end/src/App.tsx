import { useEffect, useState } from 'react';
import apiClient from './api/client';
import type { Tenant } from './types';
import { ConfigEditor } from '@/features/organizations/components/ConfigEditor';
import { ConfigDiff } from '@/features/organizations/components/ConfigDiff';
import { ConfigHistory } from '@/features/organizations/components/ConfigHistory';
import { ClaimPlayground } from '@/features/claims/components/ClaimPlayground';
import { Shield, Play, Layers, History, Plus, Loader2 } from 'lucide-react';
import { TenantLogo } from '@/components/ui/tenant-logo';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';

function App() {
  const [activeTab, setActiveTab] = useState<'tenants' | 'diff' | 'history' | 'playground'>('tenants');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  // Editor mode toggles
  const [isEditing, setIsEditing] = useState(false);
  const [editTargetTenant, setEditTargetTenant] = useState<Tenant | null>(null);

  const [loading, setLoading] = useState(true);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<Tenant[]>('/api/tenants');
      setTenants(response.data);
      // Synchronize active selected tenant if exists
      if (selectedTenant) {
        const updated = response.data.find(t => t.id === selectedTenant.id);
        if (updated) setSelectedTenant(updated);
      }
    } catch (err) {
      console.error('Error fetching tenants list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleEditClick = (tenant: Tenant) => {
    setEditTargetTenant(tenant);
    setIsEditing(true);
  };

  const handleCreateClick = () => {
    setEditTargetTenant(null);
    setIsEditing(true);
  };

  const handleEditorSave = async (savedTenant: Tenant) => {
    setIsEditing(false);
    setEditTargetTenant(null);
    await fetchTenants();

    // Select the newly updated/created tenant
    setSelectedTenant(savedTenant);
  };

  const handleRollbackSuccess = (updatedTenant: Tenant) => {
    setSelectedTenant(updatedTenant);
    fetchTenants();
  };

  return (
    <div className="flex min-h-screen text-slate-800 font-sans">
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="w-80 bg-white/80 border-r border-slate-200/80 backdrop-blur-xl flex flex-col justify-between p-6 flex-shrink-0 sticky top-0 h-screen">
        <div className="space-y-8">
          {/* Brand header using official Papaya SVG */}
          <div className="flex justify-center items-center gap-3 border-b border-slate-100 pb-5">
            <img
              src="https://www.papaya.asia/_next/static/media/logo.f727302c.svg"
              alt="Papaya Logo"
              className="h-7 object-contain"
            />
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            <button
              onClick={() => { setActiveTab('tenants'); setIsEditing(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${activeTab === 'tenants' ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md shadow-rose-200' : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50/50'}`}
            >
              <Shield size={18} />
              Tenant Insurers
            </button>

            <button
              onClick={() => { setActiveTab('playground'); setIsEditing(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${activeTab === 'playground' ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md shadow-rose-200' : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50/50'}`}
            >
              <Play size={18} />
              Claims Playground
            </button>

            <button
              onClick={() => { setActiveTab('diff'); setIsEditing(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${activeTab === 'diff' ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md shadow-rose-200' : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50/50'}`}
            >
              <Layers size={18} />
              Config Diff Tool
            </button>

            <button
              onClick={() => { setActiveTab('history'); setIsEditing(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${activeTab === 'history' ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md shadow-rose-200' : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50/50'}`}
            >
              <History size={18} />
              Version Rollback
            </button>
          </nav>
        </div>

        {/* Selected tenant details (Workspace Switcher dropdown) */}
        {selectedTenant && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: selectedTenant.primaryColor }}></span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Workspace</span>
            </div>
            
            <Select
              value={selectedTenant.id}
              onValueChange={(val) => {
                const found = tenants.find(t => t.id === val);
                if (found) setSelectedTenant(found);
              }}
            >
              <SelectTrigger className="w-full flex items-center justify-between gap-3 p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-sm focus:ring-1 focus:ring-rose-300">
                <div className="flex items-center gap-2.5 truncate text-left">
                  <TenantLogo
                    src={selectedTenant.logoUrl}
                    name={selectedTenant.name}
                    className="w-7 h-7"
                  />
                  <div className="truncate">
                    <div className="text-[11px] font-bold text-slate-800 truncate leading-snug">{selectedTenant.name}</div>
                    <div className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5">Version {selectedTenant.currentVersion}</div>
                  </div>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white border border-slate-200 rounded-xl shadow-lg p-1 min-w-[200px]">
                {tenants.map(t => (
                  <SelectItem key={t.id} value={t.id} className="cursor-pointer hover:bg-slate-50 rounded-lg text-xs transition-all font-semibold pl-8 pr-2 py-2">
                    <div className="flex items-center gap-2 text-left w-full">
                      <TenantLogo
                        src={t.logoUrl}
                        name={t.name}
                        className="w-5 h-5"
                      />
                      <span className="text-slate-700 font-bold">{t.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </aside>

      {/* 2. MAIN CORE LAYOUT DASHBOARD */}
      <main className="flex-1 p-8 overflow-y-auto custom-scrollbar flex flex-col justify-between">
        <div className="space-y-6">
          {/* Header block */}
          <header className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-rose-500">Claims Administration System</h2>
              <h1 className="text-2xl font-black text-slate-800 mt-1">Insurer Tenancy Configurator</h1>
            </div>

            {activeTab === 'tenants' && !isEditing && (
              <button
                onClick={handleCreateClick}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-rose-100 border border-rose-400/20 cursor-pointer active:scale-95 transition-all"
              >
                <Plus size={16} /> Onboard New Insurer
              </button>
            )}
          </header>

          {/* Main Router Content */}
          <div className="relative">
            {isEditing ? (
              <ConfigEditor
                tenant={editTargetTenant}
                onSave={handleEditorSave}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <>
                {/* TENANTS CARD VIEW */}
                {activeTab === 'tenants' && (
                  <div className="space-y-6">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-40 text-slate-400">
                        <Loader2 className="w-10 h-10 text-rose-500 animate-spin mb-4" />
                        <span className="text-sm font-semibold text-slate-500">Spinning database engines...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tenants.map(tenantItem => {
                          const isSelected = selectedTenant?.id === tenantItem.id;
                          return (
                            <div
                              key={tenantItem.id}
                              onClick={() => setSelectedTenant(tenantItem)}
                              className={`bg-white rounded-2xl p-6 border transition-all hover:scale-[1.02] flex flex-col justify-between gap-6 cursor-pointer relative overflow-hidden shadow-sm hover:shadow-md ${isSelected ? 'border-rose-500/50 bg-rose-50/10 ring-1 ring-rose-500/10' : 'border-slate-100 hover:border-slate-200'}`}
                            >
                              {/* Accent brand border */}
                              <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: tenantItem.primaryColor }}></div>

                              <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                  <TenantLogo
                                    src={tenantItem.logoUrl}
                                    name={tenantItem.name}
                                    className="w-12 h-12"
                                  />
                                  <span className="text-[10px] font-extrabold text-rose-600 px-2.5 py-0.5 bg-rose-50 border border-rose-100 rounded-full">
                                    Version v{tenantItem.currentVersion}
                                  </span>
                                </div>

                                <div className="space-y-1">
                                  <h3 className="font-extrabold text-slate-800 text-base leading-tight truncate">{tenantItem.name}</h3>
                                  <div className="flex items-center gap-1.5 mt-2">
                                    <span className="w-2.5 h-2.5 rounded-full border border-slate-200" style={{ backgroundColor: tenantItem.primaryColor }}></span>
                                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Color Theme</span>
                                  </div>
                                </div>

                                {/* Short properties stats */}
                                <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] text-slate-500">
                                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    <div className="text-slate-400">Auto-Approval</div>
                                    <div className="font-bold text-slate-700 mt-0.5">
                                      {tenantItem.approvalRules.autoApprovalThreshold > 0
                                        ? `${tenantItem.approvalRules.autoApprovalThreshold.toLocaleString()} VND`
                                        : 'None'}
                                    </div>
                                  </div>
                                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    <div className="text-slate-400">Claim Types</div>
                                    <div className="font-bold text-slate-700 mt-0.5">
                                      {Object.values(tenantItem.claimTypes).filter((t: any) => t.enabled).length} Enabled
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleEditClick(tenantItem); }}
                                  className="flex-1 py-2 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-600 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                                >
                                  Edit Config
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSelectedTenant(tenantItem); setActiveTab('playground'); }}
                                  className="flex-1 py-2 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl shadow-sm transition-all cursor-pointer"
                                  style={{ backgroundColor: tenantItem.primaryColor }}
                                >
                                  Sandbox Play
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* DIFF PANEL COMPARATOR */}
                {activeTab === 'diff' && <ConfigDiff tenants={tenants} />}

                {/* ROLLBACK LOGS */}
                {activeTab === 'history' && (
                  <ConfigHistory
                    tenant={selectedTenant}
                    onRollback={handleRollbackSuccess}
                  />
                )}

                {/* SANDBOX CLAIMS SIMULATOR */}
                {activeTab === 'playground' && <ClaimPlayground tenants={tenants} />}
              </>
            )}
          </div>
        </div>

        {/* Footer info */}
        <footer className="text-center text-[10px] text-slate-400 mt-12 border-t border-slate-100 pt-4">
          © {new Date().getFullYear()} Papaya Insurtech.
        </footer>
      </main>
    </div>
  );
}

export default App;
