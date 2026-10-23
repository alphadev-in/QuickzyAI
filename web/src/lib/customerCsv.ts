import { isValidLondonPostcode } from '@/types/delivery';

// Customer CSV import. One row per address; rows with the same customerName become one customer.
// Columns: customerName, addressLabel, line1, line2, postcode

export const CUSTOMER_LABELS = ['Home', 'Office', 'Store', 'Warehouse'] as const;

export const SAMPLE_CUSTOMER_CSV = `customerName,addressLabel,line1,line2,postcode
Priya Patel,Home,"12 Fleet St","Flat 3",EC4Y 1AA
Priya Patel,Office,"45 Baker St","Floor 2, Suite B",NW1 6XE
Harley Street Clinic,Office,"10 Harley St","",W1G 9PF
Covent Garden Bakery,Store,"42 Floral St","",WC2E 9DA
`;

export interface ParsedCustomerAddress {
  label: string;
  line1: string;
  line2: string;
  postcode: string;
}

export interface ParsedCustomer {
  name: string;
  addresses: ParsedCustomerAddress[];
}

export interface CustomerCsvResult {
  customers: ParsedCustomer[];
  errors: { row: number; message: string }[];
  rowCount: number;
}

// Splits one CSV line, honouring double-quoted fields that contain commas
export function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

export function parseCustomerCsv(text: string): CustomerCsvResult {
  const lines = text
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    return { customers: [], errors: [{ row: 1, message: 'CSV is empty or missing the header row' }], rowCount: 0 };
  }

  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  const col = (fields: string[], name: string) => {
    const idx = headers.indexOf(name);
    return idx === -1 ? '' : (fields[idx] || '').trim();
  };

  if (!headers.includes('customerName') || !headers.includes('line1') || !headers.includes('postcode')) {
    return {
      customers: [],
      errors: [{ row: 1, message: 'Header must include customerName, line1 and postcode' }],
      rowCount: lines.length - 1,
    };
  }

  const grouped = new Map<string, ParsedCustomer>();
  const errors: CustomerCsvResult['errors'] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = splitCsvLine(lines[i]);
    const row = i + 1;
    const name = col(fields, 'customerName');
    const line1 = col(fields, 'line1');
    const postcode = col(fields, 'postcode').toUpperCase();
    const rawLabel = col(fields, 'addressLabel');
    const label = CUSTOMER_LABELS.find((l) => l.toLowerCase() === rawLabel.toLowerCase()) || 'Home';

    const rowErrors: string[] = [];
    if (!name) rowErrors.push('customerName is required');
    if (line1.length < 3) rowErrors.push('line1 (street address) is required');
    if (!isValidLondonPostcode(postcode)) rowErrors.push(`'${postcode || 'blank'}' is not a valid London postcode`);

    if (rowErrors.length > 0) {
      errors.push({ row, message: rowErrors.join('; ') });
      continue;
    }

    const key = name.toLowerCase();
    const customer = grouped.get(key) || { name, addresses: [] };
    customer.addresses.push({ label, line1, line2: col(fields, 'line2'), postcode });
    grouped.set(key, customer);
  }

  return {
    customers: [...grouped.values()],
    errors,
    rowCount: lines.length - 1,
  };
}
