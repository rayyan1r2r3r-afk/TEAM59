import React, { useMemo } from 'react';
import { AuditResult } from '../types';
import { CheckCircle, XCircle, AlertTriangle, TrendingDown, ClipboardCheck, AlertOctagon, Check, FileSpreadsheet } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import * as XLSX from 'xlsx';

interface AuditReportProps {
  result: AuditResult;
}

const AuditReport: React.FC<AuditReportProps> = ({ result }) => {
  const isApproved = result.decision === 'APPROVED';
  const isRejected = result.decision === 'REJECTED';
  const isPartial = result.decision === 'PARTIAL_APPROVAL';

  // Classical Color Palette
  const chartData = useMemo(() => [
    { name: 'Approved', value: result.final_approved_amount, color: '#059669' }, // Emerald 600
    { name: 'Deducted', value: result.total_billed_amount - result.final_approved_amount, color: '#BE123C' }, // Rose 700
  ], [result.final_approved_amount, result.total_billed_amount]);

  const handleDownloadExcel = () => {
    const wb = XLSX.utils.book_new();

    const summaryData = [
      ["Audit Summary Report", ""],
      ["Date", new Date().toLocaleDateString()],
      ["", ""],
      ["OVERALL DECISION", result.decision],
      ["Confidence Score", `${result.confidence_score}%`],
      ["Total Billed Amount", result.total_billed_amount],
      ["Final Approved Amount", result.final_approved_amount],
      ["Summary", result.summary],
      ["", ""],
      ["POLICY CHECKS", ""],
      ["Limit Met", result.policy_check.limit_met ? "Yes" : "No"],
      ["Exclusions Found", result.policy_check.exclusions_found ? "Yes" : "No"],
      ["Waiting Period Served", result.policy_check.waiting_period_met ? "Yes" : "No"],
      ["Pre-Auth Valid", result.policy_check.pre_auth_valid ? "Yes" : "No"],
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 25 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Audit Summary");

    const itemsData = result.item_analysis.map(item => ({
      "Service Name": item.item_name,
      "Billed Amount": item.billed_amount,
      "Standard Rate": item.standard_amount,
      "Status": item.status,
      "AI Remarks": item.remarks
    }));

    const wsItems = XLSX.utils.json_to_sheet(itemsData);
    wsItems['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, wsItems, "Line Item Analysis");

    XLSX.writeFile(wb, `Audit_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Formal Paper Report Header */}
      <div className="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-200 p-8 relative overflow-hidden">
        {/* Decorative top border */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${isApproved ? 'bg-emerald-600' : isRejected ? 'bg-rose-600' : 'bg-amber-500'}`}></div>
        
        <div className="flex flex-col md:flex-row justify-between gap-8">
           <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                 <span className={`px-3 py-1 rounded text-[11px] font-bold uppercase tracking-widest border ${
                   isApproved ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 
                   isRejected ? 'bg-rose-50 text-rose-800 border-rose-200' : 
                   'bg-amber-50 text-amber-800 border-amber-200'
                 }`}>
                   Audit Decision
                 </span>
              </div>
              
              <div className="flex items-start gap-4 mb-4">
                 {isApproved && <CheckCircle size={40} className="text-emerald-700 mt-1" strokeWidth={1.5} />}
                 {isRejected && <XCircle size={40} className="text-rose-700 mt-1" strokeWidth={1.5} />}
                 {isPartial && <AlertTriangle size={40} className="text-amber-600 mt-1" strokeWidth={1.5} />}
                 <div>
                    <h2 className={`text-4xl font-serif font-bold tracking-tight text-slate-900 mb-2`}>
                      {result.decision.replace('_', ' ')}
                    </h2>
                    <p className="text-slate-600 leading-relaxed max-w-2xl font-light text-lg">
                      {result.summary}
                    </p>
                 </div>
              </div>
           </div>
           
           <div className="flex flex-col gap-4 min-w-[200px]">
               <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 text-center">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">AI Confidence</div>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-serif font-bold text-slate-800">{result.confidence_score}</span>
                    <span className="text-sm font-medium text-slate-500">%</span>
                  </div>
               </div>
               
               <button 
                onClick={handleDownloadExcel}
                className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 py-3 px-4 rounded-lg text-sm font-bold border border-slate-300 transition-all shadow-sm"
               >
                 <FileSpreadsheet size={16} className="text-emerald-600" /> Download Report
               </button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Cost Analysis Card */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col">
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
            <h3 className="text-xl font-serif font-bold text-slate-900 flex items-center gap-3">
              Financial Breakdown
            </h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">INR Currency</span>
          </div>
          
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
             <div className="h-56 w-full relative">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={chartData}
                     cx="50%"
                     cy="50%"
                     innerRadius={55}
                     outerRadius={80}
                     paddingAngle={2}
                     dataKey="value"
                     stroke="none"
                   >
                     {chartData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                   <RechartsTooltip 
                      formatter={(value: number) => `₹${value.toLocaleString()}`} 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      itemStyle={{ color: '#1e293b', fontWeight: 600, fontFamily: 'serif' }}
                    />
                 </PieChart>
               </ResponsiveContainer>
               {/* Center text in donut */}
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Billed</span>
                  <span className="text-2xl font-serif font-bold text-slate-900">₹{(result.total_billed_amount/1000).toFixed(1)}k</span>
               </div>
             </div>
             
             <div className="space-y-4">
                <div className="flex justify-between items-end p-3 border-b border-slate-100">
                   <div>
                     <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Claimed</div>
                     <div className="text-2xl font-serif font-bold text-slate-800">₹{result.total_billed_amount.toLocaleString()}</div>
                   </div>
                   <div className="text-slate-300 mb-1"><TrendingDown size={18} /></div>
                </div>
                
                <div className="flex justify-between items-end p-3 border-b border-emerald-100 bg-emerald-50/30">
                   <div>
                     <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Approved Amount</div>
                     <div className="text-2xl font-serif font-bold text-emerald-800">₹{result.final_approved_amount.toLocaleString()}</div>
                   </div>
                   <div className="text-emerald-500 mb-1"><Check size={18} /></div>
                </div>

                <div className="flex justify-between items-end p-3 border-b border-rose-100 bg-rose-50/30">
                   <div>
                     <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wider mb-1">Rejected Amount</div>
                     <div className="text-2xl font-serif font-bold text-rose-800">₹{(result.total_billed_amount - result.final_approved_amount).toLocaleString()}</div>
                   </div>
                   <div className="text-rose-400 mb-1"><XCircle size={18} /></div>
                </div>
             </div>
          </div>
        </div>

        {/* Policy Validation Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h3 className="text-xl font-serif font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">
            Policy Compliance
          </h3>
          <div className="space-y-4">
             <CheckItem label="Room Rent Limit" status={result.policy_check.limit_met} passText="Compliant" failText="Exceeded" />
             <CheckItem label="Policy Exclusions" status={!result.policy_check.exclusions_found} passText="None Found" failText="Detected" />
             <CheckItem label="Waiting Period" status={result.policy_check.waiting_period_met} passText="Served" failText="Not Served" />
             <CheckItem label="Pre-Auth Status" status={result.policy_check.pre_auth_valid} passText="Matched" failText="Mismatch" />
          </div>
          
          {result.rejection_reasons.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-200">
              <h4 className="text-[10px] font-bold text-rose-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertTriangle size={12} /> Violations
              </h4>
              <ul className="space-y-3">
                {result.rejection_reasons.map((reason, idx) => (
                  <li key={idx} className="text-sm text-slate-700 font-medium flex items-start gap-3">
                    <span className="mt-1.5 block min-w-[4px] w-[4px] h-[4px] rounded-full bg-rose-500 shrink-0"></span>
                    <span className="leading-snug">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Line Item Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
           <h3 className="text-lg font-serif font-bold text-slate-900">Line Item Audit</h3>
           <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 bg-white border border-slate-200 rounded text-slate-500">
              {result.item_analysis.length} Entries
           </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Service Description</th>
                <th className="px-4 py-4 text-right">Billed</th>
                <th className="px-4 py-4 text-right">Reference</th>
                <th className="px-4 py-4 text-center">Verdict</th>
                <th className="px-6 py-4">Observation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.item_analysis.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-800">{item.item_name}</td>
                  <td className="px-4 py-4 text-right text-slate-600 font-mono">₹{item.billed_amount.toLocaleString()}</td>
                  <td className="px-4 py-4 text-right text-slate-400 font-mono">₹{item.standard_amount.toLocaleString()}</td>
                  <td className="px-4 py-4 text-center">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-6 py-4 text-slate-600 italic max-w-xs">{item.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Correction Steps */}
      {result.correction_steps.length > 0 && (
         <div className="bg-slate-900 rounded-xl p-8 text-white shadow-lg">
            <h3 className="text-xl font-serif font-bold mb-6 flex items-center gap-2 text-amber-500">
               <AlertOctagon size={20} /> 
               Remedial Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {result.correction_steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                     <div className="bg-amber-600/20 text-amber-500 font-serif font-bold rounded border border-amber-600/50 w-8 h-8 flex items-center justify-center flex-shrink-0 text-sm">
                        {idx + 1}
                     </div>
                     <span className="text-slate-300 text-sm leading-relaxed mt-1">{step}</span>
                  </div>
               ))}
            </div>
         </div>
      )}
    </div>
  );
};

const CheckItem = ({ label, status, passText, failText }: { label: string, status: boolean, passText: string, failText: string }) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
    <span className="text-sm font-medium text-slate-600">{label}</span>
    {status ? (
       <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
         <Check size={12} strokeWidth={3} /> {passText}
       </span>
    ) : (
       <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1">
         <XCircle size={12} strokeWidth={3} /> {failText}
       </span>
    )}
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    'OK': 'text-emerald-700 bg-emerald-50 border-emerald-100',
    'OVERPRICED': 'text-amber-700 bg-amber-50 border-amber-100',
    'DENIED': 'text-rose-700 bg-rose-50 border-rose-100',
    'PARTIAL': 'text-blue-700 bg-blue-50 border-blue-100'
  };
  const config = styles[status as keyof typeof styles] || styles['OK'];
  
  return (
    <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${config}`}>
      {status}
    </span>
  );
};

export default AuditReport;