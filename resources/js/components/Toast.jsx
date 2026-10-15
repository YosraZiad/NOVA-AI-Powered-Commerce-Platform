import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
    if (!toast) return null;

    const icons = {
        success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
        error: <XCircle className="w-5 h-5 text-rose-600 shrink-0" />,
        info: <Info className="w-5 h-5 text-indigo-600 shrink-0" />
    };

    const borders = {
        success: 'border-emerald-200 bg-white shadow-emerald-500/10',
        warning: 'border-amber-200 bg-white shadow-amber-500/10',
        error: 'border-rose-200 bg-white shadow-rose-500/10',
        info: 'border-indigo-200 bg-white shadow-indigo-500/10'
    };

    return (
        <div className="fixed bottom-6 left-6 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div className={`flex items-start gap-3 p-4 rounded-2xl border shadow-xl ${borders[toast.type || 'info']}`}>
                {icons[toast.type || 'info']}
                <div className="flex-1 min-w-0">
                    {toast.title && (
                        <h4 className="text-xs font-bold text-slate-900 mb-0.5">{toast.title}</h4>
                    )}
                    <p className="text-xs text-slate-600 leading-relaxed">{toast.message}</p>
                </div>
                {onClose && (
                    <button 
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
