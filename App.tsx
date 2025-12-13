import React, { useState, useCallback, useEffect } from 'react';
import { ClaimData, AuditResult } from './types';
import { auditClaim } from './services/geminiService';
import InputForm from './components/InputForm';
import AuditReport from './components/AuditReport';
import { ShieldCheck, History, PlusCircle, Bell, Menu, X, ChevronRight } from 'lucide-react';

// --- Simple Toast Component ---
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium animate-fadeIn flex items-center gap-3 ${type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
      <span>{message}</span>
      <button onClick={onClose}><X size={16} /></button>
    </div>
  );
};

const App: React.FC = () => {
  // Navigation State
  const [view, setView] = useState<'new-audit' | 'history'>('new-audit');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // App Data State
  const [history, setHistory] = useState<AuditResult[]>([]);

  // Audit Process State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentResult, setCurrentResult] = useState<AuditResult | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // Load from LocalStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('claimGuard_history');
    if (savedHistory) {
      const parsed = JSON.parse(savedHistory);
      setHistory(parsed);
    }
  }, []);

  const handleAnalyze = useCallback(async (data: ClaimData) => {
    setIsAnalyzing(true);
    setToast(null);
    
    try {
      const result = await auditClaim(data);
      setCurrentResult(result);
      
      // Update History
      const newHistory = [result, ...history];
      setHistory(newHistory);
      localStorage.setItem('claimGuard_history', JSON.stringify(newHistory));
      
      setToast({ message: "Audit Completed Successfully", type: 'success' });
    } catch (err: any) {
      console.error(err);
      setToast({ message: err.message || "Audit Failed", type: 'error' });
    } finally {
      setIsAnalyzing(false);
    }
  }, [history]);

  const resetAudit = useCallback(() => {
    setCurrentResult(null);
    setView('new-audit');
  }, []);

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-slate-800 flex font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-[#0F172A] text-slate-300 w-64 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 border-r border-amber-600/20`}>
        <div className="h-20 flex items-center px-6 border-b border-slate-800">
          <ShieldCheck className="text-amber-500 mr-3" size={28} />
          <h1 className="text-xl font-serif font-medium text-white tracking-wide">ClaimGuard <span className="text-amber-500 italic">AI</span></h1>
        </div>
        
        <nav className="p-4 space-y-2 mt-4">
           <button onClick={() => setView('new-audit')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${view === 'new-audit' ? 'bg-amber-600 text-white' : 'hover:bg-slate-800'}`}>
              <PlusCircle size={18} /> New Audit
           </button>
           <button onClick={() => setView('history')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${view === 'history' ? 'bg-amber-600 text-white' : 'hover:bg-slate-800'}`}>
              <History size={18} /> History
           </button>
        </nav>
        
        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
           <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">SA</div>
              <div className="text-xs">
                 <div className="text-white font-bold">System Admin</div>
                 <div className="text-slate-500">admin@claimguard.ai</div>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
           <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-slate-500">
             <Menu size={24} />
           </button>
           <div className="ml-auto flex items-center gap-4">
              <button className="text-slate-400 hover:text-slate-600 relative">
                 <Bell size={20} />
                 <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
           </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
           
           {view === 'new-audit' && (
             <div className="max-w-7xl mx-auto">
               {!currentResult ? (
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start animate-fadeIn">
                    <div className="lg:col-span-5">
                       <h2 className="text-3xl font-serif text-slate-900 mb-6">New Claim Audit</h2>
                       <InputForm onSubmit={handleAnalyze} isAnalyzing={isAnalyzing} />
                    </div>
                    <div className="lg:col-span-7">
                       {/* Placeholder / Skeleton */}
                       <div className="h-full min-h-[500px] bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center text-center p-12">
                         {isAnalyzing ? (
                           <div className="space-y-8 w-full max-w-md">
                              <div className="flex justify-center"><div className="w-16 h-16 border-4 border-slate-100 border-t-amber-600 rounded-full animate-spin"></div></div>
                              <div className="space-y-4">
                                 <div className="h-4 bg-slate-100 rounded w-3/4 mx-auto animate-pulse"></div>
                                 <div className="h-4 bg-slate-100 rounded w-1/2 mx-auto animate-pulse"></div>
                                 <div className="h-32 bg-slate-50 rounded-lg w-full animate-pulse mt-8"></div>
                              </div>
                              <p className="text-sm font-medium text-slate-400">AI is fetching market rates via Google Search...</p>
                           </div>
                         ) : (
                           <div className="opacity-50">
                             <ShieldCheck size={64} className="mx-auto mb-4 text-slate-300" strokeWidth={1} />
                             <h3 className="text-xl font-serif text-slate-400">Ready to Analyze</h3>
                           </div>
                         )}
                       </div>
                    </div>
                 </div>
               ) : (
                 <div className="animate-fadeIn">
                    <div className="flex justify-between items-center mb-6">
                       <h2 className="text-3xl font-serif text-slate-900">Audit Results</h2>
                       <button onClick={resetAudit} className="text-slate-500 hover:text-amber-600 flex items-center gap-2 text-sm font-bold">
                         <ChevronRight size={16} className="rotate-180" /> Back to Form
                       </button>
                    </div>
                    <AuditReport result={currentResult} />
                 </div>
               )}
             </div>
           )}

           {view === 'history' && (
             <div className="space-y-6 animate-fadeIn">
                <h2 className="text-3xl font-serif text-slate-900">Audit History</h2>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                   <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-slate-200">
                        <tr>
                           <th className="px-6 py-4">Date</th>
                           <th className="px-6 py-4">Claim ID</th>
                           <th className="px-6 py-4">Total Billed</th>
                           <th className="px-6 py-4">Approved</th>
                           <th className="px-6 py-4">Status</th>
                           <th className="px-6 py-4">Action</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {history.map((audit, i) => (
                           <tr key={i} className="hover:bg-slate-50">
                              <td className="px-6 py-4">{new Date(audit.auditDate).toLocaleDateString()}</td>
                              <td className="px-6 py-4 font-mono text-slate-600">{audit.claimId}</td>
                              <td className="px-6 py-4">₹{audit.total_billed_amount.toLocaleString()}</td>
                              <td className="px-6 py-4 font-bold text-slate-800">₹{audit.final_approved_amount.toLocaleString()}</td>
                              <td className="px-6 py-4">
                                 <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${audit.decision === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                    {audit.decision}
                                 </span>
                              </td>
                              <td className="px-6 py-4">
                                 <button onClick={() => { setCurrentResult(audit); setView('new-audit'); }} className="text-amber-600 hover:underline">View</button>
                              </td>
                           </tr>
                        ))}
                        {history.length === 0 && (
                           <tr><td colSpan={6} className="p-8 text-center text-slate-400 italic">No history available</td></tr>
                        )}
                     </tbody>
                   </table>
                </div>
             </div>
           )}
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default App;