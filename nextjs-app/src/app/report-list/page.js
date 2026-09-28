'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './ReportList.module.css';
import Sidebar from '@/components/sidebar/Sidebar';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import { Search, Eye, Download, Trash2, PlusCircle, RefreshCw } from 'lucide-react';
import { propertyValuationAPI } from '@/services/api';

const ReportList = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const fetchReports = async (query = '') => {
    setLoading(true);
    try {
      const data = await propertyValuationAPI.getAll(query ? `?search=${encodeURIComponent(query)}` : '');
      setReports(data.results || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchReports(search);
  };

  const handleDownloadPDF = async (id) => {
    try {
      setDownloadingId(id);
      await propertyValuationAPI.generatePDF(id);
    } catch (err) {
      alert(`Error downloading PDF: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this valuation report?')) return;
    try {
      await propertyValuationAPI.delete(id);
      setReports(prev => prev.filter(r => r.id !== id && r._id !== id));
      alert('Report deleted successfully');
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  return (
    <div className={styles.layoutWrapper}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className={styles.rightSide}>
        <Header onMenuToggle={toggleSidebar} />

        <main className={styles.mainScrollArea}>
          <div className={styles.contentPadding}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 className={styles.pageTitle} style={{ margin: 0 }}>Valuation Report List</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                  Manage, filter, and download certified valuation certificates
                </p>
              </div>
              <Link href="/property-values" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--gradient-gold)',
                color: 'var(--bg-primary)',
                padding: '12px 22px',
                borderRadius: 'var(--border-radius)',
                fontWeight: 700,
                fontSize: '0.95rem',
                textDecoration: 'none',
                boxShadow: 'var(--shadow-gold)'
              }}>
                <PlusCircle size={18} />
                <span>New Valuation</span>
              </Link>
            </div>
            
            <div className={styles.card}>
              <form className={styles.searchBar} onSubmit={handleSearch}>
                <div className={styles.searchWrapper}>
                  <Search className={styles.searchIcon} size={18} />
                  <input 
                    type="text" 
                    placeholder="Search by applicant, bank, locality, or report ID..." 
                    className={styles.searchInput} 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <button type="submit" className={styles.filterBtn}>Search</button>
                <button type="button" className={styles.filterBtn} onClick={() => { setSearch(''); fetchReports(''); }}>
                  <RefreshCw size={14} />
                </button>
              </form>

              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Report No / Applicant</th>
                      <th>Bank / Branch</th>
                      <th>Inspection Date</th>
                      <th>Market Value</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#6B7280' }}>
                          Loading valuation reports from database...
                        </td>
                      </tr>
                    ) : reports.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#6B7280' }}>
                          No valuation reports found. Click "New Valuation" to create one or test with sample data.
                        </td>
                      </tr>
                    ) : (
                      reports.map((report) => {
                        const repId = report.id || report._id;
                        const applicant = report.institution_details?.applicant_name || 'Unnamed Applicant';
                        const bank = report.institution_details?.bank_name || 'Not specified';
                        const date = report.institution_details?.date_of_inspection || new Date(report.created_at).toLocaleDateString();
                        const val = report.final_valuation?.final_market_value 
                          ? `₹${Number(report.final_valuation.final_market_value).toLocaleString('en-IN')}` 
                          : 'Pending';
                        const status = report.status || 'draft';

                        return (
                          <tr key={repId}>
                            <td className={styles.reportName}>
                              <div><strong>{applicant}</strong></div>
                              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{report.report_number || repId}</div>
                            </td>
                            <td>{bank}</td>
                            <td>{date}</td>
                            <td style={{ fontWeight: 600, color: '#047857' }}>{val}</td>
                            <td>
                              <span className={`${styles.status} ${styles[status.toLowerCase().replace('_', '-')] || styles.completed}`}>
                                {status.toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <div className={styles.actions}>
                                <button 
                                  className={styles.actionBtn} 
                                  title="Download Valuation PDF"
                                  onClick={() => handleDownloadPDF(repId)}
                                  disabled={downloadingId === repId}
                                >
                                  <Download size={16} color={downloadingId === repId ? '#9CA3AF' : '#1A56DB'} />
                                </button>
                                <button 
                                  className={styles.actionBtn} 
                                  title="Delete Report"
                                  onClick={() => handleDelete(repId)}
                                >
                                  <Trash2 size={16} color="#DC2626" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className={styles.pagination}>
                <span className={styles.pageInfo}>Total {reports.length} report(s)</span>
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
