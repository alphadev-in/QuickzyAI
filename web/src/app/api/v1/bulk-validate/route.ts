import { NextRequest, NextResponse } from 'next/server';
import { parseAndValidateCsv } from '@/lib/csvValidator';

export async function POST(req: NextRequest) {
  try {
    const { csvContent } = await req.json();
    if (!csvContent || typeof csvContent !== 'string') {
      return NextResponse.json({ error: 'Missing csvContent string' }, { status: 400 });
    }

    const result = parseAndValidateCsv(csvContent);
    return NextResponse.json({
      success: true,
      totalRows: result.totalRows,
      validCount: result.validRows.length,
      invalidCount: result.invalidRows.length,
      validRows: result.validRows,
      invalidRows: result.invalidRows,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'CSV validation failed' }, { status: 500 });
  }
}
