import React, { useEffect, useState } from 'react';
import { getAdminUserSummary, adminUpdateSubscription, getStripeConfig, setStripeConfig } from '../services/storage';
import { UserSummary } from '../types';
import { Users, Loader2, Calendar, Database, CreditCard, ToggleRight, ToggleLeft, Edit, Save, X, Check, Ticket } from 'lucide-react';
import { AdminPromoManager } from './AdminPromoManager';

export const AdminUserList: React.FC = () => {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [stripeEnabled, setStripeEnabled] = useState(false);
  
  const [editingUser, setEditingUser] = useState<UserSummary | null>(null);
  const [editStatus, setEditStatus] = useState<'free' | 'pro'>('free');
  const [editExpiry, setEditExpiry] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'promos'>('users');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [userData, stripeConfig] = await Promise.all([
        getAdminUserSummary(),
        getStripeConfig()
    ]);
    setUsers(userData);
    setStripeEnabled(stripeConfig);
    setLoading(false);
  };

  const handleToggleStripe = async () => {
      const newValue = !stripeEnabled;
      setStripeEnabled(newValue);
      await setStripeConfig(newValue);
  };

  const openEditModal = (user: UserSummary) => {
      setEditingUser(user);
      setEditStatus(user.subscription?.status || 'free');
      let dateStr = '';
      if (user.subscription?.expiresAt) {
          dateStr = new Date(user.subscription.expiresAt).toISOString().split('T')[0];
      } else {
          const d = new Date();
          d.setDate(d.getDate() + 30);
          dateStr = d.toISOString().split('T')[0];
      }
      setEditExpiry(dateStr);
  };

  const handleSaveSubscription = async () => {
      if (!editingUser) return;
      setSaving(true);
      
      const success = await adminUpdateSubscription(
          editingUser.userId,
          editStatus,
          editStatus === 'pro' ? new Date(editExpiry).toISOString() : null
      );

      if (success) {
          setUsers(prev => prev.map(u => {
              if (u.userId === editingUser.userId) {
                  return {
                      ...u,
                      subscription: {
                          userId: u.userId,
                          status: editStatus,
                          expiresAt: editStatus === 'pro' ? new Date(editExpiry).toISOString() : null
                      }
                  };
              }
              return u;
          }));
          setEditingUser(null);
      } else {
          alert("Failed to update subscription.");
      }
      setSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 relative">
       <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200">
                    <Users size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Global Registry</h1>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span>{users.length} Registered Users</span>
                    </div>
                </div>
            </div>

            <div className="md:ml-auto flex items-center gap-4 border-l border-slate-100 pl-4">
                <div className="text-right">
                    <p className="text-sm font-bold text-slate-800">Stripe Payments</p>
                    <p className="text-xs text-slate-400">{stripeEnabled ? 'Enabled' : 'Disabled'}</p>
                </div>
                <button 
                    onClick={handleToggleStripe}
                    className={`transition-colors ${stripeEnabled ? 'text-emerald-500' : 'text-slate-300'}`}
                >
                    {stripeEnabled ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
                </button>
            </div>
       </div>

       {/* Tab Bar */}
       <div className="flex gap-2 bg-white rounded-xl border border-slate-100 p-1 shadow-sm">
         <button
           onClick={() => setActiveTab('users')}
           className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
             activeTab === 'users' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'
           }`}
         >
           <Users size={16} /> Users
         </button>
         <button
           onClick={() => setActiveTab('promos')}
           className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
             activeTab === 'promos' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'
           }`}
         >
           <Ticket size={16} /> Promo Codes
         </button>
       </div>

       {activeTab === 'promos' && <AdminPromoManager />}

       {activeTab === 'users' && (loading ? (
           <div className="flex justify-center py-20 text-indigo-600">
               <Loader2 size={32} className="animate-spin" />
           </div>
       ) : (
           <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
               <div className="overflow-x-auto">
                   <table className="w-full text-left">
                       <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-100">
                           <tr>
                               <th className="px-6 py-4">Identity</th>
                               <th className="px-6 py-4">Plan Status</th>
                               <th className="px-6 py-4 text-center">Stay Activity</th>
                               <th className="px-6 py-4 text-right">Actions</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                           {users.length === 0 ? (
                               <tr>
                                   <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">
                                       No registered users found.
                                   </td>
                               </tr>
                           ) : (
                               users.map((user) => {
                                   const isPro = user.subscription?.status === 'pro';
                                   const expiry = user.subscription?.expiresAt 
                                    ? new Date(user.subscription.expiresAt).toLocaleDateString() 
                                    : '-';

                                   return (
                                       <tr key={user.userId} className="hover:bg-slate-50/50 transition-colors">
                                           <td className="px-6 py-4">
                                               <div className="flex items-center gap-2 font-bold text-slate-700">
                                                   <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">
                                                       {user.email.charAt(0).toUpperCase()}
                                                   </div>
                                                   <div>
                                                       <p className="text-sm">{user.email}</p>
                                                       <p className="text-[10px] text-slate-400 font-mono">{user.userId.slice(0,8)}...</p>
                                                   </div>
                                               </div>
                                           </td>
                                           <td className="px-6 py-4">
                                               <div className="flex flex-col items-start">
                                                   <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                                                       isPro 
                                                       ? 'bg-indigo-100 text-indigo-700 border-indigo-200' 
                                                       : 'bg-slate-100 text-slate-500 border-slate-200'
                                                   }`}>
                                                       {isPro ? 'PRO' : 'FREE'}
                                                   </span>
                                                   {isPro && (
                                                       <span className="text-[10px] text-slate-400 mt-1">Exp: {expiry}</span>
                                                   )}
                                               </div>
                                           </td>
                                           <td className="px-6 py-4 text-center">
                                               <span className={`px-2 py-1 rounded text-xs font-bold border ${user.totalStays > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                                   {user.totalStays} Stays
                                               </span>
                                           </td>
                                           <td className="px-6 py-4 text-right">
                                               <button 
                                                    onClick={() => openEditModal(user)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                               >
                                                   <Edit size={16} />
                                               </button>
                                           </td>
                                       </tr>
                                   );
                               })
                           )}
                       </tbody>
                   </table>
               </div>
           </div>
       ))}

       {activeTab === 'users' && editingUser && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
               <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
                   <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
                       <h2 className="font-bold flex items-center gap-2">
                           <CreditCard size={18} /> Modify User Plan
                       </h2>
                       <button onClick={() => setEditingUser(null)} className="hover:bg-white/10 p-1 rounded-full">
                           <X size={18} />
                       </button>
                   </div>
                   <div className="p-6 space-y-4">
                       <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-2">User</label>
                           <p className="text-sm font-bold text-slate-800">{editingUser.email}</p>
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Subscription Tier</label>
                           <div className="grid grid-cols-2 gap-2">
                               <button onClick={() => setEditStatus('free')} className={`py-2 rounded-lg text-sm font-bold border transition-all ${editStatus === 'free' ? 'bg-slate-100 border-slate-400 text-slate-700' : 'bg-white border-slate-200 text-slate-400'}`}>FREE</button>
                               <button onClick={() => setEditStatus('pro')} className={`py-2 rounded-lg text-sm font-bold border transition-all ${editStatus === 'pro' ? 'bg-indigo-100 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-400'}`}>PRO</button>
                           </div>
                       </div>
                       {editStatus === 'pro' && (
                           <div>
                               <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Renewal Date</label>
                               <input type="date" value={editExpiry} onChange={(e) => setEditExpiry(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                           </div>
                       )}
                       <div className="pt-4 flex gap-3">
                           <button onClick={() => setEditingUser(null)} className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-600 font-bold hover:bg-slate-50">Cancel</button>
                           <button onClick={handleSaveSubscription} disabled={saving} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 flex items-center justify-center gap-2">
                               {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
                           </button>
                       </div>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};