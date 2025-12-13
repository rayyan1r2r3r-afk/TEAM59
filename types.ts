export interface BillItem {
  id: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  referencePrice?: number; // Optional standard rate for comparison
}

export interface PolicyDetails {
  policyNumber: string;
  insuranceProvider: string; // New field
  sumInsured: number;
  remainingSumInsured: number;
  coPayPercentage: number;
  waitingPeriodServed: boolean;
  preAuthStatus: 'APPROVED' | 'PENDING' | 'REJECTED' | 'NOT_REQUESTED';
  roomRentLimit: number;
  exclusions: string;
}

export interface PatientDetails {
  patientName: string; // New field
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  diagnosisICD10: string;
  procedureCodes: string;
  admissionType: 'Emergency' | 'Planned';
  lengthOfStay: number;
}

export interface ClaimData {
  claimId: string; // New field
  auditorName: string; // New field
  patient: PatientDetails;
  policy: PolicyDetails;
  billItems: BillItem[];
}

export interface ItemAnalysis {
  item_name: string;
  billed_amount: number;
  standard_amount: number;
  status: 'OK' | 'OVERPRICED' | 'DENIED' | 'PARTIAL';
  remarks: string;
}

export interface PolicyCheckResult {
  limit_met: boolean;
  exclusions_found: boolean;
  waiting_period_met: boolean;
  pre_auth_valid: boolean;
}

export interface AuditResult {
  decision: 'APPROVED' | 'REJECTED' | 'PARTIAL_APPROVAL';
  final_approved_amount: number;
  total_billed_amount: number;
  confidence_score: number;
  summary: string;
  rejection_reasons: string[];
  correction_steps: string[];
  item_analysis: ItemAnalysis[];
  policy_check: PolicyCheckResult;
}