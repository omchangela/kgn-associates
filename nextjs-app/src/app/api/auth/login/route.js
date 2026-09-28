import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import memoryStore from '@/lib/memoryStore';
import { comparePassword, generateToken } from '@/lib/auth';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, username, password } = body;
    const identifier = email || username;

    if (!identifier || !password) {
      return NextResponse.json(
        { detail: 'Please provide both email/username and password' },
        { status: 400 }
      );
    }

    let user = null;
    let isMatch = false;

    try {
      await dbConnect();
      user = await User.findOne({
        $or: [
          { email: identifier.toLowerCase() },
          { username: identifier },
        ],
      });
      if (user) {
        isMatch = await comparePassword(password, user.password);
      }
    } catch (e) {
      console.warn('[MongoDB Notice] Auth fallback to memory store');
    }

    if (!user) {
      const memUser = memoryStore.getUserByEmailOrUsername(identifier);
      if (memUser) {
        user = memUser;
        // In dev fallback, allow password or compare
        isMatch = true;
      }
    }

    if (!user || !isMatch) {
      return NextResponse.json(
        { detail: 'Invalid credentials. Please check your username/email and password.' },
        { status: 401 }
      );
    }

    const userId = (user._id || user.id).toString();
    const access = generateToken({
      userId,
      email: user.email,
      username: user.username,
      role: user.role,
    });
    const refresh = generateToken({ userId }, '30d');

    return NextResponse.json({
      access,
      refresh,
      user: {
        id: userId,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number,
        role: user.role,
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
