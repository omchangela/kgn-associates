'use client';

import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/header/Header';
import Sidebar from '@/components/sidebar/Sidebar';
import Footer from '@/components/footer/Footer';
import styles from './Employees.module.css';
import {
  Users,
  ShieldCheck,
  Mail,
  Phone,
  CheckCircle2,
  Briefcase,
  Search,
  ExternalLink
} from 'lucide-react';
import { ApprovedValuerBadge, ArchitecturalGridSvg } from '@/components/common/SvgDecorations';
import Link from 'next/link';
import gsap from 'gsap';

export default function EmployeesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const containerRef = useRef(null);
  const tableRef = useRef(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!loading && tableRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          tableRef.current,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }
        );
      }, containerRef);
      return () => ctx.revert();
    }
  }, [loading]);

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
    const matchesSearch =
      !q ||
      fullName.includes(q) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone_number && u.phone_number.includes(q));

    const matchesRole =
      filterRole === 'all' ||
      (filterRole === 'admin' && u.role === 'admin') ||
      (filterRole === 'valuer' && (u.role === 'valuer' || !u.role)) ||
      (filterRole === 'inspector' && (u.role === 'inspector' || u.role === 'field_inspector'));

    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className={`${styles.roleBadge} ${styles.roleAdmin}`}><ShieldCheck size={14} /> Administrator</span>;
      case 'inspector':
      case 'field_inspector':
        return <span className={`${styles.roleBadge} ${styles.roleInspector}`}><Briefcase size={14} /> Field Inspector</span>;
      default:
        return <span className={`${styles.roleBadge} ${styles.roleValuer}`}><ApprovedValuerBadge size={14} /> Approved Valuer</span>;
    }
  };

  return (
    <div className={styles.layoutWrapper} ref={containerRef}>
      <ArchitecturalGridSvg />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={styles.rightSide}>
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <div className={styles.mainScrollArea}>
          <div className={styles.contentPadding}>
            {/* Page Header - Read-Only for Employee Panel */}
            <div className={styles.pageHeader}>
              <div className={styles.headerLeft}>
                <div className={styles.badgeRow}>
                  <span className={styles.portalBadge}>
                    <Users size={14} /> Team Directory
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    • Employee Panel
                  </span>
                </div>
                <h1 className={styles.pageTitle}>Valuers &amp; Staff Directory</h1>
                <p className={styles.pageSubtitle}>
                  View official chartered engineers, registered property valuers, and municipal assessors in your organization.
                </p>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: '20px',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{
                position: 'relative',
                flex: '1',
                minWidth: '240px',
                maxWidth: '400px',
              }}>
                <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search staff by name, email, username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 38px',
                    borderRadius: '8px',
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    color: '#1e293b',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {['all', 'valuer', 'inspector', 'admin'].map((roleKey) => (
                  <button
                    key={roleKey}
                    onClick={() => setFilterRole(roleKey)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      border: filterRole === roleKey ? '1.5px solid var(--primary-gold)' : '1px solid #cbd5e1',
                      background: filterRole === roleKey ? 'var(--gradient-gold)' : '#ffffff',
                      color: filterRole === roleKey ? '#1e293b' : '#64748b',
                      textTransform: 'capitalize',
                      transition: 'all 0.2s',
                      boxShadow: filterRole === roleKey ? '0 2px 8px rgba(184, 134, 11, 0.25)' : 'none',
                    }}
                  >
                    {roleKey === 'all' ? `All Staff (${users.length})` : roleKey}
                  </button>
                ))}
              </div>
            </div>

            {/* Employee Directory Card */}
            <div className={styles.card} ref={tableRef}>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Employee / Valuer</th>
                      <th>Role &amp; Credentials</th>
                      <th>Email Address</th>
                      <th>Contact Phone</th>
                      <th>Status</th>
                      <th>Registered On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className={styles.emptyState}>
                          Loading staff directory...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className={styles.emptyState}>
                          No employees matched your search.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const initials = (u.first_name ? u.first_name[0] : u.username[0] || 'V').toUpperCase();
                        const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username;
                        const isActive = u.status !== 'inactive';

                        return (
                          <tr key={u.id}>
                            <td>
                              <div className={styles.userCell}>
                                <div className={styles.avatar}>{initials}</div>
                                <div>
                                  <div className={styles.userName}>{fullName}</div>
                                  <div className={styles.userHandle}>@{u.username}</div>
                                </div>
                              </div>
                            </td>
                            <td>{getRoleBadge(u.role)}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                                <Mail size={14} />
                                <span>{u.email}</span>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                                <Phone size={14} />
                                <span>{u.phone_number || '—'}</span>
                              </div>
                            </td>
                            <td>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontSize: '0.78rem',
                                fontWeight: '600',
                                background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: isActive ? '#34d399' : '#f87171',
                                border: `1px solid ${isActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                              }}>
                                <span style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: isActive ? '#10b981' : '#ef4444',
                                }} />
                                {isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              {new Date(u.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
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
    </div>
  );
}
