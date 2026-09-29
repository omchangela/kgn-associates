'use client';

import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/header/Header';
import Sidebar from '@/components/sidebar/Sidebar';
import Footer from '@/components/footer/Footer';
import styles from './Employees.module.css';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  Mail, 
  Phone, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { KgnCrest, ApprovedValuerBadge, ArchitecturalGridSvg } from '@/components/common/SvgDecorations';
import gsap from 'gsap';

export default function EmployeesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState({ text: '', type: '' });

  // New employee form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    role: 'valuer',
  });
  const [submitting, setSubmitting] = useState(false);

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
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
        );
      }, containerRef);
      return () => ctx.revert();
    }
  }, [loading]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const showNotification = (text, type = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification({ text: '', type: '' }), 4000);
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(`Employee ${formData.username} registered successfully!`, 'success');
        setIsModalOpen(false);
        setFormData({
          username: '',
          email: '',
          password: '',
          first_name: '',
          last_name: '',
          phone_number: '',
          role: 'valuer',
        });
        fetchUsers();
      } else {
        showNotification(data.error || 'Failed to create employee', 'error');
      }
    } catch (err) {
      showNotification('Error creating employee. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id, username) => {
    if (!confirm(`Are you sure you want to remove ${username}?`)) return;

    try {
      const res = await fetch(`/api/users?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showNotification(`Employee ${username} removed`, 'success');
        setUsers(users.filter((u) => u.id !== id));
      } else {
        showNotification(data.error || 'Failed to remove employee', 'error');
      }
    } catch (err) {
      showNotification('Failed to delete employee', 'error');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className={`${styles.roleBadge} ${styles.roleAdmin}`}><ShieldCheck size={14} /> Admin</span>;
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
            {/* Page Header */}
            <div className={styles.pageHeader}>
              <div className={styles.headerLeft}>
                <div className={styles.badgeRow}>
                  <span className={styles.portalBadge}>
                    <ShieldCheck size={14} /> Admin Management
                  </span>
                </div>
                <h1 className={styles.pageTitle}>Valuers &amp; Staff Directory</h1>
                <p className={styles.pageSubtitle}>
                  Manage authorized chartered engineers, approved valuers, and field assessment staff.
                </p>
              </div>

              <div className={styles.headerActions}>
                <button 
                  className={styles.addBtn}
                  onClick={() => setIsModalOpen(true)}
                >
                  <UserPlus size={18} />
                  <span>Add New Employee</span>
                </button>
              </div>
            </div>

            {/* Notification alert */}
            {notification.text && (
              <div 
                style={{
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
                }}
              >
                {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                <span>{notification.text}</span>
              </div>
            )}

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
                      <th>Registered On</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className={styles.emptyState}>
                          Loading staff directory...
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className={styles.emptyState}>
                          No employees found. Click "Add New Employee" above to register staff.
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => {
                        const initials = (u.first_name ? u.first_name[0] : u.username[0] || 'V').toUpperCase();
                        const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username;
                        const isRootAdmin = u.id === 'user_admin_1' || u.id === 'user_1' || u.username === 'admin';

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
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              {new Date(u.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {!isRootAdmin && (
                                <button
                                  className={styles.deleteBtn}
                                  onClick={() => handleDeleteUser(u.id, u.username)}
                                  title="Remove Employee"
                                >
                                  <Trash2 size={14} />
                                  <span>Remove</span>
                                </button>
                              )}
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

      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <KgnCrest size={28} />
                <h3 className={styles.modalTitle}>Add New Valuer / Employee</h3>
              </div>
              <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee}>
              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    className={styles.input}
                    placeholder="e.g. Rahul"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    className={styles.input}
                    placeholder="e.g. Sharma"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Username</label>
                  <input
                    type="text"
                    name="username"
                    className={styles.input}
                    placeholder="e.g. rahul_valuer"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Designation / Role</label>
                  <select
                    name="role"
                    className={styles.select}
                    value={formData.role}
                    onChange={handleInputChange}
                  >
                    <option value="valuer">Approved Valuer</option>
                    <option value="field_inspector">Field Inspector / Assessor</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label className={styles.label}>Official Email</label>
                  <input
                    type="email"
                    name="email"
                    className={styles.input}
                    placeholder="rahul@kgnassociates.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Mobile Contact</label>
                  <input
                    type="tel"
                    name="phone_number"
                    className={styles.input}
                    placeholder="+91 98765 43210"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Initial Password</label>
                  <input
                    type="password"
                    name="password"
                    className={styles.input}
                    placeholder="Minimum 6 characters"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={submitting}
                >
                  {submitting ? 'Creating Employee...' : 'Create Employee Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
