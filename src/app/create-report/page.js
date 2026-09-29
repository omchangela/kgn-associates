'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './CreateReport.module.css';
import Sidebar from '@/components/sidebar/Sidebar';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import { propertyValuationAPI } from '@/services/api';
import gsap from 'gsap';
import { FilePlus, Building, Landmark, ArrowRight, ShieldCheck } from 'lucide-react';
import { ApprovedValuerBadge } from '@/components/common/SvgDecorations';

const CreateReport = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    report_name: '',
    bank_name: 'State Bank of India',
    property_id: '',
    report_type: 'valuation',
    priority: 'high',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const containerRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardRef.current,
        { y: 20, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreate = async () => {
    if (!formData.report_name.trim()) {
      alert('Please enter applicant or borrower name');
      return;
    }

    setLoading(true);
    try {
      await propertyValuationAPI.create({
        institutionDetails: {
          loan_application_id: formData.property_id || `APP-${Date.now().toString().slice(-6)}`,
          applicant_name: formData.report_name,
          bank_name: formData.bank_name,
        },
        propertyIdentification: {
          locality_name: formData.description || 'Hyderabad',
        },
      });
      alert('Valuation report initiated! Redirecting to full 10-Tab Valuation Form...');
      router.push('/property-values');
    } catch (err) {
      alert(`Error creating report: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.layoutWrapper} ref={containerRef}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className={styles.rightSide}>
        <Header onMenuToggle={toggleSidebar} />

        <main className={styles.mainScrollArea}>
          <div className={styles.contentPadding}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <ApprovedValuerBadge size={16} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Intake &amp; Onboarding Spec
                </span>
              </div>
              <h1 className={styles.pageTitle}>Create Valuation Entry</h1>
              <p className={styles.subHeading}>
                Initiate a certified valuation dossier for banking inspection and engineering valuation
              </p>
            </div>

            <div className={styles.card} ref={cardRef}>
              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label>Applicant / Borrower Name *</label>
                  <input
                    type="text"
                    name="report_name"
                    placeholder="e.g. Mohammed Rafi & Sons"
                    className={styles.input}
                    value={formData.report_name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Lending Institution / Bank</label>
                  <select
                    name="bank_name"
                    className={styles.select}
                    value={formData.bank_name}
                    onChange={handleChange}
                  >
                    <option value="State Bank of India">State Bank of India</option>
                    <option value="HDFC Bank Ltd.">HDFC Bank Ltd.</option>
                    <option value="ICICI Bank Ltd.">ICICI Bank Ltd.</option>
                    <option value="Axis Bank">Axis Bank</option>
                    <option value="Punjab National Bank">Punjab National Bank</option>
                    <option value="Bank of Baroda">Bank of Baroda</option>
                    <option value="Canara Bank">Canara Bank</option>
                    <option value="Union Bank of India">Union Bank of India</option>
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label>Loan Application / Reference ID</label>
                  <input
                    type="text"
                    name="property_id"
                    placeholder="e.g. SBI-HL-2026-8891"
                    className={styles.input}
                    value={formData.property_id}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Valuation Dossier Type</label>
                  <select
                    name="report_type"
                    className={styles.select}
                    value={formData.report_type}
                    onChange={handleChange}
                  >
                    <option value="valuation">Full Residential &amp; Commercial Valuation</option>
                    <option value="inspection">Site Inspection &amp; Progress Valuation</option>
                    <option value="market">Fair Market Value &amp; Realizable Estimate</option>
                  </select>
                </div>

                <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                  <label>Property Address / Locality</label>
                  <textarea
                    name="description"
                    placeholder="Enter locality, plot/flat number, road and city..."
                    className={styles.textarea}
                    rows="3"
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => router.push('/dashboard')}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`${styles.createBtn} btn-shimmer`}
                  onClick={handleCreate}
                  disabled={loading}
                >
                  <FilePlus size={18} />
                  <span>{loading ? 'Creating Dossier...' : 'Initiate Valuation Dossier'}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default CreateReport;
