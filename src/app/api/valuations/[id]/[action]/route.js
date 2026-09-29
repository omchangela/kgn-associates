import { NextResponse } from 'next/server';
import { getValuationById, upsertValuation } from '@/lib/mysql';
import memoryStore from '@/lib/memoryStore';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const primaryColor = [212, 176, 122]; // Luxury Gold
    const headerBg = [10, 13, 20];
    const darkColor = [31, 41, 55];
    const accentColor = [16, 185, 129];

    // Header Banner
    doc.setFillColor(...headerBg);
    doc.rect(0, 0, 210, 32, 'F');

    doc.setTextColor(212, 176, 122);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('KGN ASSOCIATES', 15, 12);

    doc.setTextColor(220, 220, 220);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.text('CHARTERED ENGINEERS • APPROVED VALUERS • MUNICIPAL ASSESSORS', 15, 18);
    doc.text('Head Office: Hyderabad, Telangana | Tel: +91 98765 43210 | info@kgnassociates.com', 15, 24);

    // Report Header Box
    doc.setTextColor(...darkColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFIED PROPERTY VALUATION REPORT', 15, 42);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report Ref: ${report.report_number || report.id || report._id}`, 15, 48);
    doc.text(`Date of Inspection: ${inst.date_of_inspection || 'N/A'}`, 15, 53);
    doc.text(`Date of Valuation: ${inst.date_of_report || new Date().toISOString().split('T')[0]}`, 15, 58);

    doc.text(`Bank / Institution: ${inst.bank_name || 'N/A'}`, 120, 48);
    doc.text(`Branch: ${inst.branch_name || 'N/A'}`, 120, 53);
    doc.text(`Loan App ID: ${inst.loan_application_id || 'N/A'}`, 120, 58);

    let currentY = 65;

    // 1. Applicant & Property Summary
    autoTable(doc, {
      startY: currentY,
      head: [['1. APPLICANT & ASSET IDENTIFICATION', '']],
      body: [
        ['Borrower / Applicant Name', inst.applicant_name || 'N/A'],
        ['Contact Mobile', inst.applicant_contact_number || 'N/A'],
        ['Property Owner Name', inst.property_owner_name || 'N/A'],
        ['Property & Holding Type', `${inst.property_type || 'Residential'} (${inst.property_holding_type || 'Freehold'})`],
        ['Physical Site Address', prop.address_as_per_actual_site || prop.address_as_per_documents || 'N/A'],
        ['Plot / Flat No & Door No', `${prop.plot_no_flat_no || '-'}, Door No: ${prop.door_no || '-'}`],
        ['Locality & District', `${prop.locality_name || '-'}, ${prop.district || 'Hyderabad'}`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [24, 32, 51], textColor: [212, 176, 122], fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 2 },
      columnStyles: { 0: { cellWidth: 70, fontStyle: 'bold' }, 1: { cellWidth: 120 } },
    });

    currentY = doc.lastAutoTable.finalY + 6;

    // 2. Boundaries Schedule
    autoTable(doc, {
      startY: currentY,
      head: [['Direction', 'As per Registered Docs', 'As per Actual Ground Site', 'Physical Status']],
      body: [
        ['East', sched.east_boundary_docs || '-', sched.east_boundary_actual || '-', sched.east_boundary_status || 'Matching'],
        ['West', sched.west_boundary_docs || '-', sched.west_boundary_actual || '-', sched.west_boundary_status || 'Matching'],
        ['North', sched.north_boundary_docs || '-', sched.north_boundary_actual || '-', sched.north_boundary_status || 'Matching'],
        ['South', sched.south_boundary_docs || '-', sched.south_boundary_actual || '-', sched.south_boundary_status || 'Matching'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [45, 55, 72], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 2 },
    });

    currentY = doc.lastAutoTable.finalY + 6;

    // 3. Valuation Breakdown
    const valuationRows = [];
    const landExts = report.landExtentValuations || report.land_extent_valuations || [];
    if (landExts.length > 0) {
      landExts.forEach((l) => {
        valuationRows.push([
          `Land Extent (${l.basis_of_valuation || 'Ground'})`,
          `${l.land_extent_sqft || 0} Sq.Ft`,
          `Rs. ${l.cost_per_sqft || 0}/sqft`,
          `Rs. ${(l.total_value || 0).toLocaleString('en-IN')}`,
        ]);
      });
    }

    const structs = report.structureValuations || report.structure_valuations || [];
    if (structs.length > 0) {
      structs.forEach((s) => {
        valuationRows.push([
          `Structure (${s.floor_details || 'Floor'})`,
          `${s.area_sqft || 0} Sq.Ft`,
          `Rs. ${s.cost_per_sqft || 0}/sqft`,
          `Rs. ${(s.total_value || 0).toLocaleString('en-IN')}`,
        ]);
      });
    }

    const amenities = report.amenityValuations || report.amenity_valuations || [];
    if (amenities.length > 0) {
      amenities.forEach((a) => {
        valuationRows.push([
          `Amenity: ${a.amenity_name || 'Standard'}`,
          '-',
          '-',
          `Rs. ${(a.amenity_value || 0).toLocaleString('en-IN')}`,
        ]);
      });
    }

    if (valuationRows.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [['Valuation Component', 'Extent / Plinth Area', 'Applied Rate', 'Assessed Value']],
        body: valuationRows,
        theme: 'grid',
        headStyles: { fillColor: [24, 32, 51], textColor: [212, 176, 122] },
        styles: { fontSize: 8, cellPadding: 2 },
      });
      currentY = doc.lastAutoTable.finalY + 6;
    }

    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    autoTable(doc, {
      startY: currentY,
      head: [['FINAL VALUATION SUMMARY & CERTIFICATION', 'AMOUNT (INR)']],
      body: [
        ['Fair Market Value of the Property', `Rs. ${(finalVal.final_market_value || 0).toLocaleString('en-IN')}`],
        ['Guideline / Govt. Ready Reckoner Value', `Rs. ${(finalVal.final_guideline_value || 0).toLocaleString('en-IN')}`],
        ['Realizable / Distress Value', `Rs. ${(finalVal.distress_value || 0).toLocaleString('en-IN')}`],
        ['Forced Sale Value', `Rs. ${(finalVal.forced_sale_value || 0).toLocaleString('en-IN')}`],
        ['Replacement Cost of Structural Assets', `Rs. ${(finalVal.replacement_cost || 0).toLocaleString('en-IN')}`],
      ],
      theme: 'striped',
      headStyles: { fillColor: accentColor, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 2.5 },
      columnStyles: { 0: { cellWidth: 120, fontStyle: 'bold' }, 1: { cellWidth: 70, fontStyle: 'bold' } },
    });

    currentY = doc.lastAutoTable.finalY + 12;

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'italic');
    doc.text('This is an electronically verified valuation dossier issued by KGN Associates.', 15, currentY);
    doc.text('Approved Valuers & Chartered Engineers Registered with IBBI and Municipal Authorities.', 15, currentY + 5);
    doc.text(`Certified Valuer: ${finalVal.valuer_name || 'Chief Approved Valuer'}`, 130, currentY + 12);

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
