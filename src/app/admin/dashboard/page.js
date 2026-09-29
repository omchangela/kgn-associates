'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import Footer from '@/components/footer/Footer';
import styles from './AdminDashboard.module.css';
import { 
  Users, 
  UserCheck, 
  UserX, 
  FileText, 
  CheckCircle, 
  XCircle, 
  ShieldCheck, 
  ArrowUpRight, 
  Download, 
  UserPlus, 
  AlertCircle,
  Building,
  RefreshCw
} from 'lucide-react';
import { ArchitecturalGridSvg } from '@/components/common/SvgDecorations';
import gsap from 'gsap';

export default function AdminDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    totalReports: 0,
    approvedReports: 0,
    rejectedReports: 0,
    draftReports: 0,
    recentReports: [],
    recentEmployees: [],
  });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [notification, setNotification] = useState({ text: '', type: '' });

  const containerRef = useRef(null);
  const statsRef = useRef(null);
  const router = useRouter();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (!loading && statsRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          statsRef.current.children,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: 'power2.out' }
        );
      }, containerRef);
      return () => ctx.revert();
    }
  }, [loading]);

  const showNotification = (text, type = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification({ text: '', type: '' }), 4000);
  };

  const handleUpdateReportStatus = async (reportId, newStatus) => {
    setUpdatingId(reportId);
    try {
      const res = await fetch('/api/admin/reports/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reportId, status: newStatus }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showNotification(`Report status set to ${newStatus.toUpperCase()}`, 'success');
        fetchStats();
      } else {
        showNotification(data.error || 'Failed to update report status', 'error');
      }
    } catch (err) {
      showNotification('Error updating report status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleEmployeeStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, status: nextStatus }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showNotification(`Employee status changed to ${nextStatus}`, 'success');
        fetchStats();
      } else {
        showNotification(data.error || 'Failed to update status', 'error');
      }
    } catch (err) {
      showNotification('Network error updating employee status', 'error');
    }
  };

  const formatCurrency = (val) => {
    const n = Number(val) || 0;
    return `₹ ${n.toLocaleString('en-IN')}`;
  };

  return (
    <div className={styles.layoutWrapper} ref={containerRef}>
      <ArchitecturalGridSvg />
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={styles.rightSide}>
        <AdminHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} title="Executive Dashboard" />

        <div className={styles.mainScrollArea}>
          <div className={styles.contentPadding}>
            {/* Header */}
            <div className={styles.pageHeader}>
              <div className={styles.headerLeft}>
                <div className={styles.badgeRow}>
                  <span className={styles.portalBadge}>
                    <ShieldCheck size={14} /> Administration Core
                  </span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    &bull; Real-time Metrics &amp; Staff Control
                  </span>
                </div>
                <h1 className={styles.pageTitle}>Executive Admin Dashboard</h1>
                <p className={styles.pageSubtitle}>
                  Monitor employee activity, oversee institutional valuations, and moderate certification workflows.
                </p>
              </div>

              <div className={styles.headerActions}>
                <button 
                  onClick={fetchStats} 
                  className={styles.secondaryBtn}
                  title="Refresh Statistics"
                >
                  <RefreshCw size={16} className={loading ? 'spin' : ''} />
                  <span>Refresh</span>
                </button>

                <Link href="/admin/employees?create=true" className={styles.primaryGoldBtn}>
                  <UserPlus size={18} />
                  <span>Create Employee</span>
                </Link>
              </div>
            </div>

            {/* Notification Banner */}
            {notification.text && (
              <div style={{
                padding: '12px 18px',
                borderRadius: '8px',
                marginBottom: '24px',
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

            {/* 6 Metric Cards Requested by User */}
            <div className={styles.statsGrid} ref={statsRef}>
              {/* 1. Total Employees */}
              <div className={styles.statCard}>
                <div className={styles.statTop}>
                  <span className={styles.statLabel}>Total Staff</span>
                  <div className={styles.statIconWrapper} style={{ background: 'rgba(212, 175, 55, 0.12)', color: 'var(--primary-gold)' }}>
                    <Users size={18} />
                  </div>
                </div>
                <div className={styles.statValue}>{stats.totalEmployees}</div>
                <div className={styles.statIndicator}>
                  <span>Valuers &amp; Engineers</span>
                </div>
              </div>

              {/* 2. Active Employees */}
              <div className={`${styles.statCard} ${styles.statCardActive}`}>
                <div className={styles.statTop}>
                  <span className={styles.statLabel}>Active Staff</span>
                  <div className={styles.statIconWrapper} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                    <UserCheck size={18} />
                  </div>
                </div>
                <div className={styles.statValue} style={{ color: '#34d399' }}>{stats.activeEmployees}</div>
                <div className={styles.statIndicator}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  <span>Authorized to Login</span>
                </div>
              </div>

              {/* 3. Inactive Employees */}
              <div className={`${styles.statCard} ${styles.statCardInactive}`}>
                <div className={styles.statTop}>
                  <span className={styles.statLabel}>Inactive Staff</span>
                  <div className={styles.statIconWrapper} style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                    <UserX size={18} />
                  </div>
                </div>
                <div className={styles.statValue} style={{ color: '#fbbf24' }}>{stats.inactiveEmployees}</div>
                <div className={styles.statIndicator}>
                  <span>Deactivated Accounts</span>
                </div>
              </div>

              {/* 4. Total Reports */}
              <div className={styles.statCard}>
                <div className={styles.statTop}>
                  <span className={styles.statLabel}>Total Reports</span>
                  <div className={styles.statIconWrapper} style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa' }}>
                    <FileText size={18} />
                  </div>
                </div>
                <div className={styles.statValue}>{stats.totalReports}</div>
                <div className={styles.statIndicator}>
                  <span>Valuation Dossiers</span>
                </div>
              </div>

              {/* 5. Approved Reports */}
              <div className={`${styles.statCard} ${styles.statCardApproved}`}>
                <div className={styles.statTop}>
                  <span className={styles.statLabel}>Approved</span>
                  <div className={styles.statIconWrapper} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                    <CheckCircle size={18} />
                  </div>
                </div>
                <div className={styles.statValue} style={{ color: '#34d399' }}>{stats.approvedReports}</div>
                <div className={styles.statIndicator}>
                  <span>Certified for Banks</span>
                </div>
              </div>

              {/* 6. Rejected Reports */}
              <div className={`${styles.statCard} ${styles.statCardRejected}`}>
                <div className={styles.statTop}>
                  <span className={styles.statLabel}>Rejected</span>
                  <div className={styles.statIconWrapper} style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
                    <XCircle size={18} />
                  </div>
                </div>
                <div className={styles.statValue} style={{ color: '#f87171' }}>{stats.rejectedReports}</div>
                <div className={styles.statIndicator}>
                  <span>Audit Flags / Returned</span>
                </div>
              </div>
            </div>

            {/* Split Sections */}
            <div className={styles.dashboardColumns}>
              {/* Left Column: Recent Reports & Moderation Actions */}
              <div className={styles.sectionCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    <FileText size={18} style={{ color: 'var(--primary-gold)' }} />
                    <span>Recent Reports &amp; Moderation</span>
                  </div>
                  <Link 
                    href="/report-list" 
                    style={{ fontSize: '0.82rem', color: 'var(--primary-gold)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>View All Reports</span>
                    <ArrowUpRight size={14} />
                  </Link>
                </div>

                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Report Ref</th>
                        <th>Applicant &amp; Bank</th>
                        <th>Valuation</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentReports.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                            No valuation reports recorded yet.
                          </td>
                        </tr>
                      ) : (
                        stats.recentReports.map((r) => {
                          const isApproved = r.status === 'approved' || r.status === 'completed';
                          const isRejected = r.status === 'rejected';

                          return (
                            <tr key={r.id}>
                              <td>
                                <div style={{ fontWeight: '700', color: '#ffffff' }}>
                                  {r.report_number || r.id}
                                </div>
                                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                                  {r.locality_name || 'Hyderabad'}
                                </div>
                              </td>
                              <td>
                                <div style={{ fontWeight: '600' }}>{r.applicant_name || 'Applicant'}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                  {r.bank_name || 'Bank'}
                                </div>
                              </td>
                              <td style={{ fontWeight: '700', color: 'var(--primary-gold)' }}>
                                {formatCurrency(r.final_market_value)}
                              </td>
                              <td>
                                {isApproved ? (
                                  <span className={`${styles.statusPill} ${styles.statusApproved}`}>
                                    <CheckCircle size={12} /> Approved
                                  </span>
                                ) : isRejected ? (
                                  <span className={`${styles.statusPill} ${styles.statusRejected}`}>
                                    <XCircle size={12} /> Rejected
                                  </span>
                                ) : (
                                  <span className={`${styles.statusPill} ${styles.statusDraft}`}>
                                    Draft
                                  </span>
                                )}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <div className={styles.actionBtnGroup} style={{ justifyContent: 'flex-end' }}>
                                  {!isApproved && (
                                    <button
                                      className={styles.actionBtnApprove}
                                      onClick={() => handleUpdateReportStatus(r.id, 'approved')}
                                      disabled={updatingId === r.id}
                                      title="Approve Valuation"
                                    >
                                      Approve
                                    </button>
                                  )}
                                  {!isRejected && (
                                    <button
                                      className={styles.actionBtnReject}
                                      onClick={() => handleUpdateReportStatus(r.id, 'rejected')}
                                      disabled={updatingId === r.id}
                                      title="Reject / Flag Report"
                                    >
                                      Reject
                                    </button>
                                  )}
                                  <a
                                    href={`/api/valuations/${encodeURIComponent(r.id)}/generate-pdf`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={styles.actionBtnPdf}
                                    title="Download Bank Dossier PDF"
                                  >
                                    <Download size={12} />
                                    <span>PDF</span>
                                  </a>
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

              {/* Right Column: Recent Employees & Quick Status Toggle */}
              <div className={styles.sectionCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    <Users size={18} style={{ color: 'var(--primary-gold)' }} />
                    <span>Staff Directory</span>
                  </div>
                  <Link 
                    href="/admin/employees" 
                    style={{ fontSize: '0.82rem', color: 'var(--primary-gold)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>Manage</span>
                    <ArrowUpRight size={14} />
                  </Link>
                </div>

                <div style={{ padding: '16px' }}>
                  {stats.recentEmployees.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No staff accounts found.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {stats.recentEmployees.map((emp) => {
                        const initials = (emp.first_name ? emp.first_name[0] : emp.username[0] || 'V').toUpperCase();
                        const isActive = emp.status !== 'inactive';
                        const isRoot = emp.id === 'user_admin_root' || emp.id === 'user_admin_1' || emp.email === 'admin@admin.com';

                        return (
                          <div
                            key={emp.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 14px',
                              borderRadius: '8px',
                              background: 'rgba(255, 255, 255, 0.03)',
                              border: '1px solid rgba(255, 255, 255, 0.06)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '6px',
                                background: emp.role === 'admin' ? 'linear-gradient(135deg, #D4B07A, #C28B52)' : 'rgba(255, 255, 255, 0.1)',
                                color: emp.role === 'admin' ? '#0A0D14' : '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: '700',
                                fontSize: '0.85rem',
                              }}>
                                {initials}
                              </div>
                              <div>
                                <div style={{ fontSize: '0.88rem', fontWeight: '600', color: '#ffffff' }}>
                                  {emp.first_name ? `${emp.first_name} ${emp.last_name || ''}` : emp.username}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {emp.role} &bull; {emp.email}
                                </div>
                              </div>
                            </div>

                            <div>
                              {!isRoot ? (
                                <button
                                  onClick={() => handleToggleEmployeeStatus(emp.id, emp.status)}
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '0.74rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    border: isActive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                                    background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                    color: isActive ? '#34d399' : '#f87171',
                                    transition: 'all 0.15s',
                                  }}
                                  title={`Click to ${isActive ? 'Deactivate' : 'Activate'}`}
                                >
                                  {isActive ? 'Active' : 'Inactive'}
                                </button>
                              ) : (
                                <span style={{
                                  padding: '4px 8px',
                                  borderRadius: '12px',
                                  fontSize: '0.72rem',
                                  fontWeight: '700',
                                  background: 'rgba(212, 175, 55, 0.15)',
                                  color: 'var(--primary-gold)',
                                  border: '1px solid rgba(212, 175, 55, 0.3)',
                                }}>
                                  Root Admin
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <Link
                      href="/admin/employees"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '10px',
                        borderRadius: '6px',
                        background: 'rgba(212, 175, 55, 0.1)',
                        border: '1px solid rgba(212, 175, 55, 0.25)',
                        color: 'var(--primary-gold)',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      <UserPlus size={16} />
                      <span>Manage All Employees &amp; Provision Accounts &rarr;</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Footer />
        </div>
      </div>
    </div>
  );
}
