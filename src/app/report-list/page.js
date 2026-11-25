'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import styles from './ReportList.module.css';
import Sidebar from '@/components/sidebar/Sidebar';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import {
  Search,
  Trash2,
  PlusCircle,
  RefreshCw,
  CheckCircle2,
  Clock,
  Lock,
  Unlock,
  Pencil,
  Inbox,
  Star,
  AlertTriangle,
  XCircle,
  FileText,
  ArrowLeft,
  MailOpen,
  X,
} from 'lucide-react';
import { propertyValuationAPI } from '@/services/api';
import { ApprovedValuerBadge } from '@/components/common/SvgDecorations';

const STARRED_STORAGE_KEY = 'kgn_emp_starred_reports';
const READ_STORAGE_KEY = 'kgn_emp_read_reports';

const getReportCategory = (report) => {
  const s = (report.status || 'draft').toLowerCase();
  if (report.allow_employee_edit || s === 'correction_needed') return 'correction';
  if (s === 'approved' || s === 'completed') return 'approved';
  if (s === 'rejected') return 'rejected';
  if (s === 'pending' || s === 'in_progress') return 'pending';
  return 'draft';
};

const formatDateShort = (dateStr) => {
  if (!dateStr) return 'Recent';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const ReportList = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFolder, setActiveFolder] = useState('all'); // all | approved | correction | rejected | draft | starred
  const [selectedReport, setSelectedReport] = useState(null);
  const [starredIds, setStarredIds] = useState([]);
  const [readIds, setReadIds] = useState([]);

  const containerRef = useRef(null);

  useEffect(() => {
    try {
      const savedStars = JSON.parse(localStorage.getItem(STARRED_STORAGE_KEY) || '[]');
      const savedRead = JSON.parse(localStorage.getItem(READ_STORAGE_KEY) || '[]');
      if (Array.isArray(savedStars)) setStarredIds(savedStars);
      if (Array.isArray(savedRead)) setReadIds(savedRead);
    } catch (_) {}
  }, []);

  const toggleSidebar = () => setIsSidebarOpen((v) => !v);

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
    propertyValuationAPI
      .getAll('')
      .then((data) => {
        if (isMounted) {
          setReports(data.results || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Initial report fetch error:', err);
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleStar = (repId, e) => {
    if (e) e.stopPropagation();
    setStarredIds((prev) => {
      const next = prev.includes(repId) ? prev.filter((id) => id !== repId) : [...prev, repId];
      try {
        localStorage.setItem(STARRED_STORAGE_KEY, JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  const markAsRead = (repId) => {
    setReadIds((prev) => {
      if (prev.includes(repId)) return prev;
      const next = [...prev, repId];
      try {
        localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  const openReportMessage = (report) => {
    const repId = report.id || report._id;
    markAsRead(repId);
    setSelectedReport(report);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchReports(search);
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this valuation draft?')) return;
    try {
      await propertyValuationAPI.delete(id);
      setReports((prev) => prev.filter((r) => r.id !== id && r._id !== id));
      if (selectedReport && (selectedReport.id === id || selectedReport._id === id)) {
        setSelectedReport(null);
      }
      alert('Draft deleted successfully');
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const counts = useMemo(() => {
    const res = { all: reports.length, approved: 0, correction: 0, rejected: 0, draft: 0, starred: 0, unreadApproved: 0 };
    reports.forEach((r) => {
      const repId = r.id || r._id;
      const cat = getReportCategory(r);
      if (cat === 'approved') {
        res.approved += 1;
        if (!readIds.includes(repId)) res.unreadApproved += 1;
      } else if (cat === 'correction') res.correction += 1;
      else if (cat === 'rejected') res.rejected += 1;
      else if (cat === 'draft') res.draft += 1;
      if (starredIds.includes(repId)) res.starred += 1;
    });
    return res;
  }, [reports, starredIds, readIds]);

  const filteredReports = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.filter((r) => {
      const repId = r.id || r._id;
      const cat = getReportCategory(r);

      const matchesFolder =
        activeFolder === 'all' ||
        (activeFolder === 'starred' && starredIds.includes(repId)) ||
        activeFolder === cat;

      if (!matchesFolder) return false;
      if (!q) return true;

      const inst = r.institution_details || r.institutionDetails || {};
      const prop = r.property_identification || r.propertyIdentification || {};
      const haystack = [
        r.report_number,
        r.customer_name,
        inst.applicant_name,
        inst.bank_name,
        inst.branch_name,
        prop.locality_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [reports, activeFolder, starredIds, search]);

  const renderStatusPill = (category) => {
    switch (category) {
      case 'approved':
        return <span className={`${styles.gmailLabelPill} ${styles.pillApproved}`}>Approved</span>;
      case 'correction':
        return <span className={`${styles.gmailLabelPill} ${styles.pillCorrection}`}>Correction</span>;
      case 'rejected':
        return <span className={`${styles.gmailLabelPill} ${styles.pillRejected}`}>Rejected</span>;
      case 'pending':
        return <span className={`${styles.gmailLabelPill} ${styles.pillPending}`}>Under Review</span>;
      default:
        return <span className={`${styles.gmailLabelPill} ${styles.pillDraft}`}>Draft</span>;
    }
  };

  return (
    <div className={styles.layoutWrapper} ref={containerRef}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className={styles.rightSide}>
        <Header onMenuToggle={toggleSidebar} />

        <main className={styles.mainScrollArea}>
          <div className={styles.contentPadding}>
            <div className={styles.pageHeader} style={{ marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <ApprovedValuerBadge size={16} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Report Status &amp; Approval Inbox
                  </span>
                </div>
                <h1 className={styles.pageTitle}>Certificates &amp; Reports Inbox</h1>
                <p className={styles.pageSubtitle}>
                  Track Admin approvals, correction requests, and valuation statuses in one inbox
                </p>
              </div>
            </div>

            {/* ── Gmail Inbox Shell ── */}
            <div className={styles.gmailShell}>
              {/* Top Search Toolbar */}
              <div className={styles.gmailTopBar}>
                <form onSubmit={handleSearch} className={styles.gmailSearchBox}>
                  <Search className={styles.gmailSearchIcon} size={17} />
                  <input
                    type="text"
                    placeholder="Search reports by applicant, bank, locality, or Ref #..."
                    className={styles.gmailSearchInput}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch('');
                        fetchReports('');
                      }}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        background: 'transparent',
                        border: 'none',
                        color: '#5f6368',
                        cursor: 'pointer',
                        display: 'flex',
                      }}
                      title="Clear search"
                    >
                      <X size={16} />
                    </button>
                  )}
                </form>

                <div className={styles.gmailTopActions}>
                  <button
                    type="button"
                    className={styles.gmailIconBtn}
                    onClick={() => fetchReports(search)}
                    title="Refresh Inbox"
                  >
                    <RefreshCw size={17} />
                  </button>
                  <span style={{ fontSize: '0.8rem', color: '#5f6368', fontWeight: 500 }}>
                    {filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'}
                  </span>
                </div>
              </div>

              {/* Body: Left Folders + Main List / Reading Pane */}
              <div className={styles.gmailBody}>
                {/* Left Folder Rail */}
                <aside className={styles.gmailSidebar}>
                  <Link href="/property-values" className={styles.gmailComposeBtn}>
                    <PlusCircle size={18} />
                    <span>New Valuation</span>
                  </Link>

                  <button
                    type="button"
                    className={`${styles.gmailNavItem} ${activeFolder === 'all' ? styles.gmailNavItemActive : ''}`}
                    onClick={() => {
                      setActiveFolder('all');
                      setSelectedReport(null);
                    }}
                  >
                    <span className={styles.gmailNavLeft}>
                      <Inbox size={16} />
                      <span>Inbox</span>
                    </span>
                    <span className={styles.gmailNavCount}>{counts.all}</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.gmailNavItem} ${activeFolder === 'approved' ? styles.gmailNavItemActive : ''}`}
                    onClick={() => {
                      setActiveFolder('approved');
                      setSelectedReport(null);
                    }}
                  >
                    <span className={styles.gmailNavLeft}>
                      <CheckCircle2 size={16} style={{ color: '#15803d' }} />
                      <span>Approved</span>
                    </span>
                    <span
                      className={styles.gmailNavCount}
                      style={{
                        background: counts.unreadApproved > 0 ? '#15803d' : 'transparent',
                        color: counts.unreadApproved > 0 ? '#ffffff' : 'inherit',
                      }}
                    >
                      {counts.unreadApproved > 0 ? `${counts.unreadApproved} new` : counts.approved}
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.gmailNavItem} ${activeFolder === 'correction' ? styles.gmailNavItemActive : ''}`}
                    onClick={() => {
                      setActiveFolder('correction');
                      setSelectedReport(null);
                    }}
                  >
                    <span className={styles.gmailNavLeft}>
                      <AlertTriangle size={16} style={{ color: '#b45309' }} />
                      <span>Corrections</span>
                    </span>
                    <span className={styles.gmailNavCount}>{counts.correction}</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.gmailNavItem} ${activeFolder === 'rejected' ? styles.gmailNavItemActive : ''}`}
                    onClick={() => {
                      setActiveFolder('rejected');
                      setSelectedReport(null);
                    }}
                  >
                    <span className={styles.gmailNavLeft}>
                      <XCircle size={16} style={{ color: '#b91c1c' }} />
                      <span>Rejected</span>
                    </span>
                    <span className={styles.gmailNavCount}>{counts.rejected}</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.gmailNavItem} ${activeFolder === 'draft' ? styles.gmailNavItemActive : ''}`}
                    onClick={() => {
                      setActiveFolder('draft');
                      setSelectedReport(null);
                    }}
                  >
                    <span className={styles.gmailNavLeft}>
                      <FileText size={16} />
                      <span>Drafts</span>
                    </span>
                    <span className={styles.gmailNavCount}>{counts.draft}</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.gmailNavItem} ${activeFolder === 'starred' ? styles.gmailNavItemActive : ''}`}
                    onClick={() => {
                      setActiveFolder('starred');
                      setSelectedReport(null);
                    }}
                  >
                    <span className={styles.gmailNavLeft}>
                      <Star size={16} style={{ color: '#eab308' }} />
                      <span>Starred</span>
                    </span>
                    <span className={styles.gmailNavCount}>{counts.starred}</span>
                  </button>
                </aside>

                {/* Main Content Area */}
                <div className={styles.gmailMainPane}>
                  {selectedReport ? (
                    /* ── Gmail Message Reading View ── */
                    (() => {
                      const repId = selectedReport.id || selectedReport._id;
                      const cat = getReportCategory(selectedReport);
                      const inst = selectedReport.institution_details || selectedReport.institutionDetails || {};
                      const prop = selectedReport.property_identification || selectedReport.propertyIdentification || {};
                      const finalVal = selectedReport.final_valuation || selectedReport.finalValuation || {};
                      const applicant = selectedReport.customer_name || inst.applicant_name || 'Valuation Case';
                      const refNo = selectedReport.report_number || `KGN-2026-${String(repId).slice(-4)}`;
                      const marketVal = finalVal.final_market_value
                        ? `₹${Number(finalVal.final_market_value).toLocaleString('en-IN')}`
                        : '—';
                      const isStarred = starredIds.includes(repId);
                      const canEdit =
                        cat === 'correction' || cat === 'draft';

                      return (
                        <div className={styles.gmailReader}>
                          <div className={styles.gmailReaderToolbar}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                type="button"
                                className={styles.gmailBackBtn}
                                onClick={() => setSelectedReport(null)}
                              >
                                <ArrowLeft size={15} />
                                <span>Back to Inbox</span>
                              </button>
                              <button
                                type="button"
                                className={`${styles.gmailStarBtn} ${isStarred ? styles.gmailStarBtnActive : ''}`}
                                onClick={(e) => toggleStar(repId, e)}
                                title={isStarred ? 'Unstar' : 'Star'}
                              >
                                <Star size={18} fill={isStarred ? '#eab308' : 'none'} />
                              </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {canEdit ? (
                                <Link
                                  href={`/property-values?edit=${encodeURIComponent(repId)}`}
                                  className={styles.actionBtn}
                                  style={{
                                    background: '#0b57d0',
                                    color: '#ffffff',
                                    borderColor: '#0b57d0',
                                  }}
                                >
                                  <Pencil size={14} />
                                  <span>{cat === 'correction' ? 'Edit Correction' : 'Continue Editing'}</span>
                                </Link>
                              ) : (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    background: '#f1f5f9',
                                    color: '#475569',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                  }}
                                >
                                  <Lock size={13} />
                                  <span>Locked</span>
                                </span>
                              )}

                              {cat === 'draft' && (
                                <button
                                  type="button"
                                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                  onClick={(e) => handleDelete(repId, e)}
                                >
                                  <Trash2 size={14} />
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          </div>

                          <h2 className={styles.gmailReaderSubject}>
                            <span>Valuation Report: {applicant}</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#5f6368' }}>
                              ({refNo})
                            </span>
                            {renderStatusPill(cat)}
                          </h2>

                          <div className={styles.gmailSenderCard}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div className={styles.gmailAvatar}>
                                {cat === 'draft' ? 'ME' : 'KA'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1f1f1f' }}>
                                  {cat === 'draft' ? 'My Draft' : 'KGN Associates Admin'}{' '}
                                  <span style={{ fontWeight: 400, color: '#5f6368', fontSize: '0.82rem' }}>
                                    &lt;admin@kgnassociates.com&gt;
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#5f6368' }}>
                                  to me &bull; Updated {formatDateShort(selectedReport.updated_at || selectedReport.created_at)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Status Callout Banner */}
                          {cat === 'approved' && (
                            <div
                              className={styles.gmailStatusBanner}
                              style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <CheckCircle2 size={20} />
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                                    Approved by Admin
                                  </div>
                                  <div style={{ fontSize: '0.82rem' }}>
                                    This valuation report has been reviewed, verified, and approved. It is now locked.
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {cat === 'correction' && (
                            <div
                              className={styles.gmailStatusBanner}
                              style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Unlock size={20} />
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                                    Correction Access Granted
                                  </div>
                                  <div style={{ fontSize: '0.82rem' }}>
                                    Admin unlocked this report for updates. Click &ldquo;Edit Correction&rdquo; above to modify and resubmit.
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {cat === 'rejected' && (
                            <div
                              className={styles.gmailStatusBanner}
                              style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <XCircle size={20} />
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                                    Rejected by Admin
                                  </div>
                                  <div style={{ fontSize: '0.82rem' }}>
                                    Please contact the Admin team to review the reason and request edit access if needed.
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {cat === 'draft' && (
                            <div
                              className={styles.gmailStatusBanner}
                              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155' }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Clock size={20} />
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                                    Saved as Draft
                                  </div>
                                  <div style={{ fontSize: '0.82rem' }}>
                                    Complete all sections and submit this valuation for Admin approval.
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Report Summary Grid */}
                          <div className={styles.gmailSummaryGrid}>
                            <div className={styles.gmailSummaryItem}>
                              <span className={styles.gmailSummaryLabel}>Applicant / Borrower</span>
                              <span className={styles.gmailSummaryValue}>{applicant}</span>
                            </div>
                            <div className={styles.gmailSummaryItem}>
                              <span className={styles.gmailSummaryLabel}>Reference #</span>
                              <span className={styles.gmailSummaryValue}>{refNo}</span>
                            </div>
                            <div className={styles.gmailSummaryItem}>
                              <span className={styles.gmailSummaryLabel}>Bank &amp; Branch</span>
                              <span className={styles.gmailSummaryValue}>
                                {inst.bank_name || '—'} {inst.branch_name ? `(${inst.branch_name})` : ''}
                              </span>
                            </div>
                            <div className={styles.gmailSummaryItem}>
                              <span className={styles.gmailSummaryLabel}>Locality</span>
                              <span className={styles.gmailSummaryValue}>{prop.locality_name || '—'}</span>
                            </div>
                            <div className={styles.gmailSummaryItem}>
                              <span className={styles.gmailSummaryLabel}>Inspection Date</span>
                              <span className={styles.gmailSummaryValue}>{inst.date_of_inspection || '—'}</span>
                            </div>
                            <div className={styles.gmailSummaryItem}>
                              <span className={styles.gmailSummaryLabel}>Assessed Market Value</span>
                              <span className={styles.gmailSummaryValue} style={{ color: '#0b57d0' }}>
                                {marketVal}
                              </span>
                            </div>
                          </div>

                          {finalVal.valuer_remarks && (
                            <div
                              style={{
                                padding: '14px 16px',
                                borderRadius: '10px',
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                fontSize: '0.88rem',
                                color: '#334155',
                              }}
                            >
                              <strong style={{ display: 'block', marginBottom: '4px', color: '#0f172a' }}>
                                Engineer Remarks:
                              </strong>
                              {finalVal.valuer_remarks}
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    /* ── Gmail Category Tabs + Message List ── */
                    <>
                      <div className={styles.gmailTabs}>
                        <button
                          type="button"
                          className={`${styles.gmailTab} ${activeFolder === 'all' ? styles.gmailTabActive : ''}`}
                          onClick={() => setActiveFolder('all')}
                        >
                          <Inbox size={16} />
                          <span>Primary</span>
                          <span className={styles.gmailTabBadge} style={{ background: '#e2e8f0', color: '#334155' }}>
                            {counts.all}
                          </span>
                        </button>

                        <button
                          type="button"
                          className={`${styles.gmailTab} ${activeFolder === 'approved' ? styles.gmailTabActive : ''}`}
                          onClick={() => setActiveFolder('approved')}
                        >
                          <CheckCircle2 size={16} style={{ color: '#15803d' }} />
                          <span>Approved</span>
                          {counts.approved > 0 && (
                            <span className={styles.gmailTabBadge} style={{ background: '#dcfce7', color: '#15803d' }}>
                              {counts.approved}
                            </span>
                          )}
                        </button>

                        <button
                          type="button"
                          className={`${styles.gmailTab} ${activeFolder === 'correction' ? styles.gmailTabActive : ''}`}
                          onClick={() => setActiveFolder('correction')}
                        >
                          <AlertTriangle size={16} style={{ color: '#b45309' }} />
                          <span>Corrections</span>
                          {counts.correction > 0 && (
                            <span className={styles.gmailTabBadge} style={{ background: '#fef3c7', color: '#b45309' }}>
                              {counts.correction}
                            </span>
                          )}
                        </button>

                        <button
                          type="button"
                          className={`${styles.gmailTab} ${activeFolder === 'rejected' ? styles.gmailTabActive : ''}`}
                          onClick={() => setActiveFolder('rejected')}
                        >
                          <XCircle size={16} style={{ color: '#b91c1c' }} />
                          <span>Rejected</span>
                          {counts.rejected > 0 && (
                            <span className={styles.gmailTabBadge} style={{ background: '#fee2e2', color: '#b91c1c' }}>
                              {counts.rejected}
                            </span>
                          )}
                        </button>
                      </div>

                      <div className={styles.gmailList}>
                        {loading ? (
                          <div style={{ textAlign: 'center', padding: '56px 20px', color: '#64748b' }}>
                            Loading your valuation inbox...
                          </div>
                        ) : filteredReports.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '56px 20px', color: '#64748b' }}>
                            <MailOpen size={36} style={{ margin: '0 auto 10px', opacity: 0.45, display: 'block' }} />
                            <div style={{ fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                              No messages in this folder
                            </div>
                            <div style={{ fontSize: '0.85rem' }}>
                              Try switching tabs or click &ldquo;New Valuation&rdquo; to submit a report.
                            </div>
                          </div>
                        ) : (
                          filteredReports.map((report) => {
                            const repId = report.id || report._id;
                            const cat = getReportCategory(report);
                            const isRead = readIds.includes(repId);
                            const isStarred = starredIds.includes(repId);
                            const inst = report.institution_details || report.institutionDetails || {};
                            const prop = report.property_identification || report.propertyIdentification || {};
                            const finalVal = report.final_valuation || report.finalValuation || {};
                            const applicant = report.customer_name || inst.applicant_name || 'Valuation Case';
                            const bank = inst.bank_name || 'Not Specified';
                            const refNo = report.report_number || `KGN-2026-${String(repId).slice(-4)}`;
                            const marketVal = finalVal.final_market_value
                              ? `₹${Number(finalVal.final_market_value).toLocaleString('en-IN')}`
                              : '';
                            const dateStr = formatDateShort(
                              report.updated_at || inst.date_of_inspection || report.created_at
                            );

                            const senderLabel =
                              cat === 'approved'
                                ? 'KGN Admin'
                                : cat === 'correction'
                                ? 'Admin (Edit)'
                                : cat === 'rejected'
                                ? 'KGN Admin'
                                : cat === 'draft'
                                ? 'Draft'
                                : 'Submitted';

                            return (
                              <div
                                key={repId}
                                className={`${styles.gmailRow} ${isRead ? styles.gmailRowRead : ''}`}
                                onClick={() => openReportMessage(report)}
                              >
                                <button
                                  type="button"
                                  className={`${styles.gmailStarBtn} ${isStarred ? styles.gmailStarBtnActive : ''}`}
                                  onClick={(e) => toggleStar(repId, e)}
                                  title={isStarred ? 'Unstar' : 'Star'}
                                >
                                  <Star size={16} fill={isStarred ? '#eab308' : 'none'} />
                                </button>

                                {!isRead ? (
                                  <span className={styles.gmailUnreadDot} title="Unread" />
                                ) : (
                                  <span className={styles.gmailReadSpacer} />
                                )}

                                <div className={styles.gmailSenderCol}>
                                  <span className={`${styles.gmailSenderName} ${!isRead ? styles.gmailBold : ''}`}>
                                    {senderLabel}
                                  </span>
                                </div>

                                <div className={styles.gmailSubjectCol}>
                                  {renderStatusPill(cat)}
                                  <span className={`${styles.gmailSubjectText} ${!isRead ? styles.gmailBold : ''}`}>
                                    {applicant} ({refNo})
                                  </span>
                                  <span className={styles.gmailSnippetText}>
                                    — {bank}
                                    {prop.locality_name ? ` • ${prop.locality_name}` : ''}
                                    {marketVal ? ` • ${marketVal}` : ''}
                                  </span>
                                </div>

                                <div className={styles.gmailRowRight} onClick={(e) => e.stopPropagation()}>
                                  {(cat === 'correction' || cat === 'draft') && (
                                    <Link
                                      href={`/property-values?edit=${encodeURIComponent(repId)}`}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        background: '#eff6ff',
                                        color: '#1d4ed8',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        textDecoration: 'none',
                                        border: '1px solid #bfdbfe',
                                      }}
                                    >
                                      <Pencil size={12} />
                                      <span>Edit</span>
                                    </Link>
                                  )}
                                  {cat === 'draft' && (
                                    <button
                                      type="button"
                                      className={styles.gmailIconBtn}
                                      onClick={(e) => handleDelete(repId, e)}
                                      title="Delete Draft"
                                      style={{ width: '30px', height: '30px', color: '#dc2626' }}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                  <span className={`${styles.gmailDateText} ${!isRead ? styles.gmailBold : ''}`}>
                                    {dateStr}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </>
                  )}
                </div>
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
