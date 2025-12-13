import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Plus, Trash2, FileText, Shield, User, Users, Stethoscope, ChevronRight, ScanLine, FileSpreadsheet, Edit3 } from 'lucide-react';
import { ClaimData, BillItem, PatientDetails, PolicyDetails } from '../types';
import { parseBillImage, parseBillText } from '../services/geminiService';
import * as XLSX from 'xlsx';

// --- Constants ---
const INSURANCE_PRESETS: Record<string, Partial<PolicyDetails>> = {
  'Generic Insurance': { roomRentLimit: 5000, coPayPercentage: 10, exclusions: 'Cosmetic surgery, Experimental treatments' },
  'Star Health': { roomRentLimit: 10000, coPayPercentage: 0, exclusions: 'Non-medical items, Obesity treatment' },
  'HDFC Ergo': { roomRentLimit: 15000, coPayPercentage: 0, exclusions: 'External Aids, Dental' },
  'Govt Scheme (Ayushman)': { roomRentLimit: 2000, coPayPercentage: 0, exclusions: 'Private Ward, Luxury items' },
  'ACKO General': { roomRentLimit: 7500, coPayPercentage: 5, exclusions: 'Maternity (first 2 years)' },
  'LIC': { roomRentLimit: 3000, coPayPercentage: 20, exclusions: 'Pre-existing diseases (2 years)' }
};

const DISEASE_PRESETS: Record<string, { icd: string, cpt: string, type: 'Emergency' | 'Planned', days: number }> = {
  'Pneumonia (Unspecified)': { icd: 'J18.9', cpt: '99222', type: 'Emergency', days: 5 },
  'Dengue Fever': { icd: 'A90', cpt: '99223', type: 'Emergency', days: 4 },
  'Acute Appendicitis': { icd: 'K35.80', cpt: '44970', type: 'Emergency', days: 3 },
  'Cataract Surgery': { icd: 'H25.1', cpt: '66984', type: 'Planned', days: 1 },
  'Heart Attack (MI)': { icd: 'I21.9', cpt: '92920', type: 'Emergency', days: 7 },
  'Covid-19 (Severe)': { icd: 'U07.1', cpt: '99291', type: 'Emergency', days: 10 },
  'Knee Replacement': { icd: 'M17.11', cpt: '27447', type: 'Planned', days: 4 },
  'Maternity (Normal Delivery)': { icd: 'O80', cpt: '59400', type: 'Planned', days: 2 },
  'Kidney Stone Removal': { icd: 'N20.0', cpt: '50080', type: 'Planned', days: 2 },
};

const PATIENT_PROFILES = [
  { label: 'Adult Male (Rahul Sharma)', name: 'Rahul Sharma', age: 45, gender: 'Male' as const },
  { label: 'Adult Female (Priya Patel)', name: 'Priya Patel', age: 28, gender: 'Female' as const },
  { label: 'Senior Citizen (Amitabh Verma)', name: 'Amitabh Verma', age: 72, gender: 'Male' as const },
  { label: 'Senior Female (Sneha Gupta)', name: 'Sneha Gupta', age: 68, gender: 'Female' as const },
  { label: 'Child (Arjun Singh)', name: 'Arjun Singh', age: 12, gender: 'Male' as const },
];

const AUDITOR_PROFILES = ['Dr. Anjali Mehta', 'Mr. Rajesh Kumar', 'Ms. Sarah Johns', 'System Admin'];

// --- Helper Styles ---
// Clean, bordered inputs with focus state on bottom border or ring
const inputClass = "w-full p-2.5 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all";
const labelClass = "block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider";

// --- Sub-Components ---

const BillItemRow = memo(({ item, updateBillItem, removeBillItem }: { item: BillItem, updateBillItem: (id: string, field: keyof BillItem, value: any) => void, removeBillItem: (id: string) => void }) => {
  return (
    <div className="group bg-white border-b border-slate-200 p-3 hover:bg-slate-50 transition-colors relative flex items-start gap-4">
      <div className="flex-1">
         <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Service / Item</label>
         <input 
          type="text" 
          value={item.serviceName} 
          onChange={e => updateBillItem(item.id, 'serviceName', e.target.value)} 
          className="w-full text-sm font-semibold text-slate-800 bg-transparent border-none p-0 focus:ring-0 placeholder-slate-300" 
          placeholder="Enter item description" 
        />
      </div>
      
      <div className="w-16">
        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Qty</label>
        <input type="number" value={item.quantity} onChange={e => updateBillItem(item.id, 'quantity', Number(e.target.value))} className="w-full text-sm bg-slate-50 rounded border border-slate-200 p-1 text-center" />
      </div>
      <div className="w-20">
        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Price</label>
        <input type="number" value={item.unitPrice} onChange={e => updateBillItem(item.id, 'unitPrice', Number(e.target.value))} className="w-full text-sm bg-slate-50 rounded border border-slate-200 p-1 text-right" />
      </div>
       <div className="w-20 text-right">
        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Total</label>
        <div className="text-sm font-bold text-slate-800 py-1">₹{item.totalPrice}</div>
      </div>
      
      <button type="button" onClick={() => removeBillItem(item.id)} className="text-slate-300 hover:text-red-600 p-1 mt-4 transition-colors">
        <Trash2 size={14} />
      </button>
    </div>
  );
}, (prev, next) => {
  return prev.item.serviceName === next.item.serviceName && 
         prev.item.quantity === next.item.quantity && 
         prev.item.unitPrice === next.item.unitPrice &&
         prev.item.totalPrice === next.item.totalPrice;
});

interface InputFormProps {
  onSubmit: (data: ClaimData) => void;
  isAnalyzing: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isAnalyzing }) => {
  const [activeTab, setActiveTab] = useState<'patient' | 'policy' | 'bill'>('patient');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const [metadata, setMetadata] = useState({
    claimId: 'CLM-' + Math.floor(Math.random() * 100000),
    auditorName: AUDITOR_PROFILES[0]
  });

  const [patient, setPatient] = useState<PatientDetails>({
    patientName: 'Rahul Sharma',
    age: 45,
    gender: 'Male',
    diagnosisICD10: 'J18.9', 
    procedureCodes: '99222', 
    admissionType: 'Emergency',
    lengthOfStay: 3,
  });

  const [policy, setPolicy] = useState<PolicyDetails>({
    policyNumber: 'POL-123456789',
    insuranceProvider: 'Generic Insurance',
    sumInsured: 500000,
    remainingSumInsured: 450000,
    coPayPercentage: 10,
    waitingPeriodServed: true,
    preAuthStatus: 'APPROVED',
    roomRentLimit: 5000,
    exclusions: 'Cosmetic surgery, Experimental treatments',
  });

  const [billItems, setBillItems] = useState<BillItem[]>([
    { id: '1', serviceName: 'Room Rent (Private Ward)', quantity: 3, unitPrice: 7500, totalPrice: 22500, referencePrice: 5000 },
    { id: '2', serviceName: 'Doctor Consultation', quantity: 3, unitPrice: 2000, totalPrice: 6000, referencePrice: 1500 },
    { id: '3', serviceName: 'IV Fluids & Consumables', quantity: 10, unitPrice: 500, totalPrice: 5000, referencePrice: 300 },
    { id: '4', serviceName: 'N-95 Masks (Non-Medical)', quantity: 5, unitPrice: 400, totalPrice: 2000, referencePrice: 100 },
  ]);

  const [manualTotalAmount, setManualTotalAmount] = useState<number | null>(null);

  useEffect(() => {
    if (manualTotalAmount === null) {
      const sum = billItems.reduce((acc, item) => acc + item.totalPrice, 0);
      setManualTotalAmount(sum);
    }
  }, [billItems, manualTotalAmount]);

  const addBillItem = useCallback(() => {
    const newItem: BillItem = {
      id: Math.random().toString(36).substr(2, 9),
      serviceName: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      referencePrice: 0,
    };
    setBillItems(prev => [...prev, newItem]);
  }, []);

  const removeBillItem = useCallback((id: string) => {
    setBillItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateBillItem = useCallback((id: string, field: keyof BillItem, value: any) => {
    setBillItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.totalPrice = Number(updated.quantity) * Number(updated.unitPrice);
        }
        return updated;
      }
      return item;
    }));
  }, []);

  const handleInsuranceChange = (provider: string) => {
    const preset = INSURANCE_PRESETS[provider];
    setPolicy(prev => ({ ...prev, insuranceProvider: provider, ...preset }));
  };

  const handleDiseaseChange = (diseaseName: string) => {
    const preset = DISEASE_PRESETS[diseaseName];
    if (preset) {
      setPatient(prev => ({
        ...prev,
        diagnosisICD10: preset.icd,
        procedureCodes: preset.cpt,
        admissionType: preset.type,
        lengthOfStay: preset.days
      }));
    }
  };

  const handlePatientProfileChange = (value: string) => {
    if (value === "manual") {
      setPatient({
        patientName: '',
        age: 0,
        gender: 'Male',
        diagnosisICD10: '',
        procedureCodes: '',
        admissionType: 'Emergency',
        lengthOfStay: 1
      });
      return;
    }
    const profile = PATIENT_PROFILES[parseInt(value)];
    if (profile) {
      setPatient(prev => ({
        ...prev,
        patientName: profile.name,
        age: profile.age,
        gender: profile.gender
      }));
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        const mimeType = file.type;

        const extractedItems = await parseBillImage(base64Data, mimeType);
        setBillItems(prev => {
            const newItems = [...prev, ...extractedItems];
            const newSum = newItems.reduce((acc, i) => acc + i.totalPrice, 0);
            setManualTotalAmount(newSum);
            return newItems;
        });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error parsing bill:", error);
      setIsUploading(false);
      alert("Failed to parse bill image. Please try again.");
    }
  };

  const handleSpreadsheetUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      let textData = "";
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        textData = XLSX.utils.sheet_to_csv(worksheet);
      } else {
        textData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsText(file);
        });
      }

      if (!textData) throw new Error("Empty file");

      const extractedItems = await parseBillText(textData);
      setBillItems(prev => {
        const newItems = [...prev, ...extractedItems];
        const newSum = newItems.reduce((acc, i) => acc + i.totalPrice, 0);
        setManualTotalAmount(newSum);
        return newItems;
      });
      setIsUploading(false);
    } catch (error) {
      console.error("Error parsing spreadsheet:", error);
      setIsUploading(false);
      alert("Failed to parse spreadsheet file.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const calculatedSum = billItems.reduce((acc, item) => acc + item.totalPrice, 0);
    onSubmit({ 
      ...metadata,
      totalClaimAmount: manualTotalAmount || calculatedSum,
      patient, 
      policy, 
      billItems 
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden flex flex-col h-full">
      
      {/* Top Meta Bar */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className="bg-white p-1.5 rounded border border-slate-200 text-slate-600">
               <Users size={14} />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block leading-none mb-1">Assigned Auditor</label>
              <select 
                value={metadata.auditorName} 
                onChange={(e) => setMetadata({...metadata, auditorName: e.target.value})}
                className="text-sm font-bold text-slate-800 bg-transparent outline-none cursor-pointer hover:text-amber-600 transition-colors"
              >
                {AUDITOR_PROFILES.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
         </div>
         <div className="text-right">
             <label className="text-[10px] uppercase font-bold text-slate-400 block leading-none mb-1">Claim ID</label>
             <span className="text-sm font-mono font-bold text-slate-700">{metadata.claimId}</span>
         </div>
      </div>

      {/* Modern Classic Tabs */}
      <div className="px-6 pt-6">
        <div className="flex border-b border-slate-200">
          {(['patient', 'policy', 'bill'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-6 text-sm font-bold flex items-center gap-2 transition-all duration-300 relative top-[1px] ${
                activeTab === tab 
                  ? 'text-slate-900 border-b-2 border-amber-500' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab === 'patient' && <User size={14} />}
              {tab === 'policy' && <Shield size={14} />}
              {tab === 'bill' && <FileText size={14} />}
              <span className="capitalize">{tab}</span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'patient' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <label className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-2">
                 <User size={14} /> Profile Auto-Fill
              </label>
              <div className="relative">
                <select 
                  onChange={(e) => handlePatientProfileChange(e.target.value)} 
                  className="w-full appearance-none p-2.5 bg-white border border-slate-300 rounded-md text-sm text-slate-800 font-medium focus:border-amber-500 outline-none"
                >
                  <option value="">-- Choose Profile or Manual --</option>
                  <option value="manual" className="font-bold text-slate-900">Clear / Manual Entry</option>
                  {PATIENT_PROFILES.map((profile, idx) => (
                    <option key={idx} value={idx}>{profile.label}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-3 text-slate-400 pointer-events-none">
                   <ChevronRight size={16} className="rotate-90" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2">
                <label className={labelClass}>Patient Name</label>
                <div className="relative">
                   <input type="text" value={patient.patientName} onChange={e => setPatient({ ...patient, patientName: e.target.value })} className={`${inputClass} pl-9`} placeholder="Full Name" />
                   <div className="absolute left-3 top-2.5 text-slate-400"><Edit3 size={14} /></div>
                </div>
              </div>
              <div>
                <label className={labelClass}>Age</label>
                <input type="number" value={patient.age} onChange={e => setPatient({ ...patient, age: Number(e.target.value) })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Gender</label>
                <select value={patient.gender} onChange={e => setPatient({ ...patient, gender: e.target.value as any })} className={inputClass}>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 mt-2">
               <h3 className="font-serif text-lg text-slate-800 mb-4 flex items-center gap-2">
                  <Stethoscope size={18} className="text-amber-600" />
                  Medical Condition
               </h3>
               
               <div className="space-y-4">
                 <div className="relative">
                    <label className={labelClass}>Select Diagnosis (Auto-fill)</label>
                    <select onChange={(e) => handleDiseaseChange(e.target.value)} className={inputClass}>
                      <option value="">-- Select Disease / Condition --</option>
                      {Object.keys(DISEASE_PRESETS).map(disease => (
                        <option key={disease} value={disease}>{disease}</option>
                      ))}
                    </select>
                 </div>

                 <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className={labelClass}>ICD-10 Code</label>
                      <input type="text" value={patient.diagnosisICD10} onChange={e => setPatient({ ...patient, diagnosisICD10: e.target.value })} className={`${inputClass} font-mono`} />
                    </div>
                    <div>
                      <label className={labelClass}>CPT Code</label>
                      <input type="text" value={patient.procedureCodes} onChange={e => setPatient({ ...patient, procedureCodes: e.target.value })} className={`${inputClass} font-mono`} />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className={labelClass}>Admission Type</label>
                      <select value={patient.admissionType} onChange={e => setPatient({ ...patient, admissionType: e.target.value as any })} className={inputClass}>
                        <option>Emergency</option>
                        <option>Planned</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Length of Stay (Days)</label>
                      <input type="number" value={patient.lengthOfStay} onChange={e => setPatient({ ...patient, lengthOfStay: Number(e.target.value) })} className={inputClass} />
                    </div>
                 </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'policy' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
               <label className={labelClass}>Insurance Provider</label>
               <select 
                 value={policy.insuranceProvider} 
                 onChange={(e) => handleInsuranceChange(e.target.value)} 
                 className={inputClass}
               >
                 {Object.keys(INSURANCE_PRESETS).map(key => (
                   <option key={key} value={key}>{key}</option>
                 ))}
               </select>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2">
                <label className={labelClass}>Policy Number</label>
                <input type="text" value={policy.policyNumber} onChange={e => setPolicy({ ...policy, policyNumber: e.target.value })} className={`${inputClass} font-mono`} />
              </div>
              <div>
                <label className={labelClass}>Sum Insured</label>
                <div className="relative">
                   <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">₹</span>
                   <input type="number" value={policy.sumInsured} onChange={e => setPolicy({ ...policy, sumInsured: Number(e.target.value) })} className={`${inputClass} pl-7`} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Room Rent Limit</label>
                <div className="relative">
                   <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">₹</span>
                   <input type="number" value={policy.roomRentLimit} onChange={e => setPolicy({ ...policy, roomRentLimit: Number(e.target.value) })} className={`${inputClass} pl-7`} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Co-Pay (%)</label>
                <input type="number" value={policy.coPayPercentage} onChange={e => setPolicy({ ...policy, coPayPercentage: Number(e.target.value) })} className={inputClass} />
              </div>
               <div>
                  <label className={labelClass}>Pre-Auth</label>
                  <select value={policy.preAuthStatus} onChange={e => setPolicy({ ...policy, preAuthStatus: e.target.value as any })} className={inputClass}>
                    <option value="APPROVED">Approved</option>
                    <option value="PENDING">Pending</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="NOT_REQUESTED">N/A</option>
                  </select>
                </div>
            </div>
            
            <div>
              <label className={labelClass}>Policy Exclusions</label>
              <textarea value={policy.exclusions} onChange={e => setPolicy({ ...policy, exclusions: e.target.value })} className={inputClass} rows={3} />
            </div>
          </div>
        )}

        {activeTab === 'bill' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-2 gap-4">
               {/* Image OCR */}
               <div 
                 className="group bg-white border border-dashed border-slate-300 hover:border-amber-500 rounded-lg p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 hover:bg-amber-50/20"
                 onClick={() => fileInputRef.current?.click()}
               >
                 <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" ref={fileInputRef} />
                 <div className="p-2.5 bg-slate-100 group-hover:bg-amber-100 rounded-full text-slate-500 group-hover:text-amber-600 transition-colors">
                   {isUploading ? <div className="animate-spin w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full"></div> : <ScanLine size={20} />}
                 </div>
                 <span className="text-xs font-bold text-slate-600 group-hover:text-slate-800">Upload Bill Image</span>
               </div>

               {/* Excel/CSV Upload */}
               <div 
                 className="group bg-white border border-dashed border-slate-300 hover:border-emerald-500 rounded-lg p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 hover:bg-emerald-50/20"
                 onClick={() => csvInputRef.current?.click()}
               >
                 <input type="file" accept=".csv,.txt,.xlsx,.xls" onChange={handleSpreadsheetUpload} className="hidden" ref={csvInputRef} />
                 <div className="p-2.5 bg-slate-100 group-hover:bg-emerald-100 rounded-full text-slate-500 group-hover:text-emerald-600 transition-colors">
                   {isUploading ? <div className="animate-spin w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full"></div> : <FileSpreadsheet size={20} />}
                 </div>
                 <span className="text-xs font-bold text-slate-600 group-hover:text-slate-800">Upload CSV/Excel</span>
               </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <label className={labelClass}>Total Claim Amount</label>
                <p className="text-[10px] text-slate-400">Manual override allowed</p>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-slate-300 shadow-sm focus-within:border-amber-500 transition-all">
                 <span className="text-lg font-serif font-bold text-slate-400">₹</span>
                 <input 
                    type="number" 
                    value={manualTotalAmount ?? ''} 
                    onChange={(e) => setManualTotalAmount(Number(e.target.value))}
                    className="w-32 text-lg font-bold text-slate-800 bg-transparent border-none p-0 focus:ring-0 text-right"
                    placeholder="0"
                 />
              </div>
            </div>

            <div className="space-y-0 rounded-lg border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 p-2 grid grid-cols-[1fr_4rem_5rem_5rem_2rem] gap-4 px-3">
                 <span className="text-[10px] font-bold uppercase text-slate-400">Item</span>
                 <span className="text-[10px] font-bold uppercase text-slate-400 text-center">Qty</span>
                 <span className="text-[10px] font-bold uppercase text-slate-400 text-right">Price</span>
                 <span className="text-[10px] font-bold uppercase text-slate-400 text-right">Total</span>
                 <span></span>
              </div>
              {billItems.map((item) => (
                <BillItemRow 
                  key={item.id} 
                  item={item} 
                  updateBillItem={updateBillItem} 
                  removeBillItem={removeBillItem} 
                />
              ))}
            </div>

            <button type="button" onClick={addBillItem} className="w-full py-2.5 border border-dashed border-slate-300 rounded-lg text-xs font-bold uppercase tracking-wide text-slate-500 hover:text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
              <Plus size={14} /> Add Line Item
            </button>
          </div>
        )}
      </form>

      <div className="p-6 border-t border-slate-200 bg-slate-50">
        <button
          onClick={handleSubmit}
          disabled={isAnalyzing || isUploading}
          className={`w-full py-3.5 rounded-lg text-white font-bold text-sm tracking-wide uppercase flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] ${
            isAnalyzing || isUploading 
              ? 'bg-slate-400 cursor-not-allowed shadow-none' 
              : 'bg-slate-900 hover:bg-slate-800 border-b-4 border-slate-950'
          }`}
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Processing Audit...</span>
            </>
          ) : (
            <>
              Run Smart Audit <ChevronRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default InputForm;