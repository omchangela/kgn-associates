import { NextResponse } from 'next/server';
import { getValuationById, upsertValuation } from '@/lib/mysql';
import memoryStore from '@/lib/memoryStore';
import { generateValuationPdf } from '@/lib/pdfGenerator';

export async function GET(req, { params }) {
  const { id, action } = await params;
  const cleanAction = (action || '').replace(/\/$/, '');

  let report = await getValuationById(id);
  if (!report) {
    report = memoryStore.getValuationById(id);
  }

  if (!report) {
    return NextResponse.json({ detail: 'Valuation not found' }, { status: 404 });
  }

  const inst = report.institutionDetails || report.institution_details || {};
  const prop = report.propertyIdentification || report.property_identification || {};
  const sched = report.scheduleDetails || report.schedule_details || {};
  const finalVal = report.finalValuation || report.final_valuation || {};

  if (cleanAction === 'full_details') {
    return NextResponse.json({
      id: report.id || report._id,
      _id: report.id || report._id,
      ...report,
      institution_details: inst,
      verified_documents: report.verifiedDocuments || report.verified_documents,
      property_identification: prop,
      schedule_details: sched,
      infrastructure_details: report.infrastructureDetails || report.infrastructure_details,
      technical_details: report.technicalDetails || report.technical_details,
      land_extent_valuations: report.landExtentValuations || report.land_extent_valuations || [],
      structure_valuations: report.structureValuations || report.structure_valuations || [],
      amenity_valuations: report.amenityValuations || report.amenity_valuations || [],
      final_valuation: finalVal,
      location_details: report.locationDetails || report.location_details,
      property_characteristics: report.propertyCharacteristics || report.property_characteristics,
      ndma_parameters: report.ndmaParameters || report.ndma_parameters,
    });
  }

  if (cleanAction === 'generate-pdf') {
    const doc = generateValuationPdf(report);
    const pdfArrayBuffer = doc.output('arraybuffer');
    return new NextResponse(pdfArrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="property_valuation_${id}.pdf"`,
      },
    });
  }

  return NextResponse.json({ detail: `Unknown action: ${action}` }, { status: 400 });
}

export async function POST(req, { params }) {
  const { id, action } = await params;
  const cleanAction = (action || '').replace(/\/$/, '');

  let current = (await getValuationById(id)) || memoryStore.getValuationById(id) || { id, _id: id };

  // 1. Photo upload
  if (cleanAction === 'add_photo') {
    const formData = await req.formData();
    const photoFile = formData.get('photo');
    const description = formData.get('description') || '';
    const latitude = formData.get('latitude') ? parseFloat(formData.get('latitude')) : null;
    const longitude = formData.get('longitude') ? parseFloat(formData.get('longitude')) : null;
    const locality = formData.get('locality') || '';
    const region = formData.get('region') || '';
    const bearing_degrees = formData.get('bearing_degrees') || '';
    const bearing_direction = formData.get('bearing_direction') || '';
    const captured_at = formData.get('captured_at') || '';

    let photoData = '';
    if (photoFile && typeof photoFile === 'object') {
      const bytes = await photoFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const mimeType = photoFile.type || 'image/jpeg';
      photoData = `data:${mimeType};base64,${buffer.toString('base64')}`;
    }

    const photoObj = {
      photo: photoData,
      description,
      latitude,
      longitude,
      locality,
      region,
      bearing_degrees,
      bearing_direction,
      captured_at,
      uploaded_at: new Date().toISOString(),
    };

    current.photos = current.photos || [];
    current.photos.push(photoObj);

    await upsertValuation(id, current);
    memoryStore.updateValuation(id, current);

    return NextResponse.json({ message: 'Photo added successfully', photo: photoObj });
  }

  // 2. JSON Body
  const body = await req.json();

  const actionToFieldMap = {
    update_institution_details: 'institutionDetails',
    update_property_identification: 'propertyIdentification',
    update_schedule_details: 'scheduleDetails',
    update_infrastructure_details: 'infrastructureDetails',
    update_technical_details: 'technicalDetails',
    update_final_valuation: 'finalValuation',
    update_location_details: 'locationDetails',
    update_property_characteristics: 'propertyCharacteristics',
    update_ndma_parameters: 'ndmaParameters',
  };

  if (actionToFieldMap[cleanAction]) {
    const field = actionToFieldMap[cleanAction];
    current[field] = body;
    await upsertValuation(id, current);
    memoryStore.updateValuation(id, current);
    return NextResponse.json(body);
  }

  // Array updates
  const arrayFieldMap = {
    add_land_extent_valuation: 'landExtentValuations',
    add_structure_valuation: 'structureValuations',
    add_amenity_valuation: 'amenityValuations',
    add_verified_document: 'verifiedDocuments',
  };

  if (arrayFieldMap[cleanAction]) {
    const arrField = arrayFieldMap[cleanAction];
    current[arrField] = current[arrField] || [];
    current[arrField].push(body);
    await upsertValuation(id, current);
    memoryStore.updateValuation(id, current);
    return NextResponse.json(body);
  }

  return NextResponse.json({ detail: `Unknown action: ${cleanAction}` }, { status: 400 });
}
