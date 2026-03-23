import React, { useState, useRef } from 'react';
import { supabase } from '../services/supabase';
import { uploadUserAvatar } from '../services/storage';
import { User, Lock, Upload, Download, LogOut, Camera, Loader2, KeyRound, ShieldAlert, Mail, CreditCard, Check, Crown } from 'lucide-react';

interface ProfileViewProps {
  user: any; // Supabase user object
  onOpenDataModal: () => void;
  isPro: boolean;
  onTogglePro: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onOpenDataModal, isPro, onTogglePro }) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.user_metadata?.avatar_url || null);
  const [uploading, setUploading] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAdmin = user?.email === 'jeratomise@gmail.com';

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }
      const file = event.target.files[0];
      const publicUrl = await uploadUserAvatar(file);
      
      if (publicUrl) {
          setAvatarUrl(publicUrl);
      }
    } catch (error) {
      alert('Error uploading avatar: ' + (error as any).message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: password });
    if (error) {
        alert("Error updating password: " + error.message);
    } else {
        alert("Password updated successfully!");
        setPassword('');
    }
    setPasswordLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-24">
      
      {/* Header */}
      <div className="text-center space-y-2">
         <div className="inline-block p-3 bg-indigo-100 rounded-full text-indigo-600 mb-2">
            <User size={32} />
         </div>
         <h1 className="text-3xl font-black text-slate-800 tracking-tight">Your Profile</h1>
         <div className="flex items-center justify-center gap-2">
             <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${isPro ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                 {isPro ? 'PRO MEMBER' : 'FREE PLAN'}
             </span>
         </div>
      </div>

      {/* 1. Profile Identity Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
         <div className="p-8 flex flex-col items-center">
            
            {/* Avatar */}
            <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-50 shadow-inner bg-slate-100 flex items-center justify-center">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <User size={64} className="text-slate-300" />
                    )}
                    {uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
                            <Loader2 size={32} className="animate-spin" />
                        </div>
                    )}
                </div>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-1 right-1 bg-indigo-600 text-white p-2.5 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
                    title="Upload Photo"
                >
                    <Camera size={18} />
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleAvatarChange} 
                    className="hidden" 
                    accept="image/*"
                />
            </div>

            <h2 className="mt-4 text-xl font-bold text-slate-800">{user.email}</h2>
            <div className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                <Mail size={12} />
                {user.role === 'authenticated' ? 'Verified User' : 'Guest'}
            </div>
         </div>
      </div>

      {/* 2. Subscription Management (Mock) */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl shadow-indigo-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-3 opacity-10">
              <Crown size={120} />
          </div>
          <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4 text-indigo-400">
                   <CreditCard size={20} />
                   <h3 className="font-bold text-lg">Subscription Tier</h3>
              </div>
              <p className="text-slate-300 mb-6 max-w-sm">
                  {isPro 
                    ? "You are currently enjoying full access to StayFolio Pro, including multi-status tracking and AI Concierge."
                    : "You are on the Free plan. Upgrade to track multiple status programs and access the AI Concierge."
                  }
              </p>
              <button 
                onClick={onTogglePro}
                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    isPro 
                    ? 'bg-white/10 hover:bg-white/20 text-white' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg'
                }`}
              >
                  {isAdmin 
                      ? (isPro ? 'Simulate Free View (Admin)' : 'Restore Admin Access')
                      : (isPro ? 'Manage Subscription' : 'Upgrade to Pro')
                  }
              </button>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 3. Data Management */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
               <div className="flex items-center gap-2 text-indigo-600 mb-2">
                   <Upload size={20} />
                   <h3 className="font-bold text-lg text-slate-800">Data & Privacy</h3>
               </div>
               <p className="text-sm text-slate-500">
                   Export your entire stay history as a JSON file or import data from a backup.
               </p>
               <button 
                   onClick={onOpenDataModal}
                   className="w-full py-3 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-bold rounded-xl border border-slate-200 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
               >
                   <Download size={18} />
                   Manage Data
               </button>
          </div>

          {/* 4. Security (Password) */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
               <div className="flex items-center gap-2 text-amber-500 mb-2">
                   <KeyRound size={20} />
                   <h3 className="font-bold text-lg text-slate-800">Security</h3>
               </div>
               <form onSubmit={handleUpdatePassword} className="space-y-3">
                   <div className="relative">
                       <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                       <input 
                           type="password"
                           value={password}
                           onChange={(e) => setPassword(e.target.value)}
                           placeholder="New Password"
                           minLength={6}
                           className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-200 outline-none"
                       />
                   </div>
                   <button 
                       type="submit"
                       disabled={!password || passwordLoading}
                       className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                       {passwordLoading ? <Loader2 size={16} className="animate-spin" /> : 'Update Password'}
                   </button>
               </form>
          </div>
      </div>

      {/* 5. Danger Zone */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-rose-100">
           <div className="flex items-center gap-2 text-rose-600 mb-4">
               <ShieldAlert size={20} />
               <h3 className="font-bold text-lg">Account Actions</h3>
           </div>
           
           <button 
               onClick={() => supabase.auth.signOut()}
               className="w-full py-3 bg-white border border-rose-200 text-rose-600 font-bold rounded-xl hover:bg-rose-50 transition-colors flex items-center justify-center gap-2"
           >
               <LogOut size={18} />
               Sign Out of Account
           </button>
      </div>

    </div>
  );
};