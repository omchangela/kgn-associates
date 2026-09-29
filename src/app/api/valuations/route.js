import { NextResponse } from 'next/server';
import { getAllValuations, upsertValuation } from '@/lib/mysql';
import memoryStore from '@/lib/memoryStore';
import { getAuthUser } from '@/lib/auth';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  try {
    let list = await getAllValuations({ search, limit });

    if (!list || list.length === 0) {
      // Memory store fallback if table empty
      const memList = memoryStore.getValuations({ search });
      if (memList && memList.length > 0) {
        list = memList;
      }
    }

    if (status && status !== 'all') {
      list = list.filter((r) => r.status === status);
    }

    const formatted = list.map((r) => {
      const repId = (r.id || r._id || '').toString();
      const inst = r.institutionDetails || r.institution_details || {};
      const prop = r.propertyIdentification || r.property_identification || {};
      const finalVal = r.finalValuation || r.final_valuation || {};

      return {
        id: repId,
        _id: repId,
        report_number: r.report_number || `KGN-2026-${repId.slice(-4)}`,
        created_at: r.created_at || r.createdAt || new Date().toISOString(),
        updated_at: r.updated_at || r.updatedAt || new Date().toISOString(),
        status: r.status || 'completed',
        createdBy: r.createdBy || r.created_by || '',
        customer_name: inst.applicant_name || inst.borrowerName || r.applicant_name || '',
        institution_details: inst,
        property_identification: prop,
        final_valuation: finalVal,
        photos_count: r.photos ? r.photos.length : 0,
      };
    });

    return NextResponse.json({ count: formatted.length, results: formatted });
  } catch (error) {
    console.error('Valuations GET error:', error);
    const list = memoryStore.getValuations({ search });
    return NextResponse.json({ count: list.length, results: list });
  }
}

export async function POST(req) {
  const authUser = getAuthUser(req);
  const body = await req.json();

  const id = body.id || body._id || `val_${Date.now()}`;
  const reportNumber = body.report_number || `KGN-2026-${id.slice(-4)}`;

  const reportData = {
    id,
    _id: id,
    report_number: reportNumber,
    status: body.status || 'draft',
    createdBy: authUser ? authUser.userId : 'user_admin_1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...body,
  };

  try {
    const saved = await upsertValuation(id, reportData);
    memoryStore.createValuation(reportData); // Also sync in memory
    return NextResponse.json(saved || reportData, { status: 201 });
  } catch (err) {
    console.warn('[MySQL Save Error - Fallback to Memory]:', err.message);
    const newReport = memoryStore.createValuation(reportData);
    return NextResponse.json(newReport, { status: 201 });
  }
}
