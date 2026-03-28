import React, { useEffect, useState } from 'react';
import { createPromoCode, getAllPromoCodes, togglePromoCodeActive, deletePromoCode, getRedemptionsForCode } from '../services/promoCodes';
import { PromoCode, PromoRedemption } from '../types';
import { Ticket, Plus, Loader2, ToggleRight, ToggleLeft, Trash2, ChevronDown, ChevronUp, X, Copy, Check, AlertTriangle } from 'lucide-react';

export const AdminPromoManager: React.FC = () => {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Create form state
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formGrantDays, setFormGrantDays] = useState(90);
  const [formSingleUse, setFormSingleUse] = useState(true);
  const [formMaxUses, setFormMaxUses] = useState(100);
  const [formHasExpiry, setFormHasExpiry] = useState(false);
  const [formExpiryDate, setFormExpiryDate] = useState('');

  // Expanded row for redemptions
  const [expandedCodeId, setExpandedCodeId] = useState<string | null>(null);
  const [redemptions, setRedemptions] = useState<PromoRedemption[]>([]);
  const [loadingRedemptions, setLoadingRedemptions] = useState(false);

  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = async () => {
    setLoading(true);
    const data = await getAllPromoCodes();
    setCodes(data);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim()) return;
    setSaving(true);
    setError(null);

    try {
      const newCode = await createPromoCode({
        code: formCode,
        description: formDescription,
        grantDays: formGrantDays,
        isSingleUse: formSingleUse,
        maxUses: formSingleUse ? 1 : formMaxUses,
        expiresAt: formHasExpiry && formExpiryDate ? new Date(formExpiryDate).toISOString() : null,
      });
      if (newCode) {
        setCodes(prev => [newCode, ...prev]);
        resetForm();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create code.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormCode('');
    setFormDescription('');
    setFormGrantDays(90);
    setFormSingleUse(true);
    setFormMaxUses(100);
    setFormHasExpiry(false);
    setFormExpiryDate('');
    setShowForm(false);
    setError(null);
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    const success = await togglePromoCodeActive(id, !currentActive);
    if (success) {
      setCodes(prev => prev.map(c => c.id === id ? { ...c, isActive: !currentActive } : c));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this promo code permanently?')) return;
    const success = await deletePromoCode(id);
    if (success) {
      setCodes(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleExpandRedemptions = async (codeId: string) => {
    if (expandedCodeId === codeId) {
      setExpandedCodeId(null);
      return;
    }
    setExpandedCodeId(codeId);
    setLoadingRedemptions(true);
    const data = await getRedemptionsForCode(codeId);
    setRedemptions(data);
    setLoadingRedemptions(false);
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Create Button / Form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 border-2 border-dashed border-indigo-200 text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Create New Promo Code
        </button>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2"><Ticket size={18} /> New Promo Code</h3>
            <button onClick={resetForm} className="hover:bg-white/10 p-1 rounded-full"><X size={18} /></button>
          </div>
          <form onSubmit={handleCreate} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Code *</label>
                <input
                  type="text"
                  value={formCode}
                  onChange={e => setFormCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                  placeholder="e.g. LAUNCH2026"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Grant Days</label>
                <input
                  type="number"
                  value={formGrantDays}
                  onChange={e => setFormGrantDays(parseInt(e.target.value) || 90)}
                  min={1}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Description</label>
              <input
                type="text"
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                placeholder="e.g. Launch campaign code"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Usage Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormSingleUse(true)}
                    className={`py-2 rounded-lg text-sm font-bold border transition-all ${formSingleUse ? 'bg-indigo-100 border-indigo-400 text-indigo-700' : 'bg-white border-slate-200 text-slate-400'}`}
                  >
                    Single Use
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormSingleUse(false)}
                    className={`py-2 rounded-lg text-sm font-bold border transition-all ${!formSingleUse ? 'bg-indigo-100 border-indigo-400 text-indigo-700' : 'bg-white border-slate-200 text-slate-400'}`}
                  >
                    Multi Use
                  </button>
                </div>
              </div>
              {!formSingleUse && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Max Uses</label>
                  <input
                    type="number"
                    value={formMaxUses}
                    onChange={e => setFormMaxUses(parseInt(e.target.value) || 100)}
                    min={2}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formHasExpiry}
                  onChange={e => setFormHasExpiry(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-bold text-slate-600">Set expiry date</span>
              </label>
              {formHasExpiry && (
                <input
                  type="date"
                  value={formExpiryDate}
                  onChange={e => setFormExpiryDate(e.target.value)}
                  className="mt-2 w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              )}
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={resetForm} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-bold hover:bg-slate-50">Cancel</button>
              <button
                type="submit"
                disabled={saving || !formCode.trim()}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Create Code
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Codes List */}
      {loading ? (
        <div className="flex justify-center py-12 text-indigo-600">
          <Loader2 size={32} className="animate-spin" />
        </div>
      ) : codes.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Ticket size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-bold">No promo codes yet</p>
          <p className="text-sm">Create your first code above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {codes.map(code => (
            <div key={code.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 flex items-center gap-4">
                {/* Code badge */}
                <div className="flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-sm bg-slate-100 px-3 py-1.5 rounded-lg tracking-wider">
                      {code.code}
                    </span>
                    <button
                      onClick={() => copyCode(code.code, code.id)}
                      className="p-1.5 text-slate-300 hover:text-indigo-600 transition-colors"
                      title="Copy code"
                    >
                      {copiedId === code.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-600 truncate">{code.description || '—'}</p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                    <span>{code.grantDays} days</span>
                    <span>{code.isSingleUse ? 'Single use' : `Multi (${code.timesUsed}/${code.maxUses ?? '∞'})`}</span>
                    {code.expiresAt && (
                      <span className={isExpired(code.expiresAt) ? 'text-rose-500' : ''}>
                        {isExpired(code.expiresAt) ? 'Expired' : `Exp: ${new Date(code.expiresAt).toLocaleDateString()}`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status + Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                    code.isActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-400 border-slate-200'
                  }`}>
                    {code.isActive ? 'Active' : 'Disabled'}
                  </span>

                  <button
                    onClick={() => handleToggle(code.id, code.isActive)}
                    className={`transition-colors ${code.isActive ? 'text-emerald-500' : 'text-slate-300'}`}
                    title={code.isActive ? 'Disable' : 'Enable'}
                  >
                    {code.isActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                  </button>

                  <button
                    onClick={() => handleExpandRedemptions(code.id)}
                    className="p-1.5 text-slate-300 hover:text-indigo-600 transition-colors"
                    title="View redemptions"
                  >
                    {expandedCodeId === code.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  <button
                    onClick={() => handleDelete(code.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Redemptions panel */}
              {expandedCodeId === code.id && (
                <div className="border-t border-slate-100 bg-slate-50 p-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Redemptions ({code.timesUsed})</h4>
                  {loadingRedemptions ? (
                    <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-indigo-400" /></div>
                  ) : redemptions.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">No redemptions yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {redemptions.map(r => (
                        <div key={r.id} className="flex items-center justify-between text-sm bg-white px-3 py-2 rounded-lg border border-slate-100">
                          <span className="text-slate-600 font-mono text-xs">{r.userId.slice(0, 8)}...</span>
                          <span className="text-slate-400 text-xs">{new Date(r.redeemedAt).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
