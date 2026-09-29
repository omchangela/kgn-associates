import { NextResponse } from 'next/server';
import { getAllUsers, createUser, findUser, deleteUser, updateUserStatus, updateUser } from '@/lib/mysql';
import memoryStore from '@/lib/memoryStore';
import { hashPassword } from '@/lib/auth';

// GET all employees/valuers
export async function GET() {
  try {
    let users = [];
    try {
      users = await getAllUsers();
    } catch (e) {
      console.warn('[MySQL Users Fallback]:', e.message);
    }

    if (!users || users.length === 0) {
      users = memoryStore.getAllUsers();
    }

    return NextResponse.json({
      success: true,
      users: users.map(u => ({
        id: u.id || u._id,
        username: u.username,
        email: u.email,
        first_name: u.first_name || '',
        last_name: u.last_name || '',
        phone_number: u.phone_number || '',
        city: u.city || '',
        role: u.role || 'valuer',
        status: u.status || 'active',
        created_at: u.created_at || u.createdAt || new Date().toISOString(),
      })),
    });
  } catch (error) {
    console.error('Failed to get users:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

// POST: Admin creates a new employee/valuer
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      username,
      email,
      password,
      confirm_password,
      first_name = '',
      last_name = '',
      name = '',
      phone_number = '',
      city = '',
      role = 'valuer',
      status = 'active',
    } = body;

    // If confirm_password provided, validate match
    if (confirm_password !== undefined && password !== confirm_password) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Support single 'name' field split into first_name / last_name
    const resolvedFirst = first_name || (name ? name.split(' ')[0] : '');
    const resolvedLast = last_name || (name ? name.split(' ').slice(1).join(' ') : '');

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    // Check if user already exists
    try {
      const existing = (await findUser(cleanEmail)) || (await findUser(cleanUsername));
      if (existing) {
        return NextResponse.json(
          { error: 'User with this email or username already exists' },
          { status: 409 }
        );
      }
    } catch (e) {
      // ignore
    }

    const hashedPassword = await hashPassword(password);
    const userId = `emp_${Date.now()}`;
    let newUser = null;

    try {
      newUser = await createUser({
        id: userId,
        username: cleanUsername,
        email: cleanEmail,
        password: hashedPassword,
        first_name: resolvedFirst.trim(),
        last_name: resolvedLast.trim(),
        phone_number: phone_number.trim(),
        city: city.trim(),
        role: role || 'valuer',
        status: status || 'active',
      });
    } catch (err) {
      console.warn('[MySQL Create User Notice] Using memory fallback:', err.message);
      newUser = memoryStore.createUser({
        username: cleanUsername,
        email: cleanEmail,
        password: hashedPassword,
        first_name: resolvedFirst.trim(),
        last_name: resolvedLast.trim(),
        phone_number: phone_number.trim(),
        city: city.trim(),
        role: role || 'valuer',
        status: status || 'active',
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Employee created successfully. This employee can now log in at the Employee Portal.',
        user: {
          id: userId,
          username: newUser.username,
          email: newUser.email,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          phone_number: newUser.phone_number,
          role: newUser.role,
          status: newUser.status || status || 'active',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create employee' },
      { status: 500 }
    );
  }
}

// PATCH: Toggle employee status (active / inactive)
export async function PATCH(req) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'User ID and status are required' }, { status: 400 });
    }

    if (id === 'user_admin_root' || id === 'user_admin_1' || id === 'user_1') {
      return NextResponse.json(
        { error: 'Cannot deactivate root administrator account' },
        { status: 403 }
      );
    }

    try {
      await updateUserStatus(id, status);
    } catch (e) {
      console.warn('MySQL update status notice:', e.message);
    }

    if (memoryStore && typeof memoryStore.updateUserStatus === 'function') {
      memoryStore.updateUserStatus(id, status);
    }

    return NextResponse.json({
      success: true,
      message: `Employee status updated to ${status}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to update employee' },
      { status: 500 }
    );
  }
}

// PUT: Admin edits/updates employee details (CRUD Update)
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, first_name, last_name, email, phone_number, city = '', role, status, password } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    let hashedPassword = '';
    if (password && password.trim().length >= 6) {
      hashedPassword = await hashPassword(password.trim());
    }

    try {
      await updateUser(id, {
        first_name: first_name?.trim() || '',
        last_name: last_name?.trim() || '',
        email: email?.trim().toLowerCase() || '',
        phone_number: phone_number?.trim() || '',
        city: city?.trim() || '',
        role: role || 'valuer',
        status: status || 'active',
        password: hashedPassword,
      });
    } catch (e) {
      console.warn('MySQL update employee notice:', e.message);
    }

    if (memoryStore && typeof memoryStore.updateUser === 'function') {
      const updates = {
        first_name: first_name?.trim() || '',
        last_name: last_name?.trim() || '',
        email: email?.trim().toLowerCase() || '',
        phone_number: phone_number?.trim() || '',
        city: city?.trim() || '',
        role: role || 'valuer',
        status: status || 'active',
      };
      if (hashedPassword) updates.password = hashedPassword;
      memoryStore.updateUser(id, updates);
    }

    return NextResponse.json({
      success: true,
      message: 'Employee updated successfully',
    });
  } catch (error) {
    console.error('Failed to edit employee:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to edit employee' },
      { status: 500 }
    );
  }
}

// DELETE: Admin removes an employee
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (id === 'user_admin_root' || id === 'user_admin_1' || id === 'user_1') {
      return NextResponse.json(
        { error: 'Cannot delete primary root administrator' },
        { status: 403 }
      );
    }

    try {
      await deleteUser(id);
    } catch (e) {
      console.warn('MySQL delete notice:', e.message);
    }

    if (memoryStore && typeof memoryStore.deleteUser === 'function') {
      memoryStore.deleteUser(id);
    }

    return NextResponse.json({ success: true, message: 'Employee removed successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete employee' },
      { status: 500 }
    );
  }
}
