export interface MunicipalWard {
  ward_id: number;
  ward_name: string;
  zone_name: string;
  ward_officer_name?: string;
  contact_phone?: string;
  contact_email?: string;
}

export interface CitationItem {
  index: number;
  doc_id: string;
  title: string;
  department: string;
  section_ref: string;
  text: string;
  source_url: string;
  official_portal_ref: string;
}

export interface EscalationTicket {
  ticket_id: string;
  dept_code: string;
  category: string;
  priority: string;
  sla_deadline: string;
  status: string;
  receipt_url?: string;
}

export interface ClarificationOption {
  label: string;
  value: any;
}

export interface ClarificationPayload {
  needs_clarification: boolean;
  parameter: string;
  prompt: string;
  options: ClarificationOption[];
}

export interface EmergencyContact {
  service: string;
  number: string;
  action: string;
}

export interface EmergencyPayload {
  is_emergency: boolean;
  title: string;
  message: string;
  contacts: EmergencyContact[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  statusText?: string;
  modelUsed?: string;
  citations?: CitationItem[];
  emergency?: EmergencyPayload;
  clarification?: ClarificationPayload;
  escalation?: EscalationTicket;
  timestamp: string;
}

export interface WardHeatmapStat {
  ward_id: number;
  ward_name: string;
  zone_name: string;
  total_grievances: number;
  rate_per_1000: number;
  officer_name?: string;
  contact_phone?: string;
  alert_level: 'normal' | 'warning' | 'red_alert';
}

export interface SLAItem {
  ticket_id: string;
  ward_id: number;
  dept_code: string;
  category: string;
  priority: string;
  remaining_hours: number;
  deadline: string;
}

export interface SLAStatusData {
  summary: {
    breached_count: number;
    critical_count: number;
    warning_count: number;
    normal_count: number;
  };
  details: {
    normal: SLAItem[];
    warning: SLAItem[];
    critical: SLAItem[];
    breached: SLAItem[];
  };
}
