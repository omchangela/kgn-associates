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
  Send,
  Paperclip,
  Download,
  ExternalLink,
} from 'lucide-react';
import { propertyValuationAPI, apiRequest } from '@/services/api';

const STARRED_STORAGE_KEY = 'kgn_emp_starred_reports';
const READ_STORAGE_KEY = 'kgn_emp_read_reports';

const getReportCategory = (item) => {
  if (item._kind === 'allotment') return 'allotted';
  const s = (item.status || 'draft').toLowerCase();
  if (item.allow_employee_edit || s === 'correction_needed') return 'correction';
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
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFolder, setActiveFolder] = useState('all'); // all | allotted | approved | correction | rejected | draft | starred
  const [selectedItem, setSelectedItem] = useState(null);
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

  const fetchAllData = useCallback(async (query = '') => {
    setLoading(true);
    try {
      const [repData, assignRes] = await Promise.all([
        propertyValuationAPI.getAll(query ? `?search=${encodeURIComponent(query)}` : ''),
        apiRequest('/assignments').then((r) => r.json()).catch(() => ({ assignments: [] })),
      ]);
      setReports(repData?.results || []);
      setAssignments(assignRes?.assignments || []);
    } catch (err) {
      console.error('Error fetching inbox data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData('');
  }, [fetchAllData]);

  const toggleStar = (itemId, e) => {
    if (e) e.stopPropagation();
    setStarredIds((prev) => {
      const next = prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId];
      try {
        localStorage.setItem(STARRED_STORAGE_KEY, JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  const markAsRead = (itemId) => {
    setReadIds((prev) => {
      if (prev.includes(itemId)) return prev;
      const next = [...prev, itemId];
      try {
        localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  const openMessage = (item) => {
    const itemId = item.id || item._id;
    markAsRead(itemId);
    setSelectedItem(item);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchAllData(search);
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this valuation draft?')) return;
    try {
      await propertyValuationAPI.delete(id);
      setReports((prev) => prev.filter((r) => r.id !== id && r._id !== id));
      if (selectedItem && (selectedItem.id === id || selectedItem._id === id)) {
        setSelectedItem(null);
      }
      alert('Draft deleted successfully');
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const openPdfInNewTab = (pdfUrl, title) => {
    if (!pdfUrl) return;
    const win = window.open();
    if (win) {
      win.document.write(
        `<iframe src="${pdfUrl}" style="border:0;width:100%;height:100vh;" title="${title || 'Case PDF'}"></iframe>`
      );
    }
  };

  // Merge allotted cases + submitted/draft reports into unified inbox list
  const allInboxItems = useMemo(() => {
    const taggedAssigns = (assignments || []).map((a) => ({
      ...a,
      _kind: 'allotment',
      _sortTime: new Date(a.updated_at || a.created_at || 0).getTime(),
    }));
    const taggedReports = (reports || []).map((r) => ({
      ...r,
      _kind: 'report',
      _sortTime: new Date(r.updated_at || r.created_at || 0).getTime(),
    }));
    return [...taggedAssigns, ...taggedReports].sort((a, b) => b._sortTime - a._sortTime);
  }, [assignments, reports]);

  const counts = useMemo(() => {
    const res = {
      all: allInboxItems.length,
      allotted: 0,
      unreadAllotted: 0,
      approved: 0,
      unreadApproved: 0,
      correction: 0,
      rejected: 0,
      draft: 0,
      starred: 0,
    };
    allInboxItems.forEach((item) => {
      const itemId = item.id || item._id;
      const cat = getReportCategory(item);
      if (cat === 'allotted') {
        res.allotted += 1;
        if (!readIds.includes(itemId)) res.unreadAllotted += 1;
      } else if (cat === 'approved') {
        res.approved += 1;
        if (!readIds.includes(itemId)) res.unreadApproved += 1;
      } else if (cat === 'correction') res.correction += 1;
      else if (cat === 'rejected') res.rejected += 1;
      else if (cat === 'draft') res.draft += 1;
      if (starredIds.includes(itemId)) res.starred += 1;
    });
    return res;
  }, [allInboxItems, starredIds, readIds]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allInboxItems.filter((item) => {
      const itemId = item.id || item._id;
      const cat = getReportCategory(item);

      const matchesFolder =
        activeFolder === 'all' ||
        (activeFolder === 'starred' && starredIds.includes(itemId)) ||
        activeFolder === cat;

      if (!matchesFolder) return false;
      if (!q) return true;

      if (item._kind === 'allotment') {
        const hay = [
          item.case_id,
          item.applicant_name,
          item.contact_number,
          item.bank_name,
          item.branch_name,
          item.property_address,
          item.pdf_name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      }

      const inst = item.institution_details || item.institutionDetails || {};
      const prop = item.property_identification || item.propertyIdentification || {};
      const haystack = [
        item.report_number,
        item.customer_name,
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
  }, [allInboxItems, activeFolder, starredIds, search]);

  const renderStatusPill = (category) => {
    switch (category) {
      case 'allotted':
        return <span className={`${styles.gmailLabelPill} ${styles.pillPending}`}>Allotted</span>;
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
          <div className={styles.fullScreenInboxWrap}>
            {/* ── Gmail Inbox Shell ── */}
            <div className={styles.gmailShell}>
              {/* Top Search Toolbar */}
              <div className={styles.gmailTopBar}>
                <form onSubmit={handleSearch} className={styles.gmailSearchBox}>
                  <Search className={styles.gmailSearchIcon} size={17} />
                  <input
                    type="text"
                    placeholder="Search inbox by applicant, case ID, bank, locality, or Ref #..."
                    className={styles.gmailSearchInput}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch('');
                        fetchAllData('');
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
                    onClick={() => fetchAllData(search)}
                    title="Refresh Inbox"
                  >
                    <RefreshCw size={17} />
                  </button>
                  <span style={{ fontSize: '0.8rem', color: '#5f6368', fontWeight: 500 }}>
                    {filteredItems.length} {filteredItems.length === 1 ? 'message' : 'messages'}
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
                      setSelectedItem(null);
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
                    className={`${styles.gmailNavItem} ${activeFolder === 'allotted' ? styles.gmailNavItemActive : ''}`}
                    onClick={() => {
                      setActiveFolder('allotted');
                      setSelectedItem(null);
                    }}
                  >
                    <span className={styles.gmailNavLeft}>
                      <Send size={16} style={{ color: '#1d4ed8' }} />
                      <span>Allotted Cases</span>
                    </span>
                    <span
                      className={styles.gmailNavCount}
                      style={{
                        background: counts.unreadAllotted > 0 ? '#1d4ed8' : 'transparent',
                        color: counts.unreadAllotted > 0 ? '#ffffff' : 'inherit',
                      }}
                    >
                      {counts.unreadAllotted > 0 ? `${counts.unreadAllotted} new` : counts.allotted}
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.gmailNavItem} ${activeFolder === 'approved' ? styles.gmailNavItemActive : ''}`}
                    onClick={() => {
                      setActiveFolder('approved');
                      setSelectedItem(null);
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
                      setSelectedItem(null);
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
                      setSelectedItem(null);
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
                      setSelectedItem(null);
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
                      setSelectedItem(null);
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
                  {selectedItem ? (
                    selectedItem._kind === 'allotment' ? (
                      /* ── Allotted Case Reading View (with PDF) ── */
                      (() => {
                        const a = selectedItem;
                        const isStarred = starredIds.includes(a.id);
                        return (
                          <div className={styles.gmailReader}>
                            <div className={styles.gmailReaderToolbar}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                  type="button"
                                  className={styles.gmailBackBtn}
                                  onClick={() => setSelectedItem(null)}
                                >
                                  <ArrowLeft size={15} />
                                  <span>Back to Inbox</span>
                                </button>
                                <button
                                  type="button"
                                  className={`${styles.gmailStarBtn} ${isStarred ? styles.gmailStarBtnActive : ''}`}
                                  onClick={(e) => toggleStar(a.id, e)}
                                >
                                  <Star size={18} fill={isStarred ? '#eab308' : 'none'} />
                                </button>
                              </div>

                              <Link
                                href={`/property-values?${new URLSearchParams({
                                  ...(a.case_id ? { case_id: a.case_id } : {}),
                                  ...(a.applicant_name ? { applicant: a.applicant_name } : {}),
                                  ...(a.contact_number ? { contact: a.contact_number } : {}),
                                  ...(a.bank_name ? { bank: a.bank_name } : {}),
                                  ...(a.branch_name ? { branch: a.branch_name } : {}),
                                  ...(a.property_address ? { address: a.property_address } : {}),
                                }).toString()}`}
                                className={styles.actionBtn}
                                style={{
                                  background: '#0b57d0',
                                  color: '#ffffff',
                                  borderColor: '#0b57d0',
                                }}
                              >
                                <PlusCircle size={14} />
                                <span>Start Valuation Form</span>
                              </Link>
                            </div>

                            <h2 className={styles.gmailReaderSubject}>
                              <span>New Case Allotted: {a.applicant_name || 'Valuation Case'}</span>
                              {a.case_id && (
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#5f6368' }}>
                                  (Case ID: {a.case_id})
                                </span>
                              )}
                              {renderStatusPill('allotted')}
                            </h2>

                            <div className={styles.gmailSenderCard}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div className={styles.gmailAvatar}>KA</div>
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1f1f1f' }}>
                                    KGN Associates Admin{' '}
                                    <span style={{ fontWeight: 400, color: '#5f6368', fontSize: '0.82rem' }}>
                                      &lt;admin@kgnassociates.com&gt;
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '0.78rem', color: '#5f6368' }}>
                                    to me &bull; Allotted {formatDateShort(a.created_at)}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div
                              className={styles.gmailStatusBanner}
                              style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af' }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Send size={20} />
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                                    Work Assigned by Admin
                                  </div>
                                  <div style={{ fontSize: '0.82rem' }}>
                                    {a.notes || 'Please inspect this property and submit the valuation report.'}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className={styles.gmailSummaryGrid}>
                              <div className={styles.gmailSummaryItem}>
                                <span className={styles.gmailSummaryLabel}>Case ID</span>
                                <span className={styles.gmailSummaryValue}>{a.case_id || '—'}</span>
                              </div>
                              <div className={styles.gmailSummaryItem}>
                                <span className={styles.gmailSummaryLabel}>Applicant Name</span>
                                <span className={styles.gmailSummaryValue}>{a.applicant_name || '—'}</span>
                              </div>
                              <div className={styles.gmailSummaryItem}>
                                <span className={styles.gmailSummaryLabel}>Contact Number</span>
                                <span className={styles.gmailSummaryValue}>{a.contact_number || '—'}</span>
                              </div>
                              <div className={styles.gmailSummaryItem}>
                                <span className={styles.gmailSummaryLabel}>Bank &amp; Branch</span>
                                <span className={styles.gmailSummaryValue}>
                                  {a.bank_name || '—'} {a.branch_name ? `(${a.branch_name})` : ''}
                                </span>
                              </div>
                              <div className={styles.gmailSummaryItem} style={{ gridColumn: '1 / -1' }}>
                                <span className={styles.gmailSummaryLabel}>Property Address</span>
                                <span className={styles.gmailSummaryValue}>{a.property_address || '—'}</span>
                              </div>
                            </div>

                            {/* Attached PDF Section */}
                            {a.pdf_url && (
                              <div
                                style={{
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '12px',
                                  overflow: 'hidden',
                                  background: '#ffffff',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 16px',
                                    background: '#f8fafc',
                                    borderBottom: '1px solid #e2e8f0',
                                    flexWrap: 'wrap',
                                    gap: '10px',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                                    <Paperclip size={16} style={{ color: '#0b57d0' }} />
                                    <span>Attached Case PDF: {a.pdf_name || 'Document.pdf'}</span>
                                  </div>
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                      type="button"
                                      onClick={() => openPdfInNewTab(a.pdf_url, a.pdf_name)}
                                      className={styles.actionBtn}
                                    >
                                      <ExternalLink size={14} />
                                      <span>Open Fullscreen</span>
                                    </button>
                                    <a
                                      href={a.pdf_url}
                                      download={a.pdf_name || 'case_document.pdf'}
                                      className={styles.actionBtn}
                                      style={{ background: '#0b57d0', color: '#fff', borderColor: '#0b57d0' }}
                                    >
                                      <Download size={14} />
                                      <span>Download PDF</span>
                                    </a>
                                  </div>
                                </div>
                                <iframe
                                  src={a.pdf_url}
                                  title={a.pdf_name || 'Attached Case PDF'}
                                  style={{ width: '100%', height: '520px', border: 'none', display: 'block' }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      /* ── Valuation Report Reading View ── */
                      (() => {
                        const repId = selectedItem.id || selectedItem._id;
                        const cat = getReportCategory(selectedItem);
                        const inst = selectedItem.institution_details || selectedItem.institutionDetails || {};
                        const prop = selectedItem.property_identification || selectedItem.propertyIdentification || {};
                        const finalVal = selectedItem.final_valuation || selectedItem.finalValuation || {};
                        const applicant = selectedItem.customer_name || inst.applicant_name || 'Valuation Case';
                        const refNo = selectedItem.report_number || `KGN-2026-${String(repId).slice(-4)}`;
                        const marketVal = finalVal.final_market_value
                          ? `₹${Number(finalVal.final_market_value).toLocaleString('en-IN')}`
                          : '—';
                        const isStarred = starredIds.includes(repId);
                        const canEdit = cat === 'correction' || cat === 'draft';

                        return (
                          <div className={styles.gmailReader}>
                            <div className={styles.gmailReaderToolbar}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                  type="button"
                                  className={styles.gmailBackBtn}
                                  onClick={() => setSelectedItem(null)}
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

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                {cat === 'approved' && (
                                  <>
                                    <a
                                      href={`/api/valuations/${encodeURIComponent(repId)}/generate-pdf`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={styles.actionBtn}
                                    >
                                      <ExternalLink size={14} />
                                      <span>View PDF</span>
                                    </a>
                                    <a
                                      href={`/api/valuations/${encodeURIComponent(repId)}/generate-pdf?download=1`}
                                      download={`${refNo}.pdf`}
                                      className={styles.actionBtn}
                                      style={{
                                        background: '#15803d',
                                        color: '#ffffff',
                                        borderColor: '#15803d',
                                      }}
                                    >
                                      <Download size={14} />
                                      <span>Download PDF</span>
                                    </a>
                                  </>
                                )}
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
                                    to me &bull; Updated {formatDateShort(selectedItem.updated_at || selectedItem.created_at)}
                                  </div>
                                </div>
                              </div>
                            </div>

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
                                      This valuation dossier has been reviewed, verified, and approved. You can view or download the certified PDF below.
                                    </div>
                                  </div>
                                </div>
                                <a
                                  href={`/api/valuations/${encodeURIComponent(repId)}/generate-pdf?download=1`}
                                  download={`${refNo}.pdf`}
                                  className={styles.actionBtn}
                                  style={{
                                    background: '#15803d',
                                    color: '#ffffff',
                                    borderColor: '#15803d',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  <Download size={14} />
                                  <span>Download PDF</span>
                                </a>
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
                    )
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
                          className={`${styles.gmailTab} ${activeFolder === 'allotted' ? styles.gmailTabActive : ''}`}
                          onClick={() => setActiveFolder('allotted')}
                        >
                          <Send size={16} style={{ color: '#1d4ed8' }} />
                          <span>Allotted Cases</span>
                          {counts.allotted > 0 && (
                            <span className={styles.gmailTabBadge} style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                              {counts.allotted}
                            </span>
                          )}
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
                      </div>

                      <div className={styles.gmailList}>
                        {loading ? (
                          <div style={{ textAlign: 'center', padding: '56px 20px', color: '#64748b' }}>
                            Loading your valuation inbox...
                          </div>
                        ) : filteredItems.length === 0 ? (
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
                          filteredItems.map((item) => {
                            const itemId = item.id || item._id;
                            const cat = getReportCategory(item);
                            const isRead = readIds.includes(itemId);
                            const isStarred = starredIds.includes(itemId);

                            if (item._kind === 'allotment') {
                              return (
                                <div
                                  key={itemId}
                                  className={`${styles.gmailRow} ${isRead ? styles.gmailRowRead : ''}`}
                                  onClick={() => openMessage(item)}
                                >
                                  <button
                                    type="button"
                                    className={`${styles.gmailStarBtn} ${isStarred ? styles.gmailStarBtnActive : ''}`}
                                    onClick={(e) => toggleStar(itemId, e)}
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
                                      KGN Admin
                                    </span>
                                  </div>

                                  <div className={styles.gmailSubjectCol}>
                                    {renderStatusPill('allotted')}
                                    <span className={`${styles.gmailSubjectText} ${!isRead ? styles.gmailBold : ''}`}>
                                      {item.applicant_name || 'New Case'} {item.case_id ? `(${item.case_id})` : ''}
                                    </span>
                                    <span className={styles.gmailSnippetText}>
                                      — {item.bank_name || 'Bank'}
                                      {item.branch_name ? ` (${item.branch_name})` : ''}
                                      {item.property_address ? ` • ${item.property_address}` : ''}
                                    </span>
                                  </div>

                                  <div className={styles.gmailRowRight} onClick={(e) => e.stopPropagation()}>
                                    {item.pdf_url && (
                                      <button
                                        type="button"
                                        onClick={() => openPdfInNewTab(item.pdf_url, item.pdf_name)}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          padding: '4px 9px',
                                          borderRadius: '6px',
                                          background: '#eff6ff',
                                          color: '#1d4ed8',
                                          fontSize: '0.74rem',
                                          fontWeight: 600,
                                          border: '1px solid #bfdbfe',
                                          cursor: 'pointer',
                                        }}
                                        title={`Open ${item.pdf_name || 'Attached PDF'}`}
                                      >
                                        <Paperclip size={12} />
                                        <span>PDF</span>
                                      </button>
                                    )}
                                    <span className={`${styles.gmailDateText} ${!isRead ? styles.gmailBold : ''}`}>
                                      {formatDateShort(item.created_at)}
                                    </span>
                                  </div>
                                </div>
                              );
                            }

                            const inst = item.institution_details || item.institutionDetails || {};
                            const prop = item.property_identification || item.propertyIdentification || {};
                            const finalVal = item.final_valuation || item.finalValuation || {};
                            const applicant = item.customer_name || inst.applicant_name || 'Valuation Case';
                            const bank = inst.bank_name || 'Not Specified';
                            const refNo = item.report_number || `KGN-2026-${String(itemId).slice(-4)}`;
                            const marketVal = finalVal.final_market_value
                              ? `₹${Number(finalVal.final_market_value).toLocaleString('en-IN')}`
                              : '';
                            const dateStr = formatDateShort(
                              item.updated_at || inst.date_of_inspection || item.created_at
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
                                key={itemId}
                                className={`${styles.gmailRow} ${isRead ? styles.gmailRowRead : ''}`}
                                onClick={() => openMessage(item)}
                              >
                                <button
                                  type="button"
                                  className={`${styles.gmailStarBtn} ${isStarred ? styles.gmailStarBtnActive : ''}`}
                                  onClick={(e) => toggleStar(itemId, e)}
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
                                  {cat === 'approved' && (
                                    <a
                                      href={`/api/valuations/${encodeURIComponent(itemId)}/generate-pdf?download=1`}
                                      download={`${refNo}.pdf`}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        background: '#dcfce7',
                                        color: '#15803d',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        textDecoration: 'none',
                                        border: '1px solid #bbf7d0',
                                      }}
                                      title="Download Approved PDF"
                                    >
                                      <Download size={12} />
                                      <span>PDF</span>
                                    </a>
                                  )}
                                  {(cat === 'correction' || cat === 'draft') && (
                                    <Link
                                      href={`/property-values?edit=${encodeURIComponent(itemId)}`}
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
                                      onClick={(e) => handleDelete(itemId, e)}
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
