'use client';
import React, { useState, createContext, useContext, useRef, useEffect } from 'react';
import styles from './PropertyValues.module.css';
import Sidebar from '@/components/sidebar/Sidebar';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import { Calendar, ChevronRight, ChevronDown, Plus, Trash2, Upload, PenTool, RotateCcw } from 'lucide-react';
import { propertyValuationAPI } from '@/services/api';
import { initialFormData, getSampleFormData, sanitizePayload, parseNumber, roundCoord } from './propertyFormState';
import gsap from 'gsap';
import { ApprovedValuerBadge } from '@/components/common/SvgDecorations';

const FormContext = createContext(null);

const useFormContext = () => {
  const ctx = useContext(FormContext);
  if (!ctx) throw new Error('Form components must be used within PropertyValues');
  return ctx;
};

const directionOptions = [
  { value: '', label: 'Select' },
  { value: 'north', label: 'North' },
  { value: 'south', label: 'South' },
  { value: 'east', label: 'East' },
  { value: 'west', label: 'West' },
  { value: 'north_east', label: 'North-East' },
  { value: 'north_west', label: 'North-West' },
  { value: 'south_east', label: 'South-East' },
  { value: 'south_west', label: 'South-West' },
];

const approachRoadOptions = [
  { value: '', label: 'Select' },
  { value: 'black_top_road', label: 'Black Top Road' },
  { value: 'bitumen_road', label: 'Bitumen Road' },
  { value: 'cement_concrete_road', label: 'Cement Concrete Road' },
  { value: 'gravel_road', label: 'Gravel Road' },
  { value: 'sand_road', label: 'Sand Road' },
  { value: 'mud_road', label: 'Mud Road' },
  { value: 'others', label: 'Others' },
];

const accessOptions = [
  { value: '', label: 'Select' },
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
];

const PropertyValues = () => {
  const tabs = ["Institution Details", "Property", "Schedule", "Infrastructure", "Technical", "Property Market Value","Final Valuation", "Location", "Characteristics", "Photos"];
  const [activeTab, setActiveTab] = useState("Institution Details");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPropertyDetails, setShowPropertyDetails] = useState(false);
  const tabContentRef = useRef(null);

  useEffect(() => {
    if (tabContentRef.current) {
      gsap.fromTo(
        tabContentRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
      );
    }
  }, [activeTab]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleNext = () => {
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  };

  const updateField = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const updateTableRow = (section, index, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    }));
  };

  const addTableRow = (section, emptyRow) => {
    setFormData(prev => ({
      ...prev,
      [section]: [...prev[section], emptyRow],
    }));
  };

  const removeTableRow = (section, index) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index),
    }));
  };

  const updatePhoto = (id, updates) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.map(p => (p.id === id ? { ...p, ...updates } : p)),
    }));
  };

  const addPhotoRow = () => {
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, {
        id: Date.now(),
        file: null,
        preview: null,
        description: '',
        latitude: '',
        longitude: '',
        locality: '',
        region: '',
        bearing_degrees: '',
        bearing_direction: '',
        captured_at: '',
      }],
    }));
  };

  const removePhotoRow = (id) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.length > 1 ? prev.photos.filter(p => p.id !== id) : prev.photos,
    }));
  };

  const postSection = async (apiFn, id, sectionData) => {
    return apiFn(id, sanitizePayload(sectionData));
  };

  const fillSampleData = () => {
    setFormData(getSampleFormData());
    alert('Sample data loaded. Click Submit to test save & PDF.');
  };

  const clearForm = () => {
    setFormData(initialFormData);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const id = `val_${Date.now()}`;
      const payload = {
        id,
        _id: id,
        report_number: `KGN-2026-${id.slice(-4)}`,
        status: 'completed',
        institutionDetails: formData.institutionDetails,
        verifiedDocuments: formData.verifiedDocuments || [],
        propertyIdentification: formData.propertyIdentification,
        scheduleDetails: formData.scheduleDetails,
        infrastructureDetails: {
          ...formData.infrastructureDetails,
          roads_details: Array.from(
            {
              length: (() => {
                const r = parseInt(formData.infrastructureDetails?.number_of_roads, 10);
                return Number.isNaN(r) ? 1 : Math.max(0, Math.min(10, r));
              })(),
            },
            (_, idx) => {
              const roadNum = idx + 1;
              return {
                road_number: roadNum,
                type_of_access: roadNum === 1 ? formData.infrastructureDetails?.type_of_access : formData.infrastructureDetails?.[`type_of_access_${roadNum}`],
                road_direction: roadNum === 1 ? formData.infrastructureDetails?.road_direction : formData.infrastructureDetails?.[`road_direction_${roadNum}`],
                approach_road_type: roadNum === 1 ? formData.infrastructureDetails?.approach_road_type : formData.infrastructureDetails?.[`approach_road_type_${roadNum}`],
                other_approach_road_type: roadNum === 1 ? formData.infrastructureDetails?.other_approach_road_type : formData.infrastructureDetails?.[`other_approach_road_type_${roadNum}`],
                road_width_ft: roadNum === 1 ? formData.infrastructureDetails?.road_width_ft : formData.infrastructureDetails?.[`road_width_ft_${roadNum}`],
              };
            }
          ),
        },
        technicalDetails: formData.technicalDetails,
        finalValuation: formData.finalValuation,
        locationDetails: formData.locationDetails,
        propertyCharacteristics: formData.propertyCharacteristics,
        ndmaParameters: formData.ndmaParameters,
        landExtentValuations: formData.landExtentValuations
          .filter((row) => row.land_extent_sqft || row.cost_per_sqft || row.total_value)
          .map((row) => ({
            basis_of_valuation: row.basis_of_valuation,
            land_extent_sqft: parseNumber(row.land_extent_sqft),
            cost_per_sqft: parseNumber(row.cost_per_sqft),
            total_value: parseNumber(row.total_value),
          })),
        land_valuation_basis: formData.land_valuation_basis || 'as_per_documents',
        structureValuations: formData.structureValuations
          .filter((row) => row.area_sqft || row.cost_per_sqft || row.total_value)
          .map((row) => ({
            floor_details: row.floor_details,
            area_sqft: parseNumber(row.area_sqft),
            recommendation_of_funding: row.recommendation_of_funding,
            cost_per_sqft: parseNumber(row.cost_per_sqft),
            total_value: parseNumber(row.total_value),
          })),
        structure_valuation_basis: formData.structure_valuation_basis || 'as_per_actual',
        amenityValuations: formData.amenityValuations
          .filter((row) => row.amenity_name || row.amenity_value)
          .map((row) => ({
            amenity_name: row.amenity_name,
            amenity_value: parseNumber(row.amenity_value),
          })),
        photos: formData.photos.map((p) => ({
          description: p.description || '',
          latitude: roundCoord(p.latitude),
          longitude: roundCoord(p.longitude),
          locality: p.locality || '',
          region: p.region || '',
          photo: p.preview || '',
        })),
        signatures: formData.signatures || {},
      };

      // 1 single instant atomic save in MySQL (under 20ms)
      const valuation = await propertyValuationAPI.saveFullValuation(payload);
      const valId = valuation.id || valuation._id || id;

      // Download certified PDF immediately
      await propertyValuationAPI.generatePDF(valId);
      alert('Valuation report submitted and PDF downloaded successfully!');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(`Error submitting form: ${error.message || 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContextValue = {
    formData,
    setFormData,
    updateField,
    updateTableRow,
    addTableRow,
    removeTableRow,
    updatePhoto,
    addPhotoRow,
    removePhotoRow,
  };

  return (
    <FormContext.Provider value={formContextValue}>
    <div className={styles.layoutWrapper}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className={styles.rightSide}>
        <Header onMenuToggle={toggleSidebar} />

        <main className={styles.mainScrollArea}>
          <div className={styles.contentPadding}>
            {/* Navigation Tabs */}
            <div className={styles.tabsContainer}>
              {tabs.map((tab) => (
                <button 
                  key={tab} 
                  className={`${styles.tabBtn} ${activeTab === tab ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <button type="button" className={styles.blueBtn} onClick={fillSampleData}>
                Fill Sample Data
              </button>
              <button
                type="button"
                onClick={clearForm}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  padding: '8px 16px',
                  borderRadius: 'var(--border-radius)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9rem',
                }}
              >
                Clear Form
              </button>
            </div>

            <div ref={tabContentRef} style={{ width: '100%' }}>
            {/* TAB 1: INSTITUTION DETAILS */}
            {activeTab === "Institution Details" && (
              <>
                <h1 className={styles.pageTitle}>Institution Details</h1>
                <div className={styles.card}>
                  <div className={styles.formGrid}>
                    <InputGroup label="Financial Institution" placeholder="Financial Institution" section="institutionDetails" field="bank_name" />
                    <InputGroup label="Branch Name" placeholder="Branch Name" section="institutionDetails" field="branch_name" />
                    <InputGroup label="Valuer / Engineer / Institution Name" placeholder="Valuer/engineer/institution name" section="institutionDetails" field="vendor_engineer_institution_name" />
                    <InputGroup label="Contact Number" placeholder="Number" section="institutionDetails" field="vendor_contact_number" />
                    <InputGroup label="Site Engineer Name" placeholder="Site engineer name" section="institutionDetails" field="site_engineer_name" />
                    <InputGroup label="Contact Number" placeholder="Number" section="institutionDetails" field="site_engineer_contact_number" />
                  </div>
                </div>

                <h2 className={styles.sectionHeading}>Basic Details</h2>
                <p className={styles.subHeading}>Loan Application Details</p>

                <div className={styles.card}>
                  <div className={styles.formGrid}>
                    <InputGroup label="Loan Application ID" placeholder="Loan Application ID" section="institutionDetails" field="loan_application_id" />
                    <InputGroup label="Product / Loan Type" placeholder="Product / Loan Type" section="institutionDetails" field="product_loan_type" />
                    <InputGroup label="Applicant Name" placeholder="Applicant Name" section="institutionDetails" field="applicant_name" />
                    <InputGroup label="Contact Number" placeholder="Number" section="institutionDetails" field="applicant_contact_number" />
                    <InputGroup label="Property Owner / Document Holder Name" placeholder="Property Owner / Document Holder Name" section="institutionDetails" field="property_owner_name" />
                    <InputGroup label="Contact Number" placeholder="Number" section="institutionDetails" field="property_owner_contact_number" />
                    <InputGroup label="Person Met At Site" placeholder="Person Met At Site" section="institutionDetails" field="person_met_at_site" />
                    <InputGroup label="Contact Number" placeholder="Number" section="institutionDetails" field="person_met_contact_number" />
                    <InputGroup label="Relationship With Applicant" placeholder="Relationship With Applicant" section="institutionDetails" field="relationship_with_applicant" />
                    
                    <div>
                      <label className={styles.label}>Property Holding Type</label>
                      <div className={styles.radioGroup}>
                        <Radio label="Free Hold" name="holding" value="freehold" section="institutionDetails" field="property_holding_type" />
                        <Radio label="Lease Hold" name="holding" value="lease_hold" section="institutionDetails" field="property_holding_type" />
                        <Radio label="Mortgaged" name="holding" value="mortgaged" section="institutionDetails" field="property_holding_type" />
                        <Radio label="Development Authority" name="holding" value="development_authority" section="institutionDetails" field="property_holding_type" />
                      </div>
                    </div>

                    <div>
                      <label className={styles.label}>Property Type</label>
                      <div className={styles.radioGroup}>
                        <Radio label="Vacant Land" name="type" value="vacant_land" section="institutionDetails" field="property_type" />
                        <Radio label="Residential" name="type" value="residential" section="institutionDetails" field="property_type" />
                        <Radio label="Commercial" name="type" value="commercial" section="institutionDetails" field="property_type" />
                        <Radio label="Institutional" name="type" value="institutional" section="institutionDetails" field="property_type" />
                        <Radio label="Industrial" name="type" value="industrial" section="institutionDetails" field="property_type" />
                        <Radio label="Mixed" name="type" value="mixed" section="institutionDetails" field="property_type" />
                        <Radio label="Others" name="type" value="others" section="institutionDetails" field="property_type" />
                      </div>
                      {formData.institutionDetails?.property_type === 'others' && (
                        <div style={{ marginTop: '14px', width: '100%', maxWidth: '400px' }}>
                          <InputGroup 
                            label="Specify Property Type" 
                            placeholder="Enter property type manually" 
                            section="institutionDetails" 
                            field="other_property_type" 
                          />
                        </div>
                      )}
                    </div>

                    <InputGroup label="Property Sub Type" placeholder="Property Sub Type" section="institutionDetails" field="property_sub_type" />
                    <InputGroup label="Date Of Inspection" placeholder="Date Of Inspection" isDate section="institutionDetails" field="date_of_inspection" />
                    <InputGroup label="Date Of Report" placeholder="Date Of Report" isDate section="institutionDetails" field="date_of_report" />
                  </div>
                </div>

                <h2 className={styles.sectionHeading}>Verified Documents:</h2>
                {(formData.verifiedDocuments && formData.verifiedDocuments.length > 0
                  ? formData.verifiedDocuments
                  : [{ type_of_document: '', document_number: '', execution_date: '', expiry_date: '', in_favour_of: '', approval_authority: '' }]
                ).map((doc, idx) => (
                  <div key={idx} className={styles.card} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-primary, #C9A84C)' }}>
                        Document #{idx + 1}
                      </span>
                      {(formData.verifiedDocuments?.length > 1) && (
                        <button
                          type="button"
                          onClick={() => removeTableRow('verifiedDocuments', idx)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.82rem',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontWeight: 500,
                          }}
                          title="Remove Document"
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      )}
                    </div>
                    <div className={styles.formGrid}>
                      <div className={styles.inputStack}>
                        <label className={styles.label}>Type of Document</label>
                        <div className={styles.fieldWrapper}>
                          <input
                            type="text"
                            placeholder="Enter Document Name (e.g. Sale Deed, Patta, EC)"
                            className={styles.inputField}
                            value={doc.type_of_document || ''}
                            onChange={(e) => {
                              updateTableRow('verifiedDocuments', idx, 'type_of_document', e.target.value);
                              if (idx === 0) updateField('institutionDetails', 'type_of_document', e.target.value);
                            }}
                          />
                        </div>
                      </div>

                      <div className={styles.inputStack}>
                        <label className={styles.label}>Document Number</label>
                        <div className={styles.fieldWrapper}>
                          <input
                            type="text"
                            placeholder="Enter Document Number"
                            className={styles.inputField}
                            value={doc.document_number || ''}
                            onChange={(e) => {
                              updateTableRow('verifiedDocuments', idx, 'document_number', e.target.value);
                              if (idx === 0) updateField('institutionDetails', 'document_number', e.target.value);
                            }}
                          />
                        </div>
                      </div>

                      <div className={styles.inputStack}>
                        <label className={styles.label}>Execution Date</label>
                        <div className={styles.fieldWrapper}>
                          <input
                            type="date"
                            placeholder="dd-mm-yyyy"
                            className={styles.inputField}
                            value={doc.execution_date || ''}
                            onChange={(e) => {
                              updateTableRow('verifiedDocuments', idx, 'execution_date', e.target.value);
                              if (idx === 0) updateField('institutionDetails', 'execution_date', e.target.value);
                            }}
                          />
                        </div>
                      </div>

                      <div className={styles.inputStack}>
                        <label className={styles.label}>Expiry Date</label>
                        <div className={styles.fieldWrapper}>
                          <input
                            type="date"
                            placeholder="dd-mm-yyyy"
                            className={styles.inputField}
                            value={doc.expiry_date || ''}
                            onChange={(e) => {
                              updateTableRow('verifiedDocuments', idx, 'expiry_date', e.target.value);
                              if (idx === 0) updateField('institutionDetails', 'expiry_date', e.target.value);
                            }}
                          />
                        </div>
                      </div>

                      <div className={styles.inputStack}>
                        <label className={styles.label}>In Favour Of</label>
                        <div className={styles.fieldWrapper}>
                          <input
                            type="text"
                            placeholder="In Favour Of"
                            className={styles.inputField}
                            value={doc.in_favour_of || ''}
                            onChange={(e) => {
                              updateTableRow('verifiedDocuments', idx, 'in_favour_of', e.target.value);
                              if (idx === 0) updateField('institutionDetails', 'in_favour_of', e.target.value);
                            }}
                          />
                        </div>
                      </div>

                      <div className={styles.inputStack}>
                        <label className={styles.label}>Approval Authority</label>
                        <div className={styles.fieldWrapper}>
                          <input
                            type="text"
                            placeholder="Enter Approval Authority"
                            className={styles.inputField}
                            value={doc.approval_authority || ''}
                            onChange={(e) => {
                              updateTableRow('verifiedDocuments', idx, 'approval_authority', e.target.value);
                              if (idx === 0) updateField('institutionDetails', 'approval_authority', e.target.value);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px', paddingBottom: '30px' }}>
                  <div style={{ alignSelf: 'flex-start' }}>
                    <button
                      type="button"
                      className={styles.blueBtn}
                      onClick={() => addTableRow('verifiedDocuments', {
                        type_of_document: '',
                        document_number: '',
                        execution_date: '',
                        expiry_date: '',
                        in_favour_of: '',
                        approval_authority: '',
                      })}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    >
                      <Plus size={16} /> Add Document
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                    <button className={styles.nextBtn} onClick={handleNext}>Next <ChevronRight size={20} /></button>
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: PROPERTY */}
            {activeTab === "Property" && (
              <>
                <h1 className={styles.pageTitle}>Property Identification Details</h1>
                <div className={styles.formBody}>
                  <div className={styles.card}>
                    <div className={styles.formGrid}>
                      <InputGroup label="Address (As per Documents)" placeholder="Address (As per Documents)" section="propertyIdentification" field="address_as_per_documents" fullWidth />
                      <div></div>
                      <InputGroup label="Address As Per Actual Site" placeholder="Address As Per Actual Site" section="propertyIdentification" field="address_as_per_actual_site" fullWidth />
                      <div></div>
                      <InputGroup label="Address As Per Plan" placeholder="Address As Per Plan" section="propertyIdentification" field="address_as_per_plan" fullWidth />
                      <div></div>
                    </div>
                  </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-8px', marginBottom: '12px', paddingRight: '4px' }}>
                      <button
                        type="button"
                        onClick={() => setShowPropertyDetails(prev => !prev)}
                        title={showPropertyDetails ? 'Collapse' : 'Add more property details'}
                        style={{
                          background: showPropertyDetails ? 'rgba(201,168,76,0.18)' : 'rgba(201,168,76,0.09)',
                          border: '2px solid #C9A84C',
                          color: '#C9A84C',
                          borderRadius: '50%',
                          width: '36px',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '1.5rem',
                          fontWeight: '700',
                          lineHeight: 1,
                          transition: 'all 0.2s ease',
                          flexShrink: 0,
                        }}
                      >
                        {showPropertyDetails ? '\u2212' : '+'}
                      </button>
                    </div>

                  {showPropertyDetails && (
                    <div className={styles.card}>
                      <div className={styles.formGrid}>
                        <InputGroup label="Survey Number" placeholder="Enter" section="propertyIdentification" field="survey_number" />
                        <InputGroup label="Plot No / Flat No" placeholder="Enter" section="propertyIdentification" field="plot_no_flat_no" />
                        <InputGroup label="LPM / Approval No" placeholder="Enter" section="propertyIdentification" field="lpm_approval_no" />
                        <InputGroup label="Door No" placeholder="Enter" section="propertyIdentification" field="door_no" />
                        <InputGroup label="Assessment No" placeholder="Enter" section="propertyIdentification" field="assessment_no" />
                        <InputGroup label="Landmark" placeholder="Enter" section="propertyIdentification" field="landmark" />
                        <InputGroup label="Locality Name" placeholder="Enter" section="propertyIdentification" field="locality_name" />
                        <InputGroup label="Grama Polam" placeholder="Enter" section="propertyIdentification" field="grama_polam" />
                        <InputGroup label="Jurisdiction" placeholder="Enter" section="propertyIdentification" field="jurisdiction" />
                        <InputGroup label="Taluka" placeholder="Enter" section="propertyIdentification" field="taluka" />
                        <InputGroup label="Mandal" placeholder="Enter" section="propertyIdentification" field="mandal" />
                        <InputGroup label="District" placeholder="Enter" section="propertyIdentification" field="district" />
                        <SelectField
                          label="State"
                          section="propertyIdentification"
                          field="state"
                          options={[
                            { value: '', label: 'Select' },
                            { value: 'Tamil Nadu', label: 'Tamil Nadu' },
                            { value: 'Karnataka', label: 'Karnataka' },
                            { value: 'Kerala', label: 'Kerala' },
                            { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
                          ]}
                        />
                        <InputGroup label="Pincode" placeholder="Enter" section="propertyIdentification" field="pincode" />
                      </div>
                    </div>
                  )}

                  <h2 className={styles.sectionHeading}>Approval Details</h2>
                  <div className={styles.card}>
                    <div className={styles.radioList}>
                      <RadioYesNo label="Layout Plan Available?" section="propertyIdentification" field="layout_plan_available" />
                      <RadioYesNo label="Construction Plan Available?" section="propertyIdentification" field="construction_plan_available" />
                      <RadioYesNo label="Plan Validity" section="propertyIdentification" field="plan_validity" />
                      <InputGroup label="Approving Authority" placeholder="Enter authority" section="propertyIdentification" field="approving_authority" />

                    </div>
                  </div>

                  <div className={styles.footerActions}>
                    <button className={styles.nextBtn} onClick={handleNext}>Next <ChevronRight size={18} /></button>
                  </div>
                </div>
              </>
            )}

            {/* TAB 3: SCHEDULE */}
            {activeTab === "Schedule" && (
              <>
                <h1 className={styles.pageTitle}>Schedule Details</h1>
                <div className={styles.card}>
                <BoundaryTable />
                </div>

                <h2 className={styles.sectionHeading} style={{ fontSize: '1.5rem', marginTop: '10px', marginBottom: '20px' }}>Construction Details</h2>
                <div className={styles.card}>
                  <div className={styles.formGrid}>
                    <SelectField label="Construction Type" section="scheduleDetails" field="construction_type" options={[{ value: '', label: 'Select' }, { value: 'framed', label: 'Framed' }, { value: 'load_bearing', label: 'Load Bearing' }, { value: 'timber_wooden', label: 'Timber / Wooden' }, { value: 'stone', label: 'Stone' }, { value: 'others', label: 'Others' }]} />
                    {formData.scheduleDetails?.construction_type === 'others' && (
                      <div className={styles.inputStack}>
                        <label className={styles.label}>Construction Type (Others)</label>
                        <div className={styles.fieldWrapper}>
                          <input
                            type="text"
                            placeholder="Please specify construction type"
                            className={styles.inputField}
                            value={formData.scheduleDetails?.other_construction_type || ''}
                            onChange={(e) => updateField('scheduleDetails', 'other_construction_type', e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                    <SelectField label="Roof Type" section="scheduleDetails" field="roof_type" options={[{ value: '', label: 'Select' }, { value: 'flat', label: 'Flat' }, { value: 'sloped', label: 'Sloped' }, { value: 'rcc_roof', label: 'RCC Roof' }, { value: 'iron_mtr', label: 'Iron Mtr' }, { value: 'wooden_mtr', label: 'Wooden Mtr' }, { value: 'cc_mtr', label: 'CC Mtr' }, { value: 'acc_shed', label: 'ACC Shed' }, { value: 'gi_sheets', label: 'GI Sheets' }, { value: 'others', label: 'Others' }]} />
                    {formData.scheduleDetails?.roof_type === 'others' && (
                      <div className={styles.inputStack}>
                        <label className={styles.label}>Roof Type (Others)</label>
                        <div className={styles.fieldWrapper}>
                          <input
                            type="text"
                            placeholder="Please specify roof type"
                            className={styles.inputField}
                            value={formData.scheduleDetails?.other_roof_type || ''}
                            onChange={(e) => updateField('scheduleDetails', 'other_roof_type', e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                    <SelectField label="Flooring Type" section="scheduleDetails" field="flooring_type" options={[{ value: '', label: 'Select' }, { value: 'granite', label: 'Granite' }, { value: 'marble', label: 'Marble' }, { value: 'vertified_tiles', label: 'Vertified Tiles' }, { value: 'ceramic_tiles', label: 'Ceramic Tiles' }, { value: 'tiles', label: 'Tiles' }, { value: 'concrete_flooring', label: 'Concrete Flooring' }, { value: 'emanuel_flooring', label: 'Emanuel Flooring' }, { value: 'others', label: 'Others' }]} />
                    {formData.scheduleDetails?.flooring_type === 'others' && (
                      <div className={styles.inputStack}>
                        <label className={styles.label}>Flooring Type (Others)</label>
                        <div className={styles.fieldWrapper}>
                          <input
                            type="text"
                            placeholder="Please specify flooring type"
                            className={styles.inputField}
                            value={formData.scheduleDetails?.other_flooring_type || ''}
                            onChange={(e) => updateField('scheduleDetails', 'other_flooring_type', e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                    <SelectField label="Stair Type" section="scheduleDetails" field="stair_type" options={[{ value: '', label: 'Select' }, { value: 'cast_in_situ', label: 'Cast-in-situ' }, { value: 'metal', label: 'Metal' }, { value: 'cast_in_situ_metal', label: 'Cast-in-situ Metal' }, { value: 'stones', label: 'Stones' }, { value: 'timber', label: 'Timber' }, { value: 'glass', label: 'Glass' }, { value: 'not_applicable', label: 'Not Applicable' }, { value: 'others', label: 'Others' }]} />
                    {formData.scheduleDetails?.stair_type === 'others' && (
                      <div className={styles.inputStack}>
                        <label className={styles.label}>Stair Type (Others)</label>
                        <div className={styles.fieldWrapper}>
                          <input
                            type="text"
                            placeholder="Please specify stair type"
                            className={styles.inputField}
                            value={formData.scheduleDetails?.other_stair_type || ''}
                            onChange={(e) => updateField('scheduleDetails', 'other_stair_type', e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                    <InputGroup label="No. of Floors Approved" placeholder="Enter" section="scheduleDetails" field="no_of_floors_approved" />
                    <InputGroup label="No. of Floors Existing" placeholder="Enter" section="scheduleDetails" field="no_of_floors_existing" />
                    <SelectField label="Construction Quality" section="scheduleDetails" field="construction_quality" options={[{ value: '', label: 'Select' }, { value: 'Excellent', label: 'Excellent' }, { value: 'Good', label: 'Good' }, { value: 'Average', label: 'Average' }, { value: 'Poor', label: 'Poor' }]} />
                    <SelectField label="Maintenance of Property" section="scheduleDetails" field="maintenance_of_property" options={[{ value: '', label: 'Select' }, { value: 'Excellent', label: 'Excellent' }, { value: 'Good', label: 'Good' }, { value: 'Average', label: 'Average' }, { value: 'Poor', label: 'Poor' }]} />
                  </div>
                </div>

                <div className={styles.card} style={{ marginTop: '20px' }}>
                  <div className={styles.formGrid}>
                    <SelectField label="Occupancy Status" section="scheduleDetails" field="occupancy_status" options={[{ value: '', label: 'Select' }, { value: 'fully_occupied', label: 'Fully Occupied' }, { value: 'partly_occupied', label: 'Partly Occupied' }, { value: 'occupied', label: 'Occupied' }, { value: 'vacant', label: 'Vacant' }]} />
                    <InputGroup label="Occupant Details" placeholder="Input / Textarea" section="scheduleDetails" field="occupant_details" />
                    <SelectField
                      label="Class of Locality"
                      section="scheduleDetails"
                      field="class_of_locality"
                      options={[
                        { value: '', label: 'Select' },
                        { value: 'Prime', label: 'Prime' },
                        { value: 'High', label: 'High' },
                        { value: 'Middle', label: 'Middle' },
                        { value: 'Low', label: 'Low' },
                        { value: 'others', label: 'Others' },
                      ]}
                    />
                    {(formData.scheduleDetails?.class_of_locality === 'others' ||
                      formData.scheduleDetails?.class_of_locality === 'Others' ||
                      (Boolean(formData.scheduleDetails?.class_of_locality) &&
                        !['prime', 'high', 'middle', 'low', ''].some((k) =>
                          String(formData.scheduleDetails?.class_of_locality).toLowerCase().includes(k)
                        ))) && (
                      <div className={styles.inputStack}>
                        <label className={styles.label}>Class of Locality (Others)</label>
                        <div className={styles.fieldWrapper}>
                          <input
                            type="text"
                            placeholder="Please specify class of locality"
                            className={styles.inputField}
                            value={
                              formData.scheduleDetails?.other_class_of_locality ||
                              (!['others', 'Others'].includes(formData.scheduleDetails?.class_of_locality)
                                ? formData.scheduleDetails?.class_of_locality || ''
                                : '')
                            }
                            onChange={(e) => updateField('scheduleDetails', 'other_class_of_locality', e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                    <InputGroup label="Number of Floors Valued" placeholder="Enter" section="scheduleDetails" field="number_of_floors" />
                  </div>
                </div>

                <div className={styles.footerActions}>
                  <button className={styles.nextBtn} onClick={handleNext}>Next <ChevronRight size={18} /></button>
                </div>
              </>
            )}

            {/* TAB 4: INFRASTRUCTURE */}
            {activeTab === "Infrastructure" && (
              <>
                <h1 className={styles.pageTitle}>Infrastructure Details</h1>
                <div className={styles.card}>
                  <div className={styles.formGrid}>
                    <div className={styles.inputStack}><RadioYesNo label="Land Locked" section="infrastructureDetails" field="land_locked" /></div>
                    <div></div>
                    <InputGroup label="Description" placeholder="Enter" section="infrastructureDetails" field="land_locked_description" fullWidth />
                    <InputGroup label="Number of Roads" placeholder="Enter" section="infrastructureDetails" field="number_of_roads" />
                    <div></div>

                    {(() => {
                      const rawRoads = formData.infrastructureDetails?.number_of_roads;
                      const parsedRoads = parseInt(rawRoads, 10);
                      const totalRoads = (rawRoads === '0' || parsedRoads === 0)
                        ? 0
                        : (Number.isNaN(parsedRoads) ? 1 : Math.max(1, Math.min(10, parsedRoads)));

                      return Array.from({ length: totalRoads }, (_, idx) => {
                        const roadNum = idx + 1;
                        const accessField = roadNum === 1 ? 'type_of_access' : `type_of_access_${roadNum}`;
                        const dirField = roadNum === 1 ? 'road_direction' : `road_direction_${roadNum}`;
                        const approachField = roadNum === 1 ? 'approach_road_type' : `approach_road_type_${roadNum}`;
                        const otherApproachField = roadNum === 1 ? 'other_approach_road_type' : `other_approach_road_type_${roadNum}`;
                        const widthField = roadNum === 1 ? 'road_width_ft' : `road_width_ft_${roadNum}`;
                        const isOther = formData.infrastructureDetails?.[approachField] === 'others';

                        return (
                          <React.Fragment key={roadNum}>
                            {totalRoads > 1 && (
                              <div
                                className={styles.fullWidth}
                                style={{
                                  marginTop: idx === 0 ? '5px' : '15px',
                                  marginBottom: '5px',
                                  padding: '8px 12px',
                                  background: 'rgba(201, 168, 76, 0.08)',
                                  borderLeft: '3px solid var(--primary-gold, #C9A84C)',
                                  borderRadius: '4px',
                                  fontWeight: '600',
                                  fontSize: '0.9rem',
                                  color: 'var(--text-primary)',
                                }}
                              >
                                Road {roadNum} Details
                              </div>
                            )}
                            <SelectField
                              label={totalRoads > 1 ? `Type of Access (Road ${roadNum})` : "Type of Access"}
                              section="infrastructureDetails"
                              field={accessField}
                              options={accessOptions}
                            />
                            <SelectField
                              label={totalRoads > 1 ? `Direction (Road ${roadNum})` : "Direction"}
                              section="infrastructureDetails"
                              field={dirField}
                              options={directionOptions}
                            />
                            <SelectField
                              label={totalRoads > 1 ? `Approach Road Type to Property (Road ${roadNum})` : "Approach Road Type to Property"}
                              section="infrastructureDetails"
                              field={approachField}
                              options={approachRoadOptions}
                            />
                            <InputGroup
                              label={totalRoads > 1 ? `Road Width (ft) (Road ${roadNum})` : "Road Width (ft)"}
                              placeholder="Enter"
                              section="infrastructureDetails"
                              field={widthField}
                            />
                            {isOther && (
                              <div className={`${styles.inputStack} ${styles.fullWidth}`}>
                                <label className={styles.label}>
                                  Approach Road Type to Property (Others{totalRoads > 1 ? ` - Road ${roadNum}` : ''})
                                </label>
                                <div className={styles.fieldWrapper}>
                                  <input
                                    type="text"
                                    placeholder="Please specify approach road type"
                                    className={styles.inputField}
                                    value={formData.infrastructureDetails?.[otherApproachField] || ''}
                                    onChange={(e) => updateField('infrastructureDetails', otherApproachField, e.target.value)}
                                  />
                                </div>
                              </div>
                            )}
                          </React.Fragment>
                        );
                      });
                    })()}

                    <InputGroup label="Number of Lifts" placeholder="Enter" section="infrastructureDetails" field="number_of_lifts" />
                    <div className={styles.inputStack}><RadioYesNo label="Electricity" section="infrastructureDetails" field="electricity" /></div>
                    <div className={styles.inputStack}><RadioYesNo label="Water" section="infrastructureDetails" field="water" /></div>
                    <div className={styles.inputStack}><RadioYesNo label="Drainage Connection" section="infrastructureDetails" field="drainage_connection" /></div>
                  </div>
                </div>
                <div className={styles.footerActions}>
                  <button className={styles.nextBtn} onClick={handleNext}>Next <ChevronRight size={18} /></button>
                </div>
              </>
            )}

            {/* TAB 5: TECHNICAL */}
            {activeTab === "Technical" && (
              <>
                <h1 className={styles.pageTitle}>Technical Details</h1>
                <BuildingSpecificationsSection />
                <MeasurementMatchingCard
                  title="Land Measurements & Matching Status"
                  sectionKey="landMeasurements"
                  showNoteBox={true}
                  noteLabel="Note : Apartment case (just reflection)"
                />

                <MeasurementMatchingCard
                  title="Building Measurements & Matching Status"
                  sectionKey="buildingMeasurements"
                  showNoteBox={true}
                  noteLabel="Description"
                />
                <div className={styles.card}>
                  <h2 className={styles.sectionHeading}>Technical Remarks</h2>
                  <TextAreaField label="Technical Assessment" section="technicalDetails" field="technical_assessment" placeholder="Enter technical assessment details" />
                </div>
                <div className={styles.footerActions}>
                  <button className={styles.nextBtn} onClick={handleNext}>Next <ChevronRight size={18} /></button>
                </div>
              </>
            )}

            {/* TAB 6: PROPERTY MARKET VALUE */}
            {activeTab === "Property Market Value" && (
              <>
                <h1 className={styles.pageTitle} style={{ marginBottom: '5px' }}>Property Market Value Assessment</h1>
                <p className={styles.subHeading} style={{ marginBottom: '20px' }}>Land Extent Valuation:</p>
                <div className={styles.card} style={{ padding: '20px', marginBottom: '40px' }}>
                  <LandExtentTable />
                  <h2 className={styles.sectionHeading} style={{ fontSize: '1.2rem', marginTop: '10px', marginBottom: '14px' }}>Structure Valuation:</h2>
                  <StructureValuationTable />
                  <h2 className={styles.sectionHeading} style={{ fontSize: '1.2rem', marginTop: '10px', marginBottom: '15px' }}>Amenities Valuation:</h2>
                  <AmenitiesTable />
                </div>

                <h1 className={styles.pageTitle} style={{ marginBottom: '5px', marginTop: '40px' }}>Property Guideline Value Assessment:</h1>
                <p className={styles.subHeading} style={{ marginBottom: '20px' }}>Land Extent Valuation:</p>
                <div className={styles.card} style={{ padding: '20px' }}>
                  <LandExtentTable />
                  <h2 className={styles.sectionHeading} style={{ fontSize: '1.2rem', marginTop: '10px', marginBottom: '15px' }}>Amenities Valuation:</h2>
                  <AmenitiesTable />
                </div>
                <div className={styles.footerActions}>
                  <button className={styles.nextBtn} onClick={handleNext}>Next <ChevronRight size={18} /></button>
                </div>
              </>
            )}

            {/* TAB 7: FINAL VALUATION */}
            {activeTab === "Final Valuation" && (
              <>
                <h1 className={styles.pageTitle}>Final Valuation</h1>

                <div className={styles.card}>
                  <h2 className={styles.sectionHeading}>Final Values</h2>
                  <div className={styles.formGrid}>
                    <InputGroup label="Final Market Value" placeholder="Enter" type="number" section="finalValuation" field="final_market_value" />
                    <InputGroup label="Final Guideline Value" placeholder="Enter" type="number" section="finalValuation" field="final_guideline_value" />
                    <InputGroup label="Distress Value" placeholder="Enter" type="number" section="finalValuation" field="distress_value" />
                    <InputGroup label="Forced Sale Value" placeholder="Enter" type="number" section="finalValuation" field="forced_sale_value" />
                    <InputGroup label="Replacement Cost" placeholder="Enter" type="number" section="finalValuation" field="replacement_cost" />
                    <InputGroup label="Depreciated Cost" placeholder="Enter" type="number" section="finalValuation" field="depreciated_cost" />
                  </div>
                </div>

                <div className={styles.card}>
                  <h2 className={styles.sectionHeading}>Engineer Details</h2>
                  <EngineerDetailsFields />
                </div>

                <div className={styles.footerActions}>
                  <button className={styles.nextBtn} onClick={handleNext}>Next <ChevronRight size={18} /></button>
                </div>
              </>
            )}

            {/* TAB 8: LOCATION */}
            {activeTab === "Location" && (
              <>
                <h1 className={styles.pageTitle}>Location Details</h1>
                <div className={styles.card}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                    <h2 className={styles.sectionHeading} style={{ margin: 0 }}>Gps Co-Ordinates:</h2>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined' && navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            (pos) => {
                              updateField('locationDetails', 'latitude', String(pos.coords.latitude));
                              updateField('locationDetails', 'longitude', String(pos.coords.longitude));
                            },
                            (err) => {
                              console.warn('Geolocation error:', err);
                              alert('Unable to retrieve location automatically. Please enter coordinates manually.');
                            },
                            { enableHighAccuracy: true, timeout: 10000 }
                          );
                        } else {
                          alert('Geolocation is not supported by your browser.');
                        }
                      }}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: '#60a5fa',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                      title="Fetch device GPS coordinates"
                    >
                      <span>📍 Get Current Location</span>
                    </button>
                  </div>
                  <div className={styles.formGrid}>
                    <InputGroup label="Latitude" placeholder="Enter Latitude" section="locationDetails" field="latitude" />
                    <InputGroup label="Longitude" placeholder="Enter Longitude" section="locationDetails" field="longitude" />
                  </div>
                  <h2 className={styles.sectionHeading} style={{ marginTop: '20px' }}>Manual Gps Co-Ordinates:</h2>
                  <div className={styles.formGrid}>
                    <InputGroup label="Latitude" placeholder="Enter Latitude" section="locationDetails" field="manual_latitude" />
                    <InputGroup label="Longitude" placeholder="Enter Longitude" section="locationDetails" field="manual_longitude" />
                  </div>
                </div>
                <div className={styles.footerActions}>
                  <button className={styles.nextBtn} onClick={handleNext}>Next <ChevronRight size={18} /></button>
                </div>
              </>
            )}

            {/* ---------------------------------------------------
                TAB 9: CHARACTERISTICS (UPDATED)
            --------------------------------------------------- */}
            {activeTab === "Characteristics" && (
              <>
                <h1 className={styles.pageTitle}>Characteristics of Property Specifications</h1>
                <div className={styles.card}>
                  <h2 className={styles.sectionHeading} style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Property Characteristics</h2>
                  <div className={styles.formGrid}>
                    <InputGroup label="Joint Wall – Direction" placeholder="Enter" section="propertyCharacteristics" field="joint_wall_direction" />
                    <InputGroup label="Joint Slab – Direction" placeholder="Enter" section="propertyCharacteristics" field="joint_slab_direction" />
                    <InputGroup label="FSI" placeholder="Enter" section="propertyCharacteristics" field="fsi" />
                    <InputGroup label="Nearest Railway Station (Km)" placeholder="Enter" section="propertyCharacteristics" field="nearest_railway_station_km" />
                    <InputGroup label="Nearest Bus Station (Km)" placeholder="Enter" section="propertyCharacteristics" field="nearest_bus_station_km" />
                    <InputGroup label="Nearest Connecting Road (Km)" placeholder="Enter" section="propertyCharacteristics" field="nearest_connecting_road_km" />
                    <InputGroup label="Distance From City Centre" placeholder="Enter (Km)" section="propertyCharacteristics" field="distance_from_city_centre_km" />
                    <InputGroup label="Distance From Branch" placeholder="Enter (Km)" section="propertyCharacteristics" field="distance_from_branch_km" />
                    <SelectField label="Valuation Methodology" section="propertyCharacteristics" field="valuation_methodology" options={[{ value: '', label: 'Select' }, { value: 'market', label: 'Market Comparison' }, { value: 'income', label: 'Income Approach' }, { value: 'cost', label: 'Cost Approach' }]} />
                    <SelectField label="Risk Of Demolition" section="propertyCharacteristics" field="risk_of_demolition" options={[{ value: '', label: 'Select' }, { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} />
                    <RadioYesNo label="Negative Area As Per Local" section="propertyCharacteristics" field="negative_area_as_per_local" />
                    <SelectField label="Development Of Vicinity/Surroundings" section="propertyCharacteristics" field="development_of_vicinity" options={[{ value: '', label: 'Select' }, { value: 'developing', label: 'Developing' }, { value: 'developed', label: 'Fully Developed' }, { value: 'underdeveloped', label: 'Underdeveloped' }]} />
                    <InputGroup label="Habitation Around The Property (%)" placeholder="Enter %" section="propertyCharacteristics" field="habitation_around_property_percent" />
                    <SelectField label="Availability of Local Transport" section="propertyCharacteristics" field="availability_of_local_transport" options={[{ value: '', label: 'Select' }, { value: 'good', label: 'Good' }, { value: 'average', label: 'Average' }, { value: 'poor', label: 'Poor' }]} />
                    <SelectField label="Level of Land with Topographical Conditions" section="propertyCharacteristics" field="level_of_land" options={[{ value: '', label: 'Select' }, { value: 'flat', label: 'Flat' }, { value: 'sloped', label: 'Sloped' }, { value: 'hilly', label: 'Hilly' }, { value: 'undulating', label: 'Undulating' }]} />
                    <InputGroup label="Setback Deviation (%)" placeholder="Enter %" section="propertyCharacteristics" field="setback_deviation_percent" />
                    <InputGroup label="Vertical Deviation" placeholder="Enter" section="propertyCharacteristics" field="vertical_deviation" />
                    <RadioYesNo label="Structure Confirming to Safety (Load Resistance)" section="propertyCharacteristics" field="structure_confirming_to_safety" />
                  </div>

                  <h2 className={styles.sectionHeading} style={{ fontSize: '1.2rem', marginTop: '25px', marginBottom: '15px' }}>NDMA Parameters</h2>
                  <div className={styles.formGrid}>
                    <InputGroup label="Nature of Building / Wing" placeholder="Enter" section="ndmaParameters" field="nature_of_building" />
                    <SelectField label="Shape of Building" section="ndmaParameters" field="shape_of_building" options={[{ value: '', label: 'Select' }, { value: 'regular', label: 'Regular' }, { value: 'irregular', label: 'Irregular' }, { value: 'l-shape', label: 'L-Shape' }, { value: 't-shape', label: 'T-Shape' }]} />
                    <InputGroup label="Concrete Grade" placeholder="e.g. M-20" section="ndmaParameters" field="concrete_grade" />
                    <SelectField label="Roof Type" section="ndmaParameters" field="roof_type" options={[{ value: '', label: 'Select' }, { value: 'mtr', label: 'MTR' }, { value: 'flat', label: 'Flat RCC' }, { value: 'sloped', label: 'Sloped' }, { value: 'sheet', label: 'Sheet' }]} />
                    <SelectField label="Soil Strata" section="ndmaParameters" field="soil_strata" options={[{ value: '', label: 'Select' }, { value: 'hard', label: 'Hard' }, { value: 'medium', label: 'Medium' }, { value: 'soft', label: 'Soft' }]} />
                    <SelectField label="Seismic Zone" section="ndmaParameters" field="seismic_zone" options={[{ value: '', label: 'Select' }, { value: 'zone2', label: 'Zone II' }, { value: 'zone3', label: 'Zone III' }, { value: 'zone4', label: 'Zone IV' }, { value: 'zone5', label: 'Zone V' }]} />
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <TextAreaField label="Others Remarks" section="propertyCharacteristics" field="others_remarks" placeholder="Enter any other remarks" rows={3} />
                  </div>
                </div>

                <div className={styles.footerActions}>
                  <button className={styles.nextBtn} onClick={handleNext}>Next <ChevronRight size={18} /></button>
                </div>
              </>
            )}

            {/* TAB 10: PHOTOS */}
            {activeTab === "Photos" && (
              <>
                <h1 className={styles.pageTitle}>Photo Graphs</h1>

                {/* Photo Upload with Description Box per Photo */}
                <div className={styles.card}>

                  <PhotoUploadList />
                </div>

                {/* Print / Draw Tab */}
                <div className={styles.card}>
                  <h2 className={styles.sectionHeading}>Print Tab</h2>
                  <p className={styles.subHeading} style={{ marginBottom: '12px' }}>To Draw Any Thing With Hand</p>
                  <div className={styles.drawingCanvasWrapper}>
                    <DrawingCanvas />
                  </div>
                </div>

                {/* Remarks */}
                <div className={styles.card}>
                  <h2 className={styles.sectionHeading}>Remarks</h2>
                  <textarea
                    className={styles.textarea}
                    placeholder="Enter remarks here..."
                    rows="4"
                    style={{ width: '100%' }}
                  ></textarea>
                </div>

                {/* Signatures */}
                <div className={styles.card}>
                  <h2 className={styles.sectionHeading}>Signatures</h2>
                  <div className={styles.formGrid}>
                    <SignatureField label="Signature Of Inspector" section="signatures" field="signature_inspector" />
                    <SignatureField label="Signature Of Engineer" section="signatures" field="signature_engineer" />
                    <SignatureField label="Signature Of Institution" section="signatures" field="signature_institution" />
                  </div>
                </div>

                {/* Final Value Chart */}
                <div className={styles.card}>
                  <h2 className={styles.sectionHeading}>Final Value Chart</h2>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '10px' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600', paddingBottom: '10px' }}>Description</th>
                          <th style={{ textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600', paddingBottom: '10px' }}>Market Value (â‚¹)</th>
                          <th style={{ textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600', paddingBottom: '10px' }}>Guideline Value (â‚¹)</th>
                          <th style={{ textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600', paddingBottom: '10px' }}>Final Value (â‚¹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {['Land Value', 'Structure Value', 'Amenities Value', 'Total Value', 'Distress Value', 'Forced Sale Value'].map((row, idx) => (
                          <tr key={idx}>
                            <td style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)', paddingRight: '15px' }}>{row}</td>
                            <td><input type="text" className={styles.inputField} placeholder="â‚¹ 0" /></td>
                            <td><input type="text" className={styles.inputField} placeholder="â‚¹ 0" /></td>
                            <td><input type="text" className={styles.inputField} placeholder="â‚¹ 0" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Declaration */}
                <div className={styles.card}>
                  <h2 className={styles.sectionHeading}>DECLARATION</h2>
                  <ul style={{ listStyle: 'disc', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <li style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: '1.7' }}>
                      Kgn and the site engineer/service provider partner certify that they have no direct or indirect interest in the appraisal of the property.
                    </li>
                    <li style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: '1.7' }}>
                      The property was inspected by our authorised representative in the presence of owner&apos;s representative, and the information provided in the report is accurate to the best of our knowledge and in accordance with the financial institution&apos;s or the property owner&apos;s documents (We did not do any due diligence on the documents that were provided to us for this valuation).
                    </li>
                    <li style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: '1.7' }}>
                      The FAIR MARKET VALUE in the report is based on market feedback on similar properties as of the date of Valuation. Financial institutions and clients are free to obtain independent advice. The fair market value of properties/locations may fluctuates due to future market conditions and scenarios, requiring periodic analysis.
                    </li>
                    <li style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: '1.7' }}>
                      Legal considerations are beyond the scope of valuation and report does not certify the ownership or title of property or physical/legal possession of the property that has been valued therefore financial firm or client should independently verify authenticity of all title &amp; other documents.
                    </li>
                    <li style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: '1.7' }}>
                      Compliance with statutory regulations pertaining to mortgage or property loans is the responsibility of the lending institutions. Legal Opinion/considerations on the subject property is also the responsibility of lending institution.
                    </li>
                  </ul>
                </div>

                <div className={styles.footerActions}>
                  <button className={styles.nextBtn} onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit'} <ChevronRight size={18} />
                  </button>
                </div>
              </>
            )}
            </div>

          </div>
          <Footer />
        </main>
      </div>
    </div>
    </FormContext.Provider>
  );
};

/* ---------------------------------------------------
    INTERNAL REUSABLE COMPONENTS
--------------------------------------------------- */

/* Dual-mode field: Text typing OR Picture upload */
const TextOrImageField = ({ label, textField, imageField, placeholder, isTextarea = false, rows = 4 }) => {
  const { formData, updateField } = useFormContext();
  const [mode, setMode] = useState('text'); // 'text' | 'picture'
  const fileInputRef = React.useRef(null);

  const textValue = formData.finalValuation?.[textField] ?? '';
  const imageValue = formData.finalValuation?.[imageField] ?? '';

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateField('finalValuation', imageField, ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const tabStyle = (active) => ({
    padding: '5px 16px',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    borderRadius: '6px',
    background: active ? 'var(--gradient-gold, linear-gradient(135deg,#C9A84C,#E0C77D))' : 'rgba(255,255,255,0.06)',
    color: active ? '#1a1a1a' : 'var(--text-secondary)',
    transition: 'all 0.2s ease',
  });

  return (
    <div style={{ marginBottom: '18px' }}>
      {/* Label + tab switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <label className={styles.label} style={{ margin: 0 }}>{label}</label>
        <div style={{ display: 'inline-flex', gap: '4px', padding: '3px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)' }}>
          <button type="button" style={tabStyle(mode === 'text')} onClick={() => setMode('text')}>
            ✏️ Text
          </button>
          <button type="button" style={tabStyle(mode === 'picture')} onClick={() => setMode('picture')}>
            🖼️ Picture
          </button>
        </div>
      </div>

      {/* Text mode */}
      {mode === 'text' && (
        isTextarea ? (
          <textarea
            className={styles.textarea}
            placeholder={placeholder}
            rows={rows}
            value={textValue}
            onChange={(e) => updateField('finalValuation', textField, e.target.value)}
          />
        ) : (
          <div className={styles.fieldWrapper}>
            <input
              type="text"
              placeholder={placeholder}
              className={styles.inputField}
              value={textValue}
              onChange={(e) => updateField('finalValuation', textField, e.target.value)}
            />
          </div>
        )
      )}

      {/* Picture mode */}
      {mode === 'picture' && (
        <div>
          {imageValue ? (
            <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
              <img
                src={imageValue}
                alt={label}
                style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '8px', border: '1px solid var(--border-color)', objectFit: 'contain', display: 'block' }}
              />
              <button
                type="button"
                onClick={() => updateField('finalValuation', imageField, '')}
                title="Remove image"
                style={{ position: 'absolute', top: '6px', right: '6px', width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(239,68,68,0.85)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ×
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{ border: '2px dashed rgba(201,168,76,0.5)', borderRadius: '10px', padding: '32px 20px', textAlign: 'center', cursor: 'pointer', background: 'rgba(201,168,76,0.04)', transition: 'border-color 0.2s ease' }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#C9A84C'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)'}
            >
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📷</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Click to upload image</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>PNG, JPG, WEBP supported</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />
          {imageValue && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--primary-gold,#C9A84C)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Replace image
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/* Engineer Details section with per-field Text / Picture toggle */
const EngineerDetailsFields = () => {
  const { formData, updateField } = useFormContext();

  return (
    <>
      <div className={styles.formGrid} style={{ marginBottom: '18px' }}>
        {/* Engineer Name occupies left column; Signature Date stays in right column */}
        <TextOrImageField
          label="Engineer Name"
          textField="valuer_name"
          imageField="valuer_name_image"
          placeholder="Enter engineer name"
        />
        <div className={styles.inputStack}>
          <label className={styles.label}>Signature Date</label>
          <div className={styles.fieldWrapper}>
            <input
              type="date"
              className={styles.inputField}
              value={formData.finalValuation?.report_date ?? ''}
              onChange={(e) => updateField('finalValuation', 'report_date', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Engineer Remarks — full width */}
      <TextOrImageField
        label="Engineer Remarks"
        textField="valuer_remarks"
        imageField="valuer_remarks_image"
        placeholder="Enter engineer remarks"
        isTextarea
        rows={4}
      />
    </>
  );
};

const InputGroup = ({ label, placeholder, isDate, fullWidth, type = "text", section, field }) => {
  const { formData, updateField } = useFormContext();
  const [internalVal, setInternalVal] = useState('');
  const hasBinding = Boolean(section && field);
  const value = hasBinding ? (formData[section]?.[field] ?? '') : internalVal;

  return (
    <div className={`${styles.inputStack} ${fullWidth ? styles.fullWidth : ''}`}>
      <label className={styles.label}>{label}</label>
      <div className={styles.fieldWrapper}>
        <input
          type={isDate ? "date" : type}
          placeholder={placeholder}
          className={styles.inputField}
          value={value}
          onChange={(e) => {
            if (hasBinding) {
              updateField(section, field, e.target.value);
            } else {
              setInternalVal(e.target.value);
            }
          }}
        />
      </div>
    </div>
  );
};

const SelectField = ({ label, section, field, options, fullWidth }) => {
  const { formData, updateField } = useFormContext();
  const rawValue = formData[section]?.[field] ?? '';
  let matchedOpt = options.find((opt) => String(opt.value).toLowerCase() === String(rawValue).toLowerCase());

  if (!matchedOpt && rawValue && field === 'class_of_locality') {
    const rawLower = String(rawValue).toLowerCase().trim();
    if (rawLower.includes('prime')) matchedOpt = options.find((opt) => opt.value.toLowerCase() === 'prime');
    else if (rawLower.includes('high')) matchedOpt = options.find((opt) => opt.value.toLowerCase() === 'high');
    else if (rawLower.includes('middle')) matchedOpt = options.find((opt) => opt.value.toLowerCase() === 'middle');
    else if (rawLower.includes('low')) matchedOpt = options.find((opt) => opt.value.toLowerCase() === 'low');
    else matchedOpt = options.find((opt) => opt.value.toLowerCase() === 'others');
  }

  const value = matchedOpt ? matchedOpt.value : rawValue;

  return (
    <div className={`${styles.inputStack} ${fullWidth ? styles.fullWidth : ''}`}>
      <label className={styles.label}>{label}</label>
      <div className={styles.selectWrapper}>
        <select
          className={styles.select}
          value={value}
          onChange={(e) => updateField(section, field, e.target.value)}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown className={styles.selectIcon} size={18} />
      </div>
    </div>
  );
};

const TextAreaField = ({ label, section, field, placeholder, rows = 4 }) => {
  const { formData, updateField } = useFormContext();
  const value = formData[section]?.[field] ?? '';

  return (
    <div className={styles.fullWidth}>
      <label className={styles.label}>{label}</label>
      <textarea
        className={styles.textarea}
        placeholder={placeholder}
        rows={rows}
        value={value}
        onChange={(e) => updateField(section, field, e.target.value)}
      />
    </div>
  );
};

const Radio = ({ label, name, value, section, field }) => {
  const { formData, updateField } = useFormContext();
  const checked = formData[section]?.[field] === value;

  return (
    <label className={styles.radioItem}>
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={() => updateField(section, field, value)}
      />
      <span className={styles.customRadio}></span>
      {label}
    </label>
  );
};

const RadioYesNo = ({ label, section, field }) => {
  const { formData, updateField } = useFormContext();
  const isYes = Boolean(formData[section]?.[field]);

  return (
    <div className={styles.radioRow}>
      <label className={styles.radioQuestion}>{label}</label>
      <div className={styles.radioOptions}>
        <label className={styles.radioLabel}>
          <input
            type="radio"
            name={`${section}-${field}`}
            checked={isYes}
            onChange={() => updateField(section, field, true)}
          />
          <span className={styles.radioCircle}></span>
          Yes
        </label>
        <label className={styles.radioLabel}>
          <input
            type="radio"
            name={`${section}-${field}`}
            checked={!isYes}
            onChange={() => updateField(section, field, false)}
          />
          <span className={styles.radioCircle}></span>
          No
        </label>
      </div>
    </div>
  );
};

const defaultBuildingSpecCard = () => ({
  id: `bspec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
  carpet_area: '',
  plinth_area: '',
  built_up_area: '',
  super_built_up_area: '',
  slab_area: '',
  property_age: '',
  residual_age: '',
  description: '',
});

const BuildingSpecificationsSection = () => {
  const { formData, setFormData } = useFormContext();
  const td = formData.technicalDetails || {};

  // Support repeat mode: store cards in td.buildingSpecCards array
  const [cards, setCards] = React.useState(() => {
    if (Array.isArray(td.buildingSpecCards) && td.buildingSpecCards.length > 0) {
      return td.buildingSpecCards;
    }
    return [defaultBuildingSpecCard()];
  });

  // Sync cards into formData on every change
  const syncCards = (newCards) => {
    setCards(newCards);
    setFormData((prev) => ({
      ...prev,
      technicalDetails: {
        ...prev.technicalDetails,
        buildingSpecCards: newCards,
        // keep top-level fields in sync with first card for backwards compat
        carpet_area: newCards[0]?.carpet_area ?? prev.technicalDetails?.carpet_area ?? '',
        plinth_area: newCards[0]?.plinth_area ?? prev.technicalDetails?.plinth_area ?? '',
        built_up_area: newCards[0]?.built_up_area ?? prev.technicalDetails?.built_up_area ?? '',
        super_built_up_area: newCards[0]?.super_built_up_area ?? prev.technicalDetails?.super_built_up_area ?? '',
        slab_area: newCards[0]?.slab_area ?? prev.technicalDetails?.slab_area ?? '',
        property_age: newCards[0]?.property_age ?? prev.technicalDetails?.property_age ?? '',
        residual_age: newCards[0]?.residual_age ?? prev.technicalDetails?.residual_age ?? '',
        description: newCards[0]?.description ?? prev.technicalDetails?.description ?? '',
      },
    }));
  };

  const updateCard = (cardIdx, field, value) => {
    const updated = cards.map((c, i) => (i === cardIdx ? { ...c, [field]: value } : c));
    syncCards(updated);
  };

  const addCard = () => syncCards([...cards, defaultBuildingSpecCard()]);

  const removeCard = (cardIdx) => {
    if (cards.length <= 1) return;
    syncCards(cards.filter((_, i) => i !== cardIdx));
  };

  const fieldPairs = [
    [{ label: 'Carpet Area', key: 'carpet_area' }, { label: 'Plinth Area', key: 'plinth_area' }],
    [{ label: 'Built-Up Area', key: 'built_up_area' }, { label: 'Super-Built-Up Area', key: 'super_built_up_area' }],
    [{ label: 'Slab Area', key: 'slab_area' }, null],
    [{ label: 'Property Age (years)', key: 'property_age' }, { label: 'Residual Age (years)', key: 'residual_age' }],
  ];

  return (
    <>
      {cards.map((card, cardIdx) => (
        <div
          key={card.id}
          className={styles.card}
          style={{
            marginBottom: '25px',
            padding: '24px',
            border: cards.length > 1 ? '1px solid rgba(201, 168, 76, 0.4)' : undefined,
          }}
        >
          {/* Card header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h2 className={styles.sectionHeading} style={{ fontSize: '1.25rem', margin: 0 }}>
                Building Specifications
              </h2>
              {cards.length > 1 && (
                <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', background: 'rgba(201,168,76,0.15)', color: 'var(--primary-gold,#C9A84C)', border: '1px solid rgba(201,168,76,0.35)' }}>
                  #{cardIdx + 1}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {cards.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCard(cardIdx)}
                  title="Remove this card"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  <Trash2 size={14} /> Remove
                </button>
              )}
              {/* Circular + button for repeat mode */}
              <button
                type="button"
                onClick={addCard}
                title="Add another Building Specifications card"
                style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--gradient-gold, linear-gradient(135deg,#C9A84C 0%,#E0C77D 100%))', color: '#1a1a1a', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 10px rgba(201,168,76,0.35)', transition: 'transform 0.15s ease' }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <Plus size={22} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Area fields in pairs */}
          <div className={styles.formGrid}>
            {fieldPairs.map(([left, right]) => (
              <React.Fragment key={left.key}>
                <div className={styles.inputStack}>
                  <label className={styles.label}>{left.label}</label>
                  <div className={styles.fieldWrapper}>
                    <input
                      type="text"
                      placeholder="Enter"
                      className={styles.inputField}
                      value={card[left.key] ?? ''}
                      onChange={(e) => updateCard(cardIdx, left.key, e.target.value)}
                    />
                  </div>
                </div>
                {right ? (
                  <div className={styles.inputStack}>
                    <label className={styles.label}>{right.label}</label>
                    <div className={styles.fieldWrapper}>
                      <input
                        type="text"
                        placeholder="Enter"
                        className={styles.inputField}
                        value={card[right.key] ?? ''}
                        onChange={(e) => updateCard(cardIdx, right.key, e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Description box */}
          <div style={{ marginTop: '20px' }}>
            <label className={styles.label}>Description</label>
            <textarea
              className={styles.textarea}
              placeholder="Enter building description (e.g. RCC framed structure with brick masonry infill walls…)"
              rows={3}
              value={card.description ?? ''}
              onChange={(e) => updateCard(cardIdx, 'description', e.target.value)}
            />
          </div>
        </div>
      ))}
    </>
  );
};

const defaultCardState = () => ({
  id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
  document_name: '',
  shape: 'Regular',
  apartment_case_note: '',
  north: { actual: '', document: '', plan: '', match: false },
  south: { actual: '', document: '', plan: '', match: false },
  east: { actual: '', document: '', plan: '', match: false },
  west: { actual: '', document: '', plan: '', match: false },
});

const MeasurementMatchingCard = ({
  title,
  sectionKey,
  showNoteBox = (sectionKey === 'landMeasurements'),
  noteLabel = "Note : Apartment case (just reflection)",
}) => {
  const { formData, setFormData } = useFormContext();
  const rawSection = formData.technicalDetails?.[sectionKey];

  const cards = React.useMemo(() => {
    if (Array.isArray(rawSection) && rawSection.length > 0) {
      return rawSection;
    }
    if (rawSection && typeof rawSection === 'object') {
      return [{
        id: rawSection.id || 'card_1',
        document_name: rawSection.document_name || '',
        shape: rawSection.shape || 'Regular',
        apartment_case_note: rawSection.apartment_case_note || '',
        north: rawSection.north || { actual: '', document: '', plan: '', match: false },
        south: rawSection.south || { actual: '', document: '', plan: '', match: false },
        east: rawSection.east || { actual: '', document: '', plan: '', match: false },
        west: rawSection.west || { actual: '', document: '', plan: '', match: false },
      }];
    }
    return [defaultCardState()];
  }, [rawSection]);

  const updateCards = (newCards) => {
    const firstCard = newCards[0] || defaultCardState();
    const normalized = [...newCards];
    normalized.shape = firstCard.shape;
    normalized.document_name = firstCard.document_name;
    normalized.apartment_case_note = firstCard.apartment_case_note;
    normalized.north = firstCard.north;
    normalized.south = firstCard.south;
    normalized.east = firstCard.east;
    normalized.west = firstCard.west;

    setFormData((prev) => ({
      ...prev,
      technicalDetails: {
        ...prev.technicalDetails,
        apartment_case_note: firstCard.apartment_case_note || prev.technicalDetails?.apartment_case_note || '',
        [sectionKey]: normalized,
      },
    }));
  };

  const updateShape = (cardIdx, shape) => {
    const updated = cards.map((c, i) => (i === cardIdx ? { ...c, shape } : c));
    updateCards(updated);
  };

  const updateDocumentName = (cardIdx, document_name) => {
    const updated = cards.map((c, i) => (i === cardIdx ? { ...c, document_name } : c));
    updateCards(updated);
  };

  const updateMeasurement = (cardIdx, dirKey, field, val) => {
    const updated = cards.map((card, i) => {
      if (i !== cardIdx) return card;
      const currentDirData = card[dirKey] || {};
      const newDirData = { ...currentDirData, [field]: val };

      const act = field === 'actual' ? val : (newDirData.actual || '');
      const doc = field === 'document' ? val : (newDirData.document || '');
      const pln = field === 'plan' ? val : (newDirData.plan || '');

      let autoMatch = newDirData.match;
      if (act && (act === doc || act === pln)) {
        autoMatch = true;
      }

      return {
        ...card,
        [dirKey]: {
          ...newDirData,
          match: autoMatch,
        },
      };
    });
    updateCards(updated);
  };

  const toggleMatch = (cardIdx, dirKey) => {
    const updated = cards.map((card, i) => {
      if (i !== cardIdx) return card;
      const currentMatch = Boolean(card[dirKey]?.match);
      return {
        ...card,
        [dirKey]: {
          ...card[dirKey],
          match: !currentMatch,
        },
      };
    });
    updateCards(updated);
  };

  const updateApartmentNote = (cardIdx, val) => {
    const updated = cards.map((card, i) => (i === cardIdx ? { ...card, apartment_case_note: val } : card));
    updateCards(updated);
  };

  const addCard = () => {
    const newCard = defaultCardState();
    updateCards([...cards, newCard]);
  };

  const removeCard = (cardIdx) => {
    if (cards.length <= 1) return;
    const updated = cards.filter((_, i) => i !== cardIdx);
    updateCards(updated);
  };

  const directionsList = [
    { key: 'north', label: 'North' },
    { key: 'south', label: 'South' },
    { key: 'east', label: 'East' },
    { key: 'west', label: 'West' },
  ];

  return (
    <>
      {cards.map((card, cardIdx) => {
        const currentShape = card.shape || 'Regular';

        return (
          <div
            key={card.id || cardIdx}
            className={styles.card}
            style={{
              marginBottom: '25px',
              padding: '24px',
              position: 'relative',
              border: cards.length > 1 ? '1px solid rgba(201, 168, 76, 0.4)' : undefined,
            }}
          >
            {/* Header: Title + Card Counter + Circular + Button & Delete Button */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <h2 className={styles.sectionHeading} style={{ fontSize: '1.25rem', margin: 0 }}>
                  {title}
                </h2>
                {cards.length > 1 && (
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '12px',
                      background: 'rgba(201, 168, 76, 0.15)',
                      color: 'var(--primary-gold, #C9A84C)',
                      border: '1px solid rgba(201, 168, 76, 0.35)',
                    }}
                  >
                    Document #{cardIdx + 1} {card.document_name ? `(${card.document_name})` : ''}
                  </span>
                )}
              </div>

              {/* Action Buttons: Remove (if > 1) & Circular + Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {cards.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCard(cardIdx)}
                    title="Remove this document card"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      background: 'rgba(239, 68, 68, 0.08)',
                      color: '#ef4444',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Remove</span>
                  </button>
                )}

                {/* Circular + Button (as drawn in user screenshot) */}
                <button
                  type="button"
                  onClick={addCard}
                  title="Add one more complete measurement card"
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'var(--gradient-gold, linear-gradient(135deg, #C9A84C 0%, #E0C77D 100%))',
                    color: '#1a1a1a',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(201, 168, 76, 0.35)',
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <Plus size={22} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Row with Property Shape & Document : Box (as indicated in user screenshot) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '1px solid var(--border-color, #e2e8f0)',
              }}
            >
              {/* Property Shape Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary, #cbd5e1)', fontWeight: 500 }}>
                  Property Shape:
                </span>
                <div style={{ display: 'inline-flex', borderRadius: '6px', border: '1px solid #14b8a6', overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={() => updateShape(cardIdx, 'Regular')}
                    style={{
                      padding: '6px 20px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: currentShape === 'Regular' ? 'rgba(20, 184, 166, 0.25)' : 'transparent',
                      color: currentShape === 'Regular' ? '#2dd4bf' : 'var(--text-muted, #94a3b8)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Regular
                  </button>
                  <button
                    type="button"
                    onClick={() => updateShape(cardIdx, 'Irregular')}
                    style={{
                      padding: '6px 20px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      border: 'none',
                      borderLeft: '1px solid #14b8a6',
                      cursor: 'pointer',
                      backgroundColor: currentShape === 'Irregular' ? 'rgba(20, 184, 166, 0.25)' : 'transparent',
                      color: currentShape === 'Irregular' ? '#2dd4bf' : 'var(--text-muted, #94a3b8)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Irregular
                  </button>
                </div>
              </div>

              {/* Document : Box */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '260px', maxWidth: '440px' }}>
                <label style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                  Document :
                </label>
                <input
                  type="text"
                  placeholder="Enter document name / no."
                  className={styles.inputField}
                  value={card.document_name ?? ''}
                  onChange={(e) => updateDocumentName(cardIdx, e.target.value)}
                  style={{ width: '100%', padding: '7px 12px' }}
                />
              </div>
            </div>

            {/* 4 Directions */}
            {directionsList.map(({ key, label }, idx) => {
              const dirData = card[key] || {};
              const isMatch = Boolean(dirData.match);

              return (
                <div
                  key={key}
                  style={{
                    borderBottom: idx < directionsList.length - 1 ? '1px solid var(--border-color, rgba(255, 255, 255, 0.08))' : 'none',
                    paddingBottom: idx < directionsList.length - 1 ? '22px' : '6px',
                    marginBottom: idx < directionsList.length - 1 ? '22px' : '0',
                  }}
                >
                  {/* Header: Direction Name + Toggle Pill */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px',
                    }}
                  >
                    <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary, #ffffff)' }}>
                      {label}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleMatch(cardIdx, key)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '5px 14px',
                        borderRadius: '20px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#ffffff',
                        backgroundColor: isMatch ? '#16a34a' : '#ea580c',
                        boxShadow: isMatch ? '0 2px 8px rgba(22, 163, 74, 0.35)' : '0 2px 8px rgba(234, 88, 12, 0.35)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: '#ffffff',
                          display: 'inline-block',
                        }}
                      />
                      {isMatch ? 'Match' : 'No Match'}
                    </button>
                  </div>

                  {/* 3 Inputs */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary, #94a3b8)' }}>
                        As per Actual *
                      </label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="Enter"
                          className={styles.inputField}
                          style={{ width: '100%', paddingRight: '36px' }}
                          value={dirData.actual ?? ''}
                          onChange={(e) => updateMeasurement(cardIdx, key, 'actual', e.target.value)}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            right: '12px',
                            fontSize: '0.85rem',
                            color: 'var(--text-muted, #64748b)',
                            pointerEvents: 'none',
                            fontWeight: 500,
                          }}
                        >
                          ft
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary, #94a3b8)' }}>
                        As per Document Provided
                      </label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="Enter"
                          className={styles.inputField}
                          style={{ width: '100%', paddingRight: '36px' }}
                          value={dirData.document ?? ''}
                          onChange={(e) => updateMeasurement(cardIdx, key, 'document', e.target.value)}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            right: '12px',
                            fontSize: '0.85rem',
                            color: 'var(--text-muted, #64748b)',
                            pointerEvents: 'none',
                            fontWeight: 500,
                          }}
                        >
                          ft
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary, #94a3b8)' }}>
                        As per Plan
                      </label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="Enter"
                          className={styles.inputField}
                          style={{ width: '100%', paddingRight: '36px' }}
                          value={dirData.plan ?? ''}
                          onChange={(e) => updateMeasurement(cardIdx, key, 'plan', e.target.value)}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            right: '12px',
                            fontSize: '0.85rem',
                            color: 'var(--text-muted, #64748b)',
                            pointerEvents: 'none',
                            fontWeight: 500,
                          }}
                        >
                          ft
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Note Box for Apartment Case Reflection */}
            {showNoteBox && (
              <div
                style={{
                  marginTop: '22px',
                  paddingTop: '18px',
                  borderTop: '1px solid var(--border-color, #e2e8f0)',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <label
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        fontFamily: 'var(--font-heading)',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span>{noteLabel}</span>
                    </label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Manual Entry
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Enter manual data / note for apartment case (just reflection)..."
                    value={card.apartment_case_note ?? formData.technicalDetails?.apartment_case_note ?? ''}
                    onChange={(e) => updateApartmentNote(cardIdx, e.target.value)}
                    className={styles.textarea}
                    style={{
                      width: '100%',
                      minHeight: '75px',
                      padding: '10px 14px',
                      fontSize: '0.9rem',
                      fontFamily: 'var(--font-body)',
                      resize: 'vertical',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

const BoundaryTable = () => {
  const { formData, updateField } = useFormContext();
  const sched = formData.scheduleDetails || {};
  const directions = ['east', 'west', 'north', 'south'];

  const extraBoundaries = sched.extra_boundaries || { docs: [], actual: [], plan: [] };

  const addExtraRow = (key) => {
    const currentList = Array.isArray(extraBoundaries[key]) ? extraBoundaries[key] : [];
    const updatedList = [...currentList, { title: '', values: ['', '', '', ''] }];
    updateField('scheduleDetails', 'extra_boundaries', { ...extraBoundaries, [key]: updatedList });
  };

  const removeExtraRow = (key, rowIdx) => {
    const currentList = Array.isArray(extraBoundaries[key]) ? extraBoundaries[key] : [];
    const updatedList = currentList.filter((_, i) => i !== rowIdx);
    updateField('scheduleDetails', 'extra_boundaries', { ...extraBoundaries, [key]: updatedList });
  };

  const updateExtraTitle = (key, rowIdx, val) => {
    const currentList = Array.isArray(extraBoundaries[key]) ? extraBoundaries[key] : [];
    const updatedList = currentList.map((row, ri) => {
      if (ri !== rowIdx) return row;
      if (typeof row === 'object' && !Array.isArray(row)) {
        return { ...row, title: val };
      }
      return { title: val, values: Array.isArray(row) ? row : ['', '', '', ''] };
    });
    updateField('scheduleDetails', 'extra_boundaries', { ...extraBoundaries, [key]: updatedList });
  };

  const updateExtraCell = (key, rowIdx, colIdx, val) => {
    const currentList = Array.isArray(extraBoundaries[key]) ? extraBoundaries[key] : [];
    const updatedList = currentList.map((row, ri) => {
      if (ri !== rowIdx) return row;
      const currentValues = Array.isArray(row)
        ? [...row]
        : (Array.isArray(row?.values) ? [...row.values] : ['', '', '', '']);
      currentValues[colIdx] = val;
      if (typeof row === 'object' && !Array.isArray(row)) {
        return { ...row, values: currentValues };
      }
      return { title: '', values: currentValues };
    });
    updateField('scheduleDetails', 'extra_boundaries', { ...extraBoundaries, [key]: updatedList });
  };

  const getRowTitle = (r) => (r && typeof r === 'object' && !Array.isArray(r) ? r.title || '' : '');
  const getRowValue = (r, ci) => {
    if (Array.isArray(r)) return r[ci] || '';
    if (r && Array.isArray(r.values)) return r.values[ci] || '';
    return '';
  };

  const staticRows = [
    { label: 'As per Documents', prefix: 'docs', extraKey: 'docs', titlePlaceholder: 'Enter Document Title / No.' },
    { label: 'As Per Actual Visit', prefix: 'actual', extraKey: 'actual', titlePlaceholder: 'Enter Visit Description' },
    { label: 'As Per Plan', prefix: 'plan', extraKey: 'plan', titlePlaceholder: 'Enter Plan Description' },
    { label: 'Boundary Matching Status', prefix: 'status', extraKey: null },
    { label: 'Property Identification Status', prefix: 'identification', single: true, extraKey: null },
  ];

  const labelCellStyle = {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    paddingRight: '8px',
  };

  const plusBtnStyle = {
    background: 'rgba(201,168,76,0.1)',
    border: '1.5px solid #C9A84C',
    color: '#C9A84C',
    borderRadius: '50%',
    width: '22px',
    height: '22px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '700',
    lineHeight: 1,
    marginLeft: '6px',
    flexShrink: 0,
  };

  const minusBtnStyle = {
    background: 'rgba(239,68,68,0.09)',
    border: '1.5px solid rgba(239,68,68,0.4)',
    color: '#ef4444',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '700',
    lineHeight: 1,
    marginLeft: '4px',
    flexShrink: 0,
  };

  return (
    <div style={{ marginBottom: '40px', overflowX: 'auto', padding: '0 10px' }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '10px 15px' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', width: '24%', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              Source / Description
            </th>
            {directions.map((dir) => (
              <th key={dir} style={{ textAlign: 'left', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {dir.charAt(0).toUpperCase() + dir.slice(1)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {staticRows.map((row) => {
            const extra = row.extraKey && Array.isArray(extraBoundaries[row.extraKey]) ? extraBoundaries[row.extraKey] : [];
            return (
              <React.Fragment key={row.label}>
                {/* Main row */}
                <tr>
                  <td style={{ ...labelCellStyle, verticalAlign: 'bottom' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>{row.label}</span>
                        {row.extraKey && (
                          <button
                            type="button"
                            style={plusBtnStyle}
                            title={`Add another ${row.label} row`}
                            onClick={() => addExtraRow(row.extraKey)}
                          >+</button>
                        )}
                      </div>
                      {row.extraKey && (
                        <input
                          type="text"
                          className={styles.inputField}
                          style={{ padding: '8px 10px', fontSize: '0.85rem', width: '100%' }}
                          placeholder={row.titlePlaceholder || 'Enter description / title'}
                          value={sched[`${row.prefix}_title`] || ''}
                          onChange={(e) => updateField('scheduleDetails', `${row.prefix}_title`, e.target.value)}
                        />
                      )}
                    </div>
                  </td>
                  {row.single ? (
                    <td colSpan={4} style={{ verticalAlign: 'bottom' }}>
                      <input
                        type="text"
                        className={styles.inputField}
                        style={{ padding: '10px', fontSize: '0.9rem', width: '100%' }}
                        value={sched.property_identification_status || ''}
                        onChange={(e) => updateField('scheduleDetails', 'property_identification_status', e.target.value)}
                      />
                    </td>
                  ) : (
                    directions.map((dir) => {
                      const fieldName = `${dir}_boundary_${row.prefix}`;
                      return (
                        <td key={fieldName} style={{ verticalAlign: 'bottom' }}>
                          <input
                            type="text"
                            className={styles.inputField}
                            style={{ padding: '10px', fontSize: '0.9rem', width: '100%' }}
                            value={sched[fieldName] ?? ''}
                            onChange={(e) => updateField('scheduleDetails', fieldName, e.target.value)}
                          />
                        </td>
                      );
                    })
                  )}
                </tr>

                {/* Extra rows */}
                {extra.map((extraRow, ri) => (
                  <tr key={`${row.extraKey}-extra-${ri}`}>
                    <td style={{ ...labelCellStyle, verticalAlign: 'bottom' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                            {row.label} {ri + 2}
                          </span>
                          <button
                            type="button"
                            style={minusBtnStyle}
                            title="Remove row"
                            onClick={() => removeExtraRow(row.extraKey, ri)}
                          >−</button>
                        </div>
                        <input
                          type="text"
                          className={styles.inputField}
                          style={{ padding: '8px 10px', fontSize: '0.85rem', width: '100%' }}
                          placeholder={row.titlePlaceholder || 'Enter description / title'}
                          value={getRowTitle(extraRow)}
                          onChange={(e) => updateExtraTitle(row.extraKey, ri, e.target.value)}
                        />
                      </div>
                    </td>
                    {directions.map((dir, ci) => (
                      <td key={`${row.extraKey}-${ri}-${ci}`} style={{ verticalAlign: 'bottom' }}>
                        <input
                          type="text"
                          className={styles.inputField}
                          style={{ padding: '10px', fontSize: '0.9rem', width: '100%' }}
                          value={getRowValue(extraRow, ci)}
                          onChange={(e) => updateExtraCell(row.extraKey, ri, ci, e.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const LandExtentTable = ({ showSelectionOption = true }) => {
  const { formData, setFormData } = useFormContext();
  const labels = [
    'As Per Documents (Sq Ft)',
    'As Per Actual (Sq Ft)',
    'As Per Plan (Sq Ft)',
    'Final Selected (Sq Ft)',
  ];

  const ORDERED_BASIS = ['as_per_documents', 'as_per_actual', 'as_per_plan', 'final_selected'];

  const basisLabels = {
    as_per_documents: 'As Per Documents',
    as_per_actual: 'As Per Actual',
    as_per_plan: 'As Per Plan',
  };

  const currentBasis = formData.land_valuation_basis || 'as_per_documents';

  const calculateCardArea = (card, field) => {
    if (!card) return 0;
    const parseDim = (v) => {
      if (!v) return 0;
      const num = parseFloat(String(v).replace(/,/g, '').trim());
      return isNaN(num) || num < 0 ? 0 : num;
    };

    const n = parseDim(card.north?.[field]);
    const s = parseDim(card.south?.[field]);
    const e = parseDim(card.east?.[field]);
    const w = parseDim(card.west?.[field]);

    if (!n && !s && !e && !w) return 0;

    const length = n > 0 && s > 0 ? (n + s) / 2 : (n || s || 0);
    const width = e > 0 && w > 0 ? (e + w) / 2 : (e || w || 0);

    if (length > 0 && width > 0) {
      return Math.round(length * width);
    }
    return 0;
  };

  const getComputedExtents = (technicalDetails) => {
    const raw = technicalDetails?.landMeasurements;
    const cards = Array.isArray(raw) ? raw : (raw && typeof raw === 'object' ? [raw] : []);

    let totalDoc = 0;
    let totalAct = 0;
    let totalPlan = 0;

    cards.forEach((c) => {
      totalDoc += calculateCardArea(c, 'document');
      totalAct += calculateCardArea(c, 'actual');
      totalPlan += calculateCardArea(c, 'plan');
    });

    return {
      cardCount: cards.length,
      as_per_documents: totalDoc > 0 ? String(totalDoc) : '',
      as_per_actual: totalAct > 0 ? String(totalAct) : '',
      as_per_plan: totalPlan > 0 ? String(totalPlan) : '',
    };
  };

  // Ensure all 4 rows exist & ensure default basis
  useEffect(() => {
    const existing = formData.landExtentValuations || [];
    const isComplete = ORDERED_BASIS.length === existing.length && ORDERED_BASIS.every((k, i) => existing[i]?.basis_of_valuation === k);
    const hasBasis = Boolean(formData.land_valuation_basis);

    if (!isComplete || !hasBasis) {
      setFormData((prev) => {
        const prevList = prev.landExtentValuations || [];
        const newList = ORDERED_BASIS.map((b) => {
          const found = prevList.find((r) => r.basis_of_valuation === b);
          return found
            ? { ...found }
            : {
                basis_of_valuation: b,
                land_extent_sqft: '',
                cost_per_sqft: '',
                total_value: '',
              };
        });
        return {
          ...prev,
          landExtentValuations: newList,
          land_valuation_basis: prev.land_valuation_basis || 'as_per_documents',
        };
      });
    }
  }, []);

  // Reflect selection into final_selected row immediately
  const handleSelectBasis = (basisKey) => {
    setFormData((prev) => {
      const list = [...(prev.landExtentValuations || [])];
      const sourceRow = list.find((r) => r.basis_of_valuation === basisKey);
      const finalIndex = list.findIndex((r) => r.basis_of_valuation === 'final_selected');

      if (sourceRow && finalIndex !== -1) {
        const finalRow = { ...list[finalIndex] };
        finalRow.land_extent_sqft = sourceRow.land_extent_sqft || '';

        // If source row has cost_per_sqft, mirror it; otherwise preserve existing final cost
        if (sourceRow.cost_per_sqft) {
          finalRow.cost_per_sqft = sourceRow.cost_per_sqft;
        }

        const extentNum = parseFloat(String(finalRow.land_extent_sqft || '').replace(/,/g, '')) || 0;
        const costNum = parseFloat(String(finalRow.cost_per_sqft || '').replace(/,/g, '')) || 0;
        if (extentNum > 0 && costNum > 0) {
          finalRow.total_value = String(Math.round(extentNum * costNum));
        } else if (sourceRow.total_value) {
          finalRow.total_value = sourceRow.total_value;
        } else {
          finalRow.total_value = '';
        }

        list[finalIndex] = finalRow;
      }

      return {
        ...prev,
        land_valuation_basis: basisKey,
        landExtentValuations: list,
      };
    });
  };

  // Automatically reflect computed land extents when land measurements change
  useEffect(() => {
    const computed = getComputedExtents(formData.technicalDetails);
    const hasAnyComputed = Boolean(computed.as_per_documents || computed.as_per_actual || computed.as_per_plan);
    if (!hasAnyComputed) return;

    setFormData((prev) => {
      const prevList = prev.landExtentValuations || [];
      const activeBasis = prev.land_valuation_basis || 'as_per_documents';
      let hasChanges = false;

      const updated = prevList.map((row) => {
        const basis = row.basis_of_valuation;
        let newExtent = row.land_extent_sqft;

        if (basis === 'as_per_documents' && computed.as_per_documents) {
          if (row.land_extent_sqft !== computed.as_per_documents) {
            newExtent = computed.as_per_documents;
            hasChanges = true;
          }
        } else if (basis === 'as_per_actual' && computed.as_per_actual) {
          if (row.land_extent_sqft !== computed.as_per_actual) {
            newExtent = computed.as_per_actual;
            hasChanges = true;
          }
        } else if (basis === 'as_per_plan' && computed.as_per_plan) {
          if (row.land_extent_sqft !== computed.as_per_plan) {
            newExtent = computed.as_per_plan;
            hasChanges = true;
          }
        } else if (basis === 'final_selected') {
          const adopt = computed[activeBasis] || computed.as_per_documents || computed.as_per_actual || computed.as_per_plan;
          if (adopt && row.land_extent_sqft !== adopt) {
            newExtent = adopt;
            hasChanges = true;
          }
        }

        if (newExtent !== row.land_extent_sqft) {
          const extentNum = parseFloat(String(newExtent).replace(/,/g, '')) || 0;
          const costNum = parseFloat(String(row.cost_per_sqft || '').replace(/,/g, '')) || 0;
          const totalVal = extentNum > 0 && costNum > 0 ? String(Math.round(extentNum * costNum)) : row.total_value;
          return { ...row, land_extent_sqft: newExtent, total_value: totalVal };
        }
        return row;
      });

      if (!hasChanges) return prev;
      return { ...prev, landExtentValuations: updated };
    });
  }, [formData.technicalDetails?.landMeasurements, formData.land_valuation_basis]);

  const syncFromLandMeasurements = () => {
    const computed = getComputedExtents(formData.technicalDetails);
    setFormData((prev) => {
      const prevList = prev.landExtentValuations || [];
      const activeBasis = prev.land_valuation_basis || 'as_per_documents';
      const updated = prevList.map((row) => {
        const basis = row.basis_of_valuation;
        let newExtent = row.land_extent_sqft;

        if (basis === 'as_per_documents' && computed.as_per_documents) newExtent = computed.as_per_documents;
        if (basis === 'as_per_actual' && computed.as_per_actual) newExtent = computed.as_per_actual;
        if (basis === 'as_per_plan' && computed.as_per_plan) newExtent = computed.as_per_plan;
        if (basis === 'final_selected') {
          newExtent = computed[activeBasis] || computed.as_per_documents || computed.as_per_actual || computed.as_per_plan || row.land_extent_sqft;
        }

        const extentNum = parseFloat(String(newExtent).replace(/,/g, '')) || 0;
        const costNum = parseFloat(String(row.cost_per_sqft || '').replace(/,/g, '')) || 0;
        const totalVal = extentNum > 0 && costNum > 0 ? String(Math.round(extentNum * costNum)) : row.total_value;
        return { ...row, land_extent_sqft: newExtent, total_value: totalVal };
      });
      return { ...prev, landExtentValuations: updated };
    });
  };

  const handleLandChange = (idx, field, value) => {
    setFormData((prev) => {
      const list = [...(prev.landExtentValuations || [])];
      const cur = { ...(list[idx] || {}) };
      cur[field] = value;

      if (field === 'land_extent_sqft' || field === 'cost_per_sqft') {
        const extent = parseFloat(String(cur.land_extent_sqft || '').replace(/,/g, '')) || 0;
        const cost = parseFloat(String(cur.cost_per_sqft || '').replace(/,/g, '')) || 0;
        if (extent > 0 && cost > 0) {
          cur.total_value = String(Math.round(extent * cost));
        } else if (!cur.land_extent_sqft || !cur.cost_per_sqft) {
          if (field === 'land_extent_sqft' && !value) cur.total_value = '';
          if (field === 'cost_per_sqft' && !value) cur.total_value = '';
        }
      }

      list[idx] = cur;

      // If this row is the currently selected basis, mirror it into Final Selected!
      const activeBasis = prev.land_valuation_basis || 'as_per_documents';
      if (cur.basis_of_valuation === activeBasis) {
        const finalIndex = list.findIndex((r) => r.basis_of_valuation === 'final_selected');
        if (finalIndex !== -1 && finalIndex !== idx) {
          const finalRow = { ...list[finalIndex] };
          if (field === 'land_extent_sqft') {
            finalRow.land_extent_sqft = value;
          } else if (field === 'cost_per_sqft') {
            finalRow.cost_per_sqft = value;
          } else if (field === 'total_value') {
            finalRow.total_value = value;
          }

          const fExtent = parseFloat(String(finalRow.land_extent_sqft || '').replace(/,/g, '')) || 0;
          const fCost = parseFloat(String(finalRow.cost_per_sqft || '').replace(/,/g, '')) || 0;
          if (fExtent > 0 && fCost > 0) {
            finalRow.total_value = String(Math.round(fExtent * fCost));
          } else if (!finalRow.land_extent_sqft || !finalRow.cost_per_sqft) {
            if (field === 'land_extent_sqft' && !value) finalRow.total_value = '';
            if (field === 'cost_per_sqft' && !value) finalRow.total_value = '';
          }

          list[finalIndex] = finalRow;
        }
      }

      return { ...prev, landExtentValuations: list };
    });
  };

  const computedInfo = getComputedExtents(formData.technicalDetails);

  return (
    <div style={{ marginBottom: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {computedInfo.as_per_documents || computedInfo.as_per_actual || computedInfo.as_per_plan
            ? `Reflecting values calculated from Land Measurements (${computedInfo.cardCount} document${computedInfo.cardCount > 1 ? 's' : ''})`
            : 'Enter Land Measurements in Technical tab to auto-reflect extents'}
        </span>
        <button
          type="button"
          onClick={syncFromLandMeasurements}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '4px',
            background: 'rgba(201, 168, 76, 0.12)',
            border: '1px solid rgba(201, 168, 76, 0.4)',
            color: 'var(--primary-gold, #C9A84C)',
            fontSize: '0.8rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          ▶ Auto-fill from Land Measurements
        </button>
      </div>

      <div style={{ overflowX: 'auto', marginBottom: '10px' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '10px' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600', paddingBottom: '10px', width: '38%' }}>Basis of Valuation</th>
              <th style={{ textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600', paddingBottom: '10px', width: '20%' }}>Land Extent</th>
              <th style={{ textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600', paddingBottom: '10px', width: '20%' }}>Cost Per Sqft</th>
              <th style={{ textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600', paddingBottom: '10px', width: '22%' }}>Total Value</th>
            </tr>
          </thead>
          <tbody>
            {(formData.landExtentValuations || []).map((row, idx) => {
              const isFinal = row.basis_of_valuation === 'final_selected';
              const isSelected = !isFinal && currentBasis === row.basis_of_valuation;

              return (
                <tr
                  key={row.basis_of_valuation || idx}
                  style={{
                    background: isSelected
                      ? 'rgba(201, 168, 76, 0.08)'
                      : isFinal
                      ? 'rgba(59, 130, 246, 0.05)'
                      : 'transparent',
                    borderRadius: '6px',
                    transition: 'background 0.2s ease',
                  }}
                >
                  <td style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)', paddingRight: '15px' }}>
                    {!isFinal ? (
                      <label
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '10px',
                          cursor: 'pointer',
                          width: '100%',
                          userSelect: 'none',
                        }}
                      >
                        <input
                          type="radio"
                          name="land_valuation_basis_table_select"
                          checked={isSelected}
                          onChange={() => handleSelectBasis(row.basis_of_valuation)}
                          style={{
                            width: '18px',
                            height: '18px',
                            accentColor: '#C9A84C',
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ color: isSelected ? 'var(--primary-gold, #C9A84C)' : 'inherit', fontWeight: isSelected ? '700' : '600' }}>
                          {labels[idx] || row.basis_of_valuation}
                        </span>
                        {isSelected && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              background: 'rgba(201, 168, 76, 0.2)',
                              border: '1px solid rgba(201, 168, 76, 0.5)',
                              color: 'var(--primary-gold, #C9A84C)',
                              fontWeight: '700',
                              marginLeft: '4px',
                            }}
                          >
                            Selected
                          </span>
                        )}
                      </label>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: 'var(--primary-gold, #C9A84C)',
                            color: '#000',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            flexShrink: 0,
                          }}
                        >
                          ✓
                        </span>
                        <span style={{ fontWeight: '700', color: 'var(--primary-gold, #C9A84C)' }}>
                          Final Selected (Sq Ft)
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: 'rgba(59, 130, 246, 0.15)',
                            border: '1px solid rgba(59, 130, 246, 0.4)',
                            color: '#60a5fa',
                            fontWeight: '600',
                          }}
                        >
                          ✦ Reflected from {basisLabels[currentBasis] || 'Selected'}
                        </span>
                      </div>
                    )}
                  </td>
                  <td>
                    <input
                      type="text"
                      className={styles.inputField}
                      placeholder="Sq Ft"
                      value={row.land_extent_sqft || ''}
                      onChange={(e) => handleLandChange(idx, 'land_extent_sqft', e.target.value)}
                      style={
                        isFinal
                          ? { borderColor: 'rgba(201, 168, 76, 0.6)', fontWeight: '600' }
                          : undefined
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className={styles.inputField}
                      placeholder="Cost"
                      value={row.cost_per_sqft || ''}
                      onChange={(e) => handleLandChange(idx, 'cost_per_sqft', e.target.value)}
                      style={
                        isFinal
                          ? { borderColor: 'rgba(201, 168, 76, 0.6)', fontWeight: '600' }
                          : undefined
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className={styles.inputField}
                      placeholder="Total"
                      value={row.total_value || ''}
                      onChange={(e) => handleLandChange(idx, 'total_value', e.target.value)}
                      style={
                        isFinal
                          ? { borderColor: 'rgba(201, 168, 76, 0.6)', fontWeight: '700', color: 'var(--primary-gold, #C9A84C)' }
                          : undefined
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Interactive "Provide Selection Option For Final Valuation" component */}
      {showSelectionOption && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginTop: '10px',
            marginBottom: '15px',
            padding: '12px 18px',
            borderRadius: '8px',
            background: 'rgba(201, 168, 76, 0.08)',
            border: '1px solid rgba(201, 168, 76, 0.3)',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            Provide Selection Option For Final Valuation:
          </span>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { id: 'as_per_documents', label: 'As Per Documents' },
              { id: 'as_per_actual', label: 'As Per Actual' },
              { id: 'as_per_plan', label: 'As Per Plan' },
            ].map((opt) => {
              const active = currentBasis === opt.id;
              return (
                <label
                  key={opt.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: active ? '700' : '500',
                    border: active ? '1px solid #C9A84C' : '1px solid rgba(255, 255, 255, 0.15)',
                    background: active ? 'rgba(201, 168, 76, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                    color: active ? 'var(--primary-gold, #C9A84C)' : 'var(--text-secondary)',
                    transition: 'all 0.2s ease',
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="radio"
                    name="land_valuation_basis_bottom_radio"
                    checked={active}
                    onChange={() => handleSelectBasis(opt.id)}
                    style={{
                      accentColor: '#C9A84C',
                      cursor: 'pointer',
                      width: '15px',
                      height: '15px',
                    }}
                  />
                  <span>{opt.label}</span>
                </label>
              );
            })}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            Reflected into: <strong style={{ color: 'var(--primary-gold, #C9A84C)' }}>Final Selected (Sq Ft)</strong>
          </span>
        </div>
      )}
    </div>
  );
};

const StructureValuationTable = () => {
  const { formData, setFormData } = useFormContext();

  const labels = {
    carpet_area: 'Carpet Area (Sq Ft)',
    plinth_area: 'Plinth Area (Sq Ft)',
    built_up_area: 'Built Up Area (Sq Ft)',
    super_built: 'Super Built (Sq Ft)',
    slab_area: 'Slab Area (Sq Ft)',
  };

  // Maps floor_details key → technicalDetails field name
  const techMapping = {
    carpet_area: 'carpet_area',
    plinth_area: 'plinth_area',
    built_up_area: 'built_up_area',
    super_built: 'super_built_up_area',
    slab_area: 'slab_area',
  };

  const ORDERED_KEYS = ['carpet_area', 'plinth_area', 'built_up_area', 'super_built', 'slab_area'];

  // Helper: compute total area from buildingMeasurements for a given measurement field (actual/document/plan)
  // Uses average of opposite sides × average of adjacent sides (same formula as LandExtentTable)
  const computeBuildingArea = (tech, measureField) => {
    const raw = tech?.buildingMeasurements;
    const cards = Array.isArray(raw) ? raw : (raw && typeof raw === 'object' ? [raw] : []);
    if (cards.length === 0) return '';
    const parseDim = (v) => {
      if (!v) return 0;
      const n = parseFloat(String(v).replace(/,/g, '').trim());
      return isNaN(n) || n < 0 ? 0 : n;
    };
    let totalArea = 0;
    cards.forEach((c) => {
      const n = parseDim(c.north?.[measureField]);
      const s = parseDim(c.south?.[measureField]);
      const e = parseDim(c.east?.[measureField]);
      const w = parseDim(c.west?.[measureField]);
      if (!n && !s && !e && !w) return;
      const length = n > 0 && s > 0 ? (n + s) / 2 : (n || s || 0);
      const width = e > 0 && w > 0 ? (e + w) / 2 : (e || w || 0);
      if (length > 0 && width > 0) totalArea += Math.round(length * width);
    });
    return totalArea > 0 ? String(totalArea) : '';
  };

  // Helper: get the area for a floor_details key from the chosen basis.
  // Priority: (1) buildingMeasurements computed area for the basis, (2) buildingSpecCards first card, (3) technicalDetails flat fields.
  const getAreaForBasis = (key, basis, prev) => {
    const tech = prev.technicalDetails || {};
    const flatKey = techMapping[key];

    // Map basis to measurement field
    const measureField = basis === 'as_per_actual' ? 'actual' : basis === 'as_per_documents' ? 'document' : 'plan';

    // For carpet/plinth/built_up/super_built/slab: these are distinct floor-level areas,
    // not directly in N/S/E/W measurements. Use buildingMeasurements computed total area
    // only for built_up_area (the primary area field); for others fall back to tech fields.
    // This gives a real auto-fill for built_up_area and tech-based for the rest.
    const computedBuildingArea = computeBuildingArea(tech, measureField);

    // Try per-card buildingSpecCards (repeat-mode) – use first card
    const specCards = tech.buildingSpecCards;
    const firstCard = Array.isArray(specCards) && specCards.length > 0 ? specCards[0] : null;

    // For built_up_area, use the computed building measurement area
    if (key === 'built_up_area' && computedBuildingArea) return computedBuildingArea;

    // Otherwise use the value stored in the BuildingSpecifications card or flat tech field
    return firstCard?.[flatKey] || tech[flatKey] || '';
  };

  // Expose computed building areas for display
  const computedBuildingAreas = {
    as_per_actual: computeBuildingArea(formData.technicalDetails, 'actual'),
    as_per_documents: computeBuildingArea(formData.technicalDetails, 'document'),
    as_per_plan: computeBuildingArea(formData.technicalDetails, 'plan'),
  };

  const applyBasisFill = (prev, basis) => {
    const updated = (prev.structureValuations || []).map(row => {
      const areaVal = getAreaForBasis(row.floor_details, basis, prev);
      const area = parseFloat(String(areaVal).replace(/,/g, '')) || 0;
      const cost = parseFloat(String(row.cost_per_sqft || '').replace(/,/g, '')) || 0;
      let total = row.total_value;
      if (area > 0 && cost > 0) {
        const fundingStr = String(row.recommendation_of_funding || '').replace('%', '').trim();
        let pct = 1;
        if (fundingStr !== '') {
          const num = parseFloat(fundingStr);
          if (!isNaN(num) && num >= 0) pct = num / 100;
        }
        total = String(Math.round(area * cost * pct));
      }
      return { ...row, area_sqft: areaVal, total_value: total };
    });
    return { ...prev, structureValuations: updated };
  };

  const ORDERED_KEYS_CONST = ORDERED_KEYS;

  // Ensure all 5 rows exist in formData.structureValuations in exact order
  useEffect(() => {
    const existing = formData.structureValuations || [];
    const isComplete = ORDERED_KEYS_CONST.length === existing.length && ORDERED_KEYS_CONST.every((k, i) => existing[i]?.floor_details === k);
    if (!isComplete) {
      setFormData(prev => {
        const prevList = prev.structureValuations || [];
        const newList = ORDERED_KEYS_CONST.map(k => {
          const found = prevList.find(r => r.floor_details === k);
          const defaultArea = prev.technicalDetails?.[techMapping[k]] || '';
          return found ? { ...found } : {
            floor_details: k,
            area_sqft: defaultArea,
            recommendation_of_funding: '',
            cost_per_sqft: '',
            total_value: '',
          };
        });
        return { ...prev, structureValuations: newList };
      });
    }
  }, []);

  // Auto-reflect areas whenever the basis changes, tech values change, or buildingMeasurements change
  useEffect(() => {
    const basis = formData.structure_valuation_basis || 'as_per_actual';
    setFormData(prev => applyBasisFill(prev, basis));
  }, [
    formData.structure_valuation_basis,
    formData.technicalDetails?.carpet_area,
    formData.technicalDetails?.plinth_area,
    formData.technicalDetails?.built_up_area,
    formData.technicalDetails?.super_built_up_area,
    formData.technicalDetails?.slab_area,
    formData.technicalDetails?.buildingMeasurements,
  ]);

  const handleCellChange = (idx, field, val) => {
    setFormData(prev => {
      const list = [...(prev.structureValuations || [])];
      const cur = { ...(list[idx] || {}) };
      cur[field] = val;

      // Automatically calculate total value
      if (field === 'area_sqft' || field === 'cost_per_sqft' || field === 'recommendation_of_funding') {
        const area = parseFloat(String(cur.area_sqft || '').replace(/,/g, '')) || 0;
        const cost = parseFloat(String(cur.cost_per_sqft || '').replace(/,/g, '')) || 0;
        if (area > 0 && cost > 0) {
          const fundingStr = String(cur.recommendation_of_funding || '').replace('%', '').trim();
          let pct = 1;
          if (fundingStr !== '') {
            const num = parseFloat(fundingStr);
            if (!isNaN(num) && num >= 0) {
              pct = num / 100;
            }
          }
          cur.total_value = String(Math.round(area * cost * pct));
        } else if (!cur.area_sqft || !cur.cost_per_sqft) {
          if (field === 'area_sqft' && !val) cur.total_value = '';
          if (field === 'cost_per_sqft' && !val) cur.total_value = '';
        }
      }

      list[idx] = cur;
      return { ...prev, structureValuations: list };
    });
  };

  const handleBasisSelect = (basis) => {
    setFormData(prev => {
      const withBasis = { ...prev, structure_valuation_basis: basis };
      return applyBasisFill(withBasis, basis);
    });
  };

  const syncAllFromTechnical = () => {
    const basis = formData.structure_valuation_basis || 'as_per_actual';
    setFormData(prev => applyBasisFill(prev, basis));
  };

  const currentBasis = formData.structure_valuation_basis || 'as_per_actual';

  const basisOptions = [
    { id: 'as_per_actual', label: 'As Per Actual' },
    { id: 'as_per_documents', label: 'As Per Documents' },
    { id: 'as_per_plan', label: 'As Per Plan' },
  ];

  return (
    <div style={{ marginBottom: '10px' }}>
      {/* Status line */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {computedBuildingAreas.as_per_actual || computedBuildingAreas.as_per_documents || computedBuildingAreas.as_per_plan
            ? `Built-Up area auto-computed from Building Measurements · Actual: ${computedBuildingAreas.as_per_actual || '—'} · Docs: ${computedBuildingAreas.as_per_documents || '—'} · Plan: ${computedBuildingAreas.as_per_plan || '—'} sq ft`
            : 'Enter Building Measurements in Technical tab to auto-compute Built-Up area'}
        </span>
        <button
          type="button"
          onClick={syncAllFromTechnical}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '4px', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.4)', color: 'var(--primary-gold,#C9A84C)', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
          title="Re-apply areas from current basis selection"
        >
          ▶ Reflect Now
        </button>
      </div>

      {/* Basis selection pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Basis:</span>
        {basisOptions.map(opt => {
          const active = currentBasis === opt.id;
          const computedArea = computedBuildingAreas[opt.id];
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleBasisSelect(opt.id)}
              title={computedArea ? `Auto-computed Built-Up Area: ${computedArea} sq ft` : ''}
              style={{
                padding: '5px 14px',
                borderRadius: '16px',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
                border: active ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.15)',
                background: active ? '#2563eb' : 'rgba(255,255,255,0.06)',
                color: active ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {opt.label}
              {computedArea && (
                <span style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: 500 }}>
                  ({computedArea} ft²)
                </span>
              )}
            </button>
          );
        })}
        {currentBasis && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
            → Areas reflected automatically
          </span>
        )}
      </div>

      <div style={{ overflowX: 'auto', marginBottom: '10px' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '10px' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600', paddingBottom: '10px' }}>Floor Details</th>
              <th style={{ textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600', paddingBottom: '10px' }}>Area (Sq Ft)</th>
              <th style={{ textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600', paddingBottom: '10px' }}>Recommendation<br/>Of Funding</th>
              <th style={{ textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600', paddingBottom: '10px' }}>Cost Per Sft</th>
              <th style={{ textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600', paddingBottom: '10px' }}>Total Value</th>
            </tr>
          </thead>
          <tbody>
            {(formData.structureValuations || []).map((row, idx) => (
              <tr key={row.floor_details || idx}>
                <td style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)', paddingRight: '15px', whiteSpace: 'nowrap' }}>
                  {labels[row.floor_details] || row.floor_details}
                </td>
                <td>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="Area"
                    value={row.area_sqft || ''}
                    onChange={(e) => handleCellChange(idx, 'area_sqft', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="%"
                    value={row.recommendation_of_funding || ''}
                    onChange={(e) => handleCellChange(idx, 'recommendation_of_funding', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="Cost"
                    value={row.cost_per_sqft || ''}
                    onChange={(e) => handleCellChange(idx, 'cost_per_sqft', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="Total"
                    value={row.total_value || ''}
                    onChange={(e) => handleCellChange(idx, 'total_value', e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* Dynamic Amenities Valuation Table */
const AmenitiesTable = () => {
  const { formData, updateTableRow, addTableRow, removeTableRow } = useFormContext();
  const rows = formData.amenityValuations;

  const addRow = () => {
    addTableRow('amenityValuations', { amenity_name: '', amenity_value: '' });
  };

  const removeRow = (index) => {
    if (rows.length > 1) removeTableRow('amenityValuations', index);
  };

  return (
    <div>
      <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '10px' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600', paddingBottom: '10px', width: '55%' }}>Description</th>
              <th style={{ textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600', paddingBottom: '10px' }}>Rs</th>
              <th style={{ width: '36px' }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="Enter Description"
                    value={row.amenity_name}
                    onChange={e => updateTableRow('amenityValuations', idx, 'amenity_name', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="â‚¹ Amount"
                    value={row.amenity_value}
                    onChange={e => updateTableRow('amenityValuations', idx, 'amenity_value', e.target.value)}
                  />
                </td>
                <td style={{ verticalAlign: 'middle', paddingLeft: '4px' }}>
                  {rows.length > 1 && (
                    <button
                      onClick={() => removeRow(idx)}
                      title="Remove row"
                      style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >Ã—</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={addRow}
        style={{ background: 'var(--gradient-gold)', color: 'var(--bg-primary)', border: 'none', padding: '8px 18px', borderRadius: 'var(--border-radius)', fontWeight: '700', fontFamily: 'var(--font-heading)', cursor: 'pointer', boxShadow: 'var(--shadow-gold)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        + Add Amenity
      </button>
    </div>
  );
};

/* Photo upload list with description per photo */
const PhotoUploadList = () => {
  const { formData, updatePhoto, addPhotoRow, removePhotoRow } = useFormContext();
  const photos = formData.photos;

  const cardinalFromDegrees = (deg) => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(Number(deg) / 45) % 8] || '';
  };

  const handleFile = (id, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    const captured_at = new Date().toISOString();
    const locality = formData.propertyIdentification?.locality_name || '';
    const region = formData.propertyIdentification?.state || formData.propertyIdentification?.district || '';

    updatePhoto(id, { file, preview, captured_at, locality, region });

    const applyCoords = (lat, lon, heading) => {
      const bearing = heading != null && !Number.isNaN(heading) ? Math.round(heading) : '';
      updatePhoto(id, {
        latitude: roundCoord(lat),
        longitude: roundCoord(lon),
        bearing_degrees: bearing !== '' ? String(bearing) : '',
        bearing_direction: bearing !== '' ? cardinalFromDegrees(bearing) : '',
      });
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => applyCoords(pos.coords.latitude, pos.coords.longitude, pos.coords.heading),
        () => {
          const lat = formData.locationDetails?.latitude || formData.locationDetails?.manual_latitude;
          const lon = formData.locationDetails?.longitude || formData.locationDetails?.manual_longitude;
          if (lat && lon) applyCoords(lat, lon, null);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      const lat = formData.locationDetails?.latitude || formData.locationDetails?.manual_latitude;
      const lon = formData.locationDetails?.longitude || formData.locationDetails?.manual_longitude;
      if (lat && lon) applyCoords(lat, lon, null);
    }
  };

  const handleDesc = (id, value) => {
    updatePhoto(id, { description: value });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header with circular + button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
        <div>
          <h2 className={styles.sectionHeading} style={{ margin: 0 }}>Photos</h2>
          <p className={styles.subHeading} style={{ margin: '4px 0 0 0' }}>Upload photos and add a description for each picture.</p>
        </div>
        <button
          type="button"
          onClick={addPhotoRow}
          title="Add another Photo"
          style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--gradient-gold, linear-gradient(135deg,#C9A84C 0%,#E0C77D 100%))', color: '#1a1a1a', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 10px rgba(201,168,76,0.35)', transition: 'transform 0.15s ease' }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
      </div>

      {photos.map((photo, idx) => (
        <div key={photo.id} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', padding: '16px' }}>
          <div style={{ position: 'relative', width: '120px', height: '100px', flexShrink: 0, border: '2px dashed var(--border-color)', borderRadius: 'var(--border-radius)', overflow: 'hidden', cursor: 'pointer', background: 'var(--bg-secondary)' }}>
            {photo.preview
              ? <img src={photo.preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', padding: '8px' }}>
                  <span style={{ fontSize: '1.5rem', marginBottom: '4px' }}>📷</span>
                  <span>Click to upload</span>
                </div>
            }
            <input type="file" accept="image/*" capture="environment" onChange={(e) => handleFile(photo.id, e)} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>Photo {idx + 1}</label>
            <textarea
              value={photo.description}
              onChange={(e) => handleDesc(photo.id, e.target.value)}
              placeholder="Enter description..."
              rows="3"
              style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', fontSize: '0.9rem', fontFamily: 'var(--font-body)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }}
            />
            {(photo.latitude || photo.longitude) && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                GPS: {photo.latitude}N {photo.longitude}E
                {photo.bearing_degrees ? ` · ${photo.bearing_degrees}° ${photo.bearing_direction}` : ''}
                {photo.locality ? ` · ${photo.locality}` : ''}
                {photo.region ? `, ${photo.region}` : ''}
              </p>
            )}
          </div>
          {photos.length > 1 && (
            <button onClick={() => removePhotoRow(photo.id)} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '1rem', flexShrink: 0 }}>×</button>
          )}
        </div>
      ))}
    </div>
  );
};

/* Freehand drawing canvas */
const DrawingCanvas = () => {
  const canvasRef = React.useRef(null);
  const [drawing, setDrawing] = React.useState(false);
  const [color, setColor] = React.useState('#C9A84C');
  const [size, setSize] = React.useState(3);
  const lastPos = React.useRef(null);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const startDraw = (e) => {
    e.preventDefault();
    setDrawing(true);
    lastPos.current = getPos(e, canvasRef.current);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  };

  const stopDraw = () => setDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Color:</label>
          <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: '36px', height: '28px', border: 'none', cursor: 'pointer', borderRadius: '4px', background: 'transparent' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Size:</label>
          <input type="range" min="1" max="20" value={size} onChange={e => setSize(Number(e.target.value))} style={{ width: '80px' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{size}px</span>
        </div>
        <button onClick={clearCanvas} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '6px 14px', borderRadius: 'var(--border-radius)', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'var(--font-body)' }}>Clear</button>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={300}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
        style={{ width: '100%', height: '300px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', cursor: 'crosshair', touchAction: 'none', display: 'block' }}
      />
    </div>
  );
};

/* Signature field with draw pad and picture upload */
const SignatureField = ({ label, section = 'signatures', field }) => {
  const { formData, updateField } = useFormContext();
  const existingVal = (section && field && formData?.[section]?.[field]) || '';
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [mode, setMode] = useState(existingVal ? 'upload' : 'draw');
  const [signed, setSigned] = useState(Boolean(existingVal));
  const [imagePreview, setImagePreview] = useState(existingVal || '');
  const [isDragOver, setIsDragOver] = useState(false);
  const drawing = useRef(false);
  const lastPos = useRef(null);

  useEffect(() => {
    if (existingVal && existingVal !== imagePreview) {
      setImagePreview(existingVal);
      setSigned(true);
      setMode('upload');
    }
  }, [existingVal]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    lastPos.current = getPos(e, canvasRef.current);
  };

  const move = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
    setSigned(true);
  };

  const stop = () => {
    if (drawing.current) {
      drawing.current = false;
      if (canvasRef.current && section && field) {
        const dataUrl = canvasRef.current.toDataURL('image/png');
        setImagePreview(dataUrl);
        updateField(section, field, dataUrl);
      }
    }
  };

  const clear = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    }
    setSigned(false);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (section && field) {
      updateField(section, field, '');
    }
  };

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setImagePreview(dataUrl);
      setSigned(true);
      setMode('upload');
      if (section && field) {
        updateField(section, field, dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const onFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  return (
    <div className={styles.inputStack}>
      <div className={styles.signatureHeader}>
        <label className={styles.label}>{label}</label>
        <div className={styles.signatureToggleGroup}>
          <button
            type="button"
            className={`${styles.signatureToggleBtn} ${mode === 'draw' ? styles.signatureToggleBtnActive : ''}`}
            onClick={() => setMode('draw')}
            title="Draw signature with pen"
          >
            <PenTool size={12} /> Draw
          </button>
          <button
            type="button"
            className={`${styles.signatureToggleBtn} ${mode === 'upload' ? styles.signatureToggleBtnActive : ''}`}
            onClick={() => setMode('upload')}
            title="Upload signature picture"
          >
            <Upload size={12} /> Upload Picture
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={onFileInputChange}
      />

      {mode === 'upload' ? (
        imagePreview ? (
          <div
            className={styles.signatureBox}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            style={{
              borderColor: isDragOver ? 'var(--primary-gold)' : undefined,
              backgroundColor: '#ffffff',
            }}
          >
            <img src={imagePreview} alt={label} className={styles.signatureImgPreview} />
          </div>
        ) : (
          <div
            className={`${styles.signatureDropzone} ${isDragOver ? styles.signatureDropzoneActive : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload size={20} style={{ color: 'var(--primary-gold)' }} />
            <p className={styles.signatureDropzoneText}>Click to upload picture or drag & drop</p>
            <p className={styles.signatureDropzoneSub}>PNG, JPG, JPEG, WEBP or SVG</p>
          </div>
        )
      ) : (
        <div
          className={styles.signatureBox}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            borderColor: isDragOver ? 'var(--primary-gold)' : undefined,
            backgroundColor: '#ffffff',
          }}
        >
          <canvas
            ref={canvasRef}
            width={400}
            height={85}
            onMouseDown={start}
            onMouseMove={move}
            onMouseUp={stop}
            onMouseLeave={stop}
            onTouchStart={start}
            onTouchMove={move}
            onTouchEnd={stop}
            style={{ width: '100%', height: '85px', cursor: 'crosshair', display: 'block', touchAction: 'none' }}
          />
          {!signed && !imagePreview && (
            <div style={{ position: 'absolute', pointerEvents: 'none', fontSize: '0.8rem', color: '#94a3b8', padding: '4px 10px', top: '6px', left: '6px' }}>
              ✍️ Draw signature here...
            </div>
          )}
        </div>
      )}

      <div className={styles.signatureActions}>
        {(signed || imagePreview) && (
          <button type="button" onClick={clear} className={styles.signatureBtn} title="Clear signature">
            <RotateCcw size={12} /> Clear
          </button>
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={styles.signatureBtn}
          title="Upload signature picture"
        >
          <Upload size={12} /> {imagePreview && mode === 'upload' ? 'Change Picture' : 'Upload Picture'}
        </button>
      </div>
    </div>
  );
};

export default PropertyValues;
