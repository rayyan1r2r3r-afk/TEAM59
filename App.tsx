import React, { useState } from 'react';
import { ClaimData, AuditResult } from './types';
import { auditClaim } from './services/geminiService';
import InputForm from './components/InputForm';
import AuditReport from './components/AuditReport';
import { ShieldCheck, RefreshCw, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (data: ClaimData) => {
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
  };

  const resetAudit = () => {
    setAuditResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/40 via-slate-50 to-slate-50 font-sans text-slate-900 pb-12 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Glassmorphic Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-18 items-center py-3">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200">
                <ShieldCheck className="text-white" size={24} />
              </div>
              <div className="flex flex-col">
                 <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">ClaimGuard <span className="text-indigo-600">AI</span></h1>
                 <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-1">IRDAI Compliant Audit</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {auditResult && (
                <button 
                  onClick={resetAudit}
                  className="group flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100/50 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-lg transition-all"
                >
                  <RefreshCw size={16} className="text-slate-400 group-hover:rotate-180 transition-transform duration-500" /> 
                  New Audit
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {error && (
          <div className="mb-8 animate-fadeIn">
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
                <div className="bg-red-100 p-2 rounded-full">
                  <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-red-800">Audit Failed</h3>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Input Form */}
          <div className={`lg:col-span-5 transition-all duration-500 ${auditResult ? 'hidden lg:block lg:opacity-40 lg:pointer-events-none lg:scale-95 blur-[1px]' : ''}`}>
             {!auditResult && (
                <div className="mb-6 animate-fadeIn">
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight">New Claim Audit</h2>
                  <p className="text-slate-500 mt-1">Input patient data & bill details to detect anomalies.</p>
                </div>
             )}
             <InputForm onSubmit={handleAnalyze} isAnalyzing={isAnalyzing} />
          </div>

          {/* Right Column: Results or Placeholder */}
          <div className="lg:col-span-7">
             {auditResult ? (
               <AuditReport result={auditResult} />
             ) : (
               <div className="h-full min-h-[600px] bg-white/60 backdrop-blur-sm border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-center p-10 transition-all hover:border-indigo-200 hover:bg-white/80">
                  {isAnalyzing ? (
                     <div className="space-y-6 relative">
                        <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-10 rounded-full"></div>
                        <div className="relative">
                          <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto shadow-xl shadow-indigo-100"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="text-indigo-600 animate-pulse" size={24} />
                          </div>
                        </div>
                        <div className="space-y-2">
                           <h3 className="text-xl font-bold text-slate-800">Analyzing Claim...</h3>
                           <p className="text-slate-500 text-sm max-w-[280px] mx-auto leading-relaxed">
                             Our AI is cross-referencing IRDAI guidelines, checking ICD-10 codes, and validating prices.
                           </p>
                        </div>
                     </div>
                  ) : (
                     <div className="max-w-sm mx-auto space-y-6">
                        <div className="w-24 h-24 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-slate-100 rotate-3 transform transition-transform hover:rotate-6">
                           <ShieldCheck size={48} className="text-slate-300" />
                        </div>
                        <div>
                           <h3 className="text-2xl font-bold text-slate-800 mb-2">Ready to Audit</h3>
                           <p className="text-slate-500 leading-relaxed">
                              Fill out the claim details on the left. You can upload a bill image or enter data manually to get an instant AI audit report.
                           </p>
                        </div>
                        <div className="flex justify-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                          <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                          <div className="h-2 w-2 rounded-full bg-slate-300"></div>
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