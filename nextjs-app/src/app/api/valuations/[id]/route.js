import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ValuationReport from '@/models/ValuationReport';

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const report = await ValuationReport.findById(id);
    if (!report) {
      return NextResponse.json({ detail: 'Valuation not found' }, { status: 404 });
    }

    const obj = report.toObject();
    // Return both camelCase and snake_case aliases so both frontend formats are compatible
    return NextResponse.json({
      id: obj._id,
      _id: obj._id,
      ...obj,
      institution_details: obj.institutionDetails,
      verified_documents: obj.verifiedDocuments,
      property_identification: obj.propertyIdentification,
      schedule_details: obj.scheduleDetails,
      infrastructure_details: obj.infrastructureDetails,
      technical_details: obj.technicalDetails,
      land_extent_valuations: obj.landExtentValuations,
      structure_valuations: obj.structureValuations,
      amenity_valuations: obj.amenityValuations,
      final_valuation: obj.finalValuation,
      location_details: obj.locationDetails,
      property_characteristics: obj.propertyCharacteristics,
      ndma_parameters: obj.ndmaParameters,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const updated = await ValuationReport.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: false }
    );

    if (!updated) {
      return NextResponse.json({ detail: 'Valuation not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const deleted = await ValuationReport.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ detail: 'Valuation not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
