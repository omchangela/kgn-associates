import React, { useState } from 'react';
import styles from './CreateReport.module.css';
import Sidebar from '../../components/sidebar/Sidebar';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';

const CreateReport = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
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
              <p className={styles.subHeading}>Create a new property valuation report</p>
              
              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label>Report Name</label>
                  <input type="text" placeholder="Enter report name" className={styles.input} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Property ID</label>
                  <input type="text" placeholder="Enter property ID" className={styles.input} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Report Type</label>
                  <select className={styles.select}>
                    <option value="">Select report type</option>
                    <option value="valuation">Valuation Report</option>
                    <option value="inspection">Inspection Report</option>
                    <option value="market">Market Analysis</option>
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label>Priority</label>
                  <select className={styles.select}>
                    <option value="">Select priority</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className={styles.fullWidth}>
                <label className={styles.label}>Description</label>
                <textarea className={styles.textarea} placeholder="Enter report description" rows="4"></textarea>
              </div>

              <div className={styles.actionArea}>
                <button className={styles.primaryBtn}>Create Report</button>
                <button className={styles.secondaryBtn}>Cancel</button>
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
