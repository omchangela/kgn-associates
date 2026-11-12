import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import fs from 'fs';
import path from 'path';

// ─── Cached logo ────────────────────────────────────────────────────────────
let cachedLogoBase64 = null;
function getLogoBase64() {
  if (cachedLogoBase64) return cachedLogoBase64;
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    if (fs.existsSync(logoPath)) {
      const buf = fs.readFileSync(logoPath);
      cachedLogoBase64 = `data:image/png;base64,${buf.toString('base64')}`;
      return cachedLogoBase64;
    }
  } catch (err) {
    console.warn('[PDF Logo Notice]:', err.message);
  }
  return null;
}

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

function fmtCurrency(val) {
  const num = parseFloat(val);
  if (isNaN(num) || num === 0) return '—';
  return `Rs. ${num.toLocaleString('en-IN')}`;
}

function yn(val) {
  if (val === true || val === 'yes' || val === 'YES' || val === 'Yes' || val === 1) return 'YES';
  if (val === false || val === 'no' || val === 'NO' || val === 'No' || val === 0) return 'NO';
  return fmtVal(val);
}

// ─── Main Generator ───────────────────────────────────────────────────────────
export function generateValuationPdf(report) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  // logo removed per user request

  // Data extraction
  const inst      = report.institutionDetails    || report.institution_details    || {};
  const prop      = report.propertyIdentification || report.property_identification || {};
  const sched     = report.scheduleDetails       || report.schedule_details       || {};
  const infra     = report.infrastructureDetails || report.infrastructure_details || {};
  const tech      = report.technicalDetails      || report.technical_details      || {};
  const finalVal  = report.finalValuation        || report.final_valuation        || {};
  const loc       = report.locationDetails       || report.location_details       || {};
  const char      = report.propertyCharacteristics || report.property_characteristics || {};
  const ndma      = report.ndmaParameters        || report.ndma_parameters        || {};
  const landExts  = report.landExtentValuations  || report.land_extent_valuations || [];
  const structs   = report.structureValuations   || report.structure_valuations   || [];
  const amenities = report.amenityValuations     || report.amenity_valuations     || [];
  const photos    = report.photos || [];
  const verifiedDocuments = report.verifiedDocuments || report.verified_documents || [];

  // ─── Theme ────────────────────────────────────────────────────────────────
  const NAVY     = [13, 71, 161];      // #0D47A1 deep blue
  const GOLD     = [255, 255, 255];    // white accent
  const GOLD_LT  = [255, 255, 255];    // white text
  const SLATE    = [21, 101, 192];     // #1565C0 medium blue
  const BORDER   = [187, 222, 251];    // light blue border
  const LABEL_BG = [227, 242, 253];    // light blue label bg
  const TEXT     = [13, 71, 161];      // deep blue text
  const ALT_ROW  = [240, 248, 255];    // alice blue alt row

  const loanAppId = fmtVal(inst.loan_application_id, report.report_number || report.id || '—');
  const bankName  = fmtVal(inst.bank_name, 'BANK NAME');

  // ─── Shared styles ────────────────────────────────────────────────────────
  const hdrStyle = {
    fillColor: SLATE,
    textColor: [248, 250, 252],
    fontStyle: 'bold',
    fontSize: 7.5,
    cellPadding: 2,
  };
  const bodyStyle = {
    fontSize: 7,
    cellPadding: 1.6,
    textColor: TEXT,
    lineColor: BORDER,
    lineWidth: 0.15,
  };
  // 4-col: label | value | label | value
  const col4 = {
    0: { cellWidth: 44, fontStyle: 'bold', fillColor: LABEL_BG },
    1: { cellWidth: 47 },
    2: { cellWidth: 44, fontStyle: 'bold', fillColor: LABEL_BG },
    3: { cellWidth: 47 },
  };

  // alternating row colours
  const altRows = (data) => ({
    didParseCell: (hook) => {
      if (hook.section === 'body' && hook.row.index % 2 === 1) {
        if (!hook.cell.styles.fillColor || String(hook.cell.styles.fillColor) === String(LABEL_BG)) {
          hook.cell.styles.fillColor = ALT_ROW;
        }
      }
    },
  });

  // ─── Running Header / Footer helpers ─────────────────────────────────────
  const drawHeader = () => {
    // top bar
    doc.setFillColor(...SLATE);
    doc.rect(0, 0, 210, 11, 'F');
    // Gold accent
    doc.setFillColor(...GOLD);
    doc.rect(0, 11, 210, 0.8, 'F');

    // Left: KGN Groups
    doc.setTextColor(...GOLD_LT);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('KGN Groups', 14, 7.5);

    // Right: bank name only (no logo)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(bankName, 196, 7.5, { align: 'right' });
  };

  const drawFooter = (pageNum, totalPages) => {
    const footerY = 289;
    doc.setDrawColor(...BORDER);
    doc.line(14, footerY - 1, 196, footerY - 1);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text(
      'This document contains sensitive data please share with authorised people only.',
      14, footerY + 3
    );
    doc.text(`Loan application id: ${loanAppId}`, 14, footerY + 7);
    doc.text(`Page ${pageNum} of ${totalPages}`, 196, footerY + 3, { align: 'right' });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 1
  // ═══════════════════════════════════════════════════════════════════════════
  drawHeader();
  let Y = 15;

  // ── SECTION 1: INSTITUTION DETAILS ──────────────────────────────────────
  autoTable(doc, {
    startY: Y,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [['INSTITUTION DETAILS', '', '', '']],
    body: [
      ['BANK NAME',                        fmtVal(inst.bank_name),
       'BRANCH NAME',                       fmtVal(inst.branch_name)],
      ['VENDOR / ENGINEER / INSTITUTION NAME', fmtVal(inst.vendor_engineer_institution_name),
       'CONTACT',                           fmtVal(inst.vendor_contact_number)],
      ['SITE ENGINEER NAME',               fmtVal(inst.site_engineer_name),
       'CONTACT',                           fmtVal(inst.site_engineer_contact_number)],
      ['DATE OF INSPECTION',               fmtVal(inst.date_of_inspection),
       'DATE OF REPORT',                    fmtVal(inst.date_of_report)],
    ],
    theme: 'grid',
    headStyles: hdrStyle,
    styles: bodyStyle,
    columnStyles: col4,
    ...altRows(),
  });
  Y = doc.lastAutoTable.finalY + 3;

  // ── SECTION 2: BASIC DETAILS – LOAN APPLICATION DETAILS ─────────────────
  autoTable(doc, {
    startY: Y,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [['BASIC DETAILS – LOAN APPLICATION DETAILS', '', '', '']],
    body: [
      ['LOAN APPLICATION ID',              fmtVal(inst.loan_application_id),
       'LOAN TYPE',                         fmtVal(inst.product_loan_type)],
      ['APPLICANT NAME',                   fmtVal(inst.applicant_name),
       'CONTACT',                           fmtVal(inst.applicant_contact_number)],
      ['PROPERTY OWNER NAME',              fmtVal(inst.property_owner_name),
       'CONTACT',                           fmtVal(inst.property_owner_contact_number)],
      ['PERSON MET AT SITE',               fmtVal(inst.person_met_at_site),
       'CONTACT',                           fmtVal(inst.person_met_contact_number)],
      ['RELATIONSHIP WITH APPLICANT',      { content: fmtVal(inst.relationship_with_applicant), colSpan: 3 }],
    ],
    theme: 'grid',
    headStyles: hdrStyle,
    styles: bodyStyle,
    columnStyles: col4,
    ...altRows(),
  });
  Y = doc.lastAutoTable.finalY + 3;

  // ── SECTION 3: VERIFIED DOCUMENTS (YES/NO checkboxes grid) ──────────────
  const vd = (key) => {
    const found = verifiedDocuments.find(d =>
      (d.type_of_document || '').toLowerCase().includes(key.toLowerCase()) ||
      (d.document_type || '').toLowerCase().includes(key.toLowerCase())
    );
    return found ? 'YES ☑' : 'NO ☐';
  };
  // Try boolean fields first, then fall back to document list
  const docChecks = {
    title_deed:        inst.title_deed_verified       || (verifiedDocuments.some(d => /title.?deed/i.test(d.type_of_document || d.document_type))),
    property_tax:      inst.property_tax_verified     || (verifiedDocuments.some(d => /property.?tax/i.test(d.type_of_document || d.document_type))),
    e_bill:            inst.e_bill_verified           || (verifiedDocuments.some(d => /e.?bill/i.test(d.type_of_document || d.document_type))),
    plan_approval:     inst.plan_approval_verified    || (verifiedDocuments.some(d => /plan|approval|building/i.test(d.type_of_document || d.document_type))),
    sketch_layout:     inst.sketch_verified           || (verifiedDocuments.some(d => /sketch|layout/i.test(d.type_of_document || d.document_type))),
    position_cert:     inst.position_cert_verified    || (verifiedDocuments.some(d => /position/i.test(d.type_of_document || d.document_type))),
    survey_sketch:     inst.survey_sketch_verified    || (verifiedDocuments.some(d => /survey/i.test(d.type_of_document || d.document_type))),
    others:            inst.others_verified           || (verifiedDocuments.some(d => /other/i.test(d.type_of_document || d.document_type))),
  };
  const ck = (v) => v ? 'YES ☑' : 'NO ☐';

  autoTable(doc, {
    startY: Y,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [['VERIFIED DOCUMENTS', '', '', '']],
    body: [
      ['TITLE DEED',         ck(docChecks.title_deed),
       'PROPERTY TAX',       ck(docChecks.property_tax)],
      ['E-BILL',             ck(docChecks.e_bill),
       'PLAN APPROVAL & BUILDING PLANS', ck(docChecks.plan_approval)],
      ['SKETCH / LAYOUT',    ck(docChecks.sketch_layout),
       'POSITION CERTIFICATE', ck(docChecks.position_cert)],
      ['SURVEY SKETCH',      ck(docChecks.survey_sketch),
       'OTHERS',             ck(docChecks.others)],
    ],
    theme: 'grid',
    headStyles: hdrStyle,
    styles: bodyStyle,
    columnStyles: {
      0: { cellWidth: 44, fontStyle: 'bold', fillColor: LABEL_BG },
      1: { cellWidth: 47, halign: 'center' },
      2: { cellWidth: 44, fontStyle: 'bold', fillColor: LABEL_BG },
      3: { cellWidth: 47, halign: 'center' },
    },
  });
  Y = doc.lastAutoTable.finalY + 3;

  // ── SECTION 4: VERIFIED DOCUMENT DETAILS ────────────────────────────────
  const validDocs = verifiedDocuments.filter(d => d.type_of_document || d.document_type || d.document_number);
  if (validDocs.length > 0) {
    autoTable(doc, {
      startY: Y,
      margin: { left: 14, right: 14 },
      tableWidth: 182,
      head: [['VERIFIED DOCUMENT DETAILS', '', '', '', '']],
      body: validDocs.map(d => [
        fmtVal(d.type_of_document || d.document_type),
        fmtVal(d.document_number),
        fmtVal(d.execution_date),
        fmtVal(d.approval_authority),
        fmtVal(d.in_favour_of),
      ]),
      theme: 'grid',
      headStyles: hdrStyle,
      styles: { ...bodyStyle, fontSize: 6.5 },
      columnStyles: {
        0: { cellWidth: 36, fontStyle: 'bold', fillColor: LABEL_BG },
        1: { cellWidth: 34 },
        2: { cellWidth: 28 },
        3: { cellWidth: 40 },
        4: { cellWidth: 44 },
      },
      didParseCell: (hook) => {
        if (hook.section === 'head' && hook.column.index === 0) {
          hook.cell.colSpan = 5;
          hook.cell.text = ['VERIFIED DOCUMENT DETAILS – TYPE | DOC NO | EXECUTION DATE | APPROVAL AUTHORITY | IN FAVOR OF'];
        }
      },
    });
    Y = doc.lastAutoTable.finalY + 3;
  }

  // Fix: use a proper head row for verified document details
  if (validDocs.length > 0) {
    // already drawn above, skip
  }

  // ── SECTION 5: PROPERTY DETAILS ──────────────────────────────────────────
  autoTable(doc, {
    startY: Y,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [['PROPERTY DETAILS', '', '', '']],
    body: [
      ['ADDRESS AS PER SITE VISIT',  { content: fmtVal(prop.address_as_per_actual_site),  colSpan: 3 }],
      ['ADDRESS AS PER DOCUMENT',    { content: fmtVal(prop.address_as_per_documents),    colSpan: 3 }],
      ['ADDRESS AS PER PLAN',        { content: fmtVal(prop.address_as_per_plan, prop.address_as_per_documents), colSpan: 3 }],
      ['LAND MARK',                  fmtVal(prop.landmark),
       'JURISDICTION',               fmtVal(prop.jurisdiction || prop.approving_authority)],
      ['MANDAL',                     fmtVal(prop.mandal || prop.taluka),
       'CITY',                       fmtVal(prop.district)],
      ['STATE NAME',                 fmtVal(prop.state),
       'PINCODE',                    fmtVal(prop.pincode)],
      ['PROPERTY TYPE',              { content: fmtVal(prop.property_type || inst.property_type), colSpan: 3 }],
    ],
    theme: 'grid',
    headStyles: hdrStyle,
    styles: bodyStyle,
    columnStyles: col4,
    ...altRows(),
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 2
  // ═══════════════════════════════════════════════════════════════════════════
  doc.addPage();
  drawHeader();
  Y = 15;

  // ── SECTION 6: SCHEDULE DETAILS – Boundary table ─────────────────────────
  autoTable(doc, {
    startY: Y,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [['SCHEDULE DETAILS', 'AS PER VISIT', 'AS PER DOCUMENT DOC1', 'AS PER DOCUMENT DOC2', 'AS PER PLAN']],
    body: [
      ['EAST',
       fmtVal(sched.east_boundary_actual || sched.east_actual),
       fmtVal(sched.east_boundary_docs   || sched.east_docs || sched.east_document),
       fmtVal(sched.east_boundary_docs2  || sched.east_docs_2 || '—'),
       fmtVal(sched.east_boundary_plan   || sched.east_plan)],
      ['WEST',
       fmtVal(sched.west_boundary_actual || sched.west_actual),
       fmtVal(sched.west_boundary_docs   || sched.west_docs || sched.west_document),
       fmtVal(sched.west_boundary_docs2  || sched.west_docs_2 || '—'),
       fmtVal(sched.west_boundary_plan   || sched.west_plan)],
      ['NORTH',
       fmtVal(sched.north_boundary_actual || sched.north_actual),
       fmtVal(sched.north_boundary_docs   || sched.north_docs || sched.north_document),
       fmtVal(sched.north_boundary_docs2  || sched.north_docs_2 || '—'),
       fmtVal(sched.north_boundary_plan   || sched.north_plan)],
      ['SOUTH',
       fmtVal(sched.south_boundary_actual || sched.south_actual),
       fmtVal(sched.south_boundary_docs   || sched.south_docs || sched.south_document),
       fmtVal(sched.south_boundary_docs2  || sched.south_docs_2 || '—'),
       fmtVal(sched.south_boundary_plan   || sched.south_plan)],
    ],
    theme: 'grid',
    headStyles: hdrStyle,
    styles: bodyStyle,
    columnStyles: {
      0: { cellWidth: 24, fontStyle: 'bold', fillColor: LABEL_BG },
      1: { cellWidth: 38 },
      2: { cellWidth: 40 },
      3: { cellWidth: 40 },
      4: { cellWidth: 40 },
    },
  });
  Y = doc.lastAutoTable.finalY + 1;

  // Matching status rows
  autoTable(doc, {
    startY: Y,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    body: [
      ['MATCHING STATUS',
       yn(sched.east_boundary_matching  || sched.east_matching),
       yn(sched.west_boundary_matching  || sched.west_matching),
       yn(sched.north_boundary_matching || sched.north_matching),
       yn(sched.south_boundary_matching || sched.south_matching)],
      ['PROPERTY IDENTIFICATION STATUS',
       { content: yn(sched.property_identification_status), colSpan: 4, styles: { halign: 'center', fontStyle: 'bold' } }],
    ],
    theme: 'grid',
    styles: { ...bodyStyle, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 24, fillColor: LABEL_BG },
      1: { cellWidth: 38, halign: 'center' },
      2: { cellWidth: 40, halign: 'center' },
      3: { cellWidth: 40, halign: 'center' },
      4: { cellWidth: 40, halign: 'center' },
    },
  });
  Y = doc.lastAutoTable.finalY + 3;

  // ── SECTION 7: INFRASTRUCTURE DETAILS ───────────────────────────────────
  const numRoads = Math.max(1, Math.min(10, parseInt(infra.number_of_roads, 10) || 1));
  const infraBody = [
    ['ACCESSIBILITY',           yn(infra.accessibility),
     'NO. OF ROADS SURROUNDED', fmtVal(infra.number_of_roads, '1')],
    ['ROAD WIDTH (FT)',         fmtVal(infra.road_width_ft, '—'),
     'ROAD DIRECTION',          [
       infra.road_east  ? 'EAST'  : '',
       infra.road_west  ? 'WEST'  : '',
       infra.road_north ? 'NORTH' : '',
       infra.road_south ? 'SOUTH' : '',
     ].filter(Boolean).join(' / ') || fmtVal(infra.road_direction)],
    ['TYPE OF ACCESS',
     fmtVal(infra.approach_road_type === 'others' && infra.other_approach_road_type
       ? infra.other_approach_road_type
       : infra.approach_road_type),
     'ELECTRICITY',             yn(infra.electricity)],
    ['NO. OF LIFTS',            fmtVal(infra.number_of_lifts, '0'),
     '',                        ''],
  ];

  autoTable(doc, {
    startY: Y,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [['INFRASTRUCTURE DETAILS', '', '', '']],
    body: infraBody,
    theme: 'grid',
    headStyles: hdrStyle,
    styles: bodyStyle,
    columnStyles: col4,
    ...altRows(),
  });
  Y = doc.lastAutoTable.finalY + 3;

  // ── SECTION 8: PROPERTY SPECIFICATIONS ───────────────────────────────────
  autoTable(doc, {
    startY: Y,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [['PROPERTY SPECIFICATIONS', '', '', '']],
    body: [
      ['CONSTRUCTION TYPE',
       fmtVal(sched.construction_type === 'others' && sched.other_construction_type ? sched.other_construction_type : sched.construction_type),
       'CONSTRUCTION QUALITY',  fmtVal(sched.construction_quality)],
      ['MAINTENANCE OF PROPERTY', fmtVal(sched.maintenance_of_property),
       'FLOORING TYPE',          fmtVal(sched.flooring_type === 'others' && sched.other_flooring_type ? sched.other_flooring_type : sched.flooring_type)],
      ['ROOF TYPE',              fmtVal(sched.roof_type === 'others' && sched.other_roof_type ? sched.other_roof_type : sched.roof_type),
       'STAIR TYPE',             fmtVal(sched.stair_type === 'others' && sched.other_stair_type ? sched.other_stair_type : sched.stair_type)],
      ['PROPERTY USAGE',         fmtVal(sched.actual_usage_of_property),
       'OCCUPANCY STATUS',       fmtVal(sched.occupancy_status)],
      ['OCCUPANCY INFORMATION',  fmtVal(sched.occupancy_information || sched.occupant_details),
       'CLASS OF LOCALITY',      fmtVal(sched.class_of_locality === 'others' ? sched.other_class_of_locality : sched.class_of_locality)],
    ],
    theme: 'grid',
    headStyles: hdrStyle,
    styles: bodyStyle,
    columnStyles: col4,
    ...altRows(),
  });
  Y = doc.lastAutoTable.finalY + 3;

  // ── SECTION 9: TECHNICAL DETAILS – Plot Dimensions table ─────────────────
  // Gather land measurements from tech.landMeasurements
  const lm = tech.landMeasurements || {};
  const getLandVal = (basis, dir) => {
    // lm may be an array or object keyed by floor/basis
    if (Array.isArray(lm)) {
      const card = lm[0] || {};
      return fmtVal(card[`${dir}_${basis}`] || card[dir]);
    }
    return fmtVal(lm[`${dir}_${basis}`] || lm[dir] || '—');
  };
  const getExtent = (basis) => {
    if (Array.isArray(lm)) {
      const card = lm[0] || {};
      return fmtVal(card[`land_extent_${basis}`] || '—');
    }
    return fmtVal(lm[`land_extent_${basis}`] || '—');
  };

  autoTable(doc, {
    startY: Y,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [['TECHNICAL DETAILS – PLOT DIMENSIONS', 'EAST', 'WEST', 'NORTH', 'SOUTH', 'LAND EXTENT']],
    body: [
      ['AS PER ACTUAL',
       getLandVal('actual', 'east'), getLandVal('actual', 'west'),
       getLandVal('actual', 'north'), getLandVal('actual', 'south'),
       getExtent('actual')],
      ['AS PER DOCUMENT DOC1',
       getLandVal('document', 'east'), getLandVal('document', 'west'),
       getLandVal('document', 'north'), getLandVal('document', 'south'),
       getExtent('documents')],
      ['AS PER DOCUMENT DOC2',
       getLandVal('document2', 'east'), getLandVal('document2', 'west'),
       getLandVal('document2', 'north'), getLandVal('document2', 'south'),
       getExtent('documents2') || '—'],
      ['AS PER PLAN',
       getLandVal('plan', 'east'), getLandVal('plan', 'west'),
       getLandVal('plan', 'north'), getLandVal('plan', 'south'),
       getExtent('plan')],
      [{ content: 'TOTAL LAND EXTENT', colSpan: 5, styles: { fontStyle: 'bold', fillColor: LABEL_BG } },
       fmtVal(tech.total_land_extent || getExtent('actual'))],
    ],
    theme: 'grid',
    headStyles: hdrStyle,
    styles: bodyStyle,
    columnStyles: {
      0: { cellWidth: 44, fontStyle: 'bold', fillColor: LABEL_BG },
      1: { cellWidth: 26 },
      2: { cellWidth: 26 },
      3: { cellWidth: 26 },
      4: { cellWidth: 26 },
      5: { cellWidth: 34, fontStyle: 'bold' },
    },
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 3
  // ═══════════════════════════════════════════════════════════════════════════
  doc.addPage();
  drawHeader();
  Y = 15;

  // ── SECTION 10: STRUCTURE DETAILS – per floor ─────────────────────────────
  // Collect floors from specCards or structs
  const specCards = Array.isArray(tech.buildingSpecCards) ? tech.buildingSpecCards
    : Array.isArray(tech.building_spec_cards) ? tech.building_spec_cards : [];
  const perFloor  = report.perFloorStructureValuations || {};
  const floorKeys = Object.keys(perFloor).length > 0
    ? Object.keys(perFloor).sort()
    : ['gf'];

  const renderFloorDimTable = (floorLabel, floorData = {}) => {
    // floorData: { east_actual, west_actual, north_actual, south_actual, land_extent_actual, ... }
    const fv = (k) => fmtVal(floorData[k] || '—');
    const bua_actual  = parseFloat(floorData.total_bua  || floorData.bua_actual  || 0);
    const sbua_actual = parseFloat(floorData.total_sbua || floorData.sbua_actual || 0);
    const slab_actual = parseFloat(floorData.slab_area  || floorData.slab_actual || 0);
    const carpet      = Math.round(bua_actual * 0.8);
    const bua_plan    = parseFloat(floorData.bua_plan   || floorData.total_bua_plan || bua_actual);
    const deviation_sft = Math.round(bua_actual - bua_plan);
    const deviation_pct = bua_plan > 0 ? (((bua_plan - bua_actual) / bua_plan) * 100).toFixed(2) : '0.00';

    autoTable(doc, {
      startY: Y,
      margin: { left: 14, right: 14 },
      tableWidth: 182,
      head: [[`STRUCTURE DETAILS – ${floorLabel.toUpperCase()}`, 'EAST', 'WEST', 'NORTH', 'SOUTH', 'LAND EXTENT']],
      body: [
        ['AS PER ACTUAL',
         fv('east_actual'), fv('west_actual'), fv('north_actual'), fv('south_actual'),
         fv('land_extent_actual')],
        ['AS PER DOCUMENT',
         fv('east_document'), fv('west_document'), fv('north_document'), fv('south_document'),
         fv('land_extent_document')],
        ['AS PER PLAN',
         fv('east_plan'), fv('west_plan'), fv('north_plan'), fv('south_plan'),
         fv('land_extent_plan')],
        [{ content: 'TOTAL BUA',   colSpan: 5, styles: { fontStyle: 'bold', fillColor: LABEL_BG } }, bua_actual  > 0 ? `${bua_actual.toLocaleString('en-IN')} sft` : '—'],
        [{ content: 'TOTAL SBUA',  colSpan: 5, styles: { fontStyle: 'bold', fillColor: LABEL_BG } }, sbua_actual > 0 ? `${sbua_actual.toLocaleString('en-IN')} sft` : '—'],
        [{ content: 'TOTAL SLAB AREA', colSpan: 5, styles: { fontStyle: 'bold', fillColor: LABEL_BG } }, slab_actual > 0 ? `${slab_actual.toLocaleString('en-IN')} sft` : '—'],
        [{ content: `CARPET AREA (= Total BUA × 0.8) = ${carpet > 0 ? carpet.toLocaleString('en-IN') : '—'} sft`, colSpan: 6, styles: { fontStyle: 'italic', fillColor: ALT_ROW } }],
      ],
      theme: 'grid',
      headStyles: hdrStyle,
      styles: bodyStyle,
      columnStyles: {
        0: { cellWidth: 44, fontStyle: 'bold', fillColor: LABEL_BG },
        1: { cellWidth: 26 },
        2: { cellWidth: 26 },
        3: { cellWidth: 26 },
        4: { cellWidth: 26 },
        5: { cellWidth: 34, fontStyle: 'bold' },
      },
    });
    Y = doc.lastAutoTable.finalY + 1;

    // Deviation + progress
    autoTable(doc, {
      startY: Y,
      margin: { left: 14, right: 14 },
      tableWidth: 182,
      body: [
        ['DEVIATION (sft) = Actual – Plan',
         bua_plan > 0 ? `${deviation_sft > 0 ? '+' : ''}${deviation_sft} sft` : '—',
         'DEVIATION (%)',
         bua_plan > 0 ? `${deviation_pct}%` : '—'],
        ['CONSTRUCTION PROGRESS',
         fmtVal(floorData.construction_progress || tech.construction_progress, '—') + '%',
         'RECOMMENDATION OF FUNDING',
         fmtVal(floorData.recommendation_of_funding || tech.recommendation_of_funding, '—') + '%'],
      ],
      theme: 'grid',
      styles: bodyStyle,
      columnStyles: col4,
    });
    Y = doc.lastAutoTable.finalY + 3;
  };

  // Render per-floor or single floor
  if (specCards.length > 0) {
    specCards.forEach((card, idx) => {
      const label = card.description || card.document_number || (idx === 0 ? 'GROUND FLOOR (GF)' : `FLOOR ${idx}`);
      const data  = perFloor[idx] || perFloor[String(idx)] || structs[idx] || {};
      renderFloorDimTable(label, data);
      if (Y > 230 && idx < specCards.length - 1) {
        doc.addPage(); drawHeader(); Y = 15;
      }
    });
  } else {
    // Single floor fallback
    const floorData = structs[0] || {};
    renderFloorDimTable('GROUND FLOOR (GF)', {
      total_bua:  floorData.area_sqft,
      total_sbua: floorData.sbua_sqft,
      slab_area:  floorData.slab_area_sqft,
      construction_progress:   tech.construction_progress,
      recommendation_of_funding: floorData.recommendation_of_funding,
    });
  }

  // ── SECTION 11: PROPERTY MARKET VALUE ASSESSMENT ─────────────────────────
  if (Y > 220) { doc.addPage(); drawHeader(); Y = 15; }

  // Land market valuation
  autoTable(doc, {
    startY: Y,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [['PROPERTY MARKET VALUE ASSESSMENT – LAND', 'LAND EXTENT (sft)', 'COST PER SFT (₹)', 'TOTAL VALUE (₹)']],
    body: landExts.length > 0
      ? landExts.map(l => [
          fmtVal(l.basis_of_valuation, '—').replace(/_/g, ' ').toUpperCase(),
          fmtVal(l.land_extent_sqft),
          fmtCurrency(l.cost_per_sqft),
          fmtCurrency(l.total_value),
        ])
      : [['AS PER ACTUAL', '—', '—', '—'], ['AS PER DOCUMENT', '—', '—', '—'], ['AS PER PLAN', '—', '—', '—']],
    theme: 'grid',
    headStyles: hdrStyle,
    styles: bodyStyle,
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold', fillColor: LABEL_BG },
      1: { cellWidth: 40 },
      2: { cellWidth: 42 },
      3: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
    },
    ...altRows(),
  });
  Y = doc.lastAutoTable.finalY + 2;

  // Structure market valuation per floor
  const renderStructMarketTable = (floorLabel, rows) => {
    autoTable(doc, {
      startY: Y,
      margin: { left: 14, right: 14 },
      tableWidth: 182,
      head: [[`STRUCTURE MARKET VALUE – ${floorLabel.toUpperCase()}`,
              'AREA DETAILS (sft)', 'RECOMMENDATION COST OF FUNDING %', 'COST PER SFT (₹)', 'TOTAL MARKET VALUE (₹)']],
      body: rows,
      theme: 'grid',
      headStyles: { ...hdrStyle, fontSize: 6.5 },
      styles: { ...bodyStyle, fontSize: 6.5 },
      columnStyles: {
        0: { cellWidth: 44, fontStyle: 'bold', fillColor: LABEL_BG },
        1: { cellWidth: 34 },
        2: { cellWidth: 36, halign: 'center' },
        3: { cellWidth: 32 },
        4: { cellWidth: 36, halign: 'right', fontStyle: 'bold' },
      },
      ...altRows(),
    });
    Y = doc.lastAutoTable.finalY + 2;
  };

  if (structs.length > 0) {
    // Group by floor_details
    const grouped = {};
    structs.forEach(s => {
      const fl = fmtVal(s.floor_details, 'GROUND FLOOR').toUpperCase();
      if (!grouped[fl]) grouped[fl] = [];
      grouped[fl].push(s);
    });
    Object.entries(grouped).forEach(([fl, rows]) => {
      renderStructMarketTable(fl, rows.map(s => [
        fmtVal(s.area_type || s.floor_details, '—').replace(/_/g, ' ').toUpperCase(),
        fmtVal(s.area_sqft),
        fmtVal(s.recommendation_of_funding),
        fmtCurrency(s.cost_per_sqft),
        fmtCurrency(s.total_value),
      ]));
      if (Y > 250) { doc.addPage(); drawHeader(); Y = 15; }
    });
  } else {
    renderStructMarketTable('GROUND FLOOR (GF)', [
      ['TOTAL BUA', '—', '—', '—', '—'],
      ['TOTAL SBUA', '—', '—', '—', '—'],
      ['TOTAL SLAB AREA', '—', '—', '—', '—'],
    ]);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 4
  // ═══════════════════════════════════════════════════════════════════════════
  doc.addPage();
  drawHeader();
  Y = 15;

  // ── SECTION 12: PROPERTY GUIDELINE VALUE ASSESSMENT ──────────────────────
  // Government land valuation
  autoTable(doc, {
    startY: Y,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [['PROPERTY GUIDELINE VALUE ASSESSMENT – LAND', 'LAND EXTENT (sft)', 'GOVT PRICE PER SFT (₹)', 'TOTAL GOVERNMENT PRICE (₹)']],
    body: landExts.length > 0
      ? landExts.map(l => [
          fmtVal(l.basis_of_valuation, '—').replace(/_/g, ' ').toUpperCase(),
          fmtVal(l.land_extent_sqft),
          fmtCurrency(l.govt_price_per_sqft || l.guideline_rate),
          fmtCurrency(l.govt_total_value || l.guideline_total),
        ])
      : [['AS PER ACTUAL', '—', '—', '—'], ['AS PER DOCUMENT', '—', '—', '—'], ['AS PER PLAN', '—', '—', '—']],
    theme: 'grid',
    headStyles: { ...hdrStyle, fontSize: 6.5 },
    styles: { ...bodyStyle, fontSize: 6.5 },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold', fillColor: LABEL_BG },
      1: { cellWidth: 38 },
      2: { cellWidth: 44 },
      3: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
    },
    ...altRows(),
  });
  Y = doc.lastAutoTable.finalY + 2;

  // Guideline structure valuation per floor
  const renderGuidelineStructTable = (floorLabel, rows) => {
    autoTable(doc, {
      startY: Y,
      margin: { left: 14, right: 14 },
      tableWidth: 182,
      head: [[`GUIDELINE STRUCTURE VALUE – ${floorLabel.toUpperCase()}`, 'AREA DETAILS (sft)', 'GOVT PRICE (₹)', 'TOTAL GOVERNMENT PRICE (₹)']],
      body: rows,
      theme: 'grid',
      headStyles: { ...hdrStyle, fontSize: 6.5 },
      styles: { ...bodyStyle, fontSize: 6.5 },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold', fillColor: LABEL_BG },
        1: { cellWidth: 44 },
        2: { cellWidth: 44 },
        3: { cellWidth: 44, halign: 'right', fontStyle: 'bold' },
      },
      ...altRows(),
    });
    Y = doc.lastAutoTable.finalY + 2;
  };

  if (structs.length > 0) {
    const grouped = {};
    structs.forEach(s => {
      const fl = fmtVal(s.floor_details, 'GROUND FLOOR').toUpperCase();
      if (!grouped[fl]) grouped[fl] = [];
      grouped[fl].push(s);
    });
    Object.entries(grouped).forEach(([fl, rows]) => {
      renderGuidelineStructTable(fl, rows.map(s => [
        fmtVal(s.area_type || s.floor_details, '—').replace(/_/g, ' ').toUpperCase(),
        fmtVal(s.area_sqft),
        fmtCurrency(s.govt_price || s.guideline_cost_per_sqft),
        fmtCurrency(s.govt_total || s.guideline_total_value),
      ]));
    });
  } else {
    renderGuidelineStructTable('GROUND FLOOR (GF)', [
      ['TOTAL BUA', '—', '—', '—'],
      ['TOTAL SBUA', '—', '—', '—'],
      ['TOTAL SLAB AREA', '—', '—', '—'],
    ]);
  }

  Y = doc.lastAutoTable.finalY + 3;

  // ── SECTION 13: AMENITIES ─────────────────────────────────────────────────
  if (amenities.length > 0 && amenities.some(a => a.amenity_name || a.total_value)) {
    autoTable(doc, {
      startY: Y,
      margin: { left: 14, right: 14 },
      tableWidth: 182,
      head: [['AMENITIES', 'TOTAL VALUE (₹)']],
      body: amenities.map(a => [
        fmtVal(a.amenity_name, 'Extra Works'),
        fmtCurrency(a.total_value || a.amenity_value),
      ]),
      theme: 'grid',
      headStyles: hdrStyle,
      styles: bodyStyle,
      columnStyles: {
        0: { cellWidth: 142, fontStyle: 'bold' },
        1: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
      },
      ...altRows(),
    });
    Y = doc.lastAutoTable.finalY + 3;
  }

  // ── SECTION 14: FINAL MARKET VALUATION ───────────────────────────────────
  const marketVal   = parseFloat(finalVal.final_market_value)   || 0;
  const guideVal    = parseFloat(finalVal.final_guideline_value) || 0;
  const realizable  = parseFloat(finalVal.forced_sale_value || finalVal.realizable_value) || Math.round(marketVal * 0.9);
  const distressV   = parseFloat(finalVal.distress_value)       || Math.round(marketVal * 0.8);
  const insureV     = Math.round(marketVal * 0.25);
  const marketWords = numberToIndianWords(marketVal);

  autoTable(doc, {
    startY: Y,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [['FINAL MARKET VALUATION', 'VALUE (₹)']],
    body: [
      [{ content: 'Final Valuation = Selected Land + Selected Structure + Amenities', styles: { fontStyle: 'italic', fillColor: ALT_ROW } }, fmtCurrency(marketVal)],
      ['Realizable Value (Final × 0.9)', fmtCurrency(realizable)],
      ['Distress Value (Final × 0.8)',   fmtCurrency(distressV)],
      ['Insurance Value (Final × 0.25)', fmtCurrency(insureV)],
      [{ content: `Amount in Words: ${marketWords}`, colSpan: 2, styles: { fontStyle: 'italic', textColor: [30, 41, 59] } }],
      ['GUIDELINE VALUATION – Final Guideline Value (Guideline Land + Guideline Structure)', fmtCurrency(guideVal)],
    ],
    theme: 'grid',
    headStyles: { ...hdrStyle, fillColor: NAVY },
    styles: bodyStyle,
    columnStyles: {
      0: { cellWidth: 134, fontStyle: 'bold' },
      1: { cellWidth: 48, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (hook) => {
      if (hook.section === 'body' && hook.row.index === 0) {
        hook.cell.styles.fillColor = [254, 243, 199];
        hook.cell.styles.textColor = [120, 53, 15];
      }
    },
  });
  Y = doc.lastAutoTable.finalY + 3;

  // ── SECTION 15: LOCATION DETAILS ─────────────────────────────────────────
  autoTable(doc, {
    startY: Y,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [['LOCATION DETAILS', '', '', '']],
    body: [
      ['GPS CO-ORDINATES',   '',  'LATITUDE', fmtVal(loc.latitude  || loc.gps_latitude)],
      ['',                   '',  'LONGITUDE', fmtVal(loc.longitude || loc.gps_longitude)],
      ['MANUAL GPS CO-ORDINATES', '', 'LATITUDE', fmtVal(loc.manual_latitude)],
      ['',                   '',  'LONGITUDE', fmtVal(loc.manual_longitude)],
    ],
    theme: 'grid',
    headStyles: hdrStyle,
    styles: bodyStyle,
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold', fillColor: LABEL_BG },
      1: { cellWidth: 20 },
      2: { cellWidth: 40, fontStyle: 'bold', fillColor: LABEL_BG },
      3: { cellWidth: 62 },
    },
  });
  Y = doc.lastAutoTable.finalY + 3;

  // ── SECTION 16: ADDITIONAL DETAILS ───────────────────────────────────────
  const kmStr = (v) => {
    if (!v && v !== 0) return '—';
    return String(v).toLowerCase().includes('km') ? String(v) : `${v} km`;
  };
  autoTable(doc, {
    startY: Y,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [['ADDITIONAL DETAILS', '', '', '']],
    body: [
      ['NEAREST RAILWAY STATION',  kmStr(char.nearest_railway_station_km),
       'NEAREST BUS STATION',       kmStr(char.nearest_bus_station_km)],
      ['NEAREST HOSPITAL',          kmStr(char.nearest_hospital_km),
       'NEAREST CONNECTING ROAD',   kmStr(char.nearest_connecting_road_km)],
      ['JOINT WALL – DIRECTION',    fmtVal(sched.joint_wall_direction || char.joint_wall_direction),
       'JOINT SLAB – DIRECTION',    fmtVal(sched.joint_slab_direction || char.joint_slab_direction)],
      ['VALUATION METHODOLOGY',     { content: fmtVal(char.valuation_methodology || finalVal.valuation_methodology), colSpan: 3 }],
      ['RISK OF DEMOLITION',        fmtVal(char.risk_of_demolition),
       'AGE OF PROPERTY / RESIDUAL AGE', `${fmtVal(tech.property_age || char.property_age)} / ${fmtVal(tech.residual_age || char.residual_age)}`],
      ['NEGATIVE AREA AS PER LOCAL', fmtVal(char.negative_area_as_per_local || (char.negative_area ? 'YES' : 'NO')),
       'DEVELOPMENT OF VICINITY / SURROUNDINGS', fmtVal(char.development_of_vicinity)],
      ['HABITATION AROUND THE PROPERTY (%)', fmtVal(char.habitation_around_property_percent),
       'OTHERS / REMARKS',          fmtVal(finalVal.valuer_remarks || char.remarks)],
    ],
    theme: 'grid',
    headStyles: hdrStyle,
    styles: bodyStyle,
    columnStyles: col4,
    ...altRows(),
  });
  Y = doc.lastAutoTable.finalY + 3;

  // ── SECTION 17: DECLARATION ───────────────────────────────────────────────
  if (Y > 260) { doc.addPage(); drawHeader(); Y = 15; }

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...BORDER);
  doc.roundedRect(14, Y, 182, 24, 2, 2, 'FD');
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('DECLARATION', 18, Y + 5);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    'KGN and the site engineer/service provider partner certify that they have no direct or indirect interest in the appraisal of the property.\n' +
    'The property was inspected by our authorised representative in the presence of the owner\'s representative, and the information provided\n' +
    'in the report is accurate to the best of our knowledge and belief.',
    18, Y + 10, { maxWidth: 174 }
  );
  Y += 28;

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 5: PHOTOGRAPHS
  // ═══════════════════════════════════════════════════════════════════════════
  const validPhotos = photos.filter(p => p.photo || p.preview);
  if (validPhotos.length > 0) {
    // Group photos by group_note
    const photoGroups = {};
    validPhotos.forEach(p => {
      const grp = p.group_note || p.group || 'PHOTOGRAPHS';
      if (!photoGroups[grp]) photoGroups[grp] = [];
      photoGroups[grp].push(p);
    });

    const PHOTO_W    = 56; // 3 per row on A4 (14 margin each side, 3 gaps=4mm)
    const PHOTO_H    = 44;
    const PHOTO_COLS = 3;
    const GAP        = 4;
    const LABEL_H    = 8;

    let onNewPage = false;

    Object.entries(photoGroups).forEach(([groupLabel, groupPhotos]) => {
      // Start new page for each group
      doc.addPage();
      drawHeader();
      Y = 15;
      onNewPage = true;

      // Group header
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...NAVY);
      doc.text(groupLabel.toUpperCase(), 14, Y + 4);
      doc.setFillColor(...GOLD);
      doc.rect(14, Y + 6, 182, 0.5, 'F');
      Y += 10;

      groupPhotos.forEach((p, idx) => {
        const col = idx % PHOTO_COLS;
        const x = 14 + col * (PHOTO_W + GAP);

        if (col === 0 && idx > 0) {
          Y += PHOTO_H + LABEL_H + 3;
          if (Y + PHOTO_H + LABEL_H > 280) {
            doc.addPage();
            drawHeader();
            Y = 15;
          }
        }

        // Photo card background
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(...BORDER);
        doc.roundedRect(x, Y, PHOTO_W, PHOTO_H + LABEL_H, 1.5, 1.5, 'FD');

        // Photo image
        try {
          let img = p.photo || p.preview;
          if (typeof img === 'string' && img.startsWith('/uploads/')) {
            const diskPath = path.join(process.cwd(), 'public', img);
            if (fs.existsSync(diskPath)) {
              const ext = path.extname(diskPath).toLowerCase().replace('.', '') || 'jpeg';
              const buf = fs.readFileSync(diskPath);
              img = `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${buf.toString('base64')}`;
            }
          }
          if (img && img.startsWith('data:image')) {
            doc.addImage(img, 'JPEG', x + 1, Y + 1, PHOTO_W - 2, PHOTO_H - 2);
          } else {
            doc.setFillColor(226, 232, 240);
            doc.rect(x + 1, Y + 1, PHOTO_W - 2, PHOTO_H - 2, 'F');
            doc.setTextColor(100, 116, 139);
            doc.setFontSize(7);
            doc.text('[Photo]', x + PHOTO_W / 2, Y + PHOTO_H / 2, { align: 'center' });
          }
        } catch (_) {
          doc.setFillColor(226, 232, 240);
          doc.rect(x + 1, Y + 1, PHOTO_W - 2, PHOTO_H - 2, 'F');
        }

        // Caption
        doc.setFontSize(5.8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...NAVY);
        const caption = fmtVal(p.description, `Photo ${idx + 1}`);
        doc.text(caption.length > 28 ? caption.slice(0, 28) + '…' : caption, x + 2, Y + PHOTO_H + 3);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.2);
        doc.setTextColor(71, 85, 105);
        if (p.latitude || p.longitude) {
          doc.text(`GPS: ${fmtVal(p.latitude)} N, ${fmtVal(p.longitude)} E`, x + 2, Y + PHOTO_H + 6.5);
        }
      });

      Y += PHOTO_H + LABEL_H + 3;
    });

    // ── SECTION 19: SIGNATURES ──────────────────────────────────────────────
    if (Y + 35 > 280) { doc.addPage(); drawHeader(); Y = 15; }
    Y += 5;
    doc.setFillColor(...GOLD);
    doc.rect(14, Y, 182, 0.5, 'F');
    Y += 4;

    const sigCols = ['INSPECTOR', 'VENDOR', 'ENGINEER', 'INSTITUTION'];
    const sigData = [
      report.signatures?.signature_inspector,
      report.signatures?.signature_vendor,
      report.signatures?.signature_engineer,
      report.signatures?.signature_institution,
    ];
    const sigW = 182 / 4;
    sigCols.forEach((label, i) => {
      const sx = 14 + i * sigW;
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...NAVY);
      doc.text(label, sx + sigW / 2, Y + 4, { align: 'center' });
      doc.setDrawColor(...BORDER);
      doc.line(sx + 2, Y + 20, sx + sigW - 2, Y + 20);

      const sig = sigData[i];
      if (sig && typeof sig === 'string' && sig.startsWith('data:image')) {
        try {
          const fmt = sig.includes('png') ? 'PNG' : 'JPEG';
          doc.addImage(sig, fmt, sx + 5, Y + 7, sigW - 10, 11);
        } catch (_) {}
      }
    });
    Y += 25;
  }

  // ── SECTION 20: FINAL VALUE CHART (SUMMARY TABLE) ─────────────────────────
  if (Y + 30 > 280) { doc.addPage(); drawHeader(); Y = 15; }

  const totalAmenityVal = amenities.reduce((sum, a) => sum + (parseFloat(a.total_value || a.amenity_value) || 0), 0);
  const totalLandMkt    = landExts.reduce((sum, l) => sum + (parseFloat(l.total_value) || 0), 0);
  const totalStructMkt  = structs.reduce((sum, s) => sum + (parseFloat(s.total_value) || 0), 0);

  autoTable(doc, {
    startY: Y,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [['FINAL VALUE CHART SUMMARY', 'MARKET VALUE (₹)', 'GUIDELINE VALUE (₹)']],
    body: [
      ['Land Value',      fmtCurrency(totalLandMkt),   fmtCurrency(landExts.reduce((s, l) => s + (parseFloat(l.guideline_total || l.govt_total_value) || 0), 0))],
      ['Structure Value', fmtCurrency(totalStructMkt),  fmtCurrency(structs.reduce((s, str) => s + (parseFloat(str.govt_total || str.guideline_total_value) || 0), 0))],
      ['Amenities Value', fmtCurrency(totalAmenityVal), '—'],
      [{ content: 'FINAL VALUATION', styles: { fontStyle: 'bold', fillColor: LABEL_BG } },
       { content: fmtCurrency(marketVal || (totalLandMkt + totalStructMkt + totalAmenityVal)), styles: { fontStyle: 'bold', fillColor: [254, 243, 199], textColor: [120, 53, 15] } },
       { content: fmtCurrency(guideVal  || (landExts.reduce((s, l) => s + (parseFloat(l.guideline_total || l.govt_total_value) || 0), 0) + structs.reduce((s, str) => s + (parseFloat(str.govt_total || str.guideline_total_value) || 0), 0))), styles: { fontStyle: 'bold' } }],
      ['Realizable Value (90%)', fmtCurrency(realizable), '—'],
      ['Distress Value (80%)',   fmtCurrency(distressV),  '—'],
      ['Insurance Value (25%)',  fmtCurrency(insureV),    '—'],
    ],
    theme: 'grid',
    headStyles: { ...hdrStyle, fillColor: NAVY },
    styles: bodyStyle,
    columnStyles: {
      0: { cellWidth: 86, fontStyle: 'bold' },
      1: { cellWidth: 48, halign: 'right' },
      2: { cellWidth: 48, halign: 'right' },
    },
    ...altRows(),
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // APPLY HEADER + FOOTER TO ALL PAGES
  // ═══════════════════════════════════════════════════════════════════════════
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawHeader();
    drawFooter(i, totalPages);
  }

  return doc;
}
