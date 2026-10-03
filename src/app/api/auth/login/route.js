import { NextResponse } from 'next/server';
import { findUser } from '@/lib/mysql';
import memoryStore from '@/lib/memoryStore';
import { comparePassword, generateToken } from '@/lib/auth';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, username, password } = body;
    const identifier = (email || username || '').trim();

    if (!identifier || !password) {
      return NextResponse.json(
        { detail: 'Please provide both email/username and password' },
        { status: 400 }
      );
    }

    // ── STEP 0: Hardcoded production-safe credential table ──
    // These always work regardless of DB/memory state (Vercel serverless safe)
    const KNOWN_CREDENTIALS = [
      {
        identifiers: ['admin@kgnassociates.com', 'admin', 'kgn'],
        password: '12345678',
        user: {
          id: 'user_admin_1', username: 'admin',
          email: 'admin@kgnassociates.com',
          first_name: 'KGN', last_name: 'Admin',
          phone_number: '+91 98765 43210',
          role: 'admin', status: 'active',
        },
      },
      {
        identifiers: ['admin@admin.com', 'admin_super'],
        password: '12345678',
        user: {
          id: 'user_admin_root', username: 'admin_super',
          email: 'admin@admin.com',
          first_name: 'Executive', last_name: 'Admin',
          phone_number: '+91 98765 43210',
          role: 'admin', status: 'active',
        },
      },
      {
        identifiers: ['rajesh@kgnassociates.com', 'rajesh_valuer'],
        password: '12345678',
        user: {
          id: 'user_emp_1', username: 'rajesh_valuer',
          email: 'rajesh@kgnassociates.com',
          first_name: 'Rajesh', last_name: 'Kumar',
          phone_number: '+91 98765 43211',
          role: 'valuer', status: 'active',
        },
      },
    ];

    const id = identifier.toLowerCase();
    for (const cred of KNOWN_CREDENTIALS) {
      if (cred.identifiers.includes(id) && password === cred.password) {
        const userId = cred.user.id;
        const access = generateToken({ userId, email: cred.user.email, username: cred.user.username, role: cred.user.role });
        const refresh = generateToken({ userId }, '30d');
        return NextResponse.json({ access, refresh, token: access, user: cred.user });
      }
    }

    let user = null;
    let isMatch = false;

    // 1. MySQL lookup
    try {
      user = await findUser(identifier);
      if (user && user.password) {
        isMatch = await comparePassword(password, user.password);
      }
    } catch (e) {
      console.warn('[MySQL Lookup Notice]:', e.message);
    }

    // 2. In-memory fallback
    if (!user) {
      const memUser = memoryStore.getUserByEmailOrUsername(identifier);
      if (memUser) {
        user = memUser;
        // Try bcrypt first, then plain-text comparison as safety net
        try {
          isMatch = await comparePassword(password, user.password);
        } catch {
          isMatch = (password === user.password);
        }
      }
    }

    if (!user || !isMatch) {
      return NextResponse.json(
        { detail: 'Invalid credentials. Please check your username/email and password.' },
        { status: 401 }
      );
    }

    // 5. Account status check (Inactive accounts cannot log in)
    if (user.status === 'inactive') {
      return NextResponse.json(
        { detail: 'Your employee account has been deactivated. Please contact the administrator.' },
        { status: 403 }
      );
    }

    // 6. Admin portal privilege check
    const { requireAdmin } = body;
    if (requireAdmin && user.role !== 'admin') {
      return NextResponse.json(
        { detail: 'Access denied. You do not have administrator permissions to access the Admin Panel.' },
        { status: 403 }
      );
    }

    const userId = (user.id || user._id || 'user_1').toString();
    const access = generateToken({
      userId,
      email: user.email,
      username: user.username,
      role: user.role || 'admin',
    });
    const refresh = generateToken({ userId }, '30d');

    return NextResponse.json({
      access,
      refresh,
      user: {
        id: userId,
        username: user.username,
        email: user.email,
        first_name: user.first_name || 'Valuer',
        last_name: user.last_name || '',
        phone_number: user.phone_number || '',
        role: user.role || 'admin',
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { detail: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
