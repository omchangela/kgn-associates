/**
 * KGN Associates — Word Document Generator
 * Produces a structured .docx valuation report using the `docx` package.
 * Section order matches the KGN format PDF exactly.
 */
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
  Header,
  Footer,
  PageNumber,
} from 'docx';

// ── Theme colours ─────────────────────────────────────────────────────────────
const GOLD   = 'C2954A';
const NAVY   = '0F172A';
const SLATE  = '1E293B';
const GREY   = '64748B';
const WHITE  = 'FFFFFF';
const LBKG   = 'F1F5F9';  // label cell background
const ALT    = 'F8FAFC';  // alternating row background

// ── Text helpers ──────────────────────────────────────────────────────────────
const bold   = (text, size = 20, color = NAVY) =>
  new TextRun({ text: String(text ?? '—'), bold: true, size, color });
const normal = (text, size = 20, color = NAVY) =>
  new TextRun({ text: String(text ?? '—'), size, color });
const italic = (text, size = 18, color = GREY) =>
  new TextRun({ text: String(text ?? ''), italics: true, size, color });

function fmtVal(val, def = '—') {
  if (val === undefined || val === null || val === '') return def;
  return String(val).trim();
}
function fmtCurrency(val) {
  const n = parseFloat(val);
  if (isNaN(n) || n === 0) return '—';
  return `Rs. ${n.toLocaleString('en-IN')}`;
}
function yn(val) {
  if (val === true  || String(val).toLowerCase() === 'yes') return 'YES';
  if (val === false || String(val).toLowerCase() === 'no')  return 'NO';
  return fmtVal(val);
}
function numberToIndianWords(num) {
  num = Math.round(Number(num) || 0);
  if (num === 0) return 'Rupees Zero Only';
  const a = ['','One ','Two ','Three ','Four ','Five ','Six ','Seven ','Eight ','Nine ',
    'Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const iw = n => n > 19 ? b[Math.floor(n/10)] + (n%10 ? ' '+a[n%10] : ' ') : a[n];
  let w = '';
  const c = Math.floor(num/10000000); num %= 10000000;
  const l = Math.floor(num/100000);   num %= 100000;
  const t = Math.floor(num/1000);     num %= 1000;
  const h = Math.floor(num/100);      num %= 100;
  if (c) w += iw(c) + 'Crore ';
  if (l) w += iw(l) + 'Lakh ';
  if (t) w += iw(t) + 'Thousand ';
  if (h) w += iw(h) + 'Hundred ';
  if (num) w += iw(num);
  return 'Rupees ' + w.trim() + ' Only';
}

// ── Layout primitives ─────────────────────────────────────────────────────────
const spacer = () => new Paragraph({ children: [new TextRun({ text: '', size: 10 })], spacing: { before: 60, after: 60 } });

const sectionHeading = (text) =>
  new Paragraph({
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 22, color: WHITE })],
    shading: { type: ShadingType.SOLID, color: SLATE },
    spacing: { before: 240, after: 60 },
    indent: { left: 100 },
  });

const divider = () =>
  new Paragraph({
    children: [new TextRun({ text: '', size: 8 })],
    border: { bottom: { color: GOLD, style: BorderStyle.SINGLE, size: 6 } },
    spacing: { before: 100, after: 100 },
  });

// Table cell builders
const hdrCell = (text, colSpan = 1) =>
  new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text: String(text ?? ''), bold: true, size: 18, color: WHITE })],
      alignment: AlignmentType.CENTER,
    })],
    shading: { type: ShadingType.SOLID, color: SLATE },
    margins: { top: 80, bottom: 80, left: 80, right: 80 },
    columnSpan: colSpan,
  });

const labelCell = (text) =>
  new TableCell({
    children: [new Paragraph({ children: [bold(text, 18, NAVY)] })],
    shading: { type: ShadingType.SOLID, color: LBKG },
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
  });

const valueCell = (text, colSpan = 1, shade = false) =>
  new TableCell({
    children: [new Paragraph({ children: [normal(text, 18)] })],
    shading: shade ? { type: ShadingType.SOLID, color: ALT } : undefined,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    columnSpan: colSpan,
  });

/**
 * Build a 4-column (label|value|label|value) table row.
 * Pass null for label2/val2 to get a full-width value with colSpan=3.
 */
const kvRow = (label1, val1, label2 = null, val2 = null, shade = false) => {
  if (label2 === null) {
    return new TableRow({ children: [labelCell(label1), valueCell(fmtVal(val1), 3, shade)] });
  }
  return new TableRow({
    children: [
      labelCell(label1), valueCell(fmtVal(val1), 1, shade),
      labelCell(label2), valueCell(fmtVal(val2), 1, shade),
    ],
  });
};

/** Build a simple header + data table */
const buildTable = (headers, rows, widths = null) => {
  const colCount = headers.length;
  const makeCell = (text, isHdr, shade) => isHdr ? hdrCell(text) : (shade ? valueCell(text, 1, true) : valueCell(text));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: headers.map(h => hdrCell(h)) }),
      ...rows.map((row, ri) =>
        new TableRow({
          children: row.map((cell, ci) => {
            if (ci === 0) return labelCell(String(cell ?? '—'));
            return valueCell(String(cell ?? '—'), 1, ri % 2 === 1);
          }),
        })
      ),
    ],
  });
};

/** 4-column KV table from an array of [label, value, label, value] rows */
const kvTable = (sectionTitle, kvRows) => {
  const tableRows = kvRows.map(([l1, v1, l2, v2], i) =>
    kvRow(String(l1 ?? ''), String(v1 ?? '—'), l2 != null ? String(l2) : null, l2 != null ? String(v2 ?? '—') : null, i % 2 === 1)
  );
  return [
    sectionHeading(sectionTitle),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: tableRows,
    }),
    spacer(),
  ];
};

// ── Main Generator ────────────────────────────────────────────────────────────
export async function generateValuationWord(report) {
  // Data extraction (mirrors pdfGenerator)
  const inst      = report.institutionDetails    || report.institution_details    || {};
  const prop      = report.propertyIdentification || report.property_identification || {};
  const sched     = report.scheduleDetails       || report.schedule_details       || {};
  const infra     = report.infrastructureDetails || report.infrastructure_details || {};
  const tech      = report.technicalDetails      || report.technical_details      || {};
  const finalVal  = report.finalValuation        || report.final_valuation        || {};
  const loc       = report.locationDetails       || report.location_details       || {};
  const char      = report.propertyCharacteristics || report.property_characteristics || {};
  const landVals  = report.landExtentValuations  || report.land_extent_valuations || [];
  const structs   = report.structureValuations   || report.structure_valuations   || [];
  const amenities = report.amenityValuations     || report.amenity_valuations     || [];
  const verifiedDocuments = report.verifiedDocuments || report.verified_documents || [];

  const loanAppId = fmtVal(inst.loan_application_id, report.report_number || report.id || '—');
  const bankName  = fmtVal(inst.bank_name, 'BANK NAME');

  // ── HEADER / FOOTER ────────────────────────────────────────────────────────
  const docHeader = new Header({
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: 'KGN Groups', bold: true, size: 20, color: GOLD }),
          new TextRun({ text: `\t\t${bankName}`, size: 18, color: GREY }),
        ],
        border: { bottom: { color: GOLD, style: BorderStyle.SINGLE, size: 4 } },
        spacing: { after: 60 },
      }),
    ],
  });

  const docFooter = new Footer({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: `This document contains sensitive data please share with authorised people only.  |  Loan application id: ${loanAppId}`,
            size: 16, color: GREY, italics: true,
          }),
        ],
        border: { top: { color: GOLD, style: BorderStyle.SINGLE, size: 4 } },
      }),
    ],
  });

  // ── COVER ─────────────────────────────────────────────────────────────────
  const coverSection = [
    new Paragraph({
      children: [new TextRun({ text: 'KGN Groups', bold: true, size: 56, color: GOLD })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 600, after: 160 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'PROPERTY VALUATION REPORT', bold: true, size: 36, color: NAVY })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 120 },
    }),
    new Paragraph({
      children: [normal(`Loan Application ID: ${loanAppId}  |  Bank: ${bankName}`, 20, GREY)],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 400 },
    }),
    divider(),
  ];

  // ── SECTION 1: INSTITUTION DETAILS ────────────────────────────────────────
  const sec1 = kvTable('1. INSTITUTION DETAILS', [
    ['BANK NAME', inst.bank_name, 'BRANCH NAME', inst.branch_name],
    ['VENDOR / ENGINEER / INSTITUTION NAME', inst.vendor_engineer_institution_name, 'CONTACT', inst.vendor_contact_number],
    ['SITE ENGINEER NAME', inst.site_engineer_name, 'CONTACT', inst.site_engineer_contact_number],
    ['DATE OF INSPECTION', inst.date_of_inspection, 'DATE OF REPORT', inst.date_of_report],
  ]);

  // ── SECTION 2: BASIC DETAILS – LOAN APPLICATION DETAILS ───────────────────
  const sec2 = kvTable('2. BASIC DETAILS – LOAN APPLICATION DETAILS', [
    ['LOAN APPLICATION ID', inst.loan_application_id, 'LOAN TYPE', inst.product_loan_type],
    ['APPLICANT NAME', inst.applicant_name, 'CONTACT', inst.applicant_contact_number],
    ['PROPERTY OWNER NAME', inst.property_owner_name, 'CONTACT', inst.property_owner_contact_number],
    ['PERSON MET AT SITE', inst.person_met_at_site, 'CONTACT', inst.person_met_contact_number],
    ['RELATIONSHIP WITH APPLICANT', inst.relationship_with_applicant, null, null],
  ]);

  // ── SECTION 3: VERIFIED DOCUMENTS (YES/NO checkboxes) ─────────────────────
  const ck = (v) => (v ? 'YES ☑' : 'NO ☐');
  const docChecks = {
    title_deed:    verifiedDocuments.some(d => /title.?deed/i.test(d.type_of_document || d.document_type)) || inst.title_deed_verified,
    property_tax:  verifiedDocuments.some(d => /property.?tax/i.test(d.type_of_document || d.document_type)) || inst.property_tax_verified,
    e_bill:        verifiedDocuments.some(d => /e.?bill/i.test(d.type_of_document || d.document_type)) || inst.e_bill_verified,
    plan_approval: verifiedDocuments.some(d => /plan|approval|building/i.test(d.type_of_document || d.document_type)) || inst.plan_approval_verified,
    sketch_layout: verifiedDocuments.some(d => /sketch|layout/i.test(d.type_of_document || d.document_type)) || inst.sketch_verified,
    position_cert: verifiedDocuments.some(d => /position/i.test(d.type_of_document || d.document_type)) || inst.position_cert_verified,
    survey_sketch: verifiedDocuments.some(d => /survey/i.test(d.type_of_document || d.document_type)) || inst.survey_sketch_verified,
    others:        verifiedDocuments.some(d => /other/i.test(d.type_of_document || d.document_type)) || inst.others_verified,
  };
  const sec3 = kvTable('3. VERIFIED DOCUMENTS', [
    ['TITLE DEED', ck(docChecks.title_deed), 'PROPERTY TAX', ck(docChecks.property_tax)],
    ['E-BILL', ck(docChecks.e_bill), 'PLAN APPROVAL & BUILDING PLANS', ck(docChecks.plan_approval)],
    ['SKETCH / LAYOUT', ck(docChecks.sketch_layout), 'POSITION CERTIFICATE', ck(docChecks.position_cert)],
    ['SURVEY SKETCH', ck(docChecks.survey_sketch), 'OTHERS', ck(docChecks.others)],
  ]);

  // ── SECTION 4: VERIFIED DOCUMENT DETAILS ─────────────────────────────────
  const validDocs = verifiedDocuments.filter(d => d.type_of_document || d.document_type || d.document_number);
  const sec4 = [
    sectionHeading('4. VERIFIED DOCUMENT DETAILS'),
    buildTable(
      ['TYPE OF DOCUMENT', 'DOCUMENT NO', 'EXECUTION DATE', 'APPROVAL AUTHORITY', 'IN FAVOR OF'],
      validDocs.length > 0
        ? validDocs.map(d => [
            fmtVal(d.type_of_document || d.document_type),
            fmtVal(d.document_number),
            fmtVal(d.execution_date),
            fmtVal(d.approval_authority),
            fmtVal(d.in_favour_of),
          ])
        : [['—', '—', '—', '—', '—']]
    ),
    spacer(),
  ];

  // ── SECTION 5: PROPERTY DETAILS ───────────────────────────────────────────
  const sec5 = kvTable('5. PROPERTY DETAILS', [
    ['ADDRESS AS PER SITE VISIT', prop.address_as_per_actual_site, null, null],
    ['ADDRESS AS PER DOCUMENT', prop.address_as_per_documents, null, null],
    ['ADDRESS AS PER PLAN', prop.address_as_per_plan || prop.address_as_per_documents, null, null],
    ['LAND MARK', prop.landmark, 'JURISDICTION', prop.jurisdiction || prop.approving_authority],
    ['MANDAL', prop.mandal || prop.taluka, 'CITY', prop.district],
    ['STATE NAME', prop.state, 'PINCODE', prop.pincode],
    ['PROPERTY TYPE', prop.property_type || inst.property_type, null, null],
  ]);

  // ── SECTION 6: SCHEDULE DETAILS ──────────────────────────────────────────
  const sec6 = [
    sectionHeading('6. SCHEDULE DETAILS – BOUNDARY TABLE'),
    buildTable(
      ['DIRECTION', 'AS PER VISIT', 'AS PER DOCUMENT DOC1', 'AS PER DOCUMENT DOC2', 'AS PER PLAN'],
      [
        ['EAST',  fmtVal(sched.east_boundary_actual || sched.east_actual), fmtVal(sched.east_boundary_docs || sched.east_docs), fmtVal(sched.east_boundary_docs2 || '—'), fmtVal(sched.east_boundary_plan || sched.east_plan)],
        ['WEST',  fmtVal(sched.west_boundary_actual || sched.west_actual), fmtVal(sched.west_boundary_docs || sched.west_docs), fmtVal(sched.west_boundary_docs2 || '—'), fmtVal(sched.west_boundary_plan || sched.west_plan)],
        ['NORTH', fmtVal(sched.north_boundary_actual || sched.north_actual), fmtVal(sched.north_boundary_docs || sched.north_docs), fmtVal(sched.north_boundary_docs2 || '—'), fmtVal(sched.north_boundary_plan || sched.north_plan)],
        ['SOUTH', fmtVal(sched.south_boundary_actual || sched.south_actual), fmtVal(sched.south_boundary_docs || sched.south_docs), fmtVal(sched.south_boundary_docs2 || '—'), fmtVal(sched.south_boundary_plan || sched.south_plan)],
      ]
    ),
    spacer(),
    ...kvTable('', [
      ['MATCHING STATUS (E/W/N/S)',
        `${yn(sched.east_matching)} / ${yn(sched.west_matching)} / ${yn(sched.north_matching)} / ${yn(sched.south_matching)}`,
        'PROPERTY IDENTIFICATION STATUS', yn(sched.property_identification_status)],
    ]),
  ];

  // ── SECTION 7: INFRASTRUCTURE DETAILS ─────────────────────────────────────
  const sec7 = kvTable('7. INFRASTRUCTURE DETAILS', [
    ['ACCESSIBILITY', yn(infra.accessibility), 'NO. OF ROADS SURROUNDED', fmtVal(infra.number_of_roads, '1')],
    ['ROAD WIDTH (FT)', fmtVal(infra.road_width_ft), 'ROAD DIRECTION', fmtVal(infra.road_direction)],
    ['TYPE OF ACCESS', fmtVal(infra.approach_road_type === 'others' ? infra.other_approach_road_type : infra.approach_road_type), 'ELECTRICITY', yn(infra.electricity)],
    ['NO. OF LIFTS', fmtVal(infra.number_of_lifts, '0'), null, null],
  ]);

  // ── SECTION 8: PROPERTY SPECIFICATIONS ───────────────────────────────────
  const sec8 = kvTable('8. PROPERTY SPECIFICATIONS', [
    ['CONSTRUCTION TYPE', fmtVal(sched.construction_type === 'others' ? sched.other_construction_type : sched.construction_type), 'CONSTRUCTION QUALITY', fmtVal(sched.construction_quality)],
    ['MAINTENANCE OF PROPERTY', fmtVal(sched.maintenance_of_property), 'FLOORING TYPE', fmtVal(sched.flooring_type === 'others' ? sched.other_flooring_type : sched.flooring_type)],
    ['ROOF TYPE', fmtVal(sched.roof_type === 'others' ? sched.other_roof_type : sched.roof_type), 'STAIR TYPE', fmtVal(sched.stair_type === 'others' ? sched.other_stair_type : sched.stair_type)],
    ['PROPERTY USAGE', fmtVal(sched.actual_usage_of_property), 'OCCUPANCY STATUS', fmtVal(sched.occupancy_status)],
    ['OCCUPANCY INFORMATION', fmtVal(sched.occupancy_information || sched.occupant_details), 'CLASS OF LOCALITY', fmtVal(sched.class_of_locality === 'others' ? sched.other_class_of_locality : sched.class_of_locality)],
  ]);

  // ── SECTION 9: TECHNICAL DETAILS – PLOT DIMENSIONS ───────────────────────
  const lm = tech.landMeasurements || {};
  const getLM = (basis, dir) => {
    if (Array.isArray(lm)) return fmtVal((lm[0] || {})[`${dir}_${basis}`]);
    return fmtVal(lm[`${dir}_${basis}`]);
  };
  const getExt = (basis) => {
    if (Array.isArray(lm)) return fmtVal((lm[0] || {})[`land_extent_${basis}`]);
    return fmtVal(lm[`land_extent_${basis}`]);
  };

  const sec9 = [
    sectionHeading('9. TECHNICAL DETAILS – PLOT DIMENSIONS'),
    buildTable(
      ['', 'EAST', 'WEST', 'NORTH', 'SOUTH', 'LAND EXTENT'],
      [
        ['AS PER ACTUAL',       getLM('actual','east'),   getLM('actual','west'),   getLM('actual','north'),   getLM('actual','south'),   getExt('actual')],
        ['AS PER DOCUMENT DOC1',getLM('document','east'),  getLM('document','west'),  getLM('document','north'),  getLM('document','south'),  getExt('documents')],
        ['AS PER DOCUMENT DOC2',getLM('document2','east'), getLM('document2','west'), getLM('document2','north'), getLM('document2','south'), getExt('documents2') || '—'],
        ['AS PER PLAN',          getLM('plan','east'),     getLM('plan','west'),     getLM('plan','north'),     getLM('plan','south'),     getExt('plan')],
        ['TOTAL LAND EXTENT',    '', '', '', '', fmtVal(tech.total_land_extent || getExt('actual'))],
      ]
    ),
    spacer(),
  ];

  // ── SECTION 10: STRUCTURE DETAILS – per floor ─────────────────────────────
  const specCards = Array.isArray(tech.buildingSpecCards) ? tech.buildingSpecCards
    : Array.isArray(tech.building_spec_cards) ? tech.building_spec_cards : [];
  const perFloor = report.perFloorStructureValuations || {};

  const buildFloorSection = (floorLabel, floorData = {}) => {
    const bua    = parseFloat(floorData.total_bua  || floorData.bua_actual  || 0);
    const sbua   = parseFloat(floorData.total_sbua || floorData.sbua_actual || 0);
    const slab   = parseFloat(floorData.slab_area  || floorData.slab_actual || 0);
    const carpet = Math.round(bua * 0.8);
    const buaPlan = parseFloat(floorData.bua_plan || bua);
    const devSft  = Math.round(bua - buaPlan);
    const devPct  = buaPlan > 0 ? (((buaPlan - bua) / buaPlan) * 100).toFixed(2) : '0.00';
    const fv = (k) => fmtVal(floorData[k]);

    return [
      sectionHeading(`10. STRUCTURE DETAILS – ${floorLabel.toUpperCase()}`),
      buildTable(
        ['', 'EAST', 'WEST', 'NORTH', 'SOUTH', 'LAND EXTENT'],
        [
          ['AS PER ACTUAL',   fv('east_actual'),   fv('west_actual'),   fv('north_actual'),   fv('south_actual'),   fv('land_extent_actual')],
          ['AS PER DOCUMENT', fv('east_document'), fv('west_document'), fv('north_document'), fv('south_document'), fv('land_extent_document')],
          ['AS PER PLAN',     fv('east_plan'),     fv('west_plan'),     fv('north_plan'),     fv('south_plan'),     fv('land_extent_plan')],
          ['TOTAL BUA',       '', '', '', '', bua  > 0 ? `${bua.toLocaleString('en-IN')} sft` : '—'],
          ['TOTAL SBUA',      '', '', '', '', sbua > 0 ? `${sbua.toLocaleString('en-IN')} sft` : '—'],
          ['TOTAL SLAB AREA', '', '', '', '', slab > 0 ? `${slab.toLocaleString('en-IN')} sft` : '—'],
          [`CARPET AREA (BUA × 0.8) = ${carpet > 0 ? carpet.toLocaleString('en-IN') + ' sft' : '—'}`, '', '', '', '', ''],
        ]
      ),
      ...kvTable('', [
        ['DEVIATION (sft) = Actual – Plan', buaPlan > 0 ? `${devSft > 0 ? '+' : ''}${devSft} sft` : '—',
         'DEVIATION (%)', buaPlan > 0 ? `${devPct}%` : '—'],
        ['CONSTRUCTION PROGRESS', fmtVal(floorData.construction_progress || tech.construction_progress, '—') + '%',
         'RECOMMENDATION OF FUNDING', fmtVal(floorData.recommendation_of_funding || tech.recommendation_of_funding, '—') + '%'],
      ]),
    ];
  };

  const sec10 = specCards.length > 0
    ? specCards.flatMap((card, i) => {
        const label = card.description || card.document_number || (i === 0 ? 'GROUND FLOOR (GF)' : `FLOOR ${i}`);
        return buildFloorSection(label, perFloor[i] || perFloor[String(i)] || structs[i] || {});
      })
    : buildFloorSection('GROUND FLOOR (GF)', {
        total_bua: (structs[0] || {}).area_sqft,
        recommendation_of_funding: (structs[0] || {}).recommendation_of_funding,
        construction_progress: tech.construction_progress,
      });

  // ── SECTION 11: PROPERTY MARKET VALUE ASSESSMENT ──────────────────────────
  const sec11 = [
    sectionHeading('11. PROPERTY MARKET VALUE ASSESSMENT – LAND'),
    buildTable(
      ['BASIS', 'LAND EXTENT (sft)', 'COST PER SFT (₹)', 'TOTAL VALUE (₹)'],
      landVals.length > 0
        ? landVals.map(l => [
            fmtVal(l.basis_of_valuation, '—').replace(/_/g,' ').toUpperCase(),
            fmtVal(l.land_extent_sqft),
            fmtCurrency(l.cost_per_sqft),
            fmtCurrency(l.total_value),
          ])
        : [['AS PER ACTUAL','—','—','—'],['AS PER DOCUMENT','—','—','—'],['AS PER PLAN','—','—','—']]
    ),
    spacer(),
    sectionHeading('11b. STRUCTURE MARKET VALUE'),
    buildTable(
      ['AREA TYPE', 'AREA DETAILS (sft)', 'RECOMMENDATION COST OF FUNDING %', 'COST PER SFT (₹)', 'TOTAL MARKET VALUE (₹)'],
      structs.length > 0
        ? structs.map(s => [
            fmtVal(s.floor_details || s.area_type, '—').replace(/_/g,' ').toUpperCase(),
            fmtVal(s.area_sqft),
            fmtVal(s.recommendation_of_funding),
            fmtCurrency(s.cost_per_sqft),
            fmtCurrency(s.total_value),
          ])
        : [['TOTAL BUA','—','—','—','—'],['TOTAL SBUA','—','—','—','—'],['TOTAL SLAB AREA','—','—','—','—']]
    ),
    spacer(),
  ];

  // ── SECTION 12: GUIDELINE VALUE ASSESSMENT ───────────────────────────────
  const sec12 = [
    sectionHeading('12. PROPERTY GUIDELINE VALUE ASSESSMENT – LAND'),
    buildTable(
      ['BASIS', 'LAND EXTENT (sft)', 'GOVT PRICE PER SFT (₹)', 'TOTAL GOVERNMENT PRICE (₹)'],
      landVals.length > 0
        ? landVals.map(l => [
            fmtVal(l.basis_of_valuation, '—').replace(/_/g,' ').toUpperCase(),
            fmtVal(l.land_extent_sqft),
            fmtCurrency(l.govt_price_per_sqft || l.guideline_rate),
            fmtCurrency(l.govt_total_value || l.guideline_total),
          ])
        : [['AS PER ACTUAL','—','—','—'],['AS PER DOCUMENT','—','—','—'],['AS PER PLAN','—','—','—']]
    ),
    spacer(),
    sectionHeading('12b. GUIDELINE STRUCTURE VALUE'),
    buildTable(
      ['AREA TYPE', 'AREA DETAILS (sft)', 'GOVT PRICE (₹)', 'TOTAL GOVERNMENT PRICE (₹)'],
      structs.length > 0
        ? structs.map(s => [
            fmtVal(s.floor_details || s.area_type, '—').replace(/_/g,' ').toUpperCase(),
            fmtVal(s.area_sqft),
            fmtCurrency(s.govt_price || s.guideline_cost_per_sqft),
            fmtCurrency(s.govt_total || s.guideline_total_value),
          ])
        : [['TOTAL BUA','—','—','—'],['TOTAL SBUA','—','—','—'],['TOTAL SLAB AREA','—','—','—']]
    ),
    spacer(),
  ];

  // ── SECTION 13: AMENITIES ─────────────────────────────────────────────────
  const sec13 = [
    sectionHeading('13. AMENITIES'),
    buildTable(
      ['AMENITY', 'TOTAL VALUE (₹)'],
      amenities.length > 0
        ? amenities.map(a => [fmtVal(a.amenity_name,'Extra Works'), fmtCurrency(a.total_value || a.amenity_value)])
        : [['—','—']]
    ),
    spacer(),
  ];

  // ── SECTION 14: FINAL MARKET VALUATION ───────────────────────────────────
  const marketVal   = parseFloat(finalVal.final_market_value)   || 0;
  const guideVal    = parseFloat(finalVal.final_guideline_value) || 0;
  const realizable  = parseFloat(finalVal.forced_sale_value || finalVal.realizable_value) || Math.round(marketVal * 0.9);
  const distressV   = parseFloat(finalVal.distress_value)       || Math.round(marketVal * 0.8);
  const insureV     = Math.round(marketVal * 0.25);

  const sec14 = [
    sectionHeading('14. FINAL MARKET VALUATION'),
    buildTable(
      ['DESCRIPTION', 'VALUE (₹)'],
      [
        ['Final Valuation = Selected Land + Selected Structure + Amenities', fmtCurrency(marketVal)],
        ['Realizable Value (Final × 0.9)', fmtCurrency(realizable)],
        ['Distress Value (Final × 0.8)',   fmtCurrency(distressV)],
        ['Insurance Value (Final × 0.25)', fmtCurrency(insureV)],
        [`Amount in Words: ${numberToIndianWords(marketVal)}`, ''],
        ['GUIDELINE VALUATION – Final Guideline Value (Guideline Land + Guideline Structure)', fmtCurrency(guideVal)],
      ]
    ),
    spacer(),
  ];

  // ── SECTION 15: LOCATION DETAILS ─────────────────────────────────────────
  const sec15 = kvTable('15. LOCATION DETAILS', [
    ['GPS CO-ORDINATES – LATITUDE', fmtVal(loc.latitude || loc.gps_latitude), 'LONGITUDE', fmtVal(loc.longitude || loc.gps_longitude)],
    ['MANUAL GPS – LATITUDE', fmtVal(loc.manual_latitude), 'LONGITUDE', fmtVal(loc.manual_longitude)],
  ]);

  // ── SECTION 16: ADDITIONAL DETAILS ───────────────────────────────────────
  const kmStr = (v) => (!v && v !== 0) ? '—' : (String(v).toLowerCase().includes('km') ? String(v) : `${v} km`);
  const sec16 = kvTable('16. ADDITIONAL DETAILS', [
    ['NEAREST RAILWAY STATION', kmStr(char.nearest_railway_station_km), 'NEAREST BUS STATION', kmStr(char.nearest_bus_station_km)],
    ['NEAREST HOSPITAL', kmStr(char.nearest_hospital_km), 'NEAREST CONNECTING ROAD', kmStr(char.nearest_connecting_road_km)],
    ['JOINT WALL – DIRECTION', fmtVal(sched.joint_wall_direction || char.joint_wall_direction), 'JOINT SLAB – DIRECTION', fmtVal(sched.joint_slab_direction || char.joint_slab_direction)],
    ['VALUATION METHODOLOGY', fmtVal(char.valuation_methodology || finalVal.valuation_methodology), null, null],
    ['RISK OF DEMOLITION', fmtVal(char.risk_of_demolition), 'AGE / RESIDUAL AGE', `${fmtVal(tech.property_age || char.property_age)} / ${fmtVal(tech.residual_age || char.residual_age)}`],
    ['NEGATIVE AREA AS PER LOCAL', fmtVal(char.negative_area_as_per_local || (char.negative_area ? 'YES' : 'NO')), 'DEVELOPMENT OF VICINITY', fmtVal(char.development_of_vicinity)],
    ['HABITATION AROUND PROPERTY (%)', fmtVal(char.habitation_around_property_percent), 'OTHERS / REMARKS', fmtVal(finalVal.valuer_remarks || char.remarks)],
  ]);

  // ── SECTION 17: DECLARATION ───────────────────────────────────────────────
  const sec17 = [
    sectionHeading('17. DECLARATION'),
    new Paragraph({
      children: [
        italic(
          'KGN and the site engineer/service provider partner certify that they have no direct or indirect interest ' +
          'in the appraisal of the property. The property was inspected by our authorised representative in the presence of ' +
          "owner's representative, and the information provided in the report is accurate to the best of our knowledge and belief.",
          18, GREY
        ),
      ],
      spacing: { before: 80, after: 160 },
    }),
    divider(),
  ];

  // ── SECTION 20: FINAL VALUE CHART SUMMARY ────────────────────────────────
  const totalAmenityVal = amenities.reduce((sum, a) => sum + (parseFloat(a.total_value || a.amenity_value) || 0), 0);
  const totalLandMkt    = landVals.reduce((sum, l) => sum + (parseFloat(l.total_value) || 0), 0);
  const totalStructMkt  = structs.reduce((sum, s) => sum + (parseFloat(s.total_value) || 0), 0);

  const sec20 = [
    sectionHeading('20. FINAL VALUE CHART SUMMARY'),
    buildTable(
      ['DESCRIPTION', 'MARKET VALUE (₹)', 'GUIDELINE VALUE (₹)'],
      [
        ['Land Value',      fmtCurrency(totalLandMkt),   fmtCurrency(landVals.reduce((s,l) => s+(parseFloat(l.guideline_total||l.govt_total_value)||0),0))],
        ['Structure Value', fmtCurrency(totalStructMkt),  fmtCurrency(structs.reduce((s,str) => s+(parseFloat(str.govt_total||str.guideline_total_value)||0),0))],
        ['Amenities Value', fmtCurrency(totalAmenityVal), '—'],
        ['FINAL VALUATION', fmtCurrency(marketVal || totalLandMkt+totalStructMkt+totalAmenityVal), fmtCurrency(guideVal)],
        ['Realizable Value (90%)', fmtCurrency(realizable), '—'],
        ['Distress Value (80%)',   fmtCurrency(distressV),  '—'],
        ['Insurance Value (25%)',  fmtCurrency(insureV),    '—'],
      ]
    ),
    spacer(),
  ];

  // ── ASSEMBLE DOCUMENT ─────────────────────────────────────────────────────
  const docx = new Document({
    sections: [
      {
        headers: { default: docHeader },
        footers: { default: docFooter },
        children: [
          ...coverSection,
          ...sec1,
          ...sec2,
          ...sec3,
          ...sec4,
          ...sec5,
          ...sec6,
          ...sec7,
          ...sec8,
          ...sec9,
          ...sec10,
          ...sec11,
          ...sec12,
          ...sec13,
          ...sec14,
          ...sec15,
          ...sec16,
          ...sec17,
          ...sec20,
        ],
      },
    ],
  });

  return await Packer.toBuffer(docx);
}
