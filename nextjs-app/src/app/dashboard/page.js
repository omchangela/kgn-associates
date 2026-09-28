'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Dashboard.module.css';
import Sidebar from '@/components/sidebar/Sidebar';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import { BarChart3, FileText, ListChecks, PlusCircle, ArrowRight, Download, Award, ShieldCheck } from 'lucide-react';
import { propertyValuationAPI } from '@/services/api';

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalValuations: 0,
    completed: 0,
    drafts: 0,
  });
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const data = await propertyValuationAPI.getAll('?limit=5');
        const results = data.results || [];
        setRecentReports(results);
        setStats({
          totalValuations: data.count || results.length,
          completed: results.filter(r => r.status === 'completed').length,
          drafts: results.filter(r => r.status !== 'completed').length,
        });
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className={styles.layoutWrapper}>
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className={styles.rightSide}>
        {/* Header */}
        <Header onMenuToggle={toggleSidebar} />

        {/* Scrollable Content */}
        <main className={styles.mainScrollArea}>
          <div className={styles.contentPadding}>
            {/* Top Title Banner */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '32px',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <h1 className={styles.dashboardTitle} style={{ margin: 0 }}>Valuation Dashboard</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '6px' }}>
                  Property Valuation Management & Automated Certification System
                </p>
              </div>

              <Link href="/property-values" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--gradient-gold)',
                color: 'var(--bg-primary)',
                padding: '12px 24px',
                borderRadius: 'var(--border-radius)',
                fontWeight: 700,
                fontSize: '0.95rem',
                textDecoration: 'none',
                boxShadow: 'var(--shadow-gold)',
                transition: 'var(--transition)'
              }}>
                <PlusCircle size={20} />
                <span>New Property Valuation</span>
              </Link>
            </div>
            
            {/* Analysis Cards */}
            <div className={styles.analysisGrid}>
              <Link href="/property-values" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className={styles.analysisCard}>
                  <div className={styles.cardIcon}>
                    <BarChart3 size={32} />
                  </div>
                  <div className={styles.cardContent}>
                    <h3 className={styles.cardTitle}>Property Values</h3>
                    <p className={styles.cardDescription}>Detailed 10-Tab Valuation Form</p>
                    <div className={styles.cardStats}>
                      <span className={styles.statNumber}>{stats.totalValuations}</span>
                      <span className={styles.statLabel}>Properties Recorded</span>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/create-report" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className={styles.analysisCard}>
                  <div className={styles.cardIcon}>
                    <FileText size={32} />
                  </div>
                  <div className={styles.cardContent}>
                    <h3 className={styles.cardTitle}>Create Report</h3>
                    <p className={styles.cardDescription}>Fast Report Intake Form</p>
                    <div className={styles.cardStats}>
                      <span className={styles.statNumber}>10 Tabs</span>
                      <span className={styles.statLabel}>Full Valuation Spec</span>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/report-list" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className={styles.analysisCard}>
                  <div className={styles.cardIcon}>
                    <ListChecks size={32} />
                  </div>
                  <div className={styles.cardContent}>
                    <h3 className={styles.cardTitle}>Report List</h3>
                    <p className={styles.cardDescription}>View, Export & Download PDFs</p>
                    <div className={styles.cardStats}>
                      <span className={styles.statNumber}>{stats.totalValuations}</span>
                      <span className={styles.statLabel}>Total Reports</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Quick Actions */}
            <div className={styles.quickActions}>
              <h2 className={styles.sectionTitle}>Quick Actions</h2>
              <div className={styles.actionButtons}>
                <Link href="/property-values" className={styles.actionBtn} style={{ textDecoration: 'none', textAlign: 'center' }}>
                  Open Valuation Form
                </Link>
                <Link href="/create-report" className={styles.actionBtn} style={{ textDecoration: 'none', textAlign: 'center' }}>
                  Intake New Property
                </Link>
                <Link href="/report-list" className={styles.actionBtn} style={{ textDecoration: 'none', textAlign: 'center' }}>
                  Manage & Download Reports
                </Link>
              </div>
            </div>

            {/* Recent Valuation Records */}
            {recentReports.length > 0 && (
              <div style={{ 
                marginTop: '36px', 
                background: 'var(--bg-card)', 
                borderRadius: 'var(--border-radius)', 
                padding: '24px', 
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-card)' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-gold)', margin: 0 }}>
                    Recent Valuations
                  </h3>
                  <Link href="/report-list" style={{ color: 'var(--secondary-gold)', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>View all</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {recentReports.map(rep => (
                    <div 
                      key={rep.id} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '16px', 
                        background: 'var(--bg-secondary)', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: 'var(--border-radius-sm)',
                        transition: 'var(--transition)'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem' }}>
                          {rep.institution_details?.applicant_name || rep.report_number || 'Valuation Record'}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Bank: <strong style={{ color: 'var(--text-secondary)' }}>{rep.institution_details?.bank_name || 'N/A'}</strong> • Locality: {rep.property_identification?.locality_name || 'N/A'}
                        </div>
                      </div>

                      <Link 
                        href={`/api/valuations/${rep.id}/generate-pdf`} 
                        target="_blank" 
                        style={{ 
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.85rem', 
                          color: 'var(--primary-gold)', 
                          fontWeight: 600, 
                          textDecoration: 'none',
                          padding: '8px 14px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          background: 'rgba(212, 176, 122, 0.08)'
                        }}
                      >
                        <Download size={14} />
                        <span>Download PDF</span>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
