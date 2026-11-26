import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import fs from 'fs';
import path from 'path';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function numberToIndianWords(num) {
  num = Math.round(Number(num) || 0);
  if (num === 0) return 'Rupees Zero Only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ',
    'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ',
    'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const inWords = (n) => {
    let str = '';
    if (n > 19) str += b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : ' ');
    else str += a[n];
    return str;
  };
  let words = '';
  const crore = Math.floor(num / 10000000); num %= 10000000;
  const lakh = Math.floor(num / 100000); num %= 100000;
  const thousand = Math.floor(num / 1000); num %= 1000;
  const hundred = Math.floor(num / 100); num %= 100;
  if (crore > 0) words += inWords(crore) + 'Crore ';
  if (lakh > 0) words += inWords(lakh) + 'Lakh ';
  if (thousand > 0) words += inWords(thousand) + 'Thousand ';
  if (hundred > 0) words += inWords(hundred) + 'Hundred ';
  if (num > 0) words += inWords(num);
  return 'Rupees ' + words.trim() + ' Only';
}

function fmtVal(val, defaultVal = '—') {
  if (val === undefined || val === null || val === '') return defaultVal;
  return String(val).trim();
}

function fmtNum(val) {
  const n = parseFloat(val);
  if (isNaN(n) || n === 0) return '0.00';
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtSqm(sqft) {
  const n = parseFloat(sqft);
  if (isNaN(n) || n === 0) return '0.00';
  return (n * 0.092903).toFixed(2);
}

function yn(val) {
  if (val === true || val === 'yes' || val === 'YES' || val === 'Yes' || val === 1) return 'YES';
  if (val === false || val === 'no' || val === 'NO' || val === 'No' || val === 0) return 'NO';
  return fmtVal(val);
}

// ─── Main Generator (matching Technical Scrutiny Report sample PDF) ──────────
export function generateValuationPdf(report) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Data extraction
  const inst = report.institutionDetails || report.institution_details || {};
  const prop = report.propertyIdentification || report.property_identification || {};
  const sched = report.scheduleDetails || report.schedule_details || {};
  const infra = report.infrastructureDetails || report.infrastructure_details || {};
  const tech = report.technicalDetails || report.technical_details || {};
  const finalVal = report.finalValuation || report.final_valuation || {};
  const loc = report.locationDetails || report.location_details || {};
  const char = report.propertyCharacteristics || report.property_characteristics || {};
  const ndma = report.ndmaParameters || report.ndma_parameters || {};
  const landExts = report.landExtentValuations || report.land_extent_valuations || [];
  const guidelineExts = report.guidelineLandExtentValuations || report.guideline_land_extent_valuations || [];
  const structs = report.structureValuations || report.structure_valuations || [];
  const amenities = report.amenityValuations || report.amenity_valuations || [];
  const photos = report.photos || [];
  const verifiedDocuments = report.verifiedDocuments || report.verified_documents || [];

  // ─── Clean Black & White / Neutral Gray Professional Theme ────────────────
  const BLUE_DARK = [17, 24, 39];    // #111827 crisp near-black
  const BLUE_MID = [229, 231, 235];  // #E5E7EB light neutral gray section headers
  const BORDER = [156, 163, 175];    // #9CA3AF crisp table borders
  const LABEL_BG = [243, 244, 246];  // #F3F4F6 subtle gray label cells
  const TEXT_DARK = [17, 24, 39];    // #111827 dark text
  const ALT_ROW = [255, 255, 255];   // pure white

  const loanAppId = fmtVal(inst.loan_application_id, report.report_number || report.id || '—');
  const bankName = fmtVal(inst.bank_name, 'BANK / INSTITUTION');
  const kgnRef = report.report_number || `KGN-2026-${String(report.id || report._id || '').slice(-4)}`;

  const secHdrStyle = {
    fillColor: BLUE_MID,
    textColor: TEXT_DARK,
    fontStyle: 'bold',
    fontSize: 7.5,
    halign: 'center',
    cellPadding: 1.8,
  };

  const bodyStyle = {
    fontSize: 6.8,
    cellPadding: 1.5,
    textColor: TEXT_DARK,
    lineColor: BORDER,
    lineWidth: 0.15,
  };

  const col6 = {
    0: { cellWidth: 30, fontStyle: 'bold', fillColor: LABEL_BG },
    1: { cellWidth: 31 },
    2: { cellWidth: 30, fontStyle: 'bold', fillColor: LABEL_BG },
    3: { cellWidth: 31 },
    4: { cellWidth: 30, fontStyle: 'bold', fillColor: LABEL_BG },
    5: { cellWidth: 30 },
  };

  const drawRunningHeader = () => {
    doc.setFillColor(243, 244, 246);
    doc.rect(0, 0, 210, 9.5, 'F');
    doc.setDrawColor(...BORDER);
    doc.line(0, 9.5, 210, 9.5);
    doc.setTextColor(...TEXT_DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('KGN ASSOCIATES — Engineers & Property Valuers', 14, 6.3);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`${bankName} | Ref: ${kgnRef}`, 196, 6.3, { align: 'right' });
  };

  const drawFooter = (pageNum, totalPages) => {
    const footerY = 289;
    doc.setDrawColor(...BORDER);
    doc.line(14, footerY - 1, 196, footerY - 1);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text('This document contains sensitive data please share with authorised people only.', 14, footerY + 3);
    doc.text(`Case / Loan App ID: ${loanAppId} | KGN Ref: ${kgnRef}`, 14, footerY + 7);
    doc.text(`Page ${pageNum} of ${totalPages}`, 196, footerY + 3, { align: 'right' });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 1: OFFICIAL LETTERHEAD + LOAN, ADDRESS, BOUNDARIES & GENERAL DETAILS
  // ═══════════════════════════════════════════════════════════════════════════
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...BORDER);
  doc.roundedRect(14, 8, 182, 31, 1, 1, 'FD');

  doc.setTextColor(...TEXT_DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('KGN ASSOCIATES', 17, 13.5);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(55, 65, 81);
  doc.text('Engineers & Property Valuers', 17, 17.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(...TEXT_DARK);
  doc.text('APPROVED PANEL VALUER FOR:', 17, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.7);
  doc.setTextColor(55, 65, 81);
  doc.text(
    'Vistaar Financial Services Pvt. Ltd., Mas Financial Services Ltd.,\nTyger Home Finance Pvt. Ltd., Tyger Capital Pvt. Ltd.,\nMuthoot Fincorp Ltd., Cholamandalam Investment & Finance Co. Ltd.',
    17, 25.3, { lineHeightFactor: 1.25 }
  );

  const engineerDisplayName = fmtVal(finalVal.valuer_name || inst.site_engineer_name, 'KGN ASSOCIATES ENGINEER');

  doc.setTextColor(...TEXT_DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(engineerDisplayName.toUpperCase(), 193, 13, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.7);
  doc.setTextColor(55, 65, 81);
  doc.text(
    'B.Tech.(Civil Engineering), A.M.I.E, A.I.I.V | IEI Associate Member (AM 3147250)\nLicensed Technical Engineer | Approved Valuer (CAT-I-A-7649) (CAT-I/A.I.I.V. NO. 7649)\nCell: 8919561033 & 9701753099 | Email: Kgnassociates2025@Gmail.Com\nDoor No: 7/43/1, Near Bus Stop, Dam Road, Yerraguntla, Garladinne, Anantapur - 515731',
    193, 16.5, { align: 'right', lineHeightFactor: 1.3 }
  );

  // Title Banner (clean neutral gray bar with dark bold text)
  doc.setFillColor(...BLUE_MID);
  doc.setDrawColor(...BORDER);
  doc.rect(14, 40.5, 182, 6.5, 'FD');
  doc.setTextColor(...TEXT_DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`TECHNICAL SCRUTINY REPORT FOR ${bankName.toUpperCase()}`, 105, 44.8, { align: 'center' });

  let Y = 48.5;

  // LOAN APPLICATION DETAIL
  autoTable(doc, {
    startY: Y,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [[{ content: 'LOAN APPLICATION DETAIL', colSpan: 6 }]],
    body: [
      ['BRANCH NAME', fmtVal(inst.branch_name), 'APPLICANT / CO-APPLICANT NAME', fmtVal(inst.applicant_name), 'FILE NO / REF.NO / LOS NO.', loanAppId],
      ['PRODUCT / LOAN TYPE', fmtVal(inst.product_loan_type, 'SECURED LOAN'), 'TRANSACTION TYPE', fmtVal(inst.property_holding_type).toUpperCase(), 'KGN CASE REF', kgnRef],
    ],
    theme: 'grid',
    headStyles: secHdrStyle,
    styles: bodyStyle,
    columnStyles: col6,
  });
  Y = doc.lastAutoTable.finalY + 2;

  // ADDRESS DETAIL
  autoTable(doc, {
    startY: Y,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [[{ content: 'ADDRESS DETAIL', colSpan: 6 }]],
    body: [
      ['ADDRESS DETAILS (AS PER SITE INSPECTION)', { content: fmtVal(prop.address_as_per_actual_site), colSpan: 5 }],
      ['ADDRESS DETAILS (AS PER DOCUMENTS)', { content: fmtVal(prop.address_as_per_documents), colSpan: 5 }],
      ['SURVEY NO / KHASRA NO.', fmtVal(prop.survey_number), 'LANDMARK', { content: fmtVal(prop.landmark), colSpan: 3 }],
      ['DISTRICT', fmtVal(prop.district), 'STATE', fmtVal(prop.state), 'PIN CODE', fmtVal(prop.pincode)],
      ['NEAREST BRANCH NAME', fmtVal(inst.branch_name), 'DISTANCE FROM NEAREST BRANCH', char.distance_from_branch_km ? `${char.distance_from_branch_km} KM` : '—', 'PROPERTY TYPE', (inst.property_type === 'others' && inst.other_property_type ? inst.other_property_type : fmtVal(inst.property_type)).toUpperCase()],
      ['PERSON MET AT SITE', fmtVal(inst.person_met_at_site), 'RELATIONSHIP WITH APPLICANT', fmtVal(inst.relationship_with_applicant), 'CONTACT NUMBER', fmtVal(inst.person_met_contact_number || inst.applicant_contact_number)],
    ],
    theme: 'grid',
    headStyles: secHdrStyle,
    styles: bodyStyle,
    columnStyles: col6,
  });
  Y = doc.lastAutoTable.finalY + 2;

  // BOUNDARIES
  autoTable(doc, {
    startY: Y,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [
      [{ content: 'BOUNDARIES', colSpan: 5 }],
      ['DIRECTION', 'NORTH', 'SOUTH', 'EAST', 'WEST'],
    ],
    body: [
      ['AS PER PLAN / TITLE DEED', fmtVal(sched.north_boundary_docs), fmtVal(sched.south_boundary_docs), fmtVal(sched.east_boundary_docs), fmtVal(sched.west_boundary_docs)],
      ['AS PER SITE INVESTIGATION', fmtVal(sched.north_boundary_actual), fmtVal(sched.south_boundary_actual), fmtVal(sched.east_boundary_actual), fmtVal(sched.west_boundary_actual)],
    ],
    theme: 'grid',
    headStyles: secHdrStyle,
    styles: bodyStyle,
    columnStyles: {
      0: { cellWidth: 34, fontStyle: 'bold', fillColor: LABEL_BG },
      1: { cellWidth: 37 },
      2: { cellWidth: 37 },
      3: { cellWidth: 37 },
      4: { cellWidth: 37 },
    },
  });
  Y = doc.lastAutoTable.finalY + 2;

  // GENERAL PROPERTY DETAIL
  const approachRoadStr = `${fmtVal(infra.road_width_ft, '—')} FT ${fmtVal(infra.approach_road_type, '').toUpperCase()}`.trim();
  autoTable(doc, {
    startY: Y,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [[{ content: 'GENERAL PROPERTY DETAIL', colSpan: 6 }]],
    body: [
      ['APPROVAL AUTHORITY', fmtVal(prop.approving_authority), 'JURISDICTION / LIMIT', fmtVal(prop.jurisdiction, 'GRAMA PANCHAYAT / MUNICIPAL'), 'AGE OF PROPERTY', tech.property_age ? `${tech.property_age} YEARS` : '—'],
      ['RESIDUAL AGE OF PROPERTY', tech.residual_age ? `${tech.residual_age} YEARS` : '—', 'PROPERTY / UNIT TYPE', fmtVal(sched.actual_usage_of_property, 'RESIDENTIAL'), 'APPROACH ROAD', approachRoadStr || '—'],
      ['OCCUPANCY STATUS', fmtVal(sched.occupancy_status), 'OCCUPANT NAME / INFO', fmtVal(sched.occupant_details), 'CLASS OF LOCALITY', fmtVal(sched.class_of_locality, 'Middle Class')],
      ['VIOLATIONS OBSERVED', 'NO', 'RISK OF DEMOLITION', fmtVal(char.risk_of_demolition, 'No'), 'CAUTION AREA (YES/NO)', yn(char.negative_area_as_per_local)],
      ['PROPERTY INTERIORS', fmtVal(sched.construction_quality, 'GOOD'), 'PROPERTY EXTERIORS', fmtVal(sched.maintenance_of_property, 'GOOD'), 'BASIC AMENITIES (ROAD/ELEC/WATER)', (infra.electricity || infra.water) ? 'Yes' : 'No'],
      ['DEVELOPMENT IN COLONY', fmtVal(char.development_of_vicinity, 'Developed'), 'HABITATION %', char.habitation_around_property_percent ? `${char.habitation_around_property_percent}%` : '—', 'LOCAL TRANSPORT', fmtVal(char.availability_of_local_transport, 'Available')],
    ],
    theme: 'grid',
    headStyles: secHdrStyle,
    styles: bodyStyle,
    columnStyles: col6,
  });
  Y = doc.lastAutoTable.finalY + 2;

  // SURROUNDING EXTERNAL AMENITIES & LAT/LONG
  const latStr = fmtVal(loc.latitude || loc.manual_latitude, '');
  const lngStr = fmtVal(loc.longitude || loc.manual_longitude, '');
  const coordsStr = latStr && lngStr ? `${latStr}, ${lngStr}` : '—';

  autoTable(doc, {
    startY: Y,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [
      [{ content: 'SURROUNDING EXTERNAL AMENITIES', colSpan: 4 }],
      ['SR. NO.', 'PREMISES LIST', 'APPROX DISTANCE FROM PROPERTY', 'NAME OF PREMISES / DESCRIPTION'],
    ],
    body: [
      ['1', 'NEAREST RAILWAY STATION', char.nearest_railway_station_km ? `${char.nearest_railway_station_km} KM` : '—', 'NEAREST RAILWAY STATION'],
      ['2', 'NEAREST BUS STATION', char.nearest_bus_station_km ? `${char.nearest_bus_station_km} KM` : '—', 'NEAREST BUS STAND'],
      ['3', 'NEAREST HIGHWAY / CONNECTING ROAD', char.nearest_connecting_road_km ? `${char.nearest_connecting_road_km} KM` : '—', 'CONNECTING ROAD'],
      [{ content: 'PROPERTY LATITUDE AND LONGITUDE', colSpan: 2, styles: { fontStyle: 'bold', fillColor: LABEL_BG } }, { content: coordsStr, colSpan: 2, styles: { fontStyle: 'bold' } }],
    ],
    theme: 'grid',
    headStyles: secHdrStyle,
    styles: bodyStyle,
    columnStyles: {
      0: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 54, fontStyle: 'bold', fillColor: LABEL_BG },
      2: { cellWidth: 45, halign: 'center' },
      3: { cellWidth: 65 },
    },
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 2: AREA DETAIL, VALUATION DETAIL, AMENITIES & FLOOR DETAILS
  // ═══════════════════════════════════════════════════════════════════════════
  doc.addPage();
  drawRunningHeader();
  Y = 13;

  // Resolve Plot Area & Structure Areas
  const adoptedLandRow = landExts.find((l) => l.basis_of_valuation === 'final_selected') || landExts[0] || {};
  const landSqft = adoptedLandRow.land_extent_sqft || tech.plot_area || tech.landMeasurements?.land_extent_actual || 0;
  const carpetSqft = tech.carpet_area || 0;
  const buaSqft = tech.built_up_area || tech.total_built_up_area || 0;

  // AREA DETAIL
  const areaRemarks = [
    `As per Document / Actual Visit: Plot Area = ${fmtNum(landSqft)} Sq.Ft`,
    buaSqft ? `Existing Built-Up Area = ${fmtNum(buaSqft)} Sq.Ft` : '',
    tech.apartment_case_note ? `Note: ${tech.apartment_case_note}` : '',
  ].filter(Boolean).join('\n');

  autoTable(doc, {
    startY: Y,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [
      [{ content: 'AREA DETAIL', colSpan: 4 }],
      ['AREA TYPE', 'SQUARE FEET', 'SQUARE METER', 'REMARKS ON AREA OF PROPERTY'],
    ],
    body: [
      ['PLOT AREA AS PER DOCUMENT / MEASUREMENT', fmtNum(landSqft), fmtSqm(landSqft), { content: areaRemarks, rowSpan: 4 }],
      ['CARPET AREA', fmtNum(carpetSqft), fmtSqm(carpetSqft)],
      ['BUILT-UP AREA (TOTAL)', fmtNum(buaSqft), fmtSqm(buaSqft)],
      ['SALEABLE / ADOPTED AREA', fmtNum(landSqft), fmtSqm(landSqft)],
    ],
    theme: 'grid',
    headStyles: secHdrStyle,
    styles: bodyStyle,
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold', fillColor: LABEL_BG },
      1: { cellWidth: 30, halign: 'right' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 67 },
    },
  });
  Y = doc.lastAutoTable.finalY + 3;

  // VALUATION DETAIL
  const landMarketRow = landExts.find((l) => l.basis_of_valuation === 'final_selected') || landExts[0] || {};
  const govtLandRow = guidelineExts.find((l) => l.basis_of_valuation === 'final_selected') || guidelineExts[0] || {};

  const valuationBody = [
    [
      'AREA VALUATION (LAND)',
      'SALEABLE / LAND AREA',
      fmtNum(landMarketRow.land_extent_sqft || landSqft),
      fmtNum(landMarketRow.cost_per_sqft || 0),
      `${fmtNum(landMarketRow.total_value || 0)} RS.`,
    ],
  ];

  if (structs.length > 0) {
    structs.forEach((s, idx) => {
      valuationBody.push([
        idx === 0 ? 'CONSTRUCTION / BUILT-UP COST' : '',
        (s.floor_details || `FLOOR ${idx + 1}`).replace(/_/g, ' ').toUpperCase(),
        fmtNum(s.area_sqft || 0),
        fmtNum(s.cost_per_sqft || 0),
        `${fmtNum(s.total_value || 0)} RS.`,
      ]);
    });
  } else {
    valuationBody.push(['CONSTRUCTION / BUILT-UP COST', 'EXISTING BUILT-UP AREA', fmtNum(buaSqft), '0.00', '0.00 RS.']);
  }

  valuationBody.push([
    'DLC RATE / GOVT. VALUE',
    'LAND / PROPERTY',
    fmtNum(govtLandRow.land_extent_sqft || landSqft),
    fmtNum(govtLandRow.cost_per_sqft || 0),
    `${fmtNum(finalVal.final_guideline_value || govtLandRow.total_value || 0)} RS.`,
  ]);

  autoTable(doc, {
    startY: Y,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [
      [{ content: 'VALUATION DETAIL', colSpan: 5 }],
      ['CATEGORY', 'AREA TYPE', 'AREA SQ.FT.', 'RATE PER SQ.FT.', 'VALUATION'],
    ],
    body: valuationBody,
    theme: 'grid',
    headStyles: secHdrStyle,
    styles: bodyStyle,
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold', fillColor: LABEL_BG },
      1: { cellWidth: 44, fontStyle: 'bold' },
      2: { cellWidth: 28, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 38, halign: 'right', fontStyle: 'bold' },
    },
  });
  Y = doc.lastAutoTable.finalY + 3;

  // AMENITIES / F & F DETAIL + FINAL MARKET / REALIZABLE / FORCED SALE VALUE
  const validAmenities = amenities.filter((a) => a.amenity_name || a.total_value || a.amenity_value);
  const amenitiesTotal = validAmenities.reduce((s, a) => s + (parseFloat(a.total_value || a.amenity_value) || 0), 0);
  const marketValue = parseFloat(finalVal.final_market_value) || 0;
  const realizableValue = parseFloat(finalVal.distress_value) || (marketValue > 0 ? Math.round(marketValue * 0.9) : 0);
  const forcedSaleValue = parseFloat(finalVal.forced_sale_value) || (marketValue > 0 ? Math.round(marketValue * 0.8) : 0);

  const amenitiesRows = validAmenities.length > 0
    ? validAmenities.map((a, idx) => [
        String(idx + 1),
        fmtVal(a.amenity_name, 'Amenity'),
        fmtVal(a.quantity || '1'),
        'LS',
        `${fmtNum(a.total_value || a.amenity_value || 0)} RS.`,
      ])
    : [['1', 'NO EXTRA AMENITIES', '0', 'SQ.FT', '0.00 RS.']];

  amenitiesRows.push(
    [{ content: 'TOTAL AMENITIES COST', colSpan: 4, styles: { fontStyle: 'bold', halign: 'right', fillColor: LABEL_BG } }, { content: `${fmtNum(amenitiesTotal)} RS.`, styles: { fontStyle: 'bold', halign: 'right' } }],
    [{ content: 'MARKET VALUE', colSpan: 4, styles: { fontStyle: 'bold', halign: 'right', fillColor: [229, 231, 235] } }, { content: `${fmtNum(marketValue)} RS.`, styles: { fontStyle: 'bold', halign: 'right', fillColor: [229, 231, 235] } }],
    [{ content: 'AMOUNT IN WORDS', colSpan: 1, styles: { fontStyle: 'bold', fillColor: LABEL_BG } }, { content: numberToIndianWords(marketValue), colSpan: 4, styles: { fontStyle: 'italic' } }],
    [{ content: 'REALIZABLE VALUE (90%)', colSpan: 4, styles: { fontStyle: 'bold', halign: 'right', fillColor: LABEL_BG } }, { content: `${fmtNum(realizableValue)} RS.`, styles: { fontStyle: 'bold', halign: 'right' } }],
    [{ content: 'FORCED SALE / DISTRESS VALUE (80%)', colSpan: 4, styles: { fontStyle: 'bold', halign: 'right', fillColor: LABEL_BG } }, { content: `${fmtNum(forcedSaleValue)} RS.`, styles: { fontStyle: 'bold', halign: 'right' } }],
    [{ content: 'GUIDELINE / DLC VALUE', colSpan: 4, styles: { fontStyle: 'bold', halign: 'right', fillColor: LABEL_BG } }, { content: `${fmtNum(finalVal.final_guideline_value || 0)} RS.`, styles: { fontStyle: 'bold', halign: 'right' } }]
  );

  autoTable(doc, {
    startY: Y,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [
      [{ content: 'AMENITIES / F & F DETAIL & FINAL VALUATION SUMMARY', colSpan: 5 }],
      ['SR. NO.', 'DESCRIPTION', 'AREA / QUANTITY', 'UNIT', 'AMOUNT'],
    ],
    body: amenitiesRows,
    theme: 'grid',
    headStyles: secHdrStyle,
    styles: bodyStyle,
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 72 },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 38, halign: 'right' },
    },
  });
  Y = doc.lastAutoTable.finalY + 3;

  // FLOOR DETAILS
  autoTable(doc, {
    startY: Y,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [
      [{ content: 'FLOOR DETAILS', colSpan: 4 }],
      ['FLOOR', 'APPROVED', 'PROPOSED / ACTUAL', 'REMARKS ON NO. OF FLOORS'],
    ],
    body: [
      ['A. NO. OF BASEMENT', '0', '0', { content: `${fmtVal(sched.construction_type, 'RCC FRAMED STRUCTURE')} — ${fmtVal(sched.occupancy_status, 'OCCUPIED')} (${fmtVal(sched.occupant_details, 'OWNER')})`, rowSpan: 4 }],
      ['B. NO. OF GROUND / STILT FLOOR', fmtVal(sched.no_of_floors_approved, '0'), fmtVal(sched.no_of_floors_existing || sched.number_of_floors, '1')],
      ['C. NO. OF UPPER FLOORS', '0', '0'],
      ['A+B+C TOTAL NO. OF FLOORS', fmtVal(sched.no_of_floors_approved, '0'), fmtVal(sched.no_of_floors_existing || sched.number_of_floors, '1')],
    ],
    theme: 'grid',
    headStyles: secHdrStyle,
    styles: bodyStyle,
    columnStyles: {
      0: { cellWidth: 48, fontStyle: 'bold', fillColor: LABEL_BG },
      1: { cellWidth: 26, halign: 'center' },
      2: { cellWidth: 32, halign: 'center' },
      3: { cellWidth: 76 },
    },
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 3: TECHNICAL / LEGAL DOCUMENTS, NDMA PARAMETERS & REMARKS
  // ═══════════════════════════════════════════════════════════════════════════
  doc.addPage();
  drawRunningHeader();
  Y = 13;

  const validDocs = verifiedDocuments.filter((d) => d.type_of_document || d.document_type || d.document_number);
  const docRows = validDocs.length > 0
    ? validDocs.map((d) => [
        fmtVal(d.type_of_document || d.document_type, 'TITLE DEED'),
        fmtVal(d.document_number, '--'),
        fmtVal(d.execution_date, '--'),
        fmtVal(d.approval_authority, '--'),
        fmtVal(d.in_favour_of, '--'),
      ])
    : [['SALE DEED / TITLE DEED', fmtVal(inst.document_number, '--'), fmtVal(inst.execution_date, '--'), fmtVal(inst.approval_authority, '--'), fmtVal(inst.in_favour_of, '--')]];

  const docRemarksStr = validDocs.length > 0
    ? validDocs.map((d, i) => `${i + 1}. ${fmtVal(d.type_of_document || d.document_type, 'DOC')} NO: ${fmtVal(d.document_number, '--')}, DT: ${fmtVal(d.execution_date, '--')}, IN FAVOUR OF: ${fmtVal(d.in_favour_of, '--')}, ISSUED @ ${fmtVal(d.approval_authority, '--')}`).join('\n')
    : 'Documents verified as provided by the applicant / lending institution.';

  docRows.push([
    { content: 'REMARKS ON DOCUMENT VERIFIED', styles: { fontStyle: 'bold', fillColor: LABEL_BG } },
    { content: docRemarksStr, colSpan: 4 },
  ]);

  autoTable(doc, {
    startY: Y,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [
      [{ content: 'TECHNICAL / LEGAL DOCUMENT DETAIL', colSpan: 5 }],
      ['DOCUMENT NAME', 'REF / APPROVAL NO.', 'REF / APPROVAL DATE', 'APPROVAL AUTHORITY NAME', 'IN FAVOUR OF'],
    ],
    body: docRows,
    theme: 'grid',
    headStyles: secHdrStyle,
    styles: bodyStyle,
    columnStyles: {
      0: { cellWidth: 38, fontStyle: 'bold', fillColor: LABEL_BG },
      1: { cellWidth: 34 },
      2: { cellWidth: 28 },
      3: { cellWidth: 40 },
      4: { cellWidth: 42 },
    },
  });
  Y = doc.lastAutoTable.finalY + 3;

  // TECHNICAL PARAMETERS (NDMA)
  autoTable(doc, {
    startY: Y,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [[{ content: 'TECHNICAL PARAMETERS (AS PER NATURAL DISASTER MANAGEMENT NORMS)', colSpan: 6 }]],
    body: [
      ['SEISMIC ZONE', fmtVal(ndma.seismic_zone, 'II'), 'STRUCTURE TYPE', fmtVal(ndma.nature_of_building || sched.construction_type, 'RCC FRAMED STRUCTURE'), 'FOOTING / FOUNDATION', fmtVal(tech.foundation_type, 'INDEPENDENT FOOTING')],
      ['ROOF TYPE', fmtVal(ndma.roof_type || sched.roof_type, 'RCC ROOF'), 'CONCRETE GRADE', fmtVal(ndma.concrete_grade, 'M20'), 'SOIL TYPE', fmtVal(ndma.soil_strata, 'RED / HARD SOIL')],
      ['SHAPE OF BUILDING', fmtVal(ndma.shape_of_building, 'REGULAR'), 'FLOOD PRONE AREA', 'NO', 'TECHNICALLY ACCEPTABLE', 'YES'],
    ],
    theme: 'grid',
    headStyles: secHdrStyle,
    styles: bodyStyle,
    columnStyles: col6,
  });
  Y = doc.lastAutoTable.finalY + 3;

  // REMARKS ON THE PROPERTY (matching sample PDF remarks)
  const remarksList = [
    ['1.', `SUBJECT PROPERTY IS SITUATED WITHIN ${fmtVal(prop.jurisdiction || prop.locality_name, 'LOCAL').toUpperCase()} LIMITS & LOCATED IN ${fmtVal(sched.class_of_locality, 'GOOD RESIDENTIAL').toUpperCase()} AREA.`],
    ['2.', 'PROPERTY IS IDENTIFIED WITH REGISTERED DOCUMENTS, SITE MEASUREMENTS & BOUNDARIES & LOCAL ENQUIRY.'],
    ['3.', `THE SUBJECT PROPERTY IS ${fmtVal(sched.construction_type, 'RCC').toUpperCase()} STRUCTURE — ${fmtVal(sched.occupancy_status, 'OCCUPIED').toUpperCase()}.`],
    ['4.', 'LEGAL ASPECTS ARE BEYOND SCOPE OF VALUATION. THIS REPORT DOES NOT CERTIFY OR CONFIRM ANY OWNERSHIP OR TITLE.'],
    ['5.', 'I / WE DO NOT HAVE ANY DIRECT OR INDIRECT INTEREST IN VALUATION OF SUBJECT PROPERTY.'],
    ['6.', 'THE FAIR MARKET VALUE INDICATED IN THE REPORT IS AN OPINION OF THE VALUE PREVAILING ON THE DATE OF REPORT BASED ON MARKET FEEDBACK.'],
    ['7.', 'COMPLIANCE WITH STATUTORY REGULATIONS PERTAINING TO MORTGAGE OR PROPERTY LOANS IS THE RESPONSIBILITY OF THE LENDING INSTITUTION.'],
  ];
  if (finalVal.valuer_remarks) {
    remarksList.push(['8.', String(finalVal.valuer_remarks).toUpperCase()]);
  }

  autoTable(doc, {
    startY: Y,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [[{ content: 'REMARKS ON THE PROPERTY', colSpan: 2 }]],
    body: remarksList,
    theme: 'grid',
    headStyles: secHdrStyle,
    styles: bodyStyle,
    columnStyles: {
      0: { cellWidth: 12, halign: 'center', fontStyle: 'bold', fillColor: LABEL_BG },
      1: { cellWidth: 170 },
    },
  });
  Y = doc.lastAutoTable.finalY + 3;

  // TSR PREPARED BY / VISIT DONE BY / SIGNATURE BLOCK
  const engineerName = fmtVal(finalVal.valuer_name || inst.site_engineer_name, 'KGN ASSOCIATES ENGINEER');
  const reportDate = fmtVal(finalVal.report_date || inst.date_of_report, new Date().toISOString().split('T')[0]);
  const inspectDate = fmtVal(inst.date_of_inspection, reportDate);

  autoTable(doc, {
    startY: Y,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    body: [
      ['TSR PREPARED BY', engineerName, 'VISIT DONE BY (NAME)', fmtVal(inst.site_engineer_name, engineerName)],
      ['TSR PREPARED DATE', reportDate, 'VISIT DATE', inspectDate],
      ['ENGINEER CONTACT', fmtVal(finalVal.engineer_contact || inst.site_engineer_contact_number, '8919561033'), 'RECOMMENDATION', 'YES — RECOMMENDED'],
    ],
    theme: 'grid',
    styles: bodyStyle,
    columnStyles: {
      0: { cellWidth: 38, fontStyle: 'bold', fillColor: LABEL_BG },
      1: { cellWidth: 53, fontStyle: 'bold' },
      2: { cellWidth: 38, fontStyle: 'bold', fillColor: LABEL_BG },
      3: { cellWidth: 53, fontStyle: 'bold' },
    },
  });
  Y = doc.lastAutoTable.finalY + 4;

  // SIGNATURE BOXES
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...BORDER);
  doc.roundedRect(14, Y, 182, 24, 1, 1, 'FD');

  const inspectorSig = report.signatures?.signature_inspector;
  if (inspectorSig && typeof inspectorSig === 'string' && inspectorSig.startsWith('data:image')) {
    try { doc.addImage(inspectorSig, inspectorSig.includes('png') ? 'PNG' : 'JPEG', 20, Y + 2, 28, 9); } catch (_) {}
  }
  const engineerSig = report.signatures?.signature_engineer || report.signatures?.signature_valuer;
  if (engineerSig && typeof engineerSig === 'string' && engineerSig.startsWith('data:image')) {
    try { doc.addImage(engineerSig, engineerSig.includes('png') ? 'PNG' : 'JPEG', 142, Y + 2, 28, 9); } catch (_) {}
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...BLUE_DARK);
  doc.text('SIGNATURE OF INSPECTOR', 20, Y + 17);
  doc.text('SIGNATURE & STAMP OF ENGINEER', 190, Y + 17, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text(`${engineerName} | Date: ${reportDate}`, 190, Y + 21, { align: 'right' });

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 4+: GEO-COORDINATES & PROPERTY PHOTOGRAPHS (3 per row)
  // ═══════════════════════════════════════════════════════════════════════════
  if (photos && photos.length > 0 && photos.some((p) => p.photo || p.preview)) {
    const validPhotos = photos.filter((p) => p.photo || p.preview);
    const colsPerRow = 3;
    const rowsPerPage = 3;
    const perPage = colsPerRow * rowsPerPage;

    for (let pageStart = 0; pageStart < validPhotos.length; pageStart += perPage) {
      doc.addPage();
      drawRunningHeader();

      doc.setFillColor(...BLUE_MID);
      doc.setDrawColor(...BORDER);
      doc.rect(14, 13, 182, 6.5, 'FD');
      doc.setTextColor(...TEXT_DARK);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(
        pageStart === 0 ? `GEO-COORDINATES (${coordsStr}) & PROPERTY PHOTOGRAPHS` : 'PROPERTY PHOTOGRAPHS (CONT.)',
        105, 17.3, { align: 'center' }
      );

      const pagePhotos = validPhotos.slice(pageStart, pageStart + perPage);
      const cardW = 58;
      const cardH = 74;
      const gapX = 4;
      const startY = 23;

      pagePhotos.forEach((p, idx) => {
        const globalIdx = pageStart + idx;
        const col = idx % colsPerRow;
        const row = Math.floor(idx / colsPerRow);
        const x = 14 + col * (cardW + gapX);
        const y = startY + row * (cardH + 5);

        doc.setFillColor(...ALT_ROW);
        doc.setDrawColor(...BORDER);
        doc.roundedRect(x, y, cardW, cardH, 1.5, 1.5, 'FD');

        try {
          let finalImage = p.photo || p.preview;
          if (typeof finalImage === 'string' && finalImage.startsWith('/uploads/')) {
            const diskPath = path.join(process.cwd(), 'public', finalImage);
            if (fs.existsSync(diskPath)) {
              const ext = path.extname(diskPath).toLowerCase().replace('.', '') || 'jpeg';
              const buf = fs.readFileSync(diskPath);
              finalImage = `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${buf.toString('base64')}`;
            }
          }
          if (finalImage && finalImage.startsWith('data:image')) {
            doc.addImage(finalImage, 'JPEG', x + 2, y + 2, cardW - 4, 52);
          }
        } catch (_) {}

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...BLUE_DARK);
        const title = p.group_note
          ? `${globalIdx + 1}. ${p.group_note}`
          : `Photo ${globalIdx + 1}`;
        doc.text(title.slice(0, 32), x + 2.5, y + 59);

        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        doc.text(fmtVal(p.description, 'Site Inspection Photo').slice(0, 36), x + 2.5, y + 64);
        if (p.latitude || p.longitude) {
          doc.text(`GPS: ${fmtVal(p.latitude)}, ${fmtVal(p.longitude)}`, x + 2.5, y + 69);
        }
      });
    }
  }

  // Apply footer to every page
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(i, totalPages);
  }

  return doc;
}
