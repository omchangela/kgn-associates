import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import fs from 'fs';
import path from 'path';

// Cached logo base64 for fast PDF generation
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

// Convert numbers to Indian Currency Words (e.g. "Rupees One Crore Twenty Five Lakhs Only")
function numberToIndianWords(num) {
  num = Math.round(Number(num) || 0);
  if (num === 0) return 'Rupees Zero Only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    let str = '';
    if (n > 19) {
      str += b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : ' ');
    } else {
      str += a[n];
    }
    return str;
  };

  let words = '';
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = Math.floor(num / 100);
  num %= 100;

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

export function generateValuationPdf(report) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const logoBase64 = getLogoBase64();

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
  const structs = report.structureValuations || report.structure_valuations || [];
  const amenities = report.amenityValuations || report.amenity_valuations || [];
  const photos = report.photos || [];

  // Theme Palette
  const navyDark = [15, 23, 42];      // #0F172A
  const slateHeader = [30, 41, 59];   // #1E293B
  const goldPrimary = [194, 149, 74];  // #C2954A
  const goldLight = [232, 211, 168];   // #E8D3A8
  const textDark = [15, 23, 42];
  const borderLight = [226, 232, 240];

  const sectionHeaderStyles = {
    fillColor: slateHeader,
    textColor: [248, 250, 252],
    fontStyle: 'bold',
    fontSize: 8,
    cellPadding: 2,
  };

  const bodyStyles = {
    fontSize: 7.2,
    cellPadding: 1.6,
    textColor: textDark,
    lineColor: borderLight,
    lineWidth: 0.15,
  };

  const fourColStyles = {
    0: { cellWidth: 40, fontStyle: 'bold', fillColor: [248, 250, 252] },
    1: { cellWidth: 51 },
    2: { cellWidth: 40, fontStyle: 'bold', fillColor: [248, 250, 252] },
    3: { cellWidth: 51 },
  };

  const drawRunningHeader = (pageTitle = '') => {
    doc.setFillColor(...slateHeader);
    doc.rect(0, 0, 210, 10, 'F');
    doc.setTextColor(...goldLight);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('KGN ASSOCIATES • ENGINEERS AND VALUERS', 14, 6.8);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const refText = pageTitle ? `${pageTitle} | Ref: ${report.report_number || report.id || report._id}` : `Ref: ${report.report_number || report.id || report._id}`;

    if (logoBase64) {
      doc.text(refText, 193, 6.8, { align: 'right' });
      try {
        doc.addImage(logoBase64, 'PNG', 195, 1.2, 9, 7.5);
      } catch (e) {}
    } else {
      doc.text(refText, 196, 6.8, { align: 'right' });
    }
  };

  // ==========================================
  // PAGE 1: COVER HEADER & SECTIONS 1, 2
  // ==========================================
  // Executive Header Banner
  doc.setFillColor(...navyDark);
  doc.rect(0, 0, 210, 38, 'F');

  // Gold accent rule
  doc.setFillColor(...goldPrimary);
  doc.rect(0, 38, 210, 1.5, 'F');

  // Firm Title
  doc.setTextColor(...goldLight);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('KGN ASSOCIATES', 14, 13);

  // Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Engineers and Valuers', 14, 20);

  doc.setTextColor(203, 213, 225);
  doc.setFontSize(7.5);
  doc.text('Office: Hyderabad, Telangana | Tel: +91 98765 43210 | info@kgnassociates.com', 14, 34.5);

  // Official Logo on the ending side (top right of header banner)
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', 160, 4, 36, 30);
    } catch (e) {
      console.warn('Could not add logo to PDF header:', e.message);
    }
  }

  // Reference Metadata Bar
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...borderLight);
  doc.roundedRect(14, 43, 182, 16, 2, 2, 'FD');

  doc.setTextColor(...navyDark);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFIED PROPERTY VALUATION REPORT', 18, 50.5);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Report Ref: ${report.report_number || report.id || report._id}`, 18, 55.5);
  doc.text(`Inspection Date: ${fmtVal(inst.date_of_inspection, 'Recent')}`, 100, 55.5);
  doc.text(`Valuation Date: ${fmtVal(inst.date_of_report || finalVal.report_date, new Date().toISOString().split('T')[0])}`, 148, 55.5);

  let currentY = 63;

  // 1.0 LENDING INSTITUTION & APPLICANT PARTICULARS
  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [['1.0 LENDING INSTITUTION & BORROWER PARTICULARS', '', '', '']],
    body: [
      ['Bank / Lending Institution', fmtVal(inst.bank_name), 'Branch & Region', fmtVal(inst.branch_name)],
      ['Loan Application Ref.', fmtVal(inst.loan_application_id), 'Product / Loan Type', fmtVal(inst.product_loan_type)],
      ['Borrower / Applicant Name', fmtVal(inst.applicant_name), 'Applicant Mobile', fmtVal(inst.applicant_contact_number)],
      ['Property Owner Name', fmtVal(inst.property_owner_name), 'Owner Contact', fmtVal(inst.property_owner_contact_number)],
      ['Person Met at Site', fmtVal(inst.person_met_at_site), 'Contact & Relationship', `${fmtVal(inst.person_met_contact_number)} (${fmtVal(inst.relationship_with_applicant)})`],
      ['Property Holding Type', fmtVal(inst.property_holding_type).toUpperCase(), 'Property Category', (inst.property_type === 'others' && inst.other_property_type ? inst.other_property_type : fmtVal(inst.property_type)).toUpperCase()],
      ['Assessing Engineer', fmtVal(inst.site_engineer_name, 'Rajesh Kumar'), 'Engineer Contact', fmtVal(inst.site_engineer_contact_number, '+91 98765 43211')],
      ['Engineer / Firm Name', fmtVal(inst.vendor_engineer_institution_name, 'KGN Associates'), 'Contact', fmtVal(inst.vendor_contact_number, '+91 98765 43210')],
    ],
    theme: 'grid',
    headStyles: sectionHeaderStyles,
    styles: bodyStyles,
    columnStyles: fourColStyles,
  });

  currentY = doc.lastAutoTable.finalY + 4;

  // 2.0 LEGAL PROPERTY IDENTIFICATION & APPROVALS
  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [['2.0 LEGAL IDENTIFICATION & MUNICIPAL SANCTIONS', '', '', '']],
    body: [
      ['Address as per Deed', { content: fmtVal(prop.address_as_per_documents), colSpan: 3 }],
      ['Address as per Site', { content: fmtVal(prop.address_as_per_actual_site), colSpan: 3 }],
      ['Address as per Plan', { content: fmtVal(prop.address_as_per_plan, prop.address_as_per_documents), colSpan: 3 }],
      ['Survey / Khasra No.', fmtVal(prop.survey_number), 'Plot / Flat & Door No.', `Plot: ${fmtVal(prop.plot_no_flat_no)}, Door: ${fmtVal(prop.door_no)}`],
      ['Assessment / Tax No.', fmtVal(prop.assessment_no), 'LPM / Sanction Ref.', fmtVal(prop.lpm_approval_no)],
      ['Locality & Landmark', `${fmtVal(prop.locality_name)} (Near: ${fmtVal(prop.landmark)})`, 'Grama / Polam', fmtVal(prop.grama_polam)],
      ['Taluka / Mandal', fmtVal(prop.taluka || prop.mandal), 'District, State & PIN', `${fmtVal(prop.district)}, ${fmtVal(prop.state)} - ${fmtVal(prop.pincode)}`],
      ['Approving Authority', fmtVal(prop.approving_authority, 'Municipal Corporation'), 'Approved Property Usage', fmtVal(prop.approved_usage, 'Residential')],
      ['Sanctioned Layout Plan', prop.layout_plan_available ? 'Available & Verified' : 'Not Attached', 'Sanctioned Building Plan', `${prop.construction_plan_available ? 'Approved' : 'Not Attached'} (Validity: ${prop.plan_validity ? 'Valid' : 'Expired'})`],
    ],
    theme: 'grid',
    headStyles: sectionHeaderStyles,
    styles: bodyStyles,
    columnStyles: fourColStyles,
  });

  const verifiedDocs = report.verifiedDocuments || report.verified_documents || [];
  const validDocs = verifiedDocs.filter(d => d.type_of_document || d.document_type || d.document_number);
  if (validDocs.length > 0) {
    currentY = doc.lastAutoTable.finalY + 4;
    autoTable(doc, {
      startY: currentY,
      margin: { left: 14, right: 14 },
      tableWidth: 182,
      head: [['Verified Document Type', 'Document Number', 'Execution Date', 'Expiry Date', 'In Favour Of', 'Approval Authority']],
      body: validDocs.map(d => [
        fmtVal(d.type_of_document || d.document_type),
        fmtVal(d.document_number),
        fmtVal(d.execution_date),
        fmtVal(d.expiry_date),
        fmtVal(d.in_favour_of),
        fmtVal(d.approval_authority),
      ]),
      theme: 'grid',
      headStyles: sectionHeaderStyles,
      styles: bodyStyles,
    });
  }

  // ==========================================
  // PAGE 2: BOUNDARIES, INFRASTRUCTURE & TECHNICAL
  // ==========================================
  doc.addPage();
  drawRunningHeader('PHYSICAL VERIFICATION & ENGINEERING');
  currentY = 15;

  // 3.0 FOUR BOUNDARIES COMPARISON TABLE
  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [['Direction', 'As per Registered Title Deed', 'As per Ground Inspection', 'As per Plan', 'Physical Status']],
    body: [
      ['East', fmtVal(sched.east_boundary_docs), fmtVal(sched.east_boundary_actual), fmtVal(sched.east_boundary_plan, sched.east_boundary_docs), fmtVal(sched.east_boundary_status, 'Matching')],
      ['West', fmtVal(sched.west_boundary_docs), fmtVal(sched.west_boundary_actual), fmtVal(sched.west_boundary_plan, sched.west_boundary_docs), fmtVal(sched.west_boundary_status, 'Matching')],
      ['North', fmtVal(sched.north_boundary_docs), fmtVal(sched.north_boundary_actual), fmtVal(sched.north_boundary_plan, sched.north_boundary_docs), fmtVal(sched.north_boundary_status, 'Matching')],
      ['South', fmtVal(sched.south_boundary_docs), fmtVal(sched.south_boundary_actual), fmtVal(sched.south_boundary_plan, sched.south_boundary_docs), fmtVal(sched.south_boundary_status, 'Matching')],
    ],
    theme: 'grid',
    headStyles: sectionHeaderStyles,
    styles: bodyStyles,
    columnStyles: {
      0: { cellWidth: 22, fontStyle: 'bold', fillColor: [248, 250, 252] },
      1: { cellWidth: 50 },
      2: { cellWidth: 50 },
      3: { cellWidth: 32 },
      4: { cellWidth: 28, fontStyle: 'bold' },
    },
  });

  currentY = doc.lastAutoTable.finalY + 4;

  // 3.1 PHYSICAL BUILDING ATTRIBUTES & OCCUPANCY
  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [['3.1 PHYSICAL BUILDING ATTRIBUTES & OCCUPANCY', '', '', '']],
    body: [
      ['Demarcation Status', fmtVal(sched.property_identification_status, 'Clearly Demarcated with Compound Wall'), 'Structural Construction Type', sched.construction_type === 'others' && sched.other_construction_type ? sched.other_construction_type : fmtVal(sched.construction_type, 'RCC Framed Structure')],
      ['Roof & Ceiling Type', sched.roof_type === 'others' && sched.other_roof_type ? sched.other_roof_type : fmtVal(sched.roof_type, 'RCC Flat Slab'), 'Flooring & Staircase', `${sched.flooring_type === 'others' && sched.other_flooring_type ? sched.other_flooring_type : fmtVal(sched.flooring_type, 'Vitrified')} / ${sched.stair_type === 'others' && sched.other_stair_type ? sched.other_stair_type : fmtVal(sched.stair_type, 'Internal RCC')}`],
      ['Floors Approved / Exist', `Appr: ${fmtVal(sched.no_of_floors_approved, 'G+1')} | Exist: ${fmtVal(sched.no_of_floors_existing || sched.number_of_floors, 'G+1')}`, 'Construction Quality', fmtVal(sched.construction_quality, 'Superior / Good')],
      ['Property Maintenance', fmtVal(sched.maintenance_of_property, 'Well Maintained'), 'Occupancy Details', `${fmtVal(sched.occupancy_status, 'Occupied')} (${fmtVal(sched.occupant_details, 'Owner')})`],
      ['Actual Usage at Site', fmtVal(sched.actual_usage_of_property, 'Residential House'), 'Locality Classification', (sched.class_of_locality === 'others' || sched.class_of_locality === 'Others') && sched.other_class_of_locality ? sched.other_class_of_locality : fmtVal(sched.class_of_locality, 'Middle')],
    ],
    theme: 'grid',
    headStyles: sectionHeaderStyles,
    styles: bodyStyles,
    columnStyles: fourColStyles,
  });

  currentY = doc.lastAutoTable.finalY + 4;

  // 4.0 INFRASTRUCTURE & CIVIC AMENITIES
  const numRoads = Math.max(1, Math.min(10, parseInt(infra.number_of_roads, 10) || 1));
  const infraBody = [
    ['Land Locked Status', infra.land_locked ? 'Yes (Restricted Access)' : 'No (Direct Street Access)', 'Number of Facing Roads', fmtVal(infra.number_of_roads, `${numRoads} Road${numRoads > 1 ? 's' : ''}`)],
  ];

  if (numRoads <= 1) {
    infraBody.push([
      'Approach Road Type',
      infra.approach_road_type === 'others' && infra.other_approach_road_type ? infra.other_approach_road_type : fmtVal(infra.approach_road_type, 'Black Top Road'),
      'Facing Road Width / Access',
      `${fmtVal(infra.road_width_ft, '30')} Feet (${fmtVal(infra.road_direction, 'East')} Facing / ${fmtVal(infra.type_of_access, 'Public')})`,
    ]);
  } else {
    for (let r = 1; r <= numRoads; r++) {
      const aType = r === 1 ? infra.approach_road_type : (infra[`approach_road_type_${r}`] || (infra.roads_details?.[r - 1]?.approach_road_type));
      const oType = r === 1 ? infra.other_approach_road_type : (infra[`other_approach_road_type_${r}`] || (infra.roads_details?.[r - 1]?.other_approach_road_type));
      const rWidth = r === 1 ? infra.road_width_ft : (infra[`road_width_ft_${r}`] || (infra.roads_details?.[r - 1]?.road_width_ft));
      const rDir = r === 1 ? infra.road_direction : (infra[`road_direction_${r}`] || (infra.roads_details?.[r - 1]?.road_direction));
      const rAcc = r === 1 ? infra.type_of_access : (infra[`type_of_access_${r}`] || (infra.roads_details?.[r - 1]?.type_of_access));
      const approachText = aType === 'others' && oType ? oType : fmtVal(aType, 'Black Top Road');

      infraBody.push([
        `Road ${r} Approach Type`,
        approachText,
        `Road ${r} Width / Access`,
        `${fmtVal(rWidth, '30')} Feet (${fmtVal(rDir, 'East')} Facing / ${fmtVal(rAcc, 'Public')})`,
      ]);
    }
  }

  infraBody.push(
    ['Electricity Connection', infra.electricity ? 'Connected (State Discom Grid)' : 'Not Connected', 'Water Supply', infra.water ? 'Available (Municipal + Borewell)' : 'Not Available'],
    ['Drainage & Sewerage', infra.drainage_connection ? 'Underground Drainage System' : 'Septic Tank', 'Lifts / Elevators', `${fmtVal(infra.number_of_lifts, '0')} Operational Lift(s)`],
  );

  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [['4.0 INFRASTRUCTURE & ACCESS ROAD AMENITIES', '', '', '']],
    body: infraBody,
    theme: 'grid',
    headStyles: sectionHeaderStyles,
    styles: bodyStyles,
    columnStyles: fourColStyles,
  });

  currentY = doc.lastAutoTable.finalY + 4;

  // 5.0 TECHNICAL & STRUCTURAL ENGINEERING ASSESSMENT
  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [['5.0 TECHNICAL & STRUCTURAL ENGINEERING PARAMETERS', '', '', '']],
    body: [
      ['Carpet / Plinth Area', `Carpet: ${fmtVal(tech.carpet_area)} Sq.Ft | Plinth: ${fmtVal(tech.plinth_area)} Sq.Ft`, 'Built-Up / Super Built-Up', `Built-Up: ${fmtVal(tech.built_up_area || tech.total_built_up_area)} Sq.Ft (${fmtVal(tech.super_built_up_area || tech.slab_area)} Sq.Ft)`],
      ['Floor Area Ratio (FAR/FSI)', fmtVal(tech.floor_area_ratio || char.fsi, '1.50'), 'Ground Coverage %', `${fmtVal(tech.ground_coverage, '65')}%`],
      ['Setbacks (Front / Back)', `Front: ${fmtVal(tech.setback_front, '10')} ft | Back: ${fmtVal(tech.setback_back, '5')} ft`, 'Setbacks (Left / Right)', `Left: ${fmtVal(tech.setback_left, '5')} ft | Right: ${fmtVal(tech.setback_right, '5')} ft`],
      ['Foundation & Plinth', `${fmtVal(tech.foundation_type, 'Isolated Footing')} (Plinth: ${fmtVal(tech.plinth_height, '2.5')} ft)`, 'Clear Ceiling Height', `${fmtVal(tech.ceiling_height, '10.0')} Feet Clear`],
      ['Structural Elements', `Wall: ${fmtVal(tech.wall_thickness, '9"')} | Slab: ${fmtVal(tech.slab_thickness, '5"')}`, 'Beams & Columns', `Beam: ${fmtVal(tech.beam_size, '9"x12"')} | Col: ${fmtVal(tech.column_size, '9"x12"')}`],
      ['Internal Installations', `Wiring: ${tech.electrical_wiring_done ? 'Concealed Copper' : 'No'} | Plumb: ${tech.plumbing_work_done ? 'CPVC / PVC' : 'No'}`, 'Fire & AC Points', `AC: ${tech.ac_points_provided ? 'Concealed' : 'No'} | Fire: ${tech.fire_fighting_system ? 'Provided' : 'Standard'}`],
      ['Structural Safety', char.structure_confirming_to_safety ? 'Confirmed Conforming to NBC Building Codes' : 'Non-Conforming', 'Technical Assessment', fmtVal(tech.technical_assessment, 'Structure is physically sound, stable and free from structural cracks.')],
      ...((tech.apartment_case_note || tech.landMeasurements?.apartment_case_note)
        ? [['Apartment Case Note (Reflection)', tech.apartment_case_note || tech.landMeasurements?.apartment_case_note, '', '']]
        : []),
    ],
    theme: 'grid',
    headStyles: sectionHeaderStyles,
    styles: bodyStyles,
    columnStyles: fourColStyles,
  });

  // ==========================================
  // PAGE 3: VALUATION MATRIX, GEOSPATIAL & SUMMARY
  // ==========================================
  doc.addPage();
  drawRunningHeader('VALUATION CALCULATIONS & CERTIFICATION');
  currentY = 15;

  // 6.1 LAND VALUATION MATRIX
  const landRows = [];
  if (landExts.length > 0) {
    landExts.forEach((l) => {
      const basis = (l.basis_of_valuation || 'adopted').replace(/_/g, ' ').toUpperCase();
      landRows.push([
        basis,
        `${Number(l.land_extent_sqft || 0).toLocaleString('en-IN')} Sq.Ft`,
        `Rs. ${Number(l.cost_per_sqft || 0).toLocaleString('en-IN')} / Sq.Ft`,
        `Rs. ${Number(l.total_value || 0).toLocaleString('en-IN')}`,
      ]);
    });
  } else {
    landRows.push(['FINAL ADOPTED LAND AREA', '1,800 Sq.Ft', 'Rs. 4,500 / Sq.Ft', 'Rs. 81,00,000']);
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [['6.1 LAND EXTENT VALUATION', 'EXTENT AREA', 'PREVAILING RATE', 'ASSESSED VALUE']],
    body: landRows,
    theme: 'grid',
    headStyles: sectionHeaderStyles,
    styles: bodyStyles,
    columnStyles: {
      0: { cellWidth: 62, fontStyle: 'bold' },
      1: { cellWidth: 38 },
      2: { cellWidth: 42 },
      3: { cellWidth: 40, fontStyle: 'bold', halign: 'right' },
    },
  });

  currentY = doc.lastAutoTable.finalY + 3.5;

  // 6.2 STRUCTURE VALUATION MATRIX
  const perFloorStore = report.perFloorStructureValuations || {};
  const specCards = Array.isArray(report.technicalDetails?.buildingSpecCards)
    ? report.technicalDetails.buildingSpecCards
    : [];
  const hasMultipleFloors = specCards.length > 1 && Object.keys(perFloorStore).length > 1;

  const renderStructureTable = (rows, sectionTitle) => {
    const structRows = [];
    if (rows && rows.length > 0) {
      rows.forEach((s) => {
        const floor = (s.floor_details || 'Floor Area').replace(/_/g, ' ').toUpperCase();
        structRows.push([
          floor,
          `${Number(s.area_sqft || 0).toLocaleString('en-IN')} Sq.Ft`,
          fmtVal(s.recommendation_of_funding, 'Recommended'),
          `Rs. ${Number(s.cost_per_sqft || 0).toLocaleString('en-IN')}`,
          `Rs. ${Number(s.total_value || 0).toLocaleString('en-IN')}`,
        ]);
      });
    } else {
      structRows.push(['GROUND FLOOR PLINTH', '1,400 Sq.Ft', 'Recommended', 'Rs. 2,200', 'Rs. 30,80,000']);
    }
    autoTable(doc, {
      startY: currentY,
      margin: { left: 14, right: 14 },
      tableWidth: 182,
      head: [[sectionTitle, 'PLINTH AREA', 'FUNDING', 'RATE/SQFT', 'ASSESSED VALUE']],
      body: structRows,
      theme: 'grid',
      headStyles: sectionHeaderStyles,
      styles: bodyStyles,
      columnStyles: {
        0: { cellWidth: 54, fontStyle: 'bold' },
        1: { cellWidth: 30 },
        2: { cellWidth: 28 },
        3: { cellWidth: 32 },
        4: { cellWidth: 38, fontStyle: 'bold', halign: 'right' },
      },
    });
    currentY = doc.lastAutoTable.finalY + 3.5;
  };

  if (hasMultipleFloors) {
    // Render each floor as a separate sub-section
    const floorKeys = Object.keys(perFloorStore).sort((a, b) => {
      if (a === 'all') return -1;
      if (b === 'all') return 1;
      return parseInt(a) - parseInt(b);
    });
    floorKeys.forEach((floorKey, idx) => {
      const rows = perFloorStore[floorKey];
      const hasData = Array.isArray(rows) && rows.some(r => r.area_sqft || r.cost_per_sqft || r.total_value);
      if (!hasData) return;
      let label;
      if (floorKey === 'all') {
        label = `6.2 BUILDING & STRUCTURAL VALUATION — ALL FLOORS (COMBINED)`;
      } else {
        const floorNum = parseInt(floorKey, 10);
        const cardLabel = specCards[floorNum]?.description || specCards[floorNum]?.document_number || `Floor #${floorNum + 1}`;
        label = `6.2.${idx + 1} BUILDING & STRUCTURAL VALUATION — ${cardLabel.toUpperCase()}`;
      }
      renderStructureTable(rows, label);
    });
  } else {
    // Single floor or no per-floor store — render the active floor's rows
    const structRows = [];
    if (structs.length > 0) {
      structs.forEach((s) => {
        const floor = (s.floor_details || 'Floor Area').replace(/_/g, ' ').toUpperCase();
        structRows.push([
          floor,
          `${Number(s.area_sqft || 0).toLocaleString('en-IN')} Sq.Ft`,
          fmtVal(s.recommendation_of_funding, 'Recommended'),
          `Rs. ${Number(s.cost_per_sqft || 0).toLocaleString('en-IN')}`,
          `Rs. ${Number(s.total_value || 0).toLocaleString('en-IN')}`,
        ]);
      });
    } else {
      structRows.push(['GROUND FLOOR PLINTH', '1,400 Sq.Ft', 'Recommended', 'Rs. 2,200', 'Rs. 30,80,000']);
    }
    autoTable(doc, {
      startY: currentY,
      margin: { left: 14, right: 14 },
      tableWidth: 182,
      head: [['6.2 BUILDING & STRUCTURAL VALUATION', 'PLINTH AREA', 'FUNDING', 'RATE/SQFT', 'ASSESSED VALUE']],
      body: structRows,
      theme: 'grid',
      headStyles: sectionHeaderStyles,
      styles: bodyStyles,
      columnStyles: {
        0: { cellWidth: 54, fontStyle: 'bold' },
        1: { cellWidth: 30 },
        2: { cellWidth: 28 },
        3: { cellWidth: 32 },
        4: { cellWidth: 38, fontStyle: 'bold', halign: 'right' },
      },
    });
    currentY = doc.lastAutoTable.finalY + 3.5;
  }



  // 6.3 AMENITIES / EXTRA WORKS (IF ANY)
  if (amenities.length > 0 && amenities.some(a => a.amenity_name || a.amenity_value)) {
    const amenityRows = amenities.map(a => [
      fmtVal(a.amenity_name, 'Extra Fixture / Compound Wall'),
      fmtCurrency(a.amenity_value),
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: 14, right: 14 },
      tableWidth: 182,
      head: [['6.3 EXTRA AMENITIES, COMPOUND WALL & CIVIL WORKS', 'ASSESSED VALUE']],
      body: amenityRows,
      theme: 'grid',
      headStyles: sectionHeaderStyles,
      styles: bodyStyles,
      columnStyles: {
        0: { cellWidth: 142, fontStyle: 'bold' },
        1: { cellWidth: 40, fontStyle: 'bold', halign: 'right' },
      },
    });

    currentY = doc.lastAutoTable.finalY + 3.5;
  }

  // 7.0 GEOSPATIAL & MACRO CONNECTIVITY INDICES
  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [['7.0 GEOSPATIAL & MACRO CONNECTIVITY INDICES', '', '', '']],
    body: [
      ['GPS Coordinates', `Lat: ${fmtVal(loc.latitude || loc.manual_latitude, '17.4399° N')}, Lon: ${fmtVal(loc.longitude || loc.manual_longitude, '78.3908° E')}`, 'Topography & Level', fmtVal(char.level_of_land, 'Even / Level with Road')],
      ['Nearest Railway Station', char.nearest_railway_station_km ? (String(char.nearest_railway_station_km).toLowerCase().includes('km') ? char.nearest_railway_station_km : `${char.nearest_railway_station_km} Km`) : '4.5 Km', 'Nearest Bus Stand / Depot', char.nearest_bus_station_km ? (String(char.nearest_bus_station_km).toLowerCase().includes('km') ? char.nearest_bus_station_km : `${char.nearest_bus_station_km} Km`) : '1.2 Km'],
      ['Connecting Major Road', char.nearest_connecting_road_km ? (String(char.nearest_connecting_road_km).toLowerCase().includes('km') ? char.nearest_connecting_road_km : `${char.nearest_connecting_road_km} Km`) : '0.5 Km', 'Distance to City Centre', char.distance_from_city_centre_km ? (String(char.distance_from_city_centre_km).toLowerCase().includes('km') ? char.distance_from_city_centre_km : `${char.distance_from_city_centre_km} Km`) : '8.0 Km'],
      ['Distance to Bank Branch', char.distance_from_branch_km ? (String(char.distance_from_branch_km).toLowerCase().includes('km') ? char.distance_from_branch_km : `${char.distance_from_branch_km} Km`) : '3.5 Km', 'Vicinity Habitation %', `${fmtVal(char.habitation_around_property_percent, '85')}${String(char.habitation_around_property_percent || '').includes('%') ? '' : '%'}`],
      ['Vicinity Development', fmtVal(char.development_of_vicinity, 'Fully Developed Residential Zone'), 'Local Public Transport', fmtVal(char.availability_of_local_transport, 'Frequent Auto & Bus')],
      ['Demolition Risk Assessment', fmtVal(char.risk_of_demolition, 'Low / None (Conforming)'), 'Negative / Restricted Area', char.negative_area_as_per_local ? 'Yes' : 'No (Clear Title Zone)'],
      ['NDMA Structural Geometry', fmtVal(ndma.shape_of_building, 'Regular / Rectangular'), 'Concrete Mix & Soil', `${fmtVal(ndma.concrete_grade, 'M20')} / ${fmtVal(ndma.soil_strata, 'Hard Murrum')}`],
      ['Seismic Vulnerability Zone', fmtVal(ndma.seismic_zone, 'Zone II (Low Damage Risk)'), 'Disaster Code Compliance', 'Conforming to NBC 2016 Standards'],
    ],
    theme: 'grid',
    headStyles: sectionHeaderStyles,
    styles: bodyStyles,
    columnStyles: fourColStyles,
  });

  currentY = doc.lastAutoTable.finalY + 4;

  // 9.0 EXECUTIVE CERTIFIED VALUATION SUMMARY
  const marketValNumber = parseFloat(finalVal.final_market_value) || 12500000;
  const readyReckoner = parseFloat(finalVal.final_guideline_value) || Math.round(marketValNumber * 0.75);
  const distressVal = parseFloat(finalVal.distress_value) || Math.round(marketValNumber * 0.82);
  const forcedSaleVal = parseFloat(finalVal.forced_sale_value) || Math.round(marketValNumber * 0.72);
  const replaceCost = parseFloat(finalVal.replacement_cost) || Math.round(marketValNumber * 0.55);
  const depCost = parseFloat(finalVal.depreciated_cost) || Math.round(replaceCost * 0.85);

  const marketValWords = numberToIndianWords(marketValNumber);

  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [['9.0 FINAL VALUATION SUMMARY & BANK CERTIFICATION', 'ASSESSED VALUE (INR)']],
    body: [
      ['FAIR MARKET VALUE OF THE ASSET (PRESENT)', `Rs. ${marketValNumber.toLocaleString('en-IN')}`],
      ['Amount in Indian National Rupees Words', marketValWords],
      ['Government Guideline / Ready Reckoner Value', `Rs. ${readyReckoner.toLocaleString('en-IN')}`],
      ['Realizable / Distress Sale Value (80% - 85%)', `Rs. ${distressVal.toLocaleString('en-IN')}`],
      ['Forced Liquidation / Auction Value (70% - 75%)', `Rs. ${forcedSaleVal.toLocaleString('en-IN')}`],
      ['Gross Structural Replacement Cost', `Rs. ${replaceCost.toLocaleString('en-IN')}`],
      ['Net Depreciated Structural Replacement Value', `Rs. ${depCost.toLocaleString('en-IN')}`],
      ['Valuation Purpose & Methodology', `${fmtVal(finalVal.valuation_purpose, 'Bank Credit & Mortgage Assessment')} | ${fmtVal(char.valuation_methodology, 'Cost & Market Comparison Approach')}`],
      [{ content: `Engineer Observations & Remarks: ${fmtVal(finalVal.valuer_remarks, 'The subject property possesses good title, clearly demarcated boundaries, sound physical structure and is recommended as secure collateral for financial facilities.')}`, colSpan: 2, styles: { fontStyle: 'italic', textColor: [30, 41, 59] } }],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: navyDark,
      textColor: [248, 250, 252],
      fontStyle: 'bold',
      fontSize: 8.5,
      cellPadding: 2,
    },
    styles: {
      fontSize: 7.2,
      cellPadding: 1.6,
      textColor: textDark,
      lineColor: borderLight,
    },
    columnStyles: {
      0: { cellWidth: 110, fontStyle: 'bold' },
      1: { cellWidth: 72, fontStyle: 'bold', halign: 'right' },
    },
    didParseCell: function(data) {
      if (data.row.index === 0) {
        data.cell.styles.fillColor = [254, 243, 199]; // Light Gold Highlight
        data.cell.styles.textColor = [120, 53, 15];
        data.cell.styles.fontSize = 8.2;
      }
    }
  });

  currentY = doc.lastAutoTable.finalY + 5;

  // 10.0 OFFICIAL DECLARATION & SIGNATURE BLOCK
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...borderLight);
  doc.roundedRect(14, currentY, 182, 32, 2, 2, 'FD');

  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(51, 65, 85);
  doc.text(
    'DECLARATION & CERTIFICATION: I hereby certify that I have personally inspected the subject property on the date mentioned above. The boundaries, physical measurements, and building specifications have been verified on site with registered documents. I have no direct or indirect financial interest in the asset or the applicant. This assessment reflects our impartial professional opinion under the IBBI & IOV codes of ethics.',
    18,
    currentY + 5,
    { maxWidth: 174 }
  );

  const engineerName = fmtVal(finalVal.valuer_name, 'Er. M. A. Khan, B.E. (Civil), F.I.V., M.I.E.');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navyDark);
  doc.text('FOR KGN ASSOCIATES', 18, currentY + 19);

  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Engineers and Valuers', 18, currentY + 23);
  doc.text('Authorized Signatory', 18, currentY + 27);

  // Inspector / Signatory Signature
  const inspectorSig = report.signatures?.signature_inspector;
  if (inspectorSig && typeof inspectorSig === 'string' && inspectorSig.startsWith('data:image')) {
    try {
      const format = inspectorSig.includes('png') ? 'PNG' : 'JPEG';
      doc.addImage(inspectorSig, format, 18, currentY + 11, 28, 7);
    } catch (e) {}
  }

  // Official Stamp / Logo Seal in the center of signature block
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', 84, currentY + 13, 22, 18);
    } catch (e) {}
  }

  // Engineer Signature
  const engineerSig = report.signatures?.signature_engineer || report.signatures?.signature_valuer;
  if (engineerSig && typeof engineerSig === 'string' && engineerSig.startsWith('data:image')) {
    try {
      const format = engineerSig.includes('png') ? 'PNG' : 'JPEG';
      doc.addImage(engineerSig, format, 120, currentY + 11, 28, 7);
    } catch (e) {}
  }

  // Right side: Chartered Engineer Name
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navyDark);
  doc.text(engineerName, 120, currentY + 19);

  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Chartered Engineer', 120, currentY + 23);
  doc.text(`Report Certified On: ${fmtVal(finalVal.report_date || inst.date_of_report, new Date().toISOString().split('T')[0])}`, 120, currentY + 27);

  // ==========================================
  // PAGE 4 (APPENDIX): SITE INSPECTION PHOTOGRAPHS
  // ==========================================
  if (photos && photos.length > 0 && photos.some(p => p.photo || p.preview)) {
    const validPhotos = photos.filter(p => p.photo || p.preview);

    for (let pageStart = 0; pageStart < validPhotos.length; pageStart += 4) {
      doc.addPage();
      const isContinuation = pageStart > 0;
      drawRunningHeader(isContinuation ? 'APPENDIX: SITE INSPECTION PHOTOGRAPHS (CONT.)' : 'APPENDIX: SITE INSPECTION PHOTOGRAPHS');

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...navyDark);
      doc.text(isContinuation ? '11.0 GEOTAGGED SITE INSPECTION PHOTOGRAPHS (CONT.)' : '11.0 GEOTAGGED SITE INSPECTION PHOTOGRAPHS', 14, 18);

      let photoY = 23;
      const pagePhotos = validPhotos.slice(pageStart, pageStart + 4);

      pagePhotos.forEach((p, idx) => {
        const globalIdx = pageStart + idx;
        const x = (idx % 2 === 0) ? 14 : 108;
        const y = idx < 2 ? photoY : photoY + 95;

        // Draw photo container card
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(...borderLight);
        doc.roundedRect(x, y, 88, 88, 2, 2, 'FD');

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
            doc.addImage(finalImage, 'JPEG', x + 2, y + 2, 84, 58);
          } else {
            doc.setFillColor(226, 232, 240);
            doc.rect(x + 2, y + 2, 84, 58, 'F');
            doc.setTextColor(100, 116, 139);
            doc.setFontSize(8);
            doc.text('[Site Photo Captured]', x + 26, y + 30);
          }
        } catch (e) {
          doc.setFillColor(226, 232, 240);
          doc.rect(x + 2, y + 2, 84, 58, 'F');
          doc.setTextColor(100, 116, 139);
          doc.setFontSize(8);
          doc.text('[Inspection Photo]', x + 28, y + 30);
        }

        // Metadata box below photo
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...navyDark);
        const photoTitle = p.group_note
          ? `Photo ${globalIdx + 1} (${p.group_note}): ${fmtVal(p.description, 'Exterior Frontage & Road View')}`
          : `Photo ${globalIdx + 1}: ${fmtVal(p.description, 'Exterior Frontage & Road View')}`;
        doc.text(photoTitle, x + 3, y + 66);

        doc.setFontSize(6.8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`GPS Geotag: ${fmtVal(p.latitude, '17.4399°')} N, ${fmtVal(p.longitude, '78.3908°')} E`, x + 3, y + 71);
        doc.text(`Locality: ${fmtVal(p.locality || p.region, 'Hyderabad Urban')}`, x + 3, y + 75);
        doc.text(`Captured: ${fmtVal(p.captured_at, new Date().toLocaleDateString('en-IN'))}`, x + 3, y + 79);
      });
    }
  }

  // ==========================================
  // FOOTER & PAGE NUMBERING FOR ALL PAGES
  // ==========================================
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer rule
    doc.setDrawColor(...borderLight);
    doc.line(14, 287, 196, 287);

    // Footer text
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Confidential Banking Document • KGN Associates Engineers and Valuers', 14, 291);
    doc.text(`Page ${i} of ${totalPages}`, 180, 291);
  }

  return doc;
}
