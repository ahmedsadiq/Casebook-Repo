export type UserRole    = "advocate" | "associate" | "client";
export type CaseStatus  = "open" | "pending" | "closed";
export type PaymentStatus = "pending" | "paid" | "overdue";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  advocate_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Case {
  id: string;
  advocate_id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  status: CaseStatus;
  case_number: string | null;
  court: string | null;
  next_hearing_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CaseUpdate {
  id: string;
  case_id: string;
  author_id: string;
  content: string;
  hearing_date: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  case_id: string;
  advocate_id: string;
  description: string;
  amount: number;
  due_date: string | null;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

export interface CaseDocument {
  id: string;
  case_id: string;
  uploader_id: string;
  name: string;
  storage_path: string;
  size_bytes: number | null;
  created_at: string;
}

// Helper join types
export interface CaseWithClient extends Case {
  client: Pick<Profile, "id" | "full_name" | "email" | "phone"> | null;
}

export interface CaseUpdateWithAuthor extends CaseUpdate {
  author: Pick<Profile, "full_name" | "role"> | null;
}

export interface CaseAssociate {
  case_id:      string;
  associate_id: string;
  added_at:     string;
}

export type Database = {
  public: {
    Tables: {
      profiles:         { Row: Profile;       Insert: Partial<Profile> & { id: string }; Update: Partial<Profile> };
      cases:            { Row: Case;          Insert: Omit<Case,"id"|"created_at"|"updated_at"> & { id?: string }; Update: Partial<Omit<Case,"id"|"advocate_id"|"created_at">> };
      case_updates:     { Row: CaseUpdate;    Insert: Omit<CaseUpdate,"id"|"created_at"> & { id?: string }; Update: Partial<Pick<CaseUpdate,"content"|"hearing_date">> };
      payments:         { Row: Payment;       Insert: Omit<Payment,"id"|"created_at"|"updated_at"> & { id?: string }; Update: Partial<Omit<Payment,"id"|"case_id"|"advocate_id"|"created_at">> };
      case_documents:   { Row: CaseDocument;  Insert: Omit<CaseDocument,"id"|"created_at"> & { id?: string }; Update: never };
      case_associates:  { Row: CaseAssociate; Insert: Omit<CaseAssociate,"added_at"> & { added_at?: string }; Update: never };
    };
  };
};
