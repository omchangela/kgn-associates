import { NextResponse } from 'next/server';
import { updateValuationStatus } from '@/lib/mysql';
import memoryStore from '@/lib/memoryStore';

export async function POST(req) {
  try {
    const body = await req.json();
    const targetId = body.id || body.reportId;
    const { status, allow_employee_edit } = body;

    if (!targetId || (status === undefined && allow_employee_edit === undefined)) {
      return NextResponse.json({ error: 'Report ID and at least one update field are required' }, { status: 400 });
    }

    try {
      await updateValuationStatus(targetId, status, allow_employee_edit);
    } catch (e) {
      console.warn('[MySQL Report Status Notice]:', e.message);
    }

    if (memoryStore && typeof memoryStore.updateValuationStatus === 'function') {
      memoryStore.updateValuationStatus(targetId, status, allow_employee_edit);
    }

    return NextResponse.json({
      success: true,
      message: `Report updated successfully`,
      allow_employee_edit,
      status,
    });
  } catch (error) {
    console.error('Failed to update report status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update report status' },
      { status: 500 }
    );
  }
}
