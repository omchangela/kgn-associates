import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ValuationReport from '@/models/ValuationReport';
import { getAuthUser } from '@/lib/auth';
import memoryStore from '@/lib/memoryStore';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  try {
    await dbConnect();

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { report_number: { $regex: search, $options: 'i' } },
        { 'institutionDetails.applicant_name': { $regex: search, $options: 'i' } },
        { 'institutionDetails.property_owner_name': { $regex: search, $options: 'i' } },
        { 'institutionDetails.bank_name': { $regex: search, $options: 'i' } },
        { 'institutionDetails.loan_application_id': { $regex: search, $options: 'i' } },
        { 'propertyIdentification.locality_name': { $regex: search, $options: 'i' } },
      ];
    }

    const total = await ValuationReport.countDocuments(query);
    const reports = await ValuationReport.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const formatted = reports.map(r => ({
      id: r._id,
      _id: r._id,
      report_number: r.report_number,
      created_at: r.createdAt,
      updated_at: r.updatedAt,
      status: r.status,
      institution_details: r.institutionDetails,
      property_identification: r.propertyIdentification,
      final_valuation: r.finalValuation,
      photos_count: r.photos ? r.photos.length : 0,
    }));

    return NextResponse.json({ count: total, results: formatted });
  } catch (error) {
    // Resilient fallback to memoryStore if MongoDB isn't running locally yet
    console.warn('[MongoDB Notice] Operating with memory store fallback:', error.message);
    const list = memoryStore.getValuations({ search });
    const formatted = list.map(r => ({
      id: r.id || r._id,
      _id: r.id || r._id,
      report_number: r.report_number,
      created_at: r.createdAt,
      updated_at: r.updatedAt,
      status: r.status,
      institution_details: r.institutionDetails,
      property_identification: r.propertyIdentification,
      final_valuation: r.finalValuation,
      photos_count: r.photos ? r.photos.length : 0,
    }));
    return NextResponse.json({ count: formatted.length, results: formatted });
  }
}

export async function POST(req) {
  const authUser = getAuthUser(req);
  const body = await req.json();

  try {
    await dbConnect();
    const reportData = {
      ...body,
      createdBy: authUser ? authUser.userId : null,
    };
    const newReport = await ValuationReport.create(reportData);
    return NextResponse.json({
      id: newReport._id,
      _id: newReport._id,
      report_number: newReport.report_number,
      ...newReport.toObject(),
    }, { status: 201 });
  } catch (error) {
    console.warn('[MongoDB Notice] Creating in memory store fallback:', error.message);
    const newReport = memoryStore.createValuation(body);
    return NextResponse.json(newReport, { status: 201 });
  }
}
