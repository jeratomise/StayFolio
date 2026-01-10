import React, { useState, useEffect, useMemo } from 'react';
import { Crown, Moon, DollarSign, Calendar, Info, CheckCircle2, Pencil, Check } from 'lucide-react';
import { ELITE_PROGRAMS, BRAND_LOGOS } from '../constants';
import { ProgramInfo, Stay } from '../types';
import { getManualStatuses, saveManualStatus } from '../services/storage';

interface EliteStatusViewProps {
    stays: Stay[];
}

const StatusCard: React.FC<{ 
    program: ProgramInfo; 
    earnedStatus: string; 
    manualStatus: string | undefined;
    onUpdateStatus: (status: string) => void;
    prevYear: number;
    earnedStats: { nights: number; spend: number };
}> = ({ program, earnedStatus, manualStatus, onUpdateStatus, prevYear, earnedStats }) => {
  const [imageError, setImageError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const logoUrl = BRAND_LOGOS[program.name];

  const currentStatus = manualStatus || earnedStatus;
  
  // All possible tiers plus 'Member'
  const allTiers = ['Member', ...program.tiers.map(t => t.name)];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all group flex flex-col h-full">
      
      {/* Header with Current Status */}
      <div className={`p-5 border-b border-slate-50 relative ${currentStatus !== 'Member' ? 'bg-indigo-50/50' : 'bg-white'}`}>
         <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg border border-slate-100 flex items-center justify-center p-1 shrink-0 shadow-sm">
                    {logoUrl && !imageError ? (
                        <img 
                            src={logoUrl} 
                            alt={program.name} 
                            className="w-full h-full object-contain" 
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <Crown size={20} className="text-slate-400" />
                    )}
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 leading-tight">{program.name}</h3>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Status Valid thru {prevYear + 2}</p>
                </div>
            </div>
            <button 
                onClick={() => setIsEditing(!isEditing)}
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-full transition-colors"
                title="Edit Status"
            >
                <Pencil size={14} />
            </button>
         </div>

         {/* Active Status Badge */}
         <div className="relative">
            {isEditing ? (
                <div className="flex items-center gap-2 animate-fade-in">
                    <select 
                        value={currentStatus}
                        onChange={(e) => {
                            onUpdateStatus(e.target.value);
                            setIsEditing(false);
                        }}
                        className="w-full text-sm font-bold text-slate-800 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        {allTiers.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            ) : (
                <div>
                    <div className="flex items-center gap-2">
                         <h4 className={`text-xl font-black ${currentStatus !== 'Member' ? 'text-indigo-700' : 'text-slate-700'}`}>
                            {currentStatus}
                         </h4>
                         {manualStatus && (
                             <span className="bg-slate-100 text-slate-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-200">MANUAL</span>
                         )}
                    </div>
                    
                    {/* Reason Text */}
                    <p className="text-xs text-slate-500 mt-1">
                        {manualStatus ? 'Manually set by you' : (
                            currentStatus === 'Member' ? `Based on ${earnedStats.nights} nights in ${prevYear}` : 
                            `Earned via ${earnedStats.nights} nights in ${prevYear}`
                        )}
                    </p>
                </div>
            )}
         </div>
      </div>
      
      {/* Tiers List */}
      <div className="p-4 space-y-3 bg-white flex-1">
        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Requirements</p>
        {program.tiers.map((tier, idx) => {
             const isCurrent = currentStatus === tier.name;
             return (
                <div key={idx} className={`relative p-3 rounded-xl border transition-colors ${isCurrent ? 'bg-slate-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-100 opacity-80'}`}>
                    <div className="flex justify-between items-center mb-1.5">
                        <span className={`font-bold text-sm ${isCurrent ? 'text-indigo-900' : 'text-slate-700'}`}>{tier.name}</span>
                        {isCurrent && <CheckCircle2 size={14} className="text-indigo-600" />}
                    </div>
                    
                    <div className="space-y-1">
                        {tier.requirements.nights && (
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                <Moon size={12} className="text-indigo-400" />
                                <span className="font-semibold">{tier.requirements.nights} Nights</span>
                            </div>
                        )}
                        {tier.requirements.spendUSD && (
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                <DollarSign size={12} className="text-emerald-400" />
                                <span>${tier.requirements.spendUSD.toLocaleString()} Spend</span>
                            </div>
                        )}
                        {tier.requirements.stays && (
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                <Calendar size={12} className="text-amber-400" />
                                <span>{tier.requirements.stays} Stays</span>
                            </div>
                        )}
                    </div>
                </div>
             );
        })}
      </div>
    </div>
  );
};

export const EliteStatusView: React.FC<EliteStatusViewProps> = ({ stays }) => {
  const [manualStatuses, setManualStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
      setManualStatuses(getManualStatuses());
  }, []);

  const handleUpdateStatus = (programId: string, status: string) => {
      const updated = saveManualStatus(programId, status);
      setManualStatuses(updated);
  };

  // Logic: Current Status is usually determined by LAST year's activity.
  const referenceYear = useMemo(() => new Date().getFullYear() - 1, []);

  const calculateStats = (programName: string) => {
      const prevYearStays = stays.filter(s => 
          s.brand === programName && 
          new Date(s.checkInDate).getFullYear() === referenceYear
      );

      let nights = 0;
      let spend = 0;
      let stayCount = prevYearStays.length;

      prevYearStays.forEach(s => {
          if (s.checkInDate && s.checkOutDate) {
              const start = new Date(s.checkInDate).getTime();
              const end = new Date(s.checkOutDate).getTime();
              const n = Math.round((end - start) / (1000 * 60 * 60 * 24));
              nights += Math.max(0, n);
          }
          spend += s.cost || 0;
      });
      return { nights, spend, stayCount };
  };

  const getEarnedStatus = (program: ProgramInfo, stats: { nights: number; spend: number; stayCount: number }) => {
      // Sort tiers high to low (rank 1 is highest)
      const sortedTiers = [...program.tiers].sort((a, b) => a.rank - b.rank); // Rank 1 is usually highest in our data
      
      // Since our data defines Rank 1 as highest, but logic in loops usually goes low->high or checks "met requirement".
      // Let's iterate from Highest Requirement. If met, return it.
      
      // Wait, Rank 1 (Ambassador) requires 100 nights. Rank 2 (Titanium) requires 75.
      // We should check highest first.
      
      for (const tier of sortedTiers) {
          const req = tier.requirements;
          let met = false;
          
          if (req.nights && stats.nights >= req.nights) {
              // Special case: Some have AND logic (Ambassador), some OR logic.
              // Our simple types mostly just have nights. 
              // Ambassador has nights AND spend.
              if (req.spendUSD) {
                  if (stats.spend >= req.spendUSD) met = true;
              } else {
                  met = true;
              }
          } else if (req.stays && stats.stayCount >= req.stays) {
              met = true;
          } else if (req.spendUSD && !req.nights && stats.spend >= req.spendUSD) {
              // Pure spend requirement
              met = true;
          }

          if (met) return tier.name;
      }

      return 'Member';
  };

  return (
    <div className="space-y-8 pb-24">
      
      {/* Header */}
      <div className="text-center space-y-2">
         <div className="inline-block p-3 bg-indigo-100 rounded-full text-indigo-600 mb-2 shadow-sm">
            <Crown size={32} />
         </div>
         <h1 className="text-3xl font-black text-slate-800 tracking-tight">Status Wallet</h1>
         <p className="text-slate-500 max-w-md mx-auto">
            Manage your elite statuses for {referenceYear + 1}. Based on {referenceYear} activity.
         </p>
         <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full border border-amber-100">
             <Info size={10} />
             Current Status Validity
         </div>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ELITE_PROGRAMS.map(prog => {
            const stats = calculateStats(prog.name);
            const earned = getEarnedStatus(prog, stats);
            
            return (
                <StatusCard 
                    key={prog.id} 
                    program={prog}
                    earnedStatus={earned}
                    manualStatus={manualStatuses[prog.id]}
                    onUpdateStatus={(s) => handleUpdateStatus(prog.id, s)}
                    prevYear={referenceYear}
                    earnedStats={stats}
                />
            );
        })}
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
        <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle2 size={20} className="text-emerald-500" />
                Quick Reference Guide
            </h2>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-xs">
                    <tr>
                        <th className="px-6 py-3">Program</th>
                        <th className="px-6 py-3">Top Tier</th>
                        <th className="px-6 py-3">Nights Needed</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {ELITE_PROGRAMS.map((prog) => {
                        const topTier = prog.tiers[0]; // Assuming first is highest
                        return (
                            <tr key={prog.id} className="hover:bg-slate-50/50">
                                <td className="px-6 py-4 font-bold text-slate-700">{prog.name}</td>
                                <td className="px-6 py-4 text-indigo-600 font-semibold">{topTier.name}</td>
                                <td className="px-6 py-4 text-slate-800 font-bold bg-slate-50/30">
                                    {topTier.requirements.nights || '-'}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      </div>

    </div>
  );
};