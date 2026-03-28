import React from 'react';
import { AlertTriangle, X, Clock } from 'lucide-react';

interface ProExpiryBannerProps {
  expiresAt: string;
  onDismiss: () => void;
}

export const ProExpiryBanner: React.FC<ProExpiryBannerProps> = ({ expiresAt, onDismiss }) => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLeft > 7) return null;

  const isExpired = daysLeft <= 0;

  return (
    <div className={`rounded-xl px-4 py-3 mb-4 flex items-center gap-3 text-sm font-medium ${
      isExpired
        ? 'bg-rose-50 border border-rose-200 text-rose-700'
        : 'bg-amber-50 border border-amber-200 text-amber-700'
    }`}>
      {isExpired ? <AlertTriangle size={16} className="shrink-0" /> : <Clock size={16} className="shrink-0" />}
      <span className="flex-1">
        {isExpired
          ? 'Your Pro access has expired. Redeem a new code or upgrade to continue enjoying Pro features.'
          : `Your Pro access expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Redeem a code to extend.`
        }
      </span>
      <button onClick={onDismiss} className="p-1 hover:bg-black/5 rounded-full transition-colors shrink-0">
        <X size={14} />
      </button>
    </div>
  );
};
