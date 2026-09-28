import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import memoryStore from '@/lib/memoryStore';
import { hashPassword, generateToken } from '@/lib/auth';

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, email, password, first_name, last_name, phone_number } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);
    let user = null;

    try {
      await dbConnect();
      const existing = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { username }],
      });

      if (existing) {
        return NextResponse.json(
          { error: 'User with this email or username already exists' },
          { status: 409 }
        );
      }

      user = await User.create({
        username,
        email: email.toLowerCase(),
        password: hashedPassword,
        first_name: first_name || '',
        last_name: last_name || '',
        phone_number: phone_number || '',
      });
    } catch (err) {
      console.warn('[MongoDB Notice] User registration fallback to memory store');
      user = memoryStore.createUser({
        username,
        email: email.toLowerCase(),
        password: hashedPassword,
        first_name: first_name || '',
        last_name: last_name || '',
        phone_number: phone_number || '',
        role: 'valuer',
      });
    }

    const userId = (user._id || user.id).toString();
    const token = generateToken({
      userId,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    return NextResponse.json(
      {
        message: 'User registered successfully',
        access: token,
        refresh: token,
        user: {
          id: userId,
          username: user.username,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone_number: user.phone_number,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
