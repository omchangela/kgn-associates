import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export async function GET(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(authUser.userId).select('-password');
    if (!user) {
      return NextResponse.json({ detail: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user._id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone_number: user.phone_number,
      role: user.role,
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

    await dbConnect();
    const body = await req.json();
    const allowed = ['first_name', 'last_name', 'phone_number'];
    const updateData = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updateData[key] = body[key];
    }

    const updated = await User.findByIdAndUpdate(
      authUser.userId,
      { $set: updateData },
      { new: true }
    ).select('-password');

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
