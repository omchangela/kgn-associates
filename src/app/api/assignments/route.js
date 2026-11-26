import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  getAssignments,
  createAssignment,
  updateAssignmentStatus,
  deleteAssignment,
} from '@/lib/mysql';
import memoryStore from '@/lib/memoryStore';
import { getAuthUser } from '@/lib/auth';

export async function GET(req) {
  const authUser = getAuthUser(req);
  const { searchParams } = new URL(req.url);
  const queryEmpId = searchParams.get('employeeId') || '';

  // Non-admin employees only see cases allotted to them
  const employeeId =
    authUser && authUser.role !== 'admin' ? authUser.userId : queryEmpId;

  try {
    let list = await getAssignments({ employeeId });
    if (!list) {
      list = memoryStore.getAssignments({ employeeId });
    }
    return NextResponse.json({ success: true, assignments: list });
  } catch (err) {
    const list = memoryStore.getAssignments({ employeeId });
    return NextResponse.json({ success: true, assignments: list });
  }
}

export async function POST(req) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let payload = {};

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      payload = {
        employee_id: (formData.get('employee_id') || '').toString().trim(),
        employee_name: (formData.get('employee_name') || '').toString().trim(),
        case_id: (formData.get('case_id') || '').toString().trim(),
        applicant_name: (formData.get('applicant_name') || '').toString().trim(),
        contact_number: (formData.get('contact_number') || '').toString().trim(),
        bank_name: (formData.get('bank_name') || '').toString().trim(),
        branch_name: (formData.get('branch_name') || '').toString().trim(),
        property_address: (formData.get('property_address') || '').toString().trim(),
        notes: (formData.get('notes') || '').toString().trim(),
      };

      const pdfFile = formData.get('pdf') || formData.get('file');
      if (pdfFile && typeof pdfFile === 'object' && pdfFile.size > 0) {
        const bytes = await pdfFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const mimeType = pdfFile.type || 'application/pdf';
        payload.pdf_name = pdfFile.name || `case_${Date.now()}.pdf`;
        // Store as base64 data URL so it works reliably on serverless (Vercel) & localhost
        payload.pdf_url = `data:${mimeType};base64,${buffer.toString('base64')}`;

        // Also save to public/uploads if filesystem is writable
        try {
          const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
          if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
          const cleanName = payload.pdf_name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const fname = `${Date.now()}_${cleanName}`;
          fs.writeFileSync(path.join(uploadsDir, fname), buffer);
        } catch (_) { }
      }
    } else {
      payload = await req.json();
    }

    if (!payload.employee_id) {
      return NextResponse.json(
        { error: 'Please select an employee to allot this case.' },
        { status: 400 }
      );
    }

    const id = `assign_${Date.now()}`;
    const record = {
      id,
      ...payload,
      status: 'assigned',
    };

    let created = null;
    try {
      created = await createAssignment(record);
    } catch (e) {
      console.warn('[MySQL Assignment Fallback]:', e.message);
    }

    const memRecord = memoryStore.createAssignment(record);
    return NextResponse.json(
      { success: true, assignment: created || memRecord },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/assignments error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to allot case' },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { id, status } = body;
    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
    }
    try {
      await updateAssignmentStatus(id, status);
    } catch (_) { }
    memoryStore.updateAssignmentStatus(id, status);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    try {
      await deleteAssignment(id);
    } catch (_) { }
    memoryStore.deleteAssignment(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

