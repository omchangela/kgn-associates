import { NextResponse } from 'next/server';
import { findUserById } from '@/lib/mysql';
import memoryStore from '@/lib/memoryStore';
import { getAuthUser } from '@/lib/auth';

export async function GET(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }

    let user = null;
    try {
      user = await findUserById(authUser.userId);
    } catch (e) {
      console.warn('[MySQL Profile Notice]:', e.message);
    }

    if (!user) {
      user = memoryStore.getUserById(authUser.userId);
    }

    if (!user) {
      // Build safe fallback from token payload
      user = {
        id: authUser.userId,
        username: authUser.username || 'admin',
        email: authUser.email || 'admin@kgnassociates.com',
        first_name: 'KGN',
        last_name: 'Admin',
        phone_number: '+91 98765 43210',
        role: authUser.role || 'admin',
      };
    }

    return NextResponse.json({
      id: user.id || user._id,
      username: user.username,
      email: user.email,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone_number: user.phone_number || '',
      role: user.role || 'valuer',
    });
  } catch (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    return NextResponse.json({
      id: authUser.userId,
      ...body,
      role: authUser.role,
    });
  } catch (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
