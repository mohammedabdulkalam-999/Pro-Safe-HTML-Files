export interface CampaignContact {
  customerName: string;
  phoneNumber: string;
  notes?: string;
  rowNumber: number;
}

export interface ParsedCampaignRow {
  rowNumber: number;
  customerName: string;
  rawPhone: string;
  notes?: string;
  phoneNumber?: string;
  error?: string;
}

export interface CampaignParseResult {
  valid: CampaignContact[];
  invalid: ParsedCampaignRow[];
  fileName: string;
}

export interface BulkCallProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: boolean;
}
