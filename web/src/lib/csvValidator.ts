import { isValidLondonPostcode, CsvRowSchema } from '@/types/delivery';

export interface CsvValidationResult {
  validRows: any[];
  invalidRows: { row: number; data: any; errors: string[] }[];
  totalRows: number;
}

export function parseAndValidateCsv(csvText: string): CsvValidationResult {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return { validRows: [], invalidRows: [{ row: 1, data: {}, errors: ['CSV is empty or missing headers'] }], totalRows: 0 };
  }

  const rawHeaders = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const validRows: any[] = [];
  const invalidRows: { row: number; data: any; errors: string[] }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
    const rowObj: Record<string, any> = {};

    rawHeaders.forEach((header, index) => {
      rowObj[header] = values[index] !== undefined ? values[index] : '';
    });

    const errors: string[] = [];

    // Verify recipient
    if (!rowObj.recipientName) errors.push('Recipient name is required');

    // Verify London pickup postcode
    if (!rowObj.pickupPostcode) {
      errors.push('Pickup postcode is required');
    } else if (!isValidLondonPostcode(rowObj.pickupPostcode)) {
      errors.push(`Pickup postcode '${rowObj.pickupPostcode}' is not a valid London postcode (Must be E, EC, N, NW, SE, SW, W, WC, etc.)`);
    }

    // Verify London dropoff postcode
    if (!rowObj.dropoffPostcode) {
      errors.push('Dropoff postcode is required');
    } else if (!isValidLondonPostcode(rowObj.dropoffPostcode)) {
      errors.push(`Dropoff postcode '${rowObj.dropoffPostcode}' is not a valid London postcode`);
    }

    // Verify parcel weight
    const weight = parseFloat(rowObj.weightKg || '1');
    if (isNaN(weight) || weight <= 0) {
      errors.push('Weight (kg) must be a positive number');
    } else if (weight > 30) {
      errors.push('Weight exceeds maximum limit of 30kg');
    }

    // Verify contents
    if (!rowObj.contents || rowObj.contents.trim().length === 0) {
      errors.push('Contents description is required');
    }

    if (errors.length > 0) {
      invalidRows.push({
        row: i + 1,
        data: rowObj,
        errors,
      });
    } else {
      validRows.push({
        type: (rowObj.type || 'parcel').toLowerCase(),
        recipientName: rowObj.recipientName,
        pickupAddress: {
          line1: rowObj.pickupLine1 || 'Client Hub Store',
          postcode: rowObj.pickupPostcode.toUpperCase(),
          city: 'London',
          label: 'Client Store',
        },
        dropoffAddress: {
          line1: rowObj.dropoffLine1 || 'Customer Delivery Address',
          postcode: rowObj.dropoffPostcode.toUpperCase(),
          city: 'London',
          label: rowObj.recipientName,
        },
        timeSlot: 'same_day_asap',
        parcel: {
          weightKg: weight,
          lengthCm: parseFloat(rowObj.lengthCm || '20'),
          widthCm: parseFloat(rowObj.widthCm || '15'),
          heightCm: parseFloat(rowObj.heightCm || '10'),
          contentsDescription: rowObj.contents,
          isRestricted: String(rowObj.isRestricted).toLowerCase() === 'true' || String(rowObj.isRestricted) === '1',
        },
      });
    }
  }

  return {
    validRows,
    invalidRows,
    totalRows: lines.length - 1,
  };
}

export const SAMPLE_CSV_TEMPLATE = `recipientName,pickupLine1,pickupPostcode,dropoffLine1,dropoffPostcode,type,weightKg,lengthCm,widthCm,heightCm,contents,isRestricted
Oliver Twist,12 Fleet St,EC4Y 1AA,45 Baker St,NW1 6XE,parcel,2.5,25,20,15,Artisan Ceramics,false
Harley Street Clinic,10 Harley St,W1G 9PF,18 Kensington Church St,W8 4EP,pharmacy,0.8,15,10,5,Emergency Antibiotics,true
Covent Garden Bakery,42 Floral St,WC2E 9DA,14 Highbury Park,N5 2AB,food,1.2,30,20,10,Specialty Sourdough Boxes,false
`;
