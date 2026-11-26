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
  Lock,
  Unlock,
  Pencil,
  Calendar,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { propertyValuationAPI } from '@/services/api';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
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
  const [allReports, setAllReports] = useState([]);
  const [exportFromDate, setExportFromDate] = useState('');
  const [exportToDate, setExportToDate] = useState('');
  const [exportingExcel, setExportingExcel] = useState(false);
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
        const data    = await propertyValuationAPI.getAll('?limit=500');
        const results = data.results || [];
        setAllReports(results);
        setRecentReports(results.slice(0, 6));
        const total = data.count || results.length;
        const comp  = results.filter((r) => r.status === 'completed' || r.status === 'approved').length;
        const drf   = results.filter((r) => r.status !== 'completed' && r.status !== 'approved').length;
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

  const getDateFilteredReports = () => {
    if (!exportFromDate && !exportToDate) return allReports;
    return allReports.filter((r) => {
      const rawDate =
        r.institution_details?.date_of_report ||
        r.final_valuation?.report_date ||
        r.created_at ||
        r.updated_at;
      const parsed = rawDate ? new Date(rawDate) : null;
      if (!parsed || Number.isNaN(parsed.getTime())) return false;
      const ymd = parsed.toISOString().slice(0, 10);
      if (exportFromDate && ymd < exportFromDate) return false;
      if (exportToDate && ymd > exportToDate) return false;
      return true;
    });
  };

  const displayedReports = (exportFromDate || exportToDate)
    ? getDateFilteredReports()
    : recentReports;

  const handleExportExcel = async () => {
    const rowsToExport = getDateFilteredReports();
    if (rowsToExport.length === 0) {
      alert('No reports found for the selected date range.');
      return;
    }
    setExportingExcel(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Valuation Reports');

      const columns = [
        { header: 'S.NO:', key: 'sno', width: 8 },
        { header: 'REPORT DATE', key: 'report_date', width: 15 },
        { header: 'INSTITUTION NAME', key: 'institution_name', width: 20 },
        { header: 'BANK NAME', key: 'bank_name', width: 24 },
        { header: 'TYPE OF CASE', key: 'type_of_case', width: 15 },
        { header: 'BRANCH NAME', key: 'branch_name', width: 18 },
        { header: 'CASE ID', key: 'case_id', width: 20 },
        { header: 'NAME OF THE APPLICANT', key: 'applicant_name', width: 26 },
        { header: 'CONTACT', key: 'contact', width: 18 },
        { header: 'PROPERTY ADDRESS', key: 'property_address', width: 45 },
        { header: 'DISTANCE FROM BRANCH', key: 'distance_from_branch', width: 18 },
        { header: 'BILL Amount', key: 'bill_amount', width: 16 },
        { header: 'FILE STATUS', key: 'file_status', width: 16 },
        { header: 'SITE ENGINEER PAYMENT STATUS', key: 'payment_status', width: 24 },
        { header: 'PAYMENT MODE', key: 'payment_mode', width: 16 },
        { header: 'PAYMENT REFERENCE NUMBER', key: 'payment_ref', width: 24 },
      ];
      sheet.columns = columns;

      const headerRow = sheet.getRow(1);
      headerRow.height = 28;
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF94A3B8' } },
          left: { style: 'thin', color: { argb: 'FF94A3B8' } },
          bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
          right: { style: 'thin', color: { argb: 'FF94A3B8' } },
        };
      });

      sheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: columns.length },
      };

      const formatExcelDate = (raw) => {
        if (!raw) return '';
        const d = new Date(raw);
        if (Number.isNaN(d.getTime())) return String(raw);
        return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
      };

      rowsToExport.forEach((r, idx) => {
        const inst = r.institution_details || r.institutionDetails || {};
        const prop = r.property_identification || r.propertyIdentification || {};
        const chars = r.property_characteristics || r.propertyCharacteristics || {};
        const finalVal = r.final_valuation || r.finalValuation || {};

        const rawDate = inst.date_of_report || finalVal.report_date || r.created_at || r.updated_at;
        const dist = chars.distance_from_branch_km;
        const distVal = dist !== undefined && dist !== null && String(dist).trim() !== '' ? String(dist) : '';
        const billVal = finalVal.final_market_value || r.final_market_value || '';
        const statusLower = (r.status || 'draft').toLowerCase();
        const fileStatus =
          statusLower === 'approved' || statusLower === 'completed'
            ? 'CLOSED'
            : statusLower.replace(/_/g, ' ').toUpperCase();

        const row = sheet.addRow({
          sno: idx + 1,
          report_date: formatExcelDate(rawDate),
          institution_name: (inst.vendor_engineer_institution_name || 'KGN ASSOCIATES').toUpperCase(),
          bank_name: (inst.bank_name || r.bank_name || '').toUpperCase(),
          type_of_case: '',
          branch_name: (inst.branch_name || '').toUpperCase(),
          case_id: inst.loan_application_id || r.report_number || '',
          applicant_name: (inst.applicant_name || r.customer_name || '').toUpperCase(),
          contact: inst.applicant_contact_number || inst.contact_number || '',
          property_address: (prop.address_as_per_actual_site || prop.address_as_per_documents || prop.locality_name || '').toUpperCase(),
          distance_from_branch: distVal,
          bill_amount: billVal !== '' ? Number(billVal) || billVal : '',
          file_status: fileStatus,
          payment_status: '',
          payment_mode: '',
          payment_ref: '',
        });

        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF0F172A' } };
          cell.alignment = {
            vertical: 'middle',
            horizontal: colNumber === 10 ? 'left' : 'center',
            wrapText: true,
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const dateTag =
        exportFromDate || exportToDate
          ? `${exportFromDate || 'start'}_to_${exportToDate || 'end'}`
          : new Date().toISOString().slice(0, 10);
      saveAs(blob, `My_Valuation_Reports_${dateTag}.xlsx`);
    } catch (err) {
      console.error('Excel export failed:', err);
      alert('Excel export failed. Please try again.');
    } finally {
      setExportingExcel(false);
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

            {/* ── Recent Valuations + Date-Wise Excel Export ── */}
            <div className={styles.recentPanel}>
              <div className={styles.recentPanelHeader} style={{ flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 className={styles.sectionTitle}>Recent Certified Valuations</h3>
                  <p className={styles.sectionSub}>Filter by date and download your Excel report sheet</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '5px 10px' }}>
                    <Calendar size={14} style={{ color: '#64748b' }} />
                    <input
                      type="date"
                      value={exportFromDate}
                      onChange={(e) => setExportFromDate(e.target.value)}
                      title="From Date"
                      style={{ border: 'none', background: 'transparent', fontSize: '0.8rem', color: '#1e293b', outline: 'none' }}
                    />
                    <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>to</span>
                    <input
                      type="date"
                      value={exportToDate}
                      onChange={(e) => setExportToDate(e.target.value)}
                      title="To Date"
                      style={{ border: 'none', background: 'transparent', fontSize: '0.8rem', color: '#1e293b', outline: 'none' }}
                    />
                    {(exportFromDate || exportToDate) && (
                      <button
                        type="button"
                        onClick={() => { setExportFromDate(''); setExportToDate(''); }}
                        title="Clear dates"
                        style={{ border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', display: 'flex', padding: 0 }}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleExportExcel}
                    disabled={exportingExcel}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(21, 128, 61, 0.4)',
                      background: 'rgba(22, 163, 74, 0.12)',
                      color: '#15803d',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: exportingExcel ? 'wait' : 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                    title="Download Excel (.xlsx) for selected date range"
                  >
                    <FileSpreadsheet size={15} />
                    <span>{exportingExcel ? 'Exporting...' : 'Download Excel'}</span>
                  </button>

                  <Link href="/report-list" className={styles.viewAllLink}>
                    <span>View All</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {displayedReports.length === 0 ? (
                <div className={styles.emptyState}>
                  <Building size={36} className={styles.emptyIcon} />
                  <p className={styles.emptyText}>No valuation reports found for the selected criteria.</p>
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
                      {displayedReports.map((rep) => {
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
