import React, { useState, useRef } from 'react';
import { X, Upload, Download, FileJson, AlertCircle, Check, Copy, FileCode } from 'lucide-react';

interface DataManagementModalProps {
  onClose: () => void;
  onImport: (data: any[]) => void;
  onExport: () => void;
  currentStaysCount: number;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({ onClose, onImport, onExport, currentStaysCount }) => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  const sampleData = `[
  {
    "hotelName": "Grand Hyatt Tokyo",
    "brand": "World of Hyatt",
    "country": "Japan",
    "checkInDate": "2025-01-15",
    "checkOutDate": "2025-01-20",
    "cost": 1500,
    "rating": 5
  },
  {
    "hotelName": "Marriott Marquis NY",
    "brand": "Marriott Bonvoy",
    "country": "United States of America",
    "checkInDate": "2025-02-10",
    "checkOutDate": "2025-02-12",
    "cost": 850,
    "rating": 4
  }
]`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(null);
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          if (Array.isArray(json)) {
            onImport(json);
            setSuccess(`Successfully imported ${json.length} stays!`);
            setTimeout(() => {
                onClose();
            }, 1500);
          } else {
            setError('File must contain a JSON array (list) of stays.');
          }
        } catch (error) {
          setError('Invalid JSON file. Please check the format.');
        }
      };
      reader.onerror = () => setError('Error reading file.');
      reader.readAsText(file);
    }
    // Reset
    if (event.target) event.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
             <div className="bg-white/10 p-2 rounded-lg">
                <FileJson size={24} />
             </div>
             <div>
                <h2 className="text-xl font-bold">Data Management</h2>
                <p className="text-slate-400 text-xs">Import or export your stay history</p>
             </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
            
            {/* Export Section */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className="font-bold text-slate-800">Backup Your Data</h3>
                    <p className="text-sm text-slate-500 mt-1">
                        Download a copy of your {currentStaysCount} stays. You can use this file to restore data later.
                    </p>
                </div>
                <button 
                    onClick={onExport}
                    className="flex items-center gap-2 bg-white border border-slate-300 hover:border-indigo-500 hover:text-indigo-600 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-sm whitespace-nowrap"
                >
                    <Download size={16} />
                    Export JSON
                </button>
            </div>

            <hr className="border-slate-100" />

            {/* Import Section */}
            <div className="space-y-4">
                <div>
                    <h3 className="font-bold text-slate-800 text-lg">Mass Import Stays</h3>
                    <p className="text-slate-500 text-sm mt-1">
                        Upload a <code>.json</code> file to add multiple stays at once. 
                        The file should contain an array of objects with the fields shown below.
                    </p>
                </div>

                {/* Code Sample */}
                <div className="relative group">
                    <div className="absolute top-3 right-3 z-10">
                        <button 
                            onClick={handleCopy}
                            className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-md backdrop-blur-md transition-colors border border-white/10"
                            title="Copy to clipboard"
                        >
                            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        </button>
                    </div>
                    <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto text-xs font-mono text-slate-300 shadow-inner border border-slate-800">
                        <pre>{sampleData}</pre>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                        <FileCode size={12} />
                        Fields: <code>hotelName</code>, <code>brand</code>, <code>checkInDate</code> (YYYY-MM-DD), <code>checkOutDate</code> (YYYY-MM-DD) are required.
                    </p>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm flex items-center gap-3">
                        <AlertCircle size={18} className="shrink-0" />
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm flex items-center gap-3">
                        <Check size={18} className="shrink-0" />
                        {success}
                    </div>
                )}

                {/* Upload Button */}
                <div className="pt-2">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        accept=".json"
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-4 border-2 border-dashed border-indigo-200 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-400 text-indigo-700 rounded-xl transition-all flex flex-col items-center justify-center gap-2 group"
                    >
                        <div className="bg-white p-3 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                            <Upload size={24} className="text-indigo-600" />
                        </div>
                        <span className="font-bold">Select JSON File to Import</span>
                        <span className="text-xs text-indigo-400">or drag and drop here (if supported)</span>
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
