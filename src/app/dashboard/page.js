'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './Dashboard.module.css';
import Sidebar from '@/components/sidebar/Sidebar';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import {
  BarChart3,
  FileText,
  ListChecks,
  PlusCircle,
  ArrowRight,
  Download,
  Building,
  Building2,
  CheckCircle2,
  Clock,
  TrendingUp,
  Sparkles,
  Users,
  Lock,
  Unlock,
  Pencil,
} from 'lucide-react';
import { propertyValuationAPI } from '@/services/api';
import gsap from 'gsap';
import {
  ValuationTrendChart,
  MicroSparkline,
  KgnCrest,
} from '@/components/common/SvgDecorations';

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalValuations: 0,
    completed: 0,
    drafts: 0,
    staff: 0,
  });
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadingWordId, setDownloadingWordId] = useState(null);

  const containerRef = useRef(null);
  const bannerRef    = useRef(null);
  const statsRef     = useRef(null);
  const midRef       = useRef(null);

  const toggleSidebar = () => setIsSidebarOpen((v) => !v);

  useEffect(() => {
    async function loadData() {
      try {
        const data    = await propertyValuationAPI.getAll('?limit=6');
        const results = data.results || [];
        setRecentReports(results);
        const total = data.count || results.length;
        const comp  = results.filter((r) => r.status === 'completed').length;
        const drf   = results.filter((r) => r.status !== 'completed').length;
        setStats({ totalValuations: total, completed: comp, drafts: drf, staff: 0 });
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // GSAP Entrance
  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      if (bannerRef.current) {
        tl.fromTo(bannerRef.current, { y: -16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 });
      }
      if (statsRef.current) {
        tl.fromTo(
          statsRef.current.children,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.45, stagger: 0.08 },
          '-=0.25'
        );
      }
      if (midRef.current) {
        tl.fromTo(midRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, '-=0.2');
      }
    }, containerRef);

    return () => ctx.revert();
  }, [loading]);

  const handleDownloadPDF = async (id, e) => {
    e.preventDefault();
    try {
      setDownloadingId(id);
      await propertyValuationAPI.generatePDF(id);
    } catch (err) {
      alert(`Error downloading certified PDF: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadWord = async (id, e) => {
    e.preventDefault();
    try {
      setDownloadingWordId(id);
      await propertyValuationAPI.generateWord(id);
    } catch (err) {
      alert(`Error downloading Word document: ${err.message}`);
    } finally {
      setDownloadingWordId(null);
    }
  };

  return (
    <div className={styles.layoutWrapper} ref={containerRef}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className={styles.rightSide}>
        <Header onMenuToggle={toggleSidebar} />

        <main className={styles.mainScrollArea}>
          <div className={styles.contentPadding}>

            {/* ── Hero Banner ── */}
            <div className={styles.heroBanner} ref={bannerRef}>
              <div className={styles.heroLeft}>
                <div className={styles.heroEyebrow}>
                  <span className={styles.heroPill}>
                    <Sparkles size={11} />
                    Chartered Valuation Suite
                  </span>
                </div>
                <h1 className={styles.dashboardTitle}>Valuation Management Console</h1>
                <p className={styles.heroSubtitle}>
                  Real-time property metrics, automated calculations, and IBBI certified report generation.
                </p>
              </div>

              <div className={styles.heroCtas}>
                <Link href="/property-values" className={`${styles.primaryCta} btn-shimmer`}>
                  <PlusCircle size={18} />
                  <span>New Property Valuation</span>
                </Link>
              </div>
            </div>

            {/* ── KPI Stat Cards ── */}
            <div className={styles.statsRow} ref={statsRef}>
              {/* Total Valuations */}
              <div className={`${styles.statCard} ${styles.statCardGold}`}>
                <div className={styles.statCardTop}>
                  <div className={`${styles.statIconBox} ${styles.statIconGold}`}>
                    <Building2 size={22} />
                  </div>
                  <span className={`${styles.statTrend} ${styles.trendUp}`}>
                    <TrendingUp size={12} /> Active
                  </span>
                </div>
                <div>
                  <div className={styles.statValue}>{stats.totalValuations || '—'}</div>
                  <div className={styles.statLabel}>Total Valuations</div>
                </div>
              </div>

              {/* Completed */}
              <div className={`${styles.statCard} ${styles.statCardGreen}`}>
                <div className={styles.statCardTop}>
                  <div className={`${styles.statIconBox} ${styles.statIconGreen}`}>
                    <CheckCircle2 size={22} />
                  </div>
                  <span className={`${styles.statTrend} ${styles.trendUp}`}>
                    <TrendingUp size={12} /> Done
                  </span>
                </div>
                <div>
                  <div className={styles.statValue}>{stats.completed || '—'}</div>
                  <div className={styles.statLabel}>Completed Reports</div>
                </div>
              </div>

              {/* Drafts */}
              <div className={`${styles.statCard} ${styles.statCardAmber}`}>
                <div className={styles.statCardTop}>
                  <div className={`${styles.statIconBox} ${styles.statIconAmber}`}>
                    <Clock size={22} />
                  </div>
                  <span className={`${styles.statTrend} ${styles.trendNeutral}`}>
                    In Progress
                  </span>
                </div>
                <div>
                  <div className={styles.statValue}>{stats.drafts || '—'}</div>
                  <div className={styles.statLabel}>Pending Drafts</div>
                </div>
              </div>

              {/* Schedules */}
              <div className={`${styles.statCard} ${styles.statCardBlue}`}>
                <div className={styles.statCardTop}>
                  <div className={`${styles.statIconBox} ${styles.statIconBlue}`}>
                    <BarChart3 size={22} />
                  </div>
                  <span className={`${styles.statTrend} ${styles.trendUp}`}>
                    <TrendingUp size={12} /> v2.6
                  </span>
                </div>
                <div>
                  <div className={styles.statValue}>10</div>
                  <div className={styles.statLabel}>Standard Schedules</div>
                </div>
              </div>
            </div>

            {/* ── Middle Section: Chart + Quick Actions ── */}
            <div className={styles.midSection} ref={midRef}>
              {/* Trend Chart */}
              <div className={styles.chartCard}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h3 className={styles.sectionTitle}>Valuation Volume &amp; Assessment Trends</h3>
                    <p className={styles.sectionSub}>Monthly property inspection and certificate issuance rate</p>
                  </div>
                  <span className={styles.badgePill}>
                    <span className="status-dot-active" style={{ width: 6, height: 6 }} />
                    Live Telemetry
                  </span>
                </div>

                <ValuationTrendChart height={160} />

                <div className={styles.chartLegend}>
                  <div className={styles.legendItem}>
                    <div className={styles.legendDot} style={{ background: '#B8860B' }} />
                    Valuations Issued
                  </div>
                  <div className={styles.legendItem}>
                    <div className={styles.legendDot} style={{ background: '#10B981' }} />
                    Certificates Generated
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className={styles.quickActionsCard}>
                <div>
                  <h3 className={styles.sectionTitle}>Accelerated Workflows</h3>
                  <p className={styles.sectionSub}>Jump directly to core operations</p>
                </div>

                <div className={styles.actionList}>
                  <Link href="/property-values" className={styles.actionTile}>
                    <div className={styles.actionIconBox}><Building2 size={18} /></div>
                    <div className={styles.actionTextGroup}>
                      <div className={styles.actionTitle}>10-Tab Valuation Form</div>
                      <div className={styles.actionSub}>Comprehensive Property Spec</div>
                    </div>
                    <ArrowRight size={16} className={styles.actionArrow} />
                  </Link>

                  <Link href="/create-report" className={styles.actionTile}>
                    <div className={styles.actionIconBox}><PlusCircle size={18} /></div>
                    <div className={styles.actionTextGroup}>
                      <div className={styles.actionTitle}>Intake New Asset</div>
                      <div className={styles.actionSub}>Borrower &amp; Bank Details</div>
                    </div>
                    <ArrowRight size={16} className={styles.actionArrow} />
                  </Link>

                  <Link href="/report-list" className={styles.actionTile}>
                    <div className={styles.actionIconBox}><Download size={18} /></div>
                    <div className={styles.actionTextGroup}>
                      <div className={styles.actionTitle}>Download Dossiers</div>
                      <div className={styles.actionSub}>Access Certified PDFs</div>
                    </div>
                    <ArrowRight size={16} className={styles.actionArrow} />
                  </Link>

                  <Link href="/employees" className={styles.actionTile}>
                    <div className={styles.actionIconBox}><Users size={18} /></div>
                    <div className={styles.actionTextGroup}>
                      <div className={styles.actionTitle}>Valuers &amp; Staff</div>
                      <div className={styles.actionSub}>Team Management</div>
                    </div>
                    <ArrowRight size={16} className={styles.actionArrow} />
                  </Link>
                </div>
              </div>
            </div>

            {/* ── Module Cards ── */}
            <div className={styles.analysisGrid}>
              <Link href="/property-values" className={styles.analysisCard}>
                <div className={styles.cardTopRow}>
                  <div className={styles.cardIcon}><Building size={24} /></div>
                  <MicroSparkline color="#D4B07A" isUp={true} />
                </div>
                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>Property Values</h3>
                  <p className={styles.cardDescription}>Detailed 10-Tab Valuation Matrix</p>
                  <div className={styles.cardStats}>
                    <span className={styles.statNumber}>{stats.totalValuations || '—'}</span>
                    <span className={styles.statLabel}>Properties Assessed</span>
                  </div>
                </div>
              </Link>

              <Link href="/create-report" className={styles.analysisCard}>
                <div className={styles.cardTopRow}>
                  <div className={styles.cardIcon}><FileText size={24} /></div>
                  <MicroSparkline color="#10B981" isUp={true} />
                </div>
                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>Fast Report Intake</h3>
                  <p className={styles.cardDescription}>Quick Technical &amp; Land Specs</p>
                  <div className={styles.cardStats}>
                    <span className={styles.statNumber}>10</span>
                    <span className={styles.statLabel}>Standard Schedules</span>
                  </div>
                </div>
              </Link>

              <Link href="/report-list" className={styles.analysisCard}>
                <div className={styles.cardTopRow}>
                  <div className={styles.cardIcon}><ListChecks size={24} /></div>
                  <MicroSparkline color="#3B82F6" isUp={true} />
                </div>
                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>Certified Certificates</h3>
                  <p className={styles.cardDescription}>Signed PDF Generation &amp; Export</p>
                  <div className={styles.cardStats}>
                    <span className={styles.statNumber}>{stats.completed || '—'}</span>
                    <span className={styles.statLabel}>Completed Reports</span>
                  </div>
                </div>
              </Link>
            </div>

            {/* ── Recent Valuations ── */}
            <div className={styles.recentPanel}>
              <div className={styles.recentPanelHeader}>
                <div>
                  <h3 className={styles.sectionTitle}>Recent Certified Valuations</h3>
                  <p className={styles.sectionSub}>Latest assessments ready for review and digital signature</p>
                </div>
                <Link href="/report-list" className={styles.viewAllLink}>
                  <span>View All</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {recentReports.length === 0 ? (
                <div className={styles.emptyState}>
                  <Building size={36} className={styles.emptyIcon} />
                  <p className={styles.emptyText}>No valuation reports recorded yet.</p>
                  <Link href="/property-values" className={styles.emptyLink}>
                    Create First Valuation Report →
                  </Link>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className={styles.reportTable}>
                    <thead>
                      <tr className={styles.reportTableHead}>
                        <th>Applicant</th>
                        <th>Bank / Institution</th>
                        <th>Location</th>
                        <th>Report ID</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentReports.map((rep) => {
                        const repId         = rep.id || rep._id;
                        const isDownloading     = downloadingId === repId;
                        const isWordDownloading = downloadingWordId === repId;
                        const inst        = rep.institution_details || rep.institutionDetails || {};
                        const prop        = rep.property_identification || rep.propertyIdentification || {};

                        return (
                          <tr key={repId} className={styles.reportRow}>
                            <td>
                              <div className={styles.reportApplicant}>
                                {inst.applicant_name || rep.report_number || 'Property Valuation Case'}
                              </div>
                            </td>
                            <td>
                              <span className={styles.bankBadge}>
                                {inst.bank_name || 'Banking Institution'}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.82rem', color: '#64748B' }}>
                                {prop.locality_name || 'Hyderabad Region'}
                              </span>
                            </td>
                            <td>
                              <span className={styles.reportIdChip}>
                                {rep.report_number || String(repId).slice(0, 8)}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                {rep.allow_employee_edit || rep.status === 'correction_needed' ? (
                                  <Link
                                    href={`/property-values?edit=${encodeURIComponent(repId)}`}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      padding: '5px 12px',
                                      borderRadius: '6px',
                                      background: 'rgba(245, 158, 11, 0.12)',
                                      border: '1px solid rgba(245, 158, 11, 0.4)',
                                      color: '#d97706',
                                      fontSize: '0.8rem',
                                      fontWeight: '600',
                                      textDecoration: 'none',
                                    }}
                                    title="Edit corrections granted by Admin"
                                  >
                                    <Pencil size={13} />
                                    <span>Edit Correction</span>
                                  </Link>
                                ) : (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      padding: '4px 10px',
                                      borderRadius: '6px',
                                      background: 'rgba(100, 116, 139, 0.08)',
                                      border: '1px solid rgba(100, 116, 139, 0.25)',
                                      color: '#64748b',
                                      fontSize: '0.78rem',
                                      fontWeight: '500',
                                    }}
                                    title="Report submitted. Contact Admin to request edit access for corrections."
                                  >
                                    <Lock size={12} />
                                    <span>Locked</span>
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
