import React, { useState } from 'react';
import { Ticket, Loader2, Check, AlertTriangle } from 'lucide-react';
import { redeemPromoCode } from '../services/promoCodes';

interface RedeemCodeSectionProps {
  isPro: boolean;
  hasStripeSubscription: boolean;
  onRedeemed: () => void;
}

export const RedeemCodeSection: React.FC<RedeemCodeSectionProps> = ({ isPro, hasStripeSubscription, onRedeemed }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; expiresAt?: string } | null>(null);

  const handleRedeem = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);

    const res = await redeemPromoCode(code);

    if (res.success) {
      setResult({
        success: true,
        message: `Pro activated for ${res.grantDays} days!`,
        expiresAt: res.newExpiresAt,
      });
      setCode('');
      onRedeemed();
    } else {
      setResult({ success: false, message: res.error || 'Failed to redeem code.' });
    }

    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
      <div className="flex items-center gap-2 text-purple-600 mb-1">
        <Ticket size={20} />
        <h3 className="font-bold text-lg text-slate-800">Redeem a Code</h3>
      </div>

      {hasStripeSubscription ? (
        <p className="text-sm text-slate-400">You already have an active paid Pro subscription.</p>
      ) : (
        <>
          <p className="text-sm text-slate-500">
            Have a promo code? Enter it below to activate your Pro subscription.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
              placeholder="Enter code"
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono uppercase tracking-wider focus:ring-2 focus:ring-purple-500 outline-none"
              disabled={loading}
            />
            <button
              onClick={handleRedeem}
              disabled={loading || !code.trim()}
              className="px-5 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Ticket size={16} />}
              Redeem
            </button>
          </div>

          {result && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
              result.success
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-rose-50 border border-rose-200 text-rose-700'
            }`}>
              {result.success ? <Check size={16} className="shrink-0" /> : <AlertTriangle size={16} className="shrink-0" />}
              <span>
                {result.message}
                {result.expiresAt && (
                  <span className="block text-xs mt-0.5 opacity-70">
                    Pro until {new Date(result.expiresAt).toLocaleDateString()}
                  </span>
                )}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
