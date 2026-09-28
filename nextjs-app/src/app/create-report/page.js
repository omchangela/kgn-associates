'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './CreateReport.module.css';
import Sidebar from '@/components/sidebar/Sidebar';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import { propertyValuationAPI } from '@/services/api';

const CreateReport = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    report_name: '',
    property_id: '',
    report_type: 'valuation',
    priority: 'high',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const newReport = await propertyValuationAPI.create({
        institutionDetails: {
          loan_application_id: formData.property_id,
          applicant_name: formData.report_name,
        },
        propertyIdentification: {
          locality_name: formData.description,
        },
      });
      alert('Valuation report initiated! Redirecting to full 10-Tab form...');
      router.push('/property-values');
    } catch (err) {
      alert(`Error creating report: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.layoutWrapper}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className={styles.rightSide}>
        <Header onMenuToggle={toggleSidebar} />

        <main className={styles.mainScrollArea}>
          <div className={styles.contentPadding}>
            <h1 className={styles.pageTitle}>Create Report</h1>
            
            <div className={styles.card}>
              <p className={styles.subHeading}>Create a new property valuation report entry</p>
              
              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label>Report / Borrower Name</label>
                  <input 
                    type="text" 
                    name="report_name"
                    placeholder="Enter borrower / applicant name" 
                    className={styles.input} 
                    value={formData.report_name}
                    onChange={handleChange}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Loan Application / Property ID</label>
                  <input 
                    type="text" 
                    name="property_id"
                    placeholder="e.g. LN-2026-001" 
                    className={styles.input} 
                    value={formData.property_id}
                    onChange={handleChange}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Report Type</label>
                  <select 
                    name="report_type" 
                    className={styles.select}
                    value={formData.report_type}
                    onChange={handleChange}
                  >
                    <option value="valuation">Valuation Report (Full)</option>
                    <option value="inspection">Site Inspection Report</option>
                    <option value="market">Market Value Analysis</option>
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label>Priority</label>
                  <select 
                    name="priority" 
                    className={styles.select}
                    value={formData.priority}
                    onChange={handleChange}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className={styles.fullWidth}>
                <label className={styles.label}>Location / Property Description</label>
                <textarea 
                  name="description"
                  className={styles.textarea} 
                  placeholder="Enter property address or remarks" 
                  rows="4"
                  value={formData.description}
                  onChange={handleChange}
                ></textarea>
              </div>

              <div className={styles.actionArea}>
                <button 
                  className={styles.primaryBtn} 
                  onClick={handleCreate}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create & Proceed to Full Form'}
                </button>
                <button 
                  className={styles.secondaryBtn} 
                  onClick={() => router.push('/dashboard')}
                >
                  Cancel
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
