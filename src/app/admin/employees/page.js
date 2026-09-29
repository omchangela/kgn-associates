'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import Footer from '@/components/footer/Footer';
import styles from './AdminEmployees.module.css';
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
  Briefcase,
  Search,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
  Edit,
  Lock,
  User,
  AtSign
} from 'lucide-react';
import { KgnCrest, ApprovedValuerBadge, ArchitecturalGridSvg } from '@/components/common/SvgDecorations';
import gsap from 'gsap';

function AdminEmployeesContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [notification, setNotification] = useState({ text: '', type: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const searchParams = useSearchParams();

  // Create employee form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    role: 'valuer',
    status: 'active',
  });

  // Edit employee form state
  const [editFormData, setEditFormData] = useState({
    id: '',
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    role: 'valuer',
    status: 'active',
    password: '',
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
    if (searchParams && searchParams.get('create') === 'true') {
      setIsModalOpen(true);
    }
  }, [searchParams]);

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

  const showNotification = (text, type = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification({ text: '', type: '' }), 5000);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditInputChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
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
        showNotification(
          `Employee "${formData.username}" created successfully! They can now log in at the Employee Portal (/login).`,
          'success'
        );
        setIsModalOpen(false);
        setFormData({
          username: '',
          email: '',
          password: '',
          first_name: '',
          last_name: '',
          phone_number: '',
          role: 'valuer',
          status: 'active',
        });
        fetchUsers();
      } else {
        showNotification(data.error || 'Failed to create employee', 'error');
      }
    } catch (err) {
      showNotification('Network error while creating employee', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (user) => {
    setEditFormData({
      id: user.id,
      username: user.username,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone_number: user.phone_number || '',
      role: user.role || 'valuer',
      status: user.status || 'active',
      password: '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showNotification(`Employee details updated successfully`, 'success');
        setIsEditModalOpen(false);
        fetchUsers();
      } else {
        showNotification(data.error || 'Failed to update employee', 'error');
      }
    } catch (err) {
      showNotification('Network error while updating employee', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus, username) => {
    const nextStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showNotification(`Status for ${username} changed to ${nextStatus.toUpperCase()}`, 'success');
        setUsers(users.map(u => u.id === id ? { ...u, status: nextStatus } : u));
      } else {
        showNotification(data.error || 'Failed to update status', 'error');
      }
    } catch (err) {
      showNotification('Failed to toggle status', 'error');
    }
  };

  const handleDeleteUser = async (id, username) => {
    if (!confirm(`Are you sure you want to permanently delete employee account "${username}"?`)) return;

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

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && u.status !== 'inactive') ||
      (filterStatus === 'inactive' && u.status === 'inactive');

    return matchesSearch && matchesRole && matchesStatus;
  });

  const activeCount = users.filter(u => u.status !== 'inactive').length;
  const inactiveCount = users.filter(u => u.status === 'inactive').length;

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
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={styles.rightSide}>
        <AdminHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} title="Employee Management" />

        <div className={styles.mainScrollArea}>
          <div className={styles.contentPadding}>
            {/* Page Header */}
            <div className={styles.pageHeader}>
              <div className={styles.headerLeft}>
                <div className={styles.badgeRow}>
                  <span className={styles.portalBadge}>
                    <ShieldCheck size={14} /> Executive Administration
                  </span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    &bull; Staff Provisioning &amp; Access Control
                  </span>
                </div>
                <h1 className={styles.pageTitle}>Employee Management</h1>
                <p className={styles.pageSubtitle}>
                  Create, read, update, and manage employee accounts. Employees created here log in via the Employee Portal (/login).
                </p>
              </div>

              <div className={styles.headerActions}>
                <button
                  className={styles.createBtn}
                  onClick={() => setIsModalOpen(true)}
                >
                  <UserPlus size={18} />
                  <span>+ Create Employee</span>
                </button>
              </div>
            </div>

            {/* Notification alert */}
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
                {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                <span>{notification.text}</span>
              </div>
            )}

            {/* Quick Stats & Filters Bar */}
            <div style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              padding: '14px 18px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-light)',
              borderRadius: '10px',
            }}>
              {/* Quick Summary Counts */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                  Total Staff: <strong style={{ color: '#ffffff' }}>{users.length}</strong>
                </span>
                <span style={{ fontSize: '0.86rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <UserCheck size={14} /> Active: <strong>{activeCount}</strong>
                </span>
                <span style={{ fontSize: '0.86rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <UserX size={14} /> Inactive: <strong>{inactiveCount}</strong>
                </span>
              </div>

              {/* Search & Filter Controls */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Search Box */}
                <div style={{ position: 'relative', width: '220px' }}>
                  <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search name/email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 34px',
                      borderRadius: '6px',
                      background: 'rgba(11, 16, 29, 0.7)',
                      border: '1px solid var(--border-light)',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'rgba(11, 16, 29, 0.7)',
                    border: '1px solid var(--border-light)',
                    color: '#cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>

                {/* Role Filter */}
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'rgba(11, 16, 29, 0.7)',
                    border: '1px solid var(--border-light)',
                    color: '#cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                >
                  <option value="all">All Roles</option>
                  <option value="valuer">Valuers</option>
                  <option value="inspector">Field Inspectors</option>
                  <option value="admin">Administrators</option>
                </select>
              </div>
            </div>

            {/* Employee Directory Card */}
            <div className={styles.card} ref={tableRef}>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Employee / Valuer</th>
                      <th>Designation</th>
                      <th>Official Email</th>
                      <th>Contact Mobile</th>
                      <th>Account Status</th>
                      <th>Joined Date</th>
                      <th style={{ textAlign: 'right' }}>Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                          Loading employees directory...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                          No employees found matching criteria. Click "+ Create Employee" above to add staff.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const initials = (u.first_name ? u.first_name[0] : u.username[0] || 'V').toUpperCase();
                        const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username;
                        const isActive = u.status !== 'inactive';
                        const isRootAdmin = u.id === 'user_admin_root' || u.id === 'user_admin_1' || u.email === 'admin@admin.com';

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
                              <span className={`${styles.statusPill} ${isActive ? styles.statusActive : styles.statusInactive}`}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isActive ? '#10b981' : '#f59e0b' }} />
                                <span>{isActive ? 'Active' : 'Inactive'}</span>
                              </span>
                            </td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              {new Date(u.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                {/* Edit Button */}
                                <button
                                  className={styles.toggleBtn}
                                  onClick={() => handleOpenEdit(u)}
                                  title="Edit Employee Details"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <Edit size={12} />
                                  <span>Edit</span>
                                </button>

                                {!isRootAdmin ? (
                                  <>
                                    <button
                                      className={styles.toggleBtn}
                                      onClick={() => handleToggleStatus(u.id, u.status, u.username)}
                                      title={isActive ? 'Deactivate employee account' : 'Activate employee account'}
                                      style={{ color: isActive ? '#fbbf24' : '#34d399' }}
                                    >
                                      {isActive ? 'Deactivate' : 'Activate'}
                                    </button>

                                    <button
                                      className={styles.deleteBtn}
                                      onClick={() => handleDeleteUser(u.id, u.username)}
                                      title="Delete employee account"
                                    >
                                      <Trash2 size={13} />
                                      <span>Delete</span>
                                    </button>
                                  </>
                                ) : (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--primary-gold)', fontWeight: '600' }}>
                                    Root Admin
                                  </span>
                                )}
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

      {/* CREATE EMPLOYEE MODAL */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                <KgnCrest size={40} className={styles.modalIconCrest} />
                <div>
                  <div className={styles.modalTagPill}>
                    <ShieldCheck size={12} />
                    <span>Staff Provisioning &bull; Access Control</span>
                  </div>
                  <h3 className={styles.modalTitle}>Create New Employee Account</h3>
                  <p className={styles.modalSubtitle}>
                    Provision credentials for field assessment and valuation authorization.
                  </p>
                </div>
              </div>
              <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)} aria-label="Close modal">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee}>
              <div className={styles.modalBodyScroll}>
                {/* Section 1: Personal Details */}
                <div className={styles.formSectionHeading}>
                  <User size={14} />
                  <span>1. Personal &amp; Contact Details</span>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <div className={styles.labelRow}>
                      <label className={styles.label}>
                        First Name <span className={styles.requiredStar}>*</span>
                      </label>
                    </div>
                    <div className={styles.inputWrapper}>
                      <User className={styles.fieldIcon} size={16} />
                      <input
                        type="text"
                        name="first_name"
                        className={styles.inputField}
                        placeholder="e.g. Rahul"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <div className={styles.labelRow}>
                      <label className={styles.label}>
                        Last Name <span className={styles.requiredStar}>*</span>
                      </label>
                    </div>
                    <div className={styles.inputWrapper}>
                      <User className={styles.fieldIcon} size={16} />
                      <input
                        type="text"
                        name="last_name"
                        className={styles.inputField}
                        placeholder="e.g. Sharma"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                    <div className={styles.labelRow}>
                      <label className={styles.label}>Mobile Contact Number</label>
                      <span className={styles.labelHint}>Optional</span>
                    </div>
                    <div className={styles.inputWrapper}>
                      <Phone className={styles.fieldIcon} size={16} />
                      <input
                        type="tel"
                        name="phone_number"
                        className={styles.inputField}
                        placeholder="+91 98765 43210"
                        value={formData.phone_number}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Portal Login Credentials */}
                <div className={styles.formSectionHeading} style={{ marginTop: '8px' }}>
                  <ShieldCheck size={14} />
                  <span>2. Portal Login Credentials</span>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <div className={styles.labelRow}>
                      <label className={styles.label}>
                        Username / Login ID <span className={styles.requiredStar}>*</span>
                      </label>
                    </div>
                    <div className={styles.inputWrapper}>
                      <AtSign className={styles.fieldIcon} size={16} />
                      <input
                        type="text"
                        name="username"
                        className={styles.inputField}
                        placeholder="e.g. rahul_valuer"
                        value={formData.username}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <div className={styles.labelRow}>
                      <label className={styles.label}>
                        Initial Password <span className={styles.requiredStar}>*</span>
                      </label>
                    </div>
                    <div className={styles.inputWrapper}>
                      <Lock className={styles.fieldIcon} size={16} />
                      <input
                        type="password"
                        name="password"
                        className={styles.inputField}
                        placeholder="Min 6 characters"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                    <div className={styles.labelRow}>
                      <label className={styles.label}>
                        Official Email Address <span className={styles.requiredStar}>*</span>
                      </label>
                    </div>
                    <div className={styles.inputWrapper}>
                      <Mail className={styles.fieldIcon} size={16} />
                      <input
                        type="email"
                        name="email"
                        className={styles.inputField}
                        placeholder="rahul@kgnassociates.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Role & Governance */}
                <div className={styles.formSectionHeading} style={{ marginTop: '8px' }}>
                  <Briefcase size={14} />
                  <span>3. Role &amp; Access Governance</span>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <div className={styles.labelRow}>
                      <label className={styles.label}>
                        Designation / Role <span className={styles.requiredStar}>*</span>
                      </label>
                    </div>
                    <div className={styles.selectWrapper}>
                      <Briefcase className={styles.fieldIcon} size={16} />
                      <select
                        name="role"
                        className={styles.selectField}
                        value={formData.role}
                        onChange={handleInputChange}
                      >
                        <option value="valuer">Approved Valuer</option>
                        <option value="field_inspector">Field Inspector / Assessor</option>
                        <option value="engineer">Chartered Engineer</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <div className={styles.labelRow}>
                      <label className={styles.label}>
                        Account Status <span className={styles.requiredStar}>*</span>
                      </label>
                    </div>
                    <div className={styles.selectWrapper}>
                      <CheckCircle2 className={styles.fieldIcon} size={16} />
                      <select
                        name="status"
                        className={styles.selectField}
                        value={formData.status}
                        onChange={handleInputChange}
                      >
                        <option value="active">Active (Permit Portal Access)</option>
                        <option value="inactive">Inactive (Suspended Account)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <div className={styles.securityNote}>
                  <ShieldCheck size={15} style={{ color: 'var(--primary-gold)' }} />
                  <span>Instant Employee Portal Authentication</span>
                </div>

                <div className={styles.footerButtons}>
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
                    <UserPlus size={16} />
                    <span>{submitting ? 'Creating Employee...' : 'Create Employee Account'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EMPLOYEE MODAL (CRUD Update) */}
      {isEditModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsEditModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(212, 175, 55, 0.15)',
                  border: '1px solid rgba(212, 175, 55, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary-gold)',
                  flexShrink: 0
                }}>
                  <Edit size={20} />
                </div>
                <div>
                  <div className={styles.modalTagPill}>
                    <ShieldCheck size={12} />
                    <span>Credential Management</span>
                  </div>
                  <h3 className={styles.modalTitle}>Edit Employee: @{editFormData.username}</h3>
                  <p className={styles.modalSubtitle}>
                    Modify contact parameters, designation, or access status.
                  </p>
                </div>
              </div>
              <button className={styles.closeBtn} onClick={() => setIsEditModalOpen(false)} aria-label="Close modal">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateEmployee}>
              <div className={styles.modalBodyScroll}>
                {/* Personal Information */}
                <div className={styles.formSectionHeading}>
                  <User size={14} />
                  <span>Personal Details</span>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <div className={styles.labelRow}>
                      <label className={styles.label}>First Name</label>
                    </div>
                    <div className={styles.inputWrapper}>
                      <User className={styles.fieldIcon} size={16} />
                      <input
                        type="text"
                        name="first_name"
                        className={styles.inputField}
                        value={editFormData.first_name}
                        onChange={handleEditInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <div className={styles.labelRow}>
                      <label className={styles.label}>Last Name</label>
                    </div>
                    <div className={styles.inputWrapper}>
                      <User className={styles.fieldIcon} size={16} />
                      <input
                        type="text"
                        name="last_name"
                        className={styles.inputField}
                        value={editFormData.last_name}
                        onChange={handleEditInputChange}
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <div className={styles.labelRow}>
                      <label className={styles.label}>Official Email</label>
                    </div>
                    <div className={styles.inputWrapper}>
                      <Mail className={styles.fieldIcon} size={16} />
                      <input
                        type="email"
                        name="email"
                        className={styles.inputField}
                        value={editFormData.email}
                        onChange={handleEditInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <div className={styles.labelRow}>
                      <label className={styles.label}>Contact Phone</label>
                    </div>
                    <div className={styles.inputWrapper}>
                      <Phone className={styles.fieldIcon} size={16} />
                      <input
                        type="tel"
                        name="phone_number"
                        className={styles.inputField}
                        value={editFormData.phone_number}
                        onChange={handleEditInputChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Role & Status */}
                <div className={styles.formSectionHeading} style={{ marginTop: '8px' }}>
                  <Briefcase size={14} />
                  <span>Role &amp; Status Governance</span>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <div className={styles.labelRow}>
                      <label className={styles.label}>Role / Designation</label>
                    </div>
                    <div className={styles.selectWrapper}>
                      <Briefcase className={styles.fieldIcon} size={16} />
                      <select
                        name="role"
                        className={styles.selectField}
                        value={editFormData.role}
                        onChange={handleEditInputChange}
                      >
                        <option value="valuer">Approved Valuer</option>
                        <option value="field_inspector">Field Inspector / Assessor</option>
                        <option value="engineer">Chartered Engineer</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <div className={styles.labelRow}>
                      <label className={styles.label}>Account Status</label>
                    </div>
                    <div className={styles.selectWrapper}>
                      <CheckCircle2 className={styles.fieldIcon} size={16} />
                      <select
                        name="status"
                        className={styles.selectField}
                        value={editFormData.status}
                        onChange={handleEditInputChange}
                      >
                        <option value="active">Active (Access Allowed)</option>
                        <option value="inactive">Inactive (Access Suspended)</option>
                      </select>
                    </div>
                  </div>

                  <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                    <div className={styles.labelRow}>
                      <label className={styles.label}>Reset Password</label>
                      <span className={styles.labelHint}>Leave empty to keep current password</span>
                    </div>
                    <div className={styles.inputWrapper}>
                      <Lock className={styles.fieldIcon} size={16} />
                      <input
                        type="password"
                        name="password"
                        className={styles.inputField}
                        placeholder="Enter new password (optional)"
                        value={editFormData.password}
                        onChange={handleEditInputChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <div className={styles.securityNote}>
                  <ShieldCheck size={15} style={{ color: 'var(--primary-gold)' }} />
                  <span>Instant Real-Time Synchronization</span>
                </div>

                <div className={styles.footerButtons}>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={submitting}
                  >
                    <span>{submitting ? 'Saving Changes...' : 'Save Employee Details'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminEmployeesPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', color: '#fff' }}>Loading Employee Console...</div>}>
      <AdminEmployeesContent />
    </Suspense>
  );
}
