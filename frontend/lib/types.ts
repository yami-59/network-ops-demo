export type StatusCode = "PENDING" | "PLANNED" | "EXECUTED" | "FAILED";
export type Priority = "High" | "Medium" | "Low";
export type Department = "Engineering" | "Pilotage" | "Operations";

export type RequestItem = {
  op_id: string;
  feature: string;
  parameter: string;
  value: string;
  zone: string;
  sites: string;
  desired_date: string | null;
  priority: Priority;
  status: StatusCode;
  updated_at: string;
};

export type HistoryItem = {
  at: string;
  department: Department;
  from_status: StatusCode | null;
  to_status: StatusCode;
  comment: string | null;
};

export type RequestDetail = {
  request: RequestItem & { created_at?: string | null; planned_date?: string | null; initial_comment?: string | null };
  history: HistoryItem[];
};

export type RequestCreate = {
  feature: string;
  parameter: string;
  value: string;
  zone: string;
  sites: string;
  desired_date: string | null;
  priority: Priority;
  initial_comment: string | null;
};
