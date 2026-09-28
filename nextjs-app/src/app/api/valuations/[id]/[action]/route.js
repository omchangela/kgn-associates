import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ValuationReport from '@/models/ValuationReport';
import memoryStore from '@/lib/memoryStore';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function GET(req, { params }) {
  const { id, action } = await params;
  let report = null;

  try {
    await dbConnect();
    report = await ValuationReport.findById(id);
    if (report) report = report.toObject();
  } catch (err) {
    // fallback
  }

  if (!report) {
    report = memoryStore.getValuationById(id);
  }

  if (!report) {
    return NextResponse.json({ detail: 'Valuation not found' }, { status: 404 });
  }

  if (action === 'full_details' || action === 'full_details/') {
    return NextResponse.json({
      id: report.id || report._id,
      _id: report.id || report._id,
      ...report,
      institution_details: report.institutionDetails,
      verified_documents: report.verifiedDocuments,
      property_identification: report.propertyIdentification,
      schedule_details: report.scheduleDetails,
      infrastructure_details: report.infrastructureDetails,
      technical_details: report.technicalDetails,
      land_extent_valuations: report.landExtentValuations,
      structure_valuations: report.structureValuations,
      amenity_valuations: report.amenityValuations,
      final_valuation: report.finalValuation,
      location_details: report.locationDetails,
      property_characteristics: report.propertyCharacteristics,
      ndma_parameters: report.ndmaParameters,
    });
  }

  if (action === 'generate-pdf' || action === 'generate-pdf/') {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const primaryColor = [26, 86, 219];
    const darkColor = [31, 41, 55];
    const accentColor = [16, 185, 129];

    // Header Banner
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 32, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('KGN ASSOCIATES', 15, 12);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('CHARTERED ENGINEERS • APPROVED VALUERS • PROJECT CONSULTANTS', 15, 18);
    doc.text('Head Office: Hyderabad, Telangana | Tel: +91 98765 43210 | info@kgnassociates.com', 15, 24);

    // Report Header Box
    doc.setTextColor(...darkColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PROPERTY VALUATION REPORT', 15, 42);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report No: ${report.report_number || report._id}`, 15, 48);
    doc.text(`Date of Inspection: ${report.institutionDetails?.date_of_inspection || 'N/A'}`, 15, 53);
    doc.text(`Date of Report: ${report.institutionDetails?.date_of_report || new Date().toISOString().split('T')[0]}`, 15, 58);

    doc.text(`Bank / Institution: ${report.institutionDetails?.bank_name || 'N/A'}`, 120, 48);
    doc.text(`Branch: ${report.institutionDetails?.branch_name || 'N/A'}`, 120, 53);
    doc.text(`Loan App ID: ${report.institutionDetails?.loan_application_id || 'N/A'}`, 120, 58);

    let currentY = 65;

    // 1. Applicant & Property Summary
    autoTable(doc, {
      startY: currentY,
      head: [['1. APPLICANT & OWNER DETAILS', '']],
      body: [
        ['Borrower / Applicant Name', report.institutionDetails?.applicant_name || 'N/A'],
        ['Contact Number', report.institutionDetails?.applicant_contact_number || 'N/A'],
        ['Property Owner Name', report.institutionDetails?.property_owner_name || 'N/A'],
        ['Property Type & Holding', `${report.institutionDetails?.property_type || 'N/A'} (${report.institutionDetails?.property_holding_type || 'Freehold'})`],
        ['Address as per Site', report.propertyIdentification?.address_as_per_actual_site || report.propertyIdentification?.address_as_per_documents || 'N/A'],
        ['Plot / Flat No & Door No', `${report.propertyIdentification?.plot_no_flat_no || '-'}, Door No: ${report.propertyIdentification?.door_no || '-'}`],
        ['Locality & District', `${report.propertyIdentification?.locality_name || '-'}, ${report.propertyIdentification?.district || '-'}`],
      ],
      theme: 'striped',
      headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 2 },
      columnStyles: { 0: { cellWidth: 70, fontStyle: 'bold' }, 1: { cellWidth: 120 } },
    });

    currentY = doc.lastAutoTable.finalY + 6;

    // 2. Boundaries Schedule
    autoTable(doc, {
      startY: currentY,
      head: [['Direction', 'As per Documents', 'As per Actual Site', 'Status']],
      body: [
        ['East', report.scheduleDetails?.east_boundary_docs || '-', report.scheduleDetails?.east_boundary_actual || '-', report.scheduleDetails?.east_boundary_status || 'Matching'],
        ['West', report.scheduleDetails?.west_boundary_docs || '-', report.scheduleDetails?.west_boundary_actual || '-', report.scheduleDetails?.west_boundary_status || 'Matching'],
        ['North', report.scheduleDetails?.north_boundary_docs || '-', report.scheduleDetails?.north_boundary_actual || '-', report.scheduleDetails?.north_boundary_status || 'Matching'],
        ['South', report.scheduleDetails?.south_boundary_docs || '-', report.scheduleDetails?.south_boundary_actual || '-', report.scheduleDetails?.south_boundary_status || 'Matching'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [75, 85, 99], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 2 },
    });

    currentY = doc.lastAutoTable.finalY + 6;

    // 3. Valuation Breakdown
    const valuationRows = [];
    if (report.landExtentValuations && report.landExtentValuations.length > 0) {
      report.landExtentValuations.forEach(l => {
        valuationRows.push(['Land Extent (' + l.basis_of_valuation + ')', `${l.land_extent_sqft || 0} Sq.Ft`, `Rs. ${l.cost_per_sqft || 0}/sqft`, `Rs. ${(l.total_value || 0).toLocaleString('en-IN')}`]);
      });
    }
    if (report.structureValuations && report.structureValuations.length > 0) {
      report.structureValuations.forEach(s => {
        valuationRows.push(['Structure (' + s.floor_details + ')', `${s.area_sqft || 0} Sq.Ft`, `Rs. ${s.cost_per_sqft || 0}/sqft`, `Rs. ${(s.total_value || 0).toLocaleString('en-IN')}`]);
      });
    }
    if (report.amenityValuations && report.amenityValuations.length > 0) {
      report.amenityValuations.forEach(a => {
        valuationRows.push(['Amenity: ' + a.amenity_name, '-', '-', `Rs. ${(a.amenity_value || 0).toLocaleString('en-IN')}`]);
      });
    }

    if (valuationRows.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [['Valuation Item', 'Extent / Area', 'Rate', 'Total Value']],
        body: valuationRows,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: 255 },
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
      head: [['VALUATION SUMMARY & RECOMMENDATION', 'AMOUNT (INR)']],
      body: [
        ['Fair Market Value of the Property', `Rs. ${(report.finalValuation?.final_market_value || 0).toLocaleString('en-IN')}`],
        ['Guideline / Ready Reckoner Value', `Rs. ${(report.finalValuation?.final_guideline_value || 0).toLocaleString('en-IN')}`],
        ['Distress / Realizable Value', `Rs. ${(report.finalValuation?.distress_value || 0).toLocaleString('en-IN')}`],
        ['Forced Sale Value', `Rs. ${(report.finalValuation?.forced_sale_value || 0).toLocaleString('en-IN')}`],
        ['Replacement Cost of Structure', `Rs. ${(report.finalValuation?.replacement_cost || 0).toLocaleString('en-IN')}`],
      ],
      theme: 'striped',
      headStyles: { fillColor: accentColor, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 2.5 },
      columnStyles: { 0: { cellWidth: 120, fontStyle: 'bold' }, 1: { cellWidth: 70, fontStyle: 'bold' } },
    });

    currentY = doc.lastAutoTable.finalY + 12;

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'italic');
    doc.text('This is an electronically generated and certified valuation report issued by KGN Associates.', 15, currentY);
    doc.text('Prepared by: Er. K. G. N. Associates (Approved Valuers & Chartered Engineers)', 15, currentY + 6);
    doc.text(`Authorized Signatory: ${report.finalValuation?.valuer_name || 'Chief Valuer'}`, 140, currentY + 14);

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
  const cleanAction = action.replace(/\/$/, '');

  let useMemory = false;
  try {
    await dbConnect();
  } catch (err) {
    useMemory = true;
  }

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
      uploaded_at: new Date(),
    };

    if (useMemory) {
      const val = memoryStore.getValuationById(id);
      if (val) {
        val.photos = val.photos || [];
        val.photos.push(photoObj);
      }
    } else {
      await ValuationReport.findByIdAndUpdate(
        id,
        { $push: { photos: photoObj } },
        { new: true }
      );
    }

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
    if (useMemory) {
      const val = memoryStore.getValuationById(id);
      if (val) val[field] = body;
      return NextResponse.json(body);
    } else {
      const updated = await ValuationReport.findByIdAndUpdate(
        id,
        { $set: { [field]: body } },
        { new: true, runValidators: false }
      );
      return NextResponse.json(updated ? updated[field] : body);
    }
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
    if (useMemory) {
      const val = memoryStore.getValuationById(id);
      if (val) {
        val[arrField] = val[arrField] || [];
        val[arrField].push(body);
      }
      return NextResponse.json(body);
    } else {
      await ValuationReport.findByIdAndUpdate(
        id,
        { $push: { [arrField]: body } },
        { new: true }
      );
      return NextResponse.json(body);
    }
  }

  return NextResponse.json({ detail: `Unknown action: ${cleanAction}` }, { status: 400 });
}
