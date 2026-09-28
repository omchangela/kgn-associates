import React, { useState } from 'react';
import styles from './ReportList.module.css';
import Sidebar from '../../components/sidebar/Sidebar';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import { Search, Eye, Download, Trash2 } from 'lucide-react';

const ReportList = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const reports = [
    { id: 1, name: 'Property Valuation - 123 Main St', type: 'Valuation', date: '2024-01-15', status: 'Completed' },
    { id: 2, name: 'Inspection Report - 456 Oak Ave', type: 'Inspection', date: '2024-01-14', status: 'In Progress' },
    { id: 3, name: 'Market Analysis - 789 Pine Rd', type: 'Market Analysis', date: '2024-01-13', status: 'Completed' },
    { id: 4, name: 'Property Valuation - 321 Elm St', type: 'Valuation', date: '2024-01-12', status: 'Pending' },
    { id: 5, name: 'Inspection Report - 654 Maple Dr', type: 'Inspection', date: '2024-01-11', status: 'Completed' },
  ];

  return (
    <div className={styles.layoutWrapper}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className={styles.rightSide}>
        <Header onMenuToggle={toggleSidebar} />

        <main className={styles.mainScrollArea}>
          <div className={styles.contentPadding}>
            <h1 className={styles.pageTitle}>Report List</h1>
            
            <div className={styles.card}>
              <div className={styles.searchBar}>
                <div className={styles.searchWrapper}>
                  <Search className={styles.searchIcon} size={18} />
                  <input type="text" placeholder="Search reports..." className={styles.searchInput} />
                </div>
                <button className={styles.filterBtn}>Filter</button>
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Report Name</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.id}>
                        <td className={styles.reportName}>{report.name}</td>
                        <td>{report.type}</td>
                        <td>{report.date}</td>
                        <td>
                          <span className={`${styles.status} ${styles[report.status.toLowerCase().replace(' ', '-')]}`}>
                            {report.status}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actions}>
                            <button className={styles.actionBtn} title="View">
                              <Eye size={16} />
                            </button>
                            <button className={styles.actionBtn} title="Download">
                              <Download size={16} />
                            </button>
                            <button className={styles.actionBtn} title="Delete">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.pagination}>
                <button className={styles.pageBtn}>Previous</button>
                <span className={styles.pageInfo}>Page 1 of 5</span>
                <button className={styles.pageBtn}>Next</button>
              </div>
            </div>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default ReportList;
