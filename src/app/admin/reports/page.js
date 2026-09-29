'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import Footer from '@/components/footer/Footer';
import styles from './AdminReports.module.css';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  RefreshCw, 
  Eye, 
  Building2, 
  User, 
  Calendar, 
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
  MapPin,
  IndianRupee,
  Briefcase
} from 'lucide-react';
import { ArchitecturalGridSvg, KgnCrest } from '@/components/common/SvgDecorations';

export default function AdminReportsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [notification, setNotification] = useState({ text: '', type: '' });
  const [selectedReport, setSelectedReport] = useState(null); // For detail preview modal

  const showNotification = (text, type = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification({ text: '', type: '' }), 4000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [repRes, usersRes] = await Promise.all([
        fetch('/api/valuations?limit=100'),
        fetch('/api/users')
      ]);

      const repData = await repRes.json();
      const usersData = await usersRes.json();

      if (repData && repData.results) {
        setReports(repData.results);
      } else if (Array.isArray(repData)) {
        setReports(repData);
      }

      if (usersData && usersData.users) {
        setUsers(usersData.users);
      }
    } catch (err) {
      console.error('Failed to load reports data:', err);
      showNotification('Failed to load reports from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Map employee name from createdBy or fallback to assigned valuer
  const getEmployeeInfo = (report) => {
    const creatorId = report.createdBy || report.created_by;
    if (creatorId) {
      const match = users.find(u => u.id === creatorId || u._id === creatorId);
      if (match) {
        const fullName = `${match.first_name || ''} ${match.last_name || ''}`.trim() || match.username;
        return {
          name: fullName,
          role: match.role || 'Valuer',
          city: match.city || '',
          initials: fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'EM',
        };
      }
    }

    const valuerName = report.final_valuation?.valuer_name || 
      report.institution_details?.valuer_name || 
      report.institution_details?.applicant_name ? 'Rajesh Kumar' : 'Certified Valuer';

    return {
      name: valuerName,
      role: 'Valuer',
      city: 'Surat',
      initials: valuerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'VA',
    };
  };

  // Status update: Approve or Reject
  const handleUpdateStatus = async (reportId, newStatus) => {
    setUpdatingId(reportId);
    try {
      const res = await fetch('/api/admin/reports/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reportId, status: newStatus }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showNotification(`Report marked as ${newStatus.toUpperCase()}`, 'success');
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
        if (selectedReport && selectedReport.id === reportId) {
          setSelectedReport(prev => ({ ...prev, status: newStatus }));
        }
      } else {
        showNotification(data.error || 'Failed to update status', 'error');
      }
    } catch {
      showNotification('Network error updating status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const customer = (r.customer_name || r.institution_details?.applicant_name || r.applicant_name || '').toLowerCase();
      const repNo = (r.report_number || '').toLowerCase();
      const bank = (r.institution_details?.bank_name || r.bank_name || '').toLowerCase();
      const locality = (r.property_identification?.locality_name || r.locality_name || '').toLowerCase();
      const emp = getEmployeeInfo(r).name.toLowerCase();
      const q = searchQuery.toLowerCase();

      const matchSearch = !q || customer.includes(q) || repNo.includes(q) || bank.includes(q) || locality.includes(q) || emp.includes(q);

      const rStatus = (r.status || 'draft').toLowerCase();
      const matchStatus = 
        selectedStatus === 'all' ||
        (selectedStatus === 'approved' && (rStatus === 'approved' || rStatus === 'completed')) ||
        (selectedStatus === 'rejected' && rStatus === 'rejected') ||
        (selectedStatus === 'pending' && (rStatus === 'pending' || rStatus === 'in_progress')) ||
        (selectedStatus === 'draft' && rStatus === 'draft');

      return matchSearch && matchStatus;
    });
  }, [reports, searchQuery, selectedStatus, users]);

  // Metric counts
  const counts = useMemo(() => {
    const total = reports.length;
    const approved = reports.filter(r => r.status === 'approved' || r.status === 'completed').length;
    const rejected = reports.filter(r => r.status === 'rejected').length;
    const pending = reports.filter(r => r.status === 'pending' || r.status === 'in_progress').length;
    const draft = reports.filter(r => r.status === 'draft' || !r.status).length;
    return { total, approved, rejected, pending, draft };
  }, [reports]);

  const formatCurrency = (val) => {
    const n = Number(val) || 0;
    return `₹ ${n.toLocaleString('en-IN')}`;
  };

  const getStatusBadge = (status) => {
    const s = (status || 'draft').toLowerCase();
    if (s === 'approved' || s === 'completed') {
      return <span className={`${styles.statusBadge} ${styles.statusApproved}`}><CheckCircle size={13} /> Approved</span>;
    }
    if (s === 'rejected') {
      return <span className={`${styles.statusBadge} ${styles.statusRejected}`}><XCircle size={13} /> Rejected</span>;
    }
    if (s === 'pending' || s === 'in_progress') {
      return <span className={`${styles.statusBadge} ${styles.statusPending}`}><Clock size={13} /> Under Review</span>;
    }
    return <span className={`${styles.statusBadge} ${styles.statusDraft}`}><FileText size={13} /> Draft</span>;
  };

  return (
    <div className={styles.layoutWrapper}>
      <ArchitecturalGridSvg />
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={styles.rightSide}>
        <AdminHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} title="Valuation Reports Management" />

        <div className={styles.mainScrollArea}>
          <div className={styles.contentPadding}>

            {/* Page Header */}
            <div className={styles.pageHeader}>
              <div className={styles.headerLeft}>
                <div className={styles.badgeRow}>
                  <span className={styles.portalBadge}>
                    <ShieldCheck size={14} /> Institutional Oversight
                  </span>
                  <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                    &bull; Bank Reports Approval &amp; Verification
                  </span>
                </div>
                <h1 className={styles.pageTitle}>Valuation Reports</h1>
                <p className={styles.pageSubtitle}>
                  Review customer valuation submissions, inspect certified bank dossier PDFs, and moderate approval or rejection statuses.
                </p>
              </div>

              <div className={styles.headerActions}>
                <button 
                  onClick={fetchData} 
                  className={styles.secondaryBtn} 
                  title="Refresh Reports"
                  disabled={loading}
                >
                  <RefreshCw size={16} className={loading ? 'spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Notification Banner */}
            {notification.text && (
              <div style={{
                padding: '12px 18px',
                borderRadius: '8px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.92rem',
                background: notification.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                border: `1px solid ${notification.type === 'error' ? '#ef4444' : '#10b981'}`,
                color: notification.type === 'error' ? '#fca5a5' : '#6ee7b7',
              }}>
                {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
                <span>{notification.text}</span>
              </div>
            )}

            {/* 4 Stats Cards */}
            <div className={styles.statsRow}>
              <div className={styles.statCard}>
                <div className={styles.statIconBox} style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa' }}>
                  <FileText size={20} />
                </div>
                <div className={styles.statCardContent}>
                  <span className={styles.statLabel}>Total Reports</span>
                  <span className={styles.statValue}>{counts.total}</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIconBox} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                  <CheckCircle size={20} />
                </div>
                <div className={styles.statCardContent}>
                  <span className={styles.statLabel}>Approved</span>
                  <span className={styles.statValue} style={{ color: '#34d399' }}>{counts.approved}</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIconBox} style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                  <Clock size={20} />
                </div>
                <div className={styles.statCardContent}>
                  <span className={styles.statLabel}>Under Review</span>
                  <span className={styles.statValue} style={{ color: '#fbbf24' }}>{counts.pending}</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIconBox} style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
                  <XCircle size={20} />
                </div>
                <div className={styles.statCardContent}>
                  <span className={styles.statLabel}>Rejected</span>
                  <span className={styles.statValue} style={{ color: '#f87171' }}>{counts.rejected}</span>
                </div>
              </div>
            </div>

            {/* Filter and Search Toolbar */}
            <div className={styles.toolbarCard}>
              <div className={styles.searchBox}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search by customer, employee, report # or bank..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              <div className={styles.filterTabs}>
                <button
                  className={`${styles.filterTab} ${selectedStatus === 'all' ? styles.filterTabActive : ''}`}
                  onClick={() => setSelectedStatus('all')}
                >
                  <span>All</span>
                  <span className={styles.tabCount}>{counts.total}</span>
                </button>
                <button
                  className={`${styles.filterTab} ${selectedStatus === 'approved' ? styles.filterTabActive : ''}`}
                  onClick={() => setSelectedStatus('approved')}
                >
                  <span>Approved</span>
                  <span className={styles.tabCount}>{counts.approved}</span>
                </button>
                <button
                  className={`${styles.filterTab} ${selectedStatus === 'pending' ? styles.filterTabActive : ''}`}
                  onClick={() => setSelectedStatus('pending')}
                >
                  <span>Pending</span>
                  <span className={styles.tabCount}>{counts.pending}</span>
                </button>
                <button
                  className={`${styles.filterTab} ${selectedStatus === 'rejected' ? styles.filterTabActive : ''}`}
                  onClick={() => setSelectedStatus('rejected')}
                >
                  <span>Rejected</span>
                  <span className={styles.tabCount}>{counts.rejected}</span>
                </button>
              </div>
            </div>

            {/* Table Card */}
            <div className={styles.tableCard}>
              <div className={styles.tableResponsive}>
                <table className={styles.reportsTable}>
                  <thead>
                    <tr>
                      <th>Report #</th>
                      <th>Customer Name</th>
                      <th>Employee (Valuer)</th>
                      <th>Valuation Value</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                          <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px auto', display: 'block' }} />
                          <span>Loading valuation reports...</span>
                        </td>
                      </tr>
                    ) : filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <div className={styles.emptyState}>
                            <FileText size={44} className={styles.emptyIcon} />
                            <div className={styles.emptyTitle}>No valuation reports found</div>
                            <div className={styles.emptySubtitle}>
                              {searchQuery || selectedStatus !== 'all' 
                                ? 'Try adjusting your search criteria or filter options.' 
                                : 'New reports submitted by valuers will appear here.'}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredReports.map((r) => {
                        const repId = r.id || r._id;
                        const customerName = r.customer_name || 
                          r.institution_details?.applicant_name || 
                          r.applicant_name || 
                          'Confidential Client';
                        const bankName = r.institution_details?.bank_name || r.bank_name || 'Bank Valuation';
                        const emp = getEmployeeInfo(r);
                        const valuationValue = r.final_valuation?.final_market_value || r.final_market_value || 0;
                        const dateStr = r.institution_details?.date_of_report || r.created_at || r.updated_at;
                        const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : 'N/A';
                        const isUpdating = updatingId === repId;
                        const isApproved = r.status === 'approved' || r.status === 'completed';
                        const isRejected = r.status === 'rejected';

                        return (
                          <tr key={repId}>
                            {/* Report # */}
                            <td>
                              <span className={styles.reportIdBadge}>
                                <FileText size={12} />
                                {r.report_number || `KGN-${repId.toString().slice(-6)}`}
                              </span>
                            </td>

                            {/* Customer Name */}
                            <td>
                              <div className={styles.customerCell}>
                                <span className={styles.customerName}>{customerName}</span>
                                <span className={styles.bankName}>
                                  <Building2 size={12} />
                                  {bankName}
                                </span>
                              </div>
                            </td>

                            {/* Employee Name */}
                            <td>
                              <div className={styles.employeeCell}>
                                <div className={styles.empAvatar} title={emp.role}>
                                  {emp.initials}
                                </div>
                                <div className={styles.empMeta}>
                                  <span className={styles.empName}>{emp.name}</span>
                                  <span className={styles.empCity}>
                                    {emp.city ? `${emp.city} • ` : ''}{emp.role}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Value */}
                            <td>
                              <span style={{ fontWeight: 700, color: '#ffffff' }}>
                                {formatCurrency(valuationValue)}
                              </span>
                            </td>

                            {/* Date */}
                            <td>
                              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                                {formattedDate}
                              </span>
                            </td>

                            {/* Status */}
                            <td>
                              {getStatusBadge(r.status)}
                            </td>

                            {/* Actions: View PDF, Approve, Reject */}
                            <td>
                              <div className={styles.actionsCell}>
                                {/* View PDF button */}
                                <a
                                  href={`/api/valuations/${encodeURIComponent(repId)}/generate-pdf`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.pdfBtn}
                                  title="View certified bank dossier PDF"
                                >
                                  <ExternalLink size={13} />
                                  <span>View PDF</span>
                                </a>

                                {/* Approve button */}
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(repId, 'approved')}
                                  disabled={isUpdating || isApproved}
                                  className={`${styles.approveBtn} ${isApproved ? styles.actionBtnDisabled : ''}`}
                                  title={isApproved ? 'Report already approved' : 'Approve this valuation report'}
                                >
                                  <Check size={14} />
                                  <span>{isApproved ? 'Approved' : 'Approve'}</span>
                                </button>

                                {/* Reject button */}
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(repId, 'rejected')}
                                  disabled={isUpdating || isRejected}
                                  className={`${styles.rejectBtn} ${isRejected ? styles.actionBtnDisabled : ''}`}
                                  title={isRejected ? 'Report already rejected' : 'Reject this valuation report'}
                                >
                                  <X size={14} />
                                  <span>{isRejected ? 'Rejected' : 'Reject'}</span>
                                </button>

                                {/* Details / Quick View */}
                                <button
                                  type="button"
                                  onClick={() => setSelectedReport(r)}
                                  className={styles.secondaryBtn}
                                  style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                                  title="Inspect complete valuation details"
                                >
                                  <Eye size={13} />
                                  <span>Details</span>
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
        </div>
      </div>

      {/* DETAIL INSPECTION MODAL */}
      {selectedReport && (
        <div className={styles.modalOverlay} onClick={() => setSelectedReport(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <KgnCrest size={24} />
                  <h3 className={styles.modalTitle}>
                    {selectedReport.report_number || `Report #${selectedReport.id}`}
                  </h3>
                  {getStatusBadge(selectedReport.status)}
                </div>
                <span className={styles.modalSub}>
                  Valuation Dossier Summary &bull; ID: {selectedReport.id}
                </span>
              </div>
              <button className={styles.closeIconBtn} onClick={() => setSelectedReport(null)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Borrower / Customer Name</span>
                  <span className={styles.detailValue}>
                    {selectedReport.customer_name || selectedReport.institution_details?.applicant_name || 'N/A'}
                  </span>
                </div>

                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Financing Institution</span>
                  <span className={styles.detailValue}>
                    {selectedReport.institution_details?.bank_name || 'N/A'}
                  </span>
                </div>

                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Assigned Employee (Valuer)</span>
                  <span className={styles.detailValue}>
                    {getEmployeeInfo(selectedReport).name} ({getEmployeeInfo(selectedReport).role})
                  </span>
                </div>

                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Loan Product / Application</span>
                  <span className={styles.detailValue}>
                    {selectedReport.institution_details?.product_loan_type || 'Property Valuation'}
                  </span>
                </div>

                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Final Market Valuation</span>
                  <span className={styles.detailValue} style={{ color: '#D4B07A', fontSize: '1.1rem' }}>
                    {formatCurrency(selectedReport.final_valuation?.final_market_value || selectedReport.final_market_value || 0)}
                  </span>
                </div>

                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Realizable / Distress Value</span>
                  <span className={styles.detailValue}>
                    {formatCurrency(selectedReport.final_valuation?.distress_value || selectedReport.final_valuation?.forced_sale_value || 0)}
                  </span>
                </div>

                <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                  <span className={styles.detailLabel}>Property Locality &amp; Address</span>
                  <span className={styles.detailValue} style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                    {selectedReport.property_identification?.locality_name || 
                     selectedReport.property_identification?.plot_no_flat_no || 
                     'Address registered in valuation dossier'}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              {/* PDF button */}
              <a
                href={`/api/valuations/${encodeURIComponent(selectedReport.id)}/generate-pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.pdfBtn}
              >
                <ExternalLink size={14} />
                <span>Open Full Certified PDF</span>
              </a>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedReport.id, 'rejected')}
                  disabled={updatingId === selectedReport.id || selectedReport.status === 'rejected'}
                  className={`${styles.rejectBtn} ${selectedReport.status === 'rejected' ? styles.actionBtnDisabled : ''}`}
                >
                  <X size={15} />
                  <span>Reject</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedReport.id, 'approved')}
                  disabled={updatingId === selectedReport.id || selectedReport.status === 'approved'}
                  className={`${styles.approveBtn} ${selectedReport.status === 'approved' ? styles.actionBtnDisabled : ''}`}
                >
                  <Check size={15} />
                  <span>Approve Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
