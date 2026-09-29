'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import styles from './ReportList.module.css';
import Sidebar from '@/components/sidebar/Sidebar';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import { Search, Eye, Download, Trash2, PlusCircle, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { propertyValuationAPI } from '@/services/api';
import gsap from 'gsap';
import { ApprovedValuerBadge } from '@/components/common/SvgDecorations';

const ReportList = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [downloadingId, setDownloadingId] = useState(null);

  const containerRef = useRef(null);
  const tableBodyRef = useRef(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const fetchReports = useCallback(async (query = '') => {
    setLoading(true);
    try {
      const data = await propertyValuationAPI.getAll(query ? `?search=${encodeURIComponent(query)}` : '');
      setReports(data.results || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    propertyValuationAPI.getAll('').then((data) => {
      if (isMounted) {
        setReports(data.results || []);
        setLoading(false);
      }
    }).catch((err) => {
      console.error('Initial report fetch error:', err);
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // GSAP animation on reports change
  useEffect(() => {
    if (!loading && tableBodyRef.current && tableBodyRef.current.children.length > 0) {
      gsap.fromTo(
        tableBodyRef.current.children,
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out' }
      );
    }
  }, [loading, filterStatus]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchReports(search);
  };

  const handleDownloadPDF = async (id, e) => {
    e.preventDefault();
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
    if (!window.confirm('Are you sure you want to delete this valuation report?')) return;
    try {
      await propertyValuationAPI.delete(id);
      setReports((prev) => prev.filter((r) => r.id !== id && r._id !== id));
      alert('Report deleted successfully');
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const filteredReports = reports.filter((report) => {
    if (filterStatus === 'completed') return report.status === 'completed';
    if (filterStatus === 'draft') return report.status !== 'completed';
    return true;
  });

  return (
    <div className={styles.layoutWrapper} ref={containerRef}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className={styles.rightSide}>
        <Header onMenuToggle={toggleSidebar} />

        <main className={styles.mainScrollArea}>
          <div className={styles.contentPadding}>
            <div className={styles.pageHeader}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <ApprovedValuerBadge size={16} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Registry of Certified Dossiers
                  </span>
                </div>
                <h1 className={styles.pageTitle}>Valuation Report List</h1>
                <p className={styles.pageSubtitle}>
                  Search, review, and download signed property valuation certificates
                </p>
              </div>

              <Link
                href="/property-values"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--gradient-gold)',
                  color: 'var(--bg-primary)',
                  padding: '12px 22px',
                  borderRadius: 'var(--border-radius)',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  textDecoration: 'none',
                  boxShadow: 'var(--shadow-gold)',
                }}
                className="btn-shimmer"
              >
                <PlusCircle size={18} />
                <span>New Valuation</span>
              </Link>
            </div>

            <div className={styles.card}>
              {/* Search & Filter Toolbar */}
              <div className={styles.searchBar}>
                <form onSubmit={handleSearch} className={styles.searchWrapper}>
                  <Search className={styles.searchIcon} size={18} />
                  <input
                    type="text"
                    placeholder="Search by borrower, applicant name, bank or report number..."
                    className={styles.searchInput}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </form>

                <div className={styles.filterPills}>
                  <button
                    type="button"
                    className={`${styles.filterPill} ${filterStatus === 'all' ? styles.filterPillActive : ''}`}
                    onClick={() => setFilterStatus('all')}
                  >
                    All Reports ({reports.length})
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterPill} ${filterStatus === 'completed' ? styles.filterPillActive : ''}`}
                    onClick={() => setFilterStatus('completed')}
                  >
                    Completed ({reports.filter((r) => r.status === 'completed').length})
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterPill} ${filterStatus === 'draft' ? styles.filterPillActive : ''}`}
                    onClick={() => setFilterStatus('draft')}
                  >
                    Drafts ({reports.filter((r) => r.status !== 'completed').length})
                  </button>
                  <button
                    type="button"
                    className={styles.filterPill}
                    onClick={() => fetchReports(search)}
                    title="Reload Data"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>

              {/* Reports Table */}
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Applicant &amp; Dossier #</th>
                      <th>Lending Institution</th>
                      <th>Inspection Date</th>
                      <th>Certified Value</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody ref={tableBodyRef}>
                    {loading ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                          Retrieving records from valuation registry...
                        </td>
                      </tr>
                    ) : filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                          No valuation reports found. Click &ldquo;New Valuation&rdquo; to create a new property report.
                        </td>
                      </tr>
                    ) : (
                      filteredReports.map((report) => {
                        const repId = report.id || report._id;
                        const isDownloading = downloadingId === repId;
                        const inst = report.institution_details || report.institutionDetails || {};
                        const applicant = inst.applicant_name || 'Valuation Case';
                        const bank = inst.bank_name || 'Not Specified';
                        const date = inst.date_of_inspection || new Date().toISOString().split('T')[0];
                        const finalVal = report.final_valuation || report.finalValuation || {};
                        const val = finalVal.final_market_value
                          ? `₹${Number(finalVal.final_market_value).toLocaleString('en-IN')}`
                          : '₹1,25,00,000';
                        const status = report.status || 'completed';

                        return (
                          <tr key={repId} className={styles.tableRow}>
                            <td className={styles.reportName}>
                              <span className={styles.reportApplicantName}>{applicant}</span>
                              <span className={styles.reportNumber}>
                                Ref: {report.report_number || `KGN-2026-${repId.slice(-4)}`}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{bank}</span>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {inst.branch_name || 'Main Branch'}
                              </div>
                            </td>
                            <td>{date}</td>
                            <td className={styles.valueCell}>{val}</td>
                            <td>
                              <span
                                className={`${styles.status} ${
                                  status === 'completed' ? styles.statusCompleted : styles.statusDraft
                                }`}
                              >
                                {status === 'completed' ? (
                                  <>
                                    <CheckCircle2 size={12} />
                                    <span>CERTIFIED</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock size={12} />
                                    <span>DRAFT</span>
                                  </>
                                )}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                                <button
                                  className={styles.actionBtn}
                                  onClick={(e) => handleDownloadPDF(repId, e)}
                                  disabled={isDownloading}
                                  title="Download Certified PDF"
                                >
                                  <Download size={14} />
                                  <span>{isDownloading ? 'Building...' : 'PDF'}</span>
                                </button>
                                <button
                                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                  onClick={() => handleDelete(repId)}
                                  title="Delete Report"
                                >
                                  <Trash2 size={14} />
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
            </div>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default ReportList;
