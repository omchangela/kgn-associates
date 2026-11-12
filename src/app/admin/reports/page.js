'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Briefcase,
  Pencil,
  Lock,
  Unlock,
  Send,
  Download,
} from 'lucide-react';
import { ArchitecturalGridSvg, KgnCrest } from '@/components/common/SvgDecorations';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function AdminReportsPage() {
  const router = useRouter();
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

  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownloadZip = async (r) => {
    const repId = r.id || r._id;
    setDownloadingId(repId);
    try {
      const zip = new JSZip();
      const caseId = r.case_id || r.report_number || repId;
      const mobile = (
        r.institution_details?.contact_number ||
        r.institution_details?.mobile ||
        r.phone_number || r.mobile_number || r.mobile || 'NA'
      ).replace(/\s+/g, '');
      const folderName = `${caseId}_${mobile}`;
      const folder = zip.folder(folderName);

      const errors = [];

      // 1. PDF report
      try {
        const pdfUrl = `/api/valuations/${encodeURIComponent(repId)}/generate-pdf`;
        const pdfRes = await fetch(pdfUrl);
        if (pdfRes.ok) {
          const pdfBlob = await pdfRes.blob();
          folder.file(`${caseId}_Valuation_Report.pdf`, pdfBlob);
        } else {
          errors.push('PDF not available');
        }
      } catch (e) {
        errors.push('PDF fetch failed');
      }

      // 2. Photographs — scan all photo fields in the report
      const photoPaths = [];
      const scanForPhotos = (obj, depth = 0) => {
        if (!obj || depth > 8) return;
        if (Array.isArray(obj)) {
          obj.forEach(item => scanForPhotos(item, depth + 1));
        } else if (typeof obj === 'object') {
          for (const key of Object.keys(obj)) {
            const val = obj[key];
            if (typeof val === 'string' && (
              val.match(/\.(jpg|jpeg|png|gif|webp|bmp)/i) ||
              val.startsWith('/uploads/') ||
              val.startsWith('data:image/')
            )) {
              if (!photoPaths.includes(val)) photoPaths.push(val);
            } else {
              scanForPhotos(val, depth + 1);
            }
          }
        }
      };
      scanForPhotos(r);

      let photoIdx = 1;
      for (const photoUrl of photoPaths) {
        try {
          if (photoUrl.startsWith('data:image/')) {
            // base64 inline image
            const matches = photoUrl.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
            if (matches) {
              const ext = matches[1];
              const b64 = matches[2];
              folder.file(`Photo_${photoIdx}.${ext}`, b64, { base64: true });
              photoIdx++;
            }
          } else {
            const absUrl = photoUrl.startsWith('http') ? photoUrl : photoUrl;
            const imgRes = await fetch(absUrl);
            if (imgRes.ok) {
              const imgBlob = await imgRes.blob();
              const ext = imgRes.headers.get('content-type')?.split('/')[1] || 'jpg';
              folder.file(`Photo_${photoIdx}.${ext}`, imgBlob);
              photoIdx++;
            }
          }
        } catch (e) {
          errors.push(`Photo ${photoIdx} failed`);
        }
      }

      // 3. JSON data export
      const jsonStr = JSON.stringify(r, null, 2);
      folder.file(`${caseId}_Data.json`, jsonStr);

      // 4. Summary TXT
      const customerName = r.customer_name || r.institution_details?.applicant_name || 'N/A';
      const bankName = r.institution_details?.bank_name || r.bank_name || 'N/A';
      const locality = r.property_identification?.locality_name || r.locality_name || 'N/A';
      const finalVal = r.final_valuation?.final_market_value || r.final_market_value || 'N/A';
      const summary = [
        'KGN ASSOCIATES — VALUATION REPORT SUMMARY',
        '==========================================',
        `Case ID       : ${caseId}`,
        `Mobile        : ${mobile}`,
        `Customer      : ${customerName}`,
        `Bank          : ${bankName}`,
        `Locality      : ${locality}`,
        `Status        : ${r.status || 'N/A'}`,
        `Final Value   : ${finalVal}`,
        `Photos        : ${photoIdx - 1}`,
        `Generated On  : ${new Date().toLocaleString('en-IN')}`,
        '',
        errors.length ? 'NOTES: ' + errors.join('; ') : '',
      ].join('\n');
      folder.file(`${caseId}_Summary.txt`, summary);

      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      saveAs(zipBlob, `${folderName}.zip`);
      showNotification(`ZIP downloaded: ${folderName}.zip`, 'success');
    } catch (err) {
      console.error('ZIP download failed:', err);
      showNotification('ZIP download failed. Please try again.', 'error');
    } finally {
      setDownloadingId(null);
    }
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

  // Toggle employee edit access (granting access when employee calls for corrections)
  const handleToggleEmployeeEdit = async (reportId, currentAccess) => {
    setUpdatingId(reportId);
    const newAccess = !currentAccess;
    try {
      const res = await fetch('/api/admin/reports/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reportId,
          allow_employee_edit: newAccess,
          status: newAccess ? 'correction_needed' : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(
          newAccess
            ? 'Edit access granted to valuer (sent back for corrections)'
            : 'Employee edit access revoked / locked',
          'success'
        );
        setReports(prev => prev.map(r => (r.id === reportId || r._id === reportId) ? {
          ...r,
          allow_employee_edit: newAccess,
          status: newAccess ? 'correction_needed' : (r.status === 'correction_needed' ? 'pending' : r.status),
        } : r));
        if (selectedReport && (selectedReport.id === reportId || selectedReport._id === reportId)) {
          setSelectedReport(prev => ({
            ...prev,
            allow_employee_edit: newAccess,
            status: newAccess ? 'correction_needed' : (prev.status === 'correction_needed' ? 'pending' : prev.status),
          }));
        }
      } else {
        showNotification(data.error || 'Failed to update edit access', 'error');
      }
    } catch {
      showNotification('Network error updating edit access', 'error');
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
      const mobile = (r.institution_details?.contact_number || r.institution_details?.mobile || r.phone_number || r.mobile_number || r.mobile || '').replace(/\s+/g, '').toLowerCase();
      const caseId = (r.case_id || r.id || '').toString().toLowerCase();
      const q = searchQuery.toLowerCase().replace(/\s+/g, '');

      const matchSearch = !q || customer.includes(q) || repNo.includes(q) || bank.includes(q) || locality.includes(q) || emp.includes(q) || mobile.includes(q) || caseId.includes(q);

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

  const getStatusBadge = (status, allowEdit) => {
    const s = (status || 'draft').toLowerCase();
    if (s === 'correction_needed' || allowEdit) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <span className={styles.statusBadge} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
            <Unlock size={12} /> Sent for Correction
          </span>
          <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 600 }}>
            ● Valuer Has Edit Access
          </span>
        </div>
      );
    }
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
                  placeholder="Search by customer, mobile, case ID, report # or bank..."
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
                              <span style={{ fontWeight: 800, color: '#1e293b' }}>
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
                              {getStatusBadge(r.status, Boolean(r.allow_employee_edit))}
                            </td>

                            {/* Actions: View PDF, Edit, Grant/Revoke Access, Approve, Reject */}
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

                                {/* Edit — open in property-values form for Admin anytime */}
                                <button
                                  type="button"
                                  onClick={() => router.push(`/property-values?edit=${encodeURIComponent(repId)}&admin=1`)}
                                  className={styles.secondaryBtn}
                                  style={{
                                    padding: '6px 12px',
                                    fontSize: '0.8rem',
                                    fontWeight: '700',
                                    color: '#2563EB',
                                    borderColor: 'rgba(37,99,235,0.4)',
                                    background: 'rgba(37,99,235,0.08)',
                                  }}
                                  title="Edit this valuation document anytime as Admin"
                                >
                                  <Pencil size={13} />
                                  <span>Edit</span>
                                </button>

                                {/* Send Back Access / Toggle Employee Edit */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleEmployeeEdit(repId, Boolean(r.allow_employee_edit))}
                                  disabled={isUpdating}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    padding: '6px 10px',
                                    fontSize: '0.78rem',
                                    fontWeight: '600',
                                    borderRadius: '6px',
                                    cursor: isUpdating ? 'wait' : 'pointer',
                                    transition: 'all 0.15s ease',
                                    border: r.allow_employee_edit ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(245, 158, 11, 0.5)',
                                    background: r.allow_employee_edit ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.12)',
                                    color: r.allow_employee_edit ? '#dc2626' : '#d97706',
                                  }}
                                  title={r.allow_employee_edit ? 'Click to lock / revoke employee edit access' : 'Send back edit access to employee for corrections'}
                                >
                                  {r.allow_employee_edit ? <Lock size={12} /> : <Unlock size={12} />}
                                  <span>{r.allow_employee_edit ? 'Revoke Access' : 'Grant Valuer Access'}</span>
                                </button>

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

                                {/* Download ZIP */}
                                <button
                                  type="button"
                                  onClick={() => handleDownloadZip(r)}
                                  disabled={downloadingId === repId}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    padding: '6px 10px',
                                    fontSize: '0.78rem',
                                    fontWeight: '700',
                                    borderRadius: '6px',
                                    cursor: downloadingId === repId ? 'wait' : 'pointer',
                                    border: '1px solid rgba(161,120,25,0.5)',
                                    background: downloadingId === repId ? 'rgba(161,120,25,0.05)' : 'rgba(161,120,25,0.12)',
                                    color: '#a17819',
                                    transition: 'all 0.15s ease',
                                    whiteSpace: 'nowrap',
                                  }}
                                  title={`Download all files as ZIP (Case: ${r.case_id || r.report_number || repId})`}
                                >
                                  {downloadingId === repId
                                    ? <RefreshCw size={12} className="spin" />
                                    : <Download size={12} />
                                  }
                                  <span>{downloadingId === repId ? 'Zipping...' : 'Download ZIP'}</span>
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

            <div className={styles.modalFooter} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {/* PDF button */}
                <a
                  href={`/api/valuations/${encodeURIComponent(selectedReport.id)}/generate-pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.pdfBtn}
                >
                  <ExternalLink size={14} />
                  <span>Open Certified PDF</span>
                </a>

                {/* Edit document anytime as Admin */}
                <button
                  type="button"
                  onClick={() => router.push(`/property-values?edit=${encodeURIComponent(selectedReport.id)}&admin=1`)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    borderRadius: '6px',
                    background: '#2563eb',
                    border: '1px solid #1d4ed8',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                  title="Edit this report as Admin"
                >
                  <Pencil size={14} />
                  <span>Edit Report</span>
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {/* Send back access / toggle employee edit */}
                <button
                  type="button"
                  onClick={() => handleToggleEmployeeEdit(selectedReport.id, Boolean(selectedReport.allow_employee_edit))}
                  disabled={updatingId === selectedReport.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 13px',
                    borderRadius: '6px',
                    border: selectedReport.allow_employee_edit ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(245, 158, 11, 0.5)',
                    background: selectedReport.allow_employee_edit ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.12)',
                    color: selectedReport.allow_employee_edit ? '#dc2626' : '#d97706',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                  title={selectedReport.allow_employee_edit ? 'Revoke employee edit access' : 'Send back edit access to valuer for corrections'}
                >
                  {selectedReport.allow_employee_edit ? <Lock size={14} /> : <Unlock size={14} />}
                  <span>{selectedReport.allow_employee_edit ? 'Revoke Valuer Access' : 'Grant Valuer Edit Access'}</span>
                </button>

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
