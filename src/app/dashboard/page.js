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
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { propertyValuationAPI } from '@/services/api';
import gsap from 'gsap';
import {
  ValuationTrendChart,
  MicroSparkline,
  ApprovedValuerBadge,
  KgnCrest,
} from '@/components/common/SvgDecorations';

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalValuations: 1,
    completed: 1,
    drafts: 0,
  });
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  const containerRef = useRef(null);
  const cardsRef = useRef(null);
  const bannerRef = useRef(null);
  const stat1Ref = useRef(null);
  const stat2Ref = useRef(null);
  const stat3Ref = useRef(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const data = await propertyValuationAPI.getAll('?limit=6');
        const results = data.results || [];
        setRecentReports(results);
        const total = data.count || results.length;
        const comp = results.filter((r) => r.status === 'completed').length || 1;
        const drf = results.filter((r) => r.status !== 'completed').length;
        setStats({
          totalValuations: total || 1,
          completed: comp,
          drafts: drf,
        });
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // GSAP Entrance Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      if (bannerRef.current) {
        tl.fromTo(
          bannerRef.current,
          { y: -20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6 }
        );
      }

      if (cardsRef.current) {
        tl.fromTo(
          cardsRef.current.children,
          { y: 30, opacity: 0, scale: 0.96 },
          { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.12 },
          '-=0.3'
        );
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

  return (
    <div className={styles.layoutWrapper} ref={containerRef}>
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className={styles.rightSide}>
        {/* Header */}
        <Header onMenuToggle={toggleSidebar} />

        {/* Scrollable Content */}
        <main className={styles.mainScrollArea}>
          <div className={styles.contentPadding}>
            {/* Top Title Banner */}
            <div className={styles.heroBanner} ref={bannerRef}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <ApprovedValuerBadge size={16} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Chartered Valuation Suite
                  </span>
                </div>
                <h1 className={styles.dashboardTitle}>Valuation Management Console</h1>
                <p className={styles.heroSubtitle}>
                  Real-time property metrics, automated calculations, and IBBI certified generation.
                </p>
              </div>

              <Link href="/property-values" className={`${styles.primaryCta} btn-shimmer`}>
                <PlusCircle size={20} />
                <span>New Property Valuation</span>
              </Link>
            </div>

            {/* Analysis Metric Cards Grid */}
            <div className={styles.analysisGrid} ref={cardsRef}>
              <Link href="/property-values" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className={styles.analysisCard}>
                  <div className={styles.cardTopRow}>
                    <div className={styles.cardIcon}>
                      <Building size={28} />
                    </div>
                    <MicroSparkline color="#D4B07A" isUp={true} />
                  </div>
                  <div className={styles.cardContent}>
                    <h3 className={styles.cardTitle}>Property Values</h3>
                    <p className={styles.cardDescription}>Detailed 10-Tab Valuation Matrix</p>
                    <div className={styles.cardStats}>
                      <span className={styles.statNumber} ref={stat1Ref}>
                        {stats.totalValuations}
                      </span>
                      <span className={styles.statLabel}>Properties Assessed</span>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/create-report" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className={styles.analysisCard}>
                  <div className={styles.cardTopRow}>
                    <div className={styles.cardIcon}>
                      <FileText size={28} />
                    </div>
                    <MicroSparkline color="#10B981" isUp={true} />
                  </div>
                  <div className={styles.cardContent}>
                    <h3 className={styles.cardTitle}>Fast Report Intake</h3>
                    <p className={styles.cardDescription}>Quick Technical &amp; Land Specs</p>
                    <div className={styles.cardStats}>
                      <span className={styles.statNumber} ref={stat2Ref}>
                        10
                      </span>
                      <span className={styles.statLabel}>Standard Schedules</span>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/report-list" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className={styles.analysisCard}>
                  <div className={styles.cardTopRow}>
                    <div className={styles.cardIcon}>
                      <ListChecks size={28} />
                    </div>
                    <MicroSparkline color="#3B82F6" isUp={true} />
                  </div>
                  <div className={styles.cardContent}>
                    <h3 className={styles.cardTitle}>Certified Certificates</h3>
                    <p className={styles.cardDescription}>Signed PDF Generation &amp; Export</p>
                    <div className={styles.cardStats}>
                      <span className={styles.statNumber} ref={stat3Ref}>
                        {stats.completed}
                      </span>
                      <span className={styles.statLabel}>Completed Reports</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Middle Section: Valuation Trends SVG Chart & Quick Action Tiles */}
            <div className={styles.analyticsMiddleSection}>
              {/* Valuation Activity Curve */}
              <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <div>
                    <h3 className={styles.chartTitle}>Valuation Volume &amp; Assessment Trends</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Monthly property inspection and certified certificate issuance rate
                    </p>
                  </div>
                  <span className={styles.chartBadge}>Live Telemetry</span>
                </div>

                <ValuationTrendChart height={160} />
              </div>

              {/* Quick Actions Panel */}
              <div className={styles.quickActionsCard}>
                <h3 className={styles.chartTitle}>Accelerated Workflows</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Jump directly to core valuation operations
                </p>

                <div className={styles.actionGrid}>
                  <Link href="/property-values" className={styles.actionTile}>
                    <div className={styles.actionTileLeft}>
                      <Building size={20} color="var(--primary-gold)" />
                      <div>
                        <div className={styles.actionTileTitle}>10-Tab Valuation Form</div>
                        <div className={styles.actionTileSub}>Comprehensive Property Spec</div>
                      </div>
                    </div>
                    <ArrowRight size={16} />
                  </Link>

                  <Link href="/create-report" className={styles.actionTile}>
                    <div className={styles.actionTileLeft}>
                      <PlusCircle size={20} color="var(--primary-gold)" />
                      <div>
                        <div className={styles.actionTileTitle}>Intake New Asset</div>
                        <div className={styles.actionTileSub}>Borrower &amp; Bank Details</div>
                      </div>
                    </div>
                    <ArrowRight size={16} />
                  </Link>

                  <Link href="/report-list" className={styles.actionTile}>
                    <div className={styles.actionTileLeft}>
                      <Download size={20} color="var(--primary-gold)" />
                      <div>
                        <div className={styles.actionTileTitle}>Download Dossiers</div>
                        <div className={styles.actionTileSub}>Access Certified PDFs</div>
                      </div>
                    </div>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent Valuation Records Panel */}
            <div className={styles.recentPanel}>
              <div className={styles.recentPanelHeader}>
                <div>
                  <h3 className={styles.recentTitle}>Recent Certified Valuations</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                    Latest property assessments ready for review and digital signature
                  </p>
                </div>
                <Link href="/report-list" className={styles.viewAllLink}>
                  <span>View All Reports</span>
                  <ArrowRight size={16} />
                </Link>
              </div>

              {recentReports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <Building size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                  <p>No valuation reports recorded yet.</p>
                  <Link
                    href="/property-values"
                    style={{ color: 'var(--primary-gold)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}
                  >
                    Create First Valuation Report &rarr;
                  </Link>
                </div>
              ) : (
                recentReports.map((rep) => {
                  const repId = rep.id || rep._id;
                  const isDownloading = downloadingId === repId;
                  const inst = rep.institution_details || rep.institutionDetails || {};
                  const prop = rep.property_identification || rep.propertyIdentification || {};

                  return (
                    <div key={repId} className={styles.reportItem}>
                      <div className={styles.reportMainInfo}>
                        <div className={styles.reportApplicant}>
                          {inst.applicant_name || rep.report_number || 'Property Valuation Case'}
                        </div>
                        <div className={styles.reportMetaRow}>
                          <span className={styles.bankBadge}>
                            {inst.bank_name || 'Banking Institution'}
                          </span>
                          <span>•</span>
                          <span>
                            Location: <strong style={{ color: 'var(--text-secondary)' }}>{prop.locality_name || 'Hyderabad Region'}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Report ID: <span style={{ color: 'var(--secondary-gold)' }}>{rep.report_number || repId}</span>
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDownloadPDF(repId, e)}
                        className={styles.pdfButton}
                        disabled={isDownloading}
                      >
                        <Download size={15} />
                        <span>{isDownloading ? 'Preparing PDF...' : 'Download PDF'}</span>
                      </button>
                    </div>
                  );
                })
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
