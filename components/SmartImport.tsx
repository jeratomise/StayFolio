import React, { useState } from 'react';
import { X, Sparkles, Loader2, AlertTriangle, Trash2, Plus, Check, ChevronLeft } from 'lucide-react';
import { parseStaysFromText, ParsedStay } from '../services/ai';
import { POPULAR_BRANDS, COUNTRIES } from '../constants';

interface SmartImportProps {
    onImport: (stays: any[]) => void;
    onClose: () => void;
}

export const SmartImport: React.FC<SmartImportProps> = ({ onImport, onClose }) => {
    const [step, setStep] = useState<'paste' | 'review'>('paste');
    const [rawText, setRawText] = useState('');
    const [parsing, setParsing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stays, setStays] = useState<(ParsedStay & { selected: boolean })[]>([]);
    const [importing, setImporting] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleParse = async () => {
        if (!rawText.trim()) return;
        setParsing(true);
        setError(null);
        try {
            const parsed = await parseStaysFromText(rawText);
            setStays(parsed.map(s => ({ ...s, selected: true })));
            setStep('review');
        } catch (err: any) {
            setError(err.message || 'Failed to parse text.');
        } finally {
            setParsing(false);
        }
    };

    const updateStay = (index: number, field: keyof ParsedStay, value: any) => {
        setStays(prev => prev.map((s, i) => i === index ? { ...s, [field]: value, confident: true } : s));
    };

    const toggleSelect = (index: number) => {
        setStays(prev => prev.map((s, i) => i === index ? { ...s, selected: !s.selected } : s));
    };

    const removeStay = (index: number) => {
        setStays(prev => prev.filter((_, i) => i !== index));
    };

    const addEmptyRow = () => {
        setStays(prev => [...prev, {
            hotelName: '', brand: POPULAR_BRANDS[0], country: '', checkInDate: '', checkOutDate: '',
            confident: true, selected: true
        }]);
    };

    const selectedCount = stays.filter(s => s.selected).length;

    const handleImport = () => {
        const toImport = stays
            .filter(s => s.selected && s.hotelName && s.brand && s.checkInDate && s.checkOutDate)
            .map(({ selected, confident, ...stay }) => stay);

        if (toImport.length === 0) return;
        setImporting(true);
        onImport(toImport);
        setSuccess(true);
        setTimeout(() => onClose(), 1500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        {step === 'review' && (
                            <button onClick={() => setStep('paste')} className="hover:bg-white/10 p-1.5 rounded-lg transition-colors">
                                <ChevronLeft size={20} />
                            </button>
                        )}
                        <div className="bg-white/10 p-2 rounded-lg">
                            <Sparkles size={22} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Smart Import</h2>
                            <p className="text-white/70 text-xs">
                                {step === 'paste' ? 'Paste your travel history — AI will parse it' : `Review ${stays.length} parsed stays`}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5">

                    {/* Step 1: Paste */}
                    {step === 'paste' && (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-slate-600 mb-3">
                                    Paste a table, CSV, email text, or any description of your hotel stays. The AI will extract and structure the data for you to review before importing.
                                </p>
                                <textarea
                                    value={rawText}
                                    onChange={e => setRawText(e.target.value)}
                                    placeholder={"Example:\n1. St. Regis Jakarta, Indonesia, Mar 13-15 2025\n2. Capella Hanoi, Vietnam, Apr 8 2025\n3. Grand Hyatt Jeju, South Korea, Apr 2025\n\nOr paste a table, CSV, or any format..."}
                                    className="w-full h-64 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            {error && (
                                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                                    <AlertTriangle size={16} className="shrink-0" />
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleParse}
                                disabled={parsing || !rawText.trim()}
                                className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            >
                                {parsing ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Parsing with AI...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        Parse with AI
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Step 2: Review */}
                    {step === 'review' && (
                        <div className="space-y-4">
                            {success ? (
                                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-6 rounded-xl text-center">
                                    <Check size={32} className="mx-auto mb-2" />
                                    <p className="font-bold">Successfully imported {selectedCount} stays!</p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-xs text-slate-500">
                                        Review and edit the parsed stays below. Rows marked with ⚠️ need attention. Uncheck rows you don't want to import.
                                    </p>

                                    {/* Table */}
                                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-slate-200">
                                                        <th className="px-3 py-2.5 text-left w-8">
                                                            <input
                                                                type="checkbox"
                                                                checked={stays.every(s => s.selected)}
                                                                onChange={() => {
                                                                    const allSelected = stays.every(s => s.selected);
                                                                    setStays(prev => prev.map(s => ({ ...s, selected: !allSelected })));
                                                                }}
                                                                className="rounded"
                                                            />
                                                        </th>
                                                        <th className="px-3 py-2.5 text-left text-xs font-bold text-slate-500 uppercase">Hotel</th>
                                                        <th className="px-3 py-2.5 text-left text-xs font-bold text-slate-500 uppercase">Brand</th>
                                                        <th className="px-3 py-2.5 text-left text-xs font-bold text-slate-500 uppercase">Country</th>
                                                        <th className="px-3 py-2.5 text-left text-xs font-bold text-slate-500 uppercase">Check-in</th>
                                                        <th className="px-3 py-2.5 text-left text-xs font-bold text-slate-500 uppercase">Check-out</th>
                                                        <th className="px-3 py-2.5 w-8"></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {stays.map((stay, i) => (
                                                        <tr key={i} className={`border-b border-slate-100 ${!stay.selected ? 'opacity-40' : ''} ${!stay.confident ? 'bg-amber-50/50' : ''}`}>
                                                            <td className="px-3 py-2">
                                                                <input type="checkbox" checked={stay.selected} onChange={() => toggleSelect(i)} className="rounded" />
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                <div className="flex items-center gap-1">
                                                                    {!stay.confident && <AlertTriangle size={12} className="text-amber-500 shrink-0" />}
                                                                    <input
                                                                        type="text"
                                                                        value={stay.hotelName}
                                                                        onChange={e => updateStay(i, 'hotelName', e.target.value)}
                                                                        className="w-full min-w-[160px] px-2 py-1 bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-400 rounded text-sm outline-none transition-colors"
                                                                    />
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                <select
                                                                    value={stay.brand}
                                                                    onChange={e => updateStay(i, 'brand', e.target.value)}
                                                                    className={`w-full min-w-[140px] px-2 py-1 border rounded text-sm outline-none transition-colors ${
                                                                        POPULAR_BRANDS.includes(stay.brand)
                                                                            ? 'border-transparent hover:border-slate-200 focus:border-indigo-400 bg-transparent'
                                                                            : 'border-amber-300 bg-amber-50 text-amber-800'
                                                                    }`}
                                                                >
                                                                    {!POPULAR_BRANDS.includes(stay.brand) && (
                                                                        <option value={stay.brand}>⚠️ {stay.brand}</option>
                                                                    )}
                                                                    {POPULAR_BRANDS.map(b => (
                                                                        <option key={b} value={b}>{b}</option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                <select
                                                                    value={stay.country}
                                                                    onChange={e => updateStay(i, 'country', e.target.value)}
                                                                    className="w-full min-w-[120px] px-2 py-1 bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-400 rounded text-sm outline-none transition-colors"
                                                                >
                                                                    <option value="">Select...</option>
                                                                    {COUNTRIES.map(c => (
                                                                        <option key={c} value={c}>{c}</option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                <input
                                                                    type="date"
                                                                    value={stay.checkInDate}
                                                                    onChange={e => updateStay(i, 'checkInDate', e.target.value)}
                                                                    className="px-2 py-1 bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-400 rounded text-sm outline-none transition-colors"
                                                                />
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                <input
                                                                    type="date"
                                                                    value={stay.checkOutDate}
                                                                    onChange={e => updateStay(i, 'checkOutDate', e.target.value)}
                                                                    className="px-2 py-1 bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-400 rounded text-sm outline-none transition-colors"
                                                                />
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                <button onClick={() => removeStay(i)} className="p-1 text-slate-300 hover:text-rose-500 transition-colors">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <button
                                        onClick={addEmptyRow}
                                        className="text-sm text-indigo-600 font-bold flex items-center gap-1 hover:text-indigo-800 transition-colors"
                                    >
                                        <Plus size={14} /> Add row manually
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {step === 'review' && !success && (
                    <div className="border-t border-slate-200 p-4 flex items-center justify-between bg-slate-50 shrink-0">
                        <p className="text-sm text-slate-500">
                            <span className="font-bold text-slate-800">{selectedCount}</span> of {stays.length} stays selected
                        </p>
                        <button
                            onClick={handleImport}
                            disabled={importing || selectedCount === 0}
                            className="bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                        >
                            {importing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            Import {selectedCount} Stays
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
