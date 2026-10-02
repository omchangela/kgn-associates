import { NextResponse } from 'next/server';
import { getValuationById, upsertValuation, deleteValuation } from '@/lib/mysql';
import memoryStore from '@/lib/memoryStore';

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    let report = await getValuationById(id);
    if (!report) {
      report = memoryStore.getValuationById(id);
    }

    if (!report) {
      return NextResponse.json({ detail: 'Valuation not found' }, { status: 404 });
    }

    const obj = report;
    return NextResponse.json({
      id: obj.id || obj._id,
      _id: obj.id || obj._id,
      ...obj,
      institution_details: obj.institutionDetails || obj.institution_details,
      verified_documents: obj.verifiedDocuments || obj.verified_documents,
      property_identification: obj.propertyIdentification || obj.property_identification,
      schedule_details: obj.scheduleDetails || obj.schedule_details,
      infrastructure_details: obj.infrastructureDetails || obj.infrastructure_details,
      technical_details: obj.technicalDetails || obj.technical_details,
      land_extent_valuations: obj.landExtentValuations || obj.land_extent_valuations || [],
      land_valuation_basis: obj.landValuationBasis || obj.land_valuation_basis || 'as_per_documents',
      structure_valuations: obj.structureValuations || obj.structure_valuations || [],
      structure_valuation_basis: obj.structureValuationBasis || obj.structure_valuation_basis || 'as_per_actual',
      amenity_valuations: obj.amenityValuations || obj.amenity_valuations || [],
      final_valuation: obj.finalValuation || obj.final_valuation,
      location_details: obj.locationDetails || obj.location_details,
      property_characteristics: obj.propertyCharacteristics || obj.property_characteristics,
      ndma_parameters: obj.ndmaParameters || obj.ndma_parameters,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = (await getValuationById(id)) || memoryStore.getValuationById(id) || {};
    const merged = { ...existing, ...body, id, _id: id, updatedAt: new Date().toISOString() };

    let updated = null;
    try {
      updated = await upsertValuation(id, merged);
    } catch (e) {
      console.warn('[MySQL Update Fallback]:', e.message);
    }

    memoryStore.updateValuation(id, merged);

    return NextResponse.json(updated || merged);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    try {
      await deleteValuation(id);
    } catch (e) {
      console.warn('[MySQL Delete Fallback]:', e.message);
    }
    memoryStore.deleteValuation(id);

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
