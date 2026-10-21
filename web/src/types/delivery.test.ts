import { calculateDeliveryPrice, evaluateSameDayCutoff, isValidLondonPostcode } from './delivery';
import { parseAndValidateCsv, SAMPLE_CSV_TEMPLATE } from '../lib/csvValidator';

function runTests() {
  console.log('--- Quickzy Unit & Integration Test Suite ---');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, desc: string) {
    total++;
    if (condition) {
      console.log(`✓ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`✕ FAIL: ${desc}`);
    }
  }

  // 1. Postcode validation
  assert(isValidLondonPostcode('EC1A 1BB'), 'EC1A 1BB is a valid Central London postcode');
  assert(isValidLondonPostcode('N1 1QP'), 'N1 1QP is a valid North London postcode');
  assert(isValidLondonPostcode('SW1A 2AA'), 'SW1A 2AA is a valid Westminster postcode');
  assert(!isValidLondonPostcode('M1 1AE'), 'M1 1AE (Manchester) is rejected');
  assert(!isValidLondonPostcode('B1 1BB'), 'B1 1BB (Birmingham) is rejected');
  assert(!isValidLondonPostcode(''), 'Empty postcode is rejected');

  // 2. Pricing calculations
  const standardParcel = calculateDeliveryPrice({
    type: 'parcel',
    weightKg: 1,
    estimatedMiles: 3,
  });
  assert(standardParcel.baseFeePence === 450, 'Standard parcel base fee is 450p (£4.50)');
  assert(standardParcel.distanceFeePence === 360, '3 miles distance fee is 360p (£3.60)');
  assert(standardParcel.totalPence === 810, 'Total standard delivery is 810p (£8.10)');

  const restrictedPharmacy = calculateDeliveryPrice({
    type: 'pharmacy',
    weightKg: 3,
    isRestricted: true,
    estimatedMiles: 4,
  });
  assert(restrictedPharmacy.baseFeePence === 550, 'Pharmacy base fee is 550p (£5.50)');
  assert(restrictedPharmacy.restrictedHandlingFeePence === 350, 'Restricted handling fee is 350p (£3.50)');
  assert(restrictedPharmacy.weightFeePence === 50, 'Weight over 2kg incurs 50p surcharge');

  // 3. Same-day cutoff logic
  const earlyMorning = new Date('2026-10-21T09:00:00Z');
  const cutoffEarly = evaluateSameDayCutoff(earlyMorning);
  assert(!cutoffEarly.isCutoffExceeded, '09:00 order is within same-day cutoff');

  const lateAfternoon = new Date('2026-10-21T16:00:00Z');
  const cutoffLate = evaluateSameDayCutoff(lateAfternoon);
  assert(cutoffLate.isCutoffExceeded, '16:00 order exceeds 14:00 cutoff and shifts to next day');

  // 4. CSV Bulk parser & row validator
  const validCsvResult = parseAndValidateCsv(SAMPLE_CSV_TEMPLATE);
  assert(validCsvResult.totalRows === 3, 'Sample template parses 3 rows');
  assert(validCsvResult.validRows.length === 3, 'All 3 sample rows pass London postcode validation');
  assert(validCsvResult.invalidRows.length === 0, 'Zero errors in valid template');

  const badCsv = `recipientName,pickupLine1,pickupPostcode,dropoffLine1,dropoffPostcode,type,weightKg,lengthCm,widthCm,heightCm,contents,isRestricted
Bad Postcode,12 Fleet St,M1 1AE,45 Baker St,B1 1AA,parcel,35,20,10,5,,false
`;
  const invalidResult = parseAndValidateCsv(badCsv);
  assert(invalidResult.invalidRows.length === 1, 'Invalid CSV row detected');
  assert(invalidResult.invalidRows[0].errors.some(e => e.includes('postcode')), 'Row reports London postcode error');
  assert(invalidResult.invalidRows[0].errors.some(e => e.includes('Contents description')), 'Row reports missing contents');

  console.log(`\n==========================================`);
  console.log(`Result: ${passed}/${total} assertions passed successfully.`);
  console.log(`==========================================\n`);

  if (passed !== total) process.exit(1);
}

runTests();
