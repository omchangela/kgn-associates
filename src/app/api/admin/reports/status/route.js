import { NextResponse } from 'next/server';
import { updateValuationStatus } from '@/lib/mysql';
import memoryStore from '@/lib/memoryStore';

export async function POST(req) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Report ID and status are required' }, { status: 400 });
    }

    try {
      await updateValuationStatus(id, status);
    } catch (e) {
      console.warn('[MySQL Report Status Notice]:', e.message);
    }

    if (memoryStore && typeof memoryStore.updateValuationStatus === 'function') {
      memoryStore.updateValuationStatus(id, status);
    }

    return NextResponse.json({
      success: true,
      message: `Report status updated to ${status}`,
    });
  } catch (error) {
    console.error('Failed to update report status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update report status' },
      { status: 500 }
    );
  }
}
