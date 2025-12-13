import React, { useState, useCallback } from 'react';
import { ClaimData, AuditResult } from './types';
import { auditClaim } from './services/geminiService';
import InputForm from './components/InputForm';
import AuditReport from './components/AuditReport';
import { ShieldCheck, RefreshCw, Sparkles, FileText } from 'lucide-react';

const App: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = useCallback(async (data: ClaimData) => {
    setIsAnalyzing(true);
    setError(null);
    setAuditResult(null);
    
    try {
      const result = await auditClaim(data);
      setAuditResult(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during the audit.");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const resetAudit = useCallback(() => {
    setAuditResult(null);
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-slate-800 pb-12 selection:bg-amber-100 selection:text-amber-900">
      {/* Modern Classic Navbar: Dark Navy with Gold Accents */}
      <nav className="sticky top-0 z-50 bg-[#0F172A] border-b border-amber-600/30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-4">
              <div className="bg-white/10 p-2 rounded-lg border border-white/10">
                <ShieldCheck className="text-amber-500" size={28} strokeWidth={1.5} />
              </div>
              <div className="flex flex-col">
                 <h1 className="text-2xl font-serif font-medium text-white tracking-wide">ClaimGuard <span className="text-amber-500 italic">AI</span></h1>
                 <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400 mt-0.5">IRDAI Compliance & Audit</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {auditResult && (
                <button 
                  onClick={resetAudit}
                  className="group flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white border border-slate-600 hover:border-amber-500 rounded-lg transition-all duration-300"
                >
                  <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-700" /> 
                  New Audit
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        {error && (
          <div className="mb-8 animate-fadeIn">
            <div className="bg-red-50 border-l-4 border-red-800 p-4 flex items-start gap-4 shadow-sm">
                <div className="text-red-800 mt-0.5">
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-serif font-bold text-red-900">Audit Processing Failed</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: Input Form */}
          <div className={`lg:col-span-5 transition-all duration-700 ${auditResult ? 'hidden lg:block lg:opacity-40 lg:pointer-events-none grayscale' : ''}`}>
             {!auditResult && (
                <div className="mb-8 animate-fadeIn border-b border-slate-200 pb-4">
                  <h2 className="text-3xl font-serif text-slate-900">New Claim Audit</h2>
                  <p className="text-slate-500 mt-2 font-light">Enter patient and policy details to initiate the AI verification process.</p>
                </div>
             )}
             <InputForm onSubmit={handleAnalyze} isAnalyzing={isAnalyzing} />
          </div>

          {/* Right Column: Results or Placeholder */}
          <div className="lg:col-span-7">
             {auditResult ? (
               <AuditReport result={auditResult} />
             ) : (
               <div className="h-full min-h-[600px] bg-white border border-slate-200 rounded-xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center text-center p-12 transition-all">
                  {isAnalyzing ? (
                     <div className="space-y-8 relative">
                        <div className="relative">
                          <div className="w-24 h-24 border-2 border-slate-100 border-t-amber-600 rounded-full animate-spin mx-auto"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="text-amber-600 animate-pulse" size={28} />
                          </div>
                        </div>
                        <div className="space-y-3">
                           <h3 className="text-2xl font-serif text-slate-900">Analyzing Documents...</h3>
                           <p className="text-slate-500 text-sm max-w-[280px] mx-auto leading-relaxed font-medium">
                             Cross-referencing IRDAI protocols, checking medical codes, and validating pricing structures.
                           </p>
                        </div>
                     </div>
                  ) : (
                     <div className="max-w-md mx-auto space-y-8">
                        <div className="w-28 h-28 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
                           <FileText size={48} className="text-slate-300" strokeWidth={1} />
                        </div>
                        <div>
                           <h3 className="text-2xl font-serif text-slate-800 mb-3">Ready for Analysis</h3>
                           <p className="text-slate-500 leading-relaxed font-light">
                              Please complete the form on the left. You may upload a bill image or input line items manually to generate a comprehensive audit report.
                           </p>
                        </div>
                     </div>
                  )}
               </div>
             )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;