/**
 * KGN Associates — Word Document Generator
 * Produces a structured .docx valuation report using the `docx` package.
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
} from 'docx';

// ── Helpers ──────────────────────────────────────────────────────────────────

const GOLD  = 'B8860B';
const DARK  = '1A1A2E';
const GREY  = '64748B';
const LIGHT = 'FFF8E7';

const bold   = (text, size = 22, color = DARK) =>
  new TextRun({ text: String(text ?? ''), bold: true, size, color });
const normal = (text, size = 20, color = DARK) =>
  new TextRun({ text: String(text ?? ''), size, color });
const gold   = (text, size = 22) =>
  new TextRun({ text: String(text ?? ''), bold: true, size, color: GOLD });

const heading = (text, level = HeadingLevel.HEADING_2) =>
  new Paragraph({
    children: [new TextRun({ text, bold: true, size: 26, color: GOLD })],
    heading: level,
    spacing: { before: 300, after: 120 },
  });

const subheading = (text) =>
  new Paragraph({
    children: [bold(text, 24, DARK)],
    spacing: { before: 200, after: 80 },
  });

const kv = (label, value) =>
  new Paragraph({
    children: [
      bold(`${label}: `, 20, GREY),
      normal(value || '—', 20, DARK),
    ],
    spacing: { before: 60, after: 60 },
  });

const divider = () =>
  new Paragraph({
    children: [new TextRun({ text: '', size: 10 })],
    border: { bottom: { color: GOLD, style: BorderStyle.SINGLE, size: 6 } },
    spacing: { before: 160, after: 160 },
  });

const tblCell = (text, isHeader = false, shade = false) =>
  new TableCell({
    children: [
      new Paragraph({
        children: [
          isHeader
            ? new TextRun({ text: String(text ?? ''), bold: true, size: 18, color: isHeader ? 'FFFFFF' : DARK })
            : normal(text, 18),
        ],
        alignment: AlignmentType.LEFT,
      }),
    ],
    shading: isHeader
      ? { type: ShadingType.SOLID, color: GOLD }
      : shade
      ? { type: ShadingType.SOLID, color: 'FFF8E7' }
      : undefined,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
  });

const simpleTable = (headers, rows) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: headers.map(h => tblCell(h, true)) }),
      ...rows.map((row, i) =>
        new TableRow({ children: row.map(cell => tblCell(cell, false, i % 2 === 0)) })
      ),
    ],
  });

const spacer = () => new Paragraph({ children: [normal('')], spacing: { before: 80, after: 80 } });

// ── Main Generator ───────────────────────────────────────────────────────────

export async function generateValuationWord(report) {
  const inst      = report.institutionDetails    || report.institution_details    || {};
  const prop      = report.propertyIdentification || report.property_identification || {};
  const sched     = report.scheduleDetails       || report.schedule_details       || {};
  const infra     = report.infrastructureDetails || report.infrastructure_details || {};
  const tech      = report.technicalDetails      || report.technical_details      || {};
  const finalVal  = report.finalValuation        || report.final_valuation        || {};
  const landVals  = report.landExtentValuations  || report.land_extent_valuations || [];
  const structs   = report.structureValuations   || report.structure_valuations   || [];
  const amenities = report.amenityValuations     || report.amenity_valuations     || [];

  // ── Cover section ──────────────────────────────────────────────────────────
  const coverSection = [
    new Paragraph({
      children: [
        new TextRun({ text: 'KGN ASSOCIATES', bold: true, size: 48, color: GOLD }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 160 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'PROPERTY VALUATION REPORT', bold: true, size: 32, color: DARK })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80 },
    }),
    new Paragraph({
      children: [normal(`Report No: ${report.report_number || report.id || '—'}`, 20, GREY)],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 400 },
    }),
    divider(),
  ];

  // ── Institution Details ────────────────────────────────────────────────────
  const institutionSection = [
    heading('1. Institution Details'),
    kv('Applicant Name',   inst.applicant_name   || inst.applicantName),
    kv('Bank / Institution', inst.bank_name      || inst.bankName),
    kv('Branch',           inst.branch_name      || inst.branchName),
    kv('Loan Type',        inst.loan_type        || inst.loanType),
    kv('Reference No.',    inst.reference_number || inst.referenceNumber),
    divider(),
  ];

  // ── Property Identification ────────────────────────────────────────────────
  const propertySection = [
    heading('2. Property Identification'),
    kv('Property Type',    prop.property_type    || prop.propertyType),
    kv('Locality',         prop.locality_name    || prop.localityName),
    kv('District',         prop.district),
    kv('State',            prop.state),
    kv('Pin Code',         prop.pin_code         || prop.pinCode),
    kv('Survey No.',       prop.survey_number    || prop.surveyNumber),
    kv('Door No.',         prop.door_number      || prop.doorNumber),
    divider(),
  ];

  // ── Schedule / Boundary ────────────────────────────────────────────────────
  const schedSection = [
    heading('3. Schedule of Property'),
    kv('North Boundary', sched.north),
    kv('South Boundary', sched.south),
    kv('East Boundary',  sched.east),
    kv('West Boundary',  sched.west),
    kv('Total Extent',   sched.total_extent || sched.totalExtent),
    divider(),
  ];

  // ── Land Extent Valuation ─────────────────────────────────────────────────
  const landRows = landVals.map(r => [
    r.basis_of_valuation || r.basisOfValuation || '—',
    r.land_extent_sqft   || r.landExtentSqft   || '—',
    r.cost_per_sqft      || r.costPerSqft      || '—',
    r.total_value        || r.totalValue       || '—',
  ]);

  const landSection = [
    heading('4. Land Extent Valuation'),
    landRows.length > 0
      ? simpleTable(['Basis of Valuation', 'Land Extent (SqFt)', 'Cost / SqFt (₹)', 'Total Value (₹)'], landRows)
      : new Paragraph({ children: [normal('No land valuation data entered.', 18, GREY)] }),
    spacer(),
    divider(),
  ];

  // ── Structure Valuation ───────────────────────────────────────────────────
  const structRows = structs.map(r => [
    r.floor_details       || r.floorDetails       || '—',
    r.area_sqft           || r.areaSqft           || '—',
    r.recommendation_funding || '—',
    r.cost_per_sft        || r.costPerSft         || '—',
    r.total_value         || r.totalValue         || '—',
  ]);

  const structSection = [
    heading('5. Structure Valuation'),
    structRows.length > 0
      ? simpleTable(['Floor Details', 'Area (SqFt)', 'Funding %', 'Cost / SFT (₹)', 'Total Value (₹)'], structRows)
      : new Paragraph({ children: [normal('No structure valuation data entered.', 18, GREY)] }),
    spacer(),
    divider(),
  ];

  // ── Amenities Valuation ───────────────────────────────────────────────────
  const amenityRows = amenities.map(r => [
    r.amenity_name  || r.amenityName  || '—',
    r.quantity      || '—',
    r.rate          || '—',
    r.total_value   || r.totalValue   || '—',
  ]);

  const amenitySection = [
    heading('6. Amenities Valuation'),
    amenityRows.length > 0
      ? simpleTable(['Amenity', 'Quantity', 'Rate (₹)', 'Total Value (₹)'], amenityRows)
      : new Paragraph({ children: [normal('No amenity data entered.', 18, GREY)] }),
    spacer(),
    divider(),
  ];

  // ── Final Valuation ───────────────────────────────────────────────────────
  const finalSection = [
    heading('7. Final Valuation Summary'),
    simpleTable(
      ['Description', 'Value (₹)'],
      [
        ['Final Market Value',    finalVal.final_market_value    || finalVal.finalMarketValue    || '—'],
        ['Final Guideline Value', finalVal.final_guideline_value || finalVal.finalGuidelineValue || '—'],
        ['Realised Value',        finalVal.distress_value        || finalVal.distressValue       || '—'],
        ['Distress Value',        finalVal.forced_sale_value     || finalVal.forcedSaleValue     || '—'],
        ['Replacement Cost',      finalVal.replacement_cost      || finalVal.replacementCost     || '—'],
        ['Depreciated Cost',      finalVal.depreciated_cost      || finalVal.depreciatedCost     || '—'],
      ]
    ),
    spacer(),
    divider(),
  ];

  // ── Declaration ───────────────────────────────────────────────────────────
  const declarationSection = [
    heading('8. Declaration'),
    new Paragraph({
      children: [
        normal(
          'KGN and the site engineer/service provider partner certify that they have no direct or indirect interest ' +
          'in the appraisal of the property. The property was inspected by our authorised representative in the presence of ' +
          'owner\'s representative, and the information provided in the report is accurate to the best of our knowledge.',
          18,
          GREY
        ),
      ],
      spacing: { before: 80, after: 80 },
    }),
    spacer(),
    divider(),
  ];

  // ── Footer note ───────────────────────────────────────────────────────────
  const footerSection = [
    new Paragraph({
      children: [
        new TextRun({ text: 'KGN ASSOCIATES', bold: true, size: 18, color: GOLD }),
        new TextRun({ text: '  |  Confidential Banking Document', size: 16, color: GREY }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 0 },
    }),
  ];

  // ── Assemble Document ─────────────────────────────────────────────────────
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          ...coverSection,
          ...institutionSection,
          ...propertySection,
          ...schedSection,
          ...landSection,
          ...structSection,
          ...amenitySection,
          ...finalSection,
          ...declarationSection,
          ...footerSection,
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

