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
import { generateKgnCaseId } from '@/lib/kgnId';

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
        kgn_case_id: (formData.get('kgn_case_id') || '').toString().trim(),
        case_id: (formData.get('case_id') || '').toString().trim(),
        applicant_name: (formData.get('applicant_name') || '').toString().trim(),
        contact_number: (formData.get('contact_number') || '').toString().trim(),
        bank_name: (formData.get('bank_name') || '').toString().trim(),
        branch_name: (formData.get('branch_name') || '').toString().trim(),
        property_address: (formData.get('property_address') || '').toString().trim(),
        notes: (formData.get('notes') || '').toString().trim(),
      };

      const uploadedFiles = formData.getAll('files');
      const uploadedTitles = formData.getAll('titles');
      const singleFallback = formData.get('pdf') || formData.get('file');
      const allFiles = uploadedFiles.length > 0
        ? uploadedFiles
        : (singleFallback && typeof singleFallback === 'object' ? [singleFallback] : []);

      const attachments = [];
      for (let i = 0; i < allFiles.length; i++) {
        const fileItem = allFiles[i];
        if (!fileItem || typeof fileItem !== 'object' || fileItem.size <= 0) continue;
        const bytes = await fileItem.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const mimeType = fileItem.type || 'application/pdf';
        const fileName = fileItem.name || `document_${Date.now()}_${i + 1}.pdf`;
        const title = (uploadedTitles[i] || '').toString().trim() || fileName.replace(/\.[^.]+$/, '');
        const fileUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;

        attachments.push({
          title,
          file_name: fileName,
          file_url: fileUrl,
          mime_type: mimeType,
        });

        try {
          const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
          if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
          const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
          const fname = `${Date.now()}_${i}_${cleanName}`;
          fs.writeFileSync(path.join(uploadsDir, fname), buffer);
        } catch (_) { }
      }

      payload.attachments = attachments;
      if (attachments.length > 0) {
        payload.pdf_name = attachments[0].file_name;
        payload.pdf_url = attachments[0].file_url;
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
    let nextSeq = null;
    try {
      const existing = await getAssignments();
      if (Array.isArray(existing)) nextSeq = existing.length + 1;
    } catch (_) {}
    const kgnCaseId = payload.kgn_case_id || generateKgnCaseId(nextSeq);

    const record = {
      id,
      ...payload,
      kgn_case_id: kgnCaseId,
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

