export interface BillItem {
  id: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  referencePrice?: number; // Optional, populated by AI
  category?: 'Consultation' | 'Surgery' | 'Pharmacy' | 'Consumables' | 'Room Rent' | 'Other';
}

export interface PatientDetails {
  patientName: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  diagnosisICD10: string;
  procedureCodes: string;
  admissionType: 'Emergency' | 'Planned';
  lengthOfStay: number;
}

export interface PolicyDetails {
  policyNumber: string;
  insuranceProvider: string;
  sumInsured: number;
  remainingSumInsured: number;
  coPayPercentage: number;
  waitingPeriodServed: boolean;
  preAuthStatus: 'APPROVED' | 'PENDING' | 'REJECTED' | 'NOT_REQUESTED';
  roomRentLimit: number;
  exclusions: string;
}

export interface ClaimData {
  claimId: string;
  auditorName: string;
  totalClaimAmount: number;
  date: string; // ISO date string
  patient: PatientDetails;
  policy: PolicyDetails;
  billItems: BillItem[];
}

export interface ItemAnalysis {
  item_id: string; // To link back to BillItem
  item_name: string;
  billed_amount: number;
  standard_amount: number;
  status: 'OK' | 'OVERPRICED' | 'DENIED' | 'PARTIAL';
  reasoning: string;
  flagged_type?: 'Unbundling' | 'Upcoding' | 'NME_Exclusion' | 'Price_Variance' | 'None';
}

export interface PolicyCheckResult {
  limit_met: boolean;
  exclusions_found: boolean;
  waiting_period_met: boolean;
  pre_auth_valid: boolean;
}

export interface AuditResult {
  claimId: string; // Link back to claim
  auditDate: string;
  decision: 'APPROVED' | 'REJECTED' | 'PARTIAL_APPROVAL';
  confidence_score: number;
  total_billed_amount: number;
  final_approved_amount: number;
  summary: string;
  policy_check: PolicyCheckResult;
  rejection_reasons: string[];
  correction_steps: string[];
  item_analysis: ItemAnalysis[];
}

export interface DashboardMetrics {
  totalClaimsProcessed: number;
  totalAmountSaved: number;
  averageProcessingTime: string;
  recentAudits: AuditResult[];
}