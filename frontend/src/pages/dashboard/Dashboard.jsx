import React, { useState } from 'react';
import styles from './Dashboard.module.css';
import Sidebar from '../../components/sidebar/Sidebar';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import { BarChart3, FileText, ListChecks } from 'lucide-react';

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className={styles.layoutWrapper}>
      {/* Sidebar - Fixed on the left */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className={styles.rightSide}>
        {/* Header - Fixed at the top */}
        <Header onMenuToggle={toggleSidebar} />

        {/* Scrollable Content Area */}
        <main className={styles.mainScrollArea}>
          <div className={styles.contentPadding}>
            <h1 className={styles.dashboardTitle}>Dashboard Analysis</h1>
            
            {/* Analysis Cards */}
            <div className={styles.analysisGrid}>
              <div className={styles.analysisCard}>
                <div className={styles.cardIcon}>
                  <BarChart3 size={32} />
                </div>
                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>Property Values</h3>
                  <p className={styles.cardDescription}>View and analyze property valuation data</p>
                  <div className={styles.cardStats}>
                    <span className={styles.statNumber}>128</span>
                    <span className={styles.statLabel}>Properties</span>
                  </div>
                </div>
              </div>

              <div className={styles.analysisCard}>
                <div className={styles.cardIcon}>
                  <FileText size={32} />
                </div>
                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>Create Report</h3>
                  <p className={styles.cardDescription}>Generate new valuation reports</p>
                  <div className={styles.cardStats}>
                    <span className={styles.statNumber}>45</span>
                    <span className={styles.statLabel}>Reports Created</span>
                  </div>
                </div>
              </div>

              <div className={styles.analysisCard}>
                <div className={styles.cardIcon}>
                  <ListChecks size={32} />
                </div>
                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>Report List</h3>
                  <p className={styles.cardDescription}>View all generated reports</p>
                  <div className={styles.cardStats}>
                    <span className={styles.statNumber}>89</span>
                    <span className={styles.statLabel}>Total Reports</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className={styles.quickActions}>
              <h2 className={styles.sectionTitle}>Quick Actions</h2>
              <div className={styles.actionButtons}>
                <button className={styles.actionBtn}>New Property Valuation</button>
                <button className={styles.actionBtn}>Generate Report</button>
                <button className={styles.actionBtn}>View All Reports</button>
              </div>
            </div>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;