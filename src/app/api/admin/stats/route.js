import { NextResponse } from 'next/server';
import { getAdminStats } from '@/lib/mysql';
import memoryStore from '@/lib/memoryStore';

export async function GET() {
  try {
    let stats = null;
    try {
      stats = await getAdminStats();
    } catch (e) {
      console.warn('[MySQL Admin Stats Fallback]:', e.message);
    }

    if (!stats) {
      stats = memoryStore.getAdminStats();
    }

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Failed to get admin stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}
