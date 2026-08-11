import type {
  CampaignContact,
  CampaignParseResult,
  ParsedCampaignRow,
} from "@/types/campaign";
import { normalizePhoneNumber } from "@/utils/phone";

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function resolveColumnIndex(
  headers: string[],
  candidates: string[],
): number {
  const normalized = headers.map((h) => h.trim().toLowerCase());
  for (const candidate of candidates) {
    const index = normalized.indexOf(candidate);
    if (index !== -1) return index;
  }
  return -1;
}

function buildContact(row: ParsedCampaignRow): CampaignContact | null {
  if (!row.customerName.trim()) {
    return null;
  }

  const phoneNumber = normalizePhoneNumber(row.rawPhone);
  if (!phoneNumber) {
    return null;
  }

  return {
    customerName: row.customerName.trim(),
    phoneNumber,
    notes: row.notes?.trim() || undefined,
    rowNumber: row.rowNumber,
  };
}

function partitionRows(
  rows: ParsedCampaignRow[],
  fileName: string,
): CampaignParseResult {
  const valid: CampaignContact[] = [];
  const invalid: ParsedCampaignRow[] = [];

  for (const row of rows) {
    if (!row.customerName.trim()) {
      invalid.push({ ...row, error: "Customer name is required" });
      continue;
    }

    const phoneNumber = normalizePhoneNumber(row.rawPhone);
    if (!phoneNumber) {
      invalid.push({
        ...row,
        error: `Invalid phone number: "${row.rawPhone}"`,
      });
      continue;
    }

    valid.push({
      customerName: row.customerName.trim(),
      phoneNumber,
      notes: row.notes?.trim() || undefined,
      rowNumber: row.rowNumber,
    });
  }

  return { valid, invalid, fileName };
}

export function parseCampaignCsv(
  content: string,
  fileName: string,
): CampaignParseResult {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return {
      valid: [],
      invalid: [
        {
          rowNumber: 1,
          customerName: "",
          rawPhone: "",
          error: "File must include a header row and at least one contact",
        },
      ],
      fileName,
    };
  }

  const headerLine = lines[0];
  if (!headerLine) {
    return { valid: [], invalid: [], fileName };
  }

  const headers = parseCsvLine(headerLine);
  const numberIdx = resolveColumnIndex(headers, ["number", "phone", "phone_number", "phonenumber"]);
  const nameIdx = resolveColumnIndex(headers, ["name", "customer_name", "customername", "customer"]);
  const notesIdx = resolveColumnIndex(headers, ["another_var", "notes", "note", "comment"]);

  if (numberIdx === -1 || nameIdx === -1) {
    return {
      valid: [],
      invalid: [
        {
          rowNumber: 1,
          customerName: "",
          rawPhone: "",
          error: 'CSV must include "number" and "name" columns',
        },
      ],
      fileName,
    };
  }

  const rows: ParsedCampaignRow[] = lines.slice(1).map((line, index) => {
    const cells = parseCsvLine(line);
    return {
      rowNumber: index + 2,
      customerName: cells[nameIdx] ?? "",
      rawPhone: cells[numberIdx] ?? "",
      notes: notesIdx !== -1 ? cells[notesIdx] : undefined,
    };
  });

  return partitionRows(rows, fileName);
}

export function parseCampaignXml(
  content: string,
  fileName: string,
): CampaignParseResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, "application/xml");
  const parseError = doc.querySelector("parsererror");

  if (parseError) {
    return {
      valid: [],
      invalid: [
        {
          rowNumber: 1,
          customerName: "",
          rawPhone: "",
          error: "Invalid XML format",
        },
      ],
      fileName,
    };
  }

  const contactNodes = doc.querySelectorAll("contact, Contact, row, Row, customer, Customer");

  if (contactNodes.length === 0) {
    return {
      valid: [],
      invalid: [
        {
          rowNumber: 1,
          customerName: "",
          rawPhone: "",
          error: "XML must contain <contact> elements with <number> and <name>",
        },
      ],
      fileName,
    };
  }

  const rows: ParsedCampaignRow[] = Array.from(contactNodes).map((node, index) => {
    const getText = (tags: string[]): string => {
      for (const tag of tags) {
        const el = node.querySelector(tag);
        if (el?.textContent?.trim()) return el.textContent.trim();
      }
      return "";
    };

    return {
      rowNumber: index + 1,
      customerName: getText(["name", "Name", "customer_name", "customerName"]),
      rawPhone: getText(["number", "Number", "phone", "Phone", "phone_number"]),
      notes: getText(["another_var", "notes", "Notes", "note"]) || undefined,
    };
  });

  return partitionRows(rows, fileName);
}

export function parseCampaignFile(
  content: string,
  fileName: string,
): CampaignParseResult {
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".csv")) {
    return parseCampaignCsv(content, fileName);
  }

  if (lower.endsWith(".xml")) {
    return parseCampaignXml(content, fileName);
  }

  return {
    valid: [],
    invalid: [
      {
        rowNumber: 0,
        customerName: "",
        rawPhone: "",
        error: "Unsupported file type. Upload .csv or .xml",
      },
    ],
    fileName,
  };
}
