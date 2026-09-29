'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import Footer from '@/components/footer/Footer';
import styles from './AdminEmployees.module.css';
import { 
  Users, UserPlus, Trash2, ShieldCheck, Mail, Phone,
  X, CheckCircle2, AlertCircle, Briefcase, Search,
  UserCheck, UserX, Edit, Lock, User, MapPin, Eye, EyeOff
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
  const [filterStatus, setFilterStatus] = useState('all');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    name: '', email: '', phone_number: '', city: '', password: '', confirm_password: '',
  });

  const [editFormData, setEditFormData] = useState({
    id: '', first_name: '', last_name: '', email: '', phone_number: '',
    city: '', role: 'valuer', status: 'active', password: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const containerRef = useRef(null);
  const tableRef = useRef(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) setUsers(data.users);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    if (searchParams && searchParams.get('create') === 'true') setIsModalOpen(true);
  }, [searchParams]);

  useEffect(() => {
    if (!loading && tableRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(tableRef.current, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' });
      }, containerRef);
      return () => ctx.revert();
    }
  }, [loading]);

  const showNotification = (text, type = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification({ text: '', type: '' }), 5000);
  };

  const generateUsername = (name) => {
    const base = name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '') || 'emp';
    const suffix = Date.now().toString().slice(-6);
    return `${base}.${suffix}`;
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
      showNotification('Passwords do not match.', 'error'); return;
    }
    if (formData.password.length < 6) {
      showNotification('Password must be at least 6 characters.', 'error'); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          username: generateUsername(formData.name),
          email: formData.email,
          phone_number: formData.phone_number,
          city: formData.city,
          password: formData.password,
          confirm_password: formData.confirm_password,
          role: 'valuer', status: 'active',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(`Employee "${formData.name}" created successfully!`, 'success');
        setIsModalOpen(false);
        setFormData({ name: '', email: '', phone_number: '', city: '', password: '', confirm_password: '' });
        setShowPassword(false); setShowConfirmPassword(false);
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
      id: user.id, first_name: user.first_name || '', last_name: user.last_name || '',
      email: user.email || '', phone_number: user.phone_number || '',
      city: user.city || '', role: user.role || 'valuer', status: user.status || 'active', password: '',
    });
    setShowEditPassword(false);
    setIsEditModalOpen(true);
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    if (editFormData.password && editFormData.password.length < 6) {
      showNotification('New password must be at least 6 characters.', 'error'); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('Employee details updated successfully', 'success');
        setIsEditModalOpen(false); fetchUsers();
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
      } else { showNotification(data.error || 'Failed to update status', 'error'); }
    } catch { showNotification('Failed to toggle status', 'error'); }
  };

  const handleDeleteUser = async (id, username) => {
    if (!confirm(`Permanently delete employee "${username}"?`)) return;
    try {
      const res = await fetch(`/api/users?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(`Employee ${username} removed`, 'success');
        setUsers(users.filter(u => u.id !== id));
      } else { showNotification(data.error || 'Failed to remove', 'error'); }
    } catch { showNotification('Failed to delete employee', 'error'); }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
    const matchSearch = !q || fullName.includes(q) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q));
    const matchStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && u.status !== 'inactive') ||
      (filterStatus === 'inactive' && u.status === 'inactive');
    return matchSearch && matchStatus;
  });

  const activeCount = users.filter(u => u.status !== 'inactive').length;
  const inactiveCount = users.filter(u => u.status === 'inactive').length;

  const getRoleBadge = (role) => {
    if (role === 'admin') return <span className={`${styles.roleBadge} ${styles.roleAdmin}`}><ShieldCheck size={13} /> Admin</span>;
    if (role === 'inspector' || role === 'field_inspector') return <span className={`${styles.roleBadge} ${styles.roleInspector}`}><Briefcase size={13} /> Inspector</span>;
    return <span className={`${styles.roleBadge} ${styles.roleValuer}`}><ApprovedValuerBadge size={13} /> Valuer</span>;
  };

  const secureInputProps = {
    autoComplete: 'new-password',
    onCopy: (e) => e.preventDefault(),
    onCut: (e) => e.preventDefault(),
    onPaste: (e) => e.preventDefault(),
    onContextMenu: (e) => e.preventDefault(),
    'data-form-type': 'other',
  };

  return (
    <div className={styles.layoutWrapper} ref={containerRef}>
      <ArchitecturalGridSvg />
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={styles.rightSide}>
        <AdminHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} title="Employee Management" />
        <div className={styles.mainScrollArea}>
          <div className={styles.contentPadding}>
            <div className={styles.pageHeader}>
              <div className={styles.headerLeft}>
                <div className={styles.badgeRow}>
                  <span className={styles.portalBadge}><ShieldCheck size={14} /> Executive Administration</span>
                </div>
                <h1 className={styles.pageTitle}>Employee Management</h1>
                <p className={styles.pageSubtitle}>Create, edit, activate, or remove employee accounts.</p>
              </div>
              <div className={styles.headerActions}>
                <button className={styles.createBtn} onClick={() => setIsModalOpen(true)}>
                  <UserPlus size={18} /><span>+ Add Employee</span>
                </button>
              </div>
            </div>

            {notification.text && (
              <div style={{
                padding: '12px 18px', borderRadius: '8px', marginBottom: '20px',
                display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.92rem',
                background: notification.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                border: `1px solid ${notification.type === 'error' ? '#ef4444' : '#10b981'}`,
                color: notification.type === 'error' ? '#fca5a5' : '#6ee7b7',
              }}>
                {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                <span>{notification.text}</span>
              </div>
            )}

            <div style={{
              display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center',
              justifyContent: 'space-between', marginBottom: '20px', padding: '14px 18px',
              background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border-light)', borderRadius: '10px',
            }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                  Total: <strong style={{ color: '#fff' }}>{users.length}</strong>
                </span>
                <span style={{ fontSize: '0.86rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <UserCheck size={14} /> Active: <strong>{activeCount}</strong>
                </span>
                <span style={{ fontSize: '0.86rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <UserX size={14} /> Inactive: <strong>{inactiveCount}</strong>
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '220px' }}>
                  <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" placeholder="Search name / email..." value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: '6px', background: 'rgba(11,16,29,0.7)', border: '1px solid var(--border-light)', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(11,16,29,0.7)', border: '1px solid var(--border-light)', color: '#cbd5e1', fontSize: '0.85rem', outline: 'none' }}>
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>

            <div className={styles.card} ref={tableRef}>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Designation</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>City</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>Loading employees...</td></tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr><td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>No employees found. Click "+ Add Employee" to get started.</td></tr>
                    ) : filteredUsers.map((u) => {
                      const initials = (u.first_name ? u.first_name[0] : u.username?.[0] || 'V').toUpperCase();
                      const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username;
                      const isActive = u.status !== 'inactive';
                      const isRootAdmin = u.email === 'admin@admin.com';
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
                          <td><div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontSize: '0.87rem' }}><Mail size={13} />{u.email}</div></td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.87rem' }}>{u.phone_number || '—'}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.87rem' }}>{u.city || '—'}</td>
                          <td>
                            <span className={`${styles.statusPill} ${isActive ? styles.statusActive : styles.statusInactive}`}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isActive ? '#10b981' : '#f59e0b' }} />
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                            {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <button className={styles.toggleBtn} onClick={() => handleOpenEdit(u)}><Edit size={12} /> Edit</button>
                              {!isRootAdmin ? (
                                <>
                                  <button className={styles.toggleBtn} onClick={() => handleToggleStatus(u.id, u.status, u.username)} style={{ color: isActive ? '#fbbf24' : '#34d399' }}>
                                    {isActive ? 'Deactivate' : 'Activate'}
                                  </button>
                                  <button className={styles.deleteBtn} onClick={() => handleDeleteUser(u.id, u.username)}><Trash2 size={12} /> Delete</button>
                                </>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: 'var(--primary-gold)', fontWeight: 700 }}>Root Admin</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
                <KgnCrest size={38} className={styles.modalIconCrest} />
                <div>
                  <div className={styles.modalTagPill}><UserPlus size={12} /><span>New Employee</span></div>
                  <h3 className={styles.modalTitle}>Add New Employee</h3>
                  <p className={styles.modalSubtitle}>Fill in the details to create this employee&apos;s account.</p>
                </div>
              </div>
              <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateEmployee} autoComplete="off">
              <div className={styles.modalBodyScroll}>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Full Name <span className={styles.requiredStar}>*</span></label>
                  <div className={styles.inputWrapper}>
                    <User className={styles.fieldIcon} size={16} />
                    <input type="text" name="name" className={styles.inputField} placeholder="e.g. Rahul Sharma"
                      value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required autoComplete="off" />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Email Address <span className={styles.requiredStar}>*</span></label>
                  <div className={styles.inputWrapper}>
                    <Mail className={styles.fieldIcon} size={16} />
                    <input type="email" name="email" className={styles.inputField} placeholder="email@example.com"
                      value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required autoComplete="off" />
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Phone Number</label>
                    <div className={styles.inputWrapper}>
                      <Phone className={styles.fieldIcon} size={16} />
                      <input type="tel" name="phone_number" className={styles.inputField} placeholder="+91 98765 43210"
                        value={formData.phone_number} onChange={(e) => setFormData({...formData, phone_number: e.target.value})} autoComplete="off" />
                    </div>
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>City</label>
                    <div className={styles.inputWrapper}>
                      <MapPin className={styles.fieldIcon} size={16} />
                      <input type="text" name="city" className={styles.inputField} placeholder="e.g. Surat"
                        value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} autoComplete="off" />
                    </div>
                  </div>
                </div>

                <div className={styles.formDivider}>
                  <Lock size={13} /><span>Access Credentials</span>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Password <span className={styles.requiredStar}>*</span></label>
                    <div className={styles.inputWrapper}>
                      <Lock className={styles.fieldIcon} size={16} />
                      <input type={showPassword ? 'text' : 'password'} name="password" className={styles.inputField}
                        placeholder="Minimum 6 characters" value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required minLength={6} {...secureInputProps} />
                      <button type="button" className={styles.eyeToggle} onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Confirm Password <span className={styles.requiredStar}>*</span></label>
                    <div className={`${styles.inputWrapper} ${formData.confirm_password && formData.password !== formData.confirm_password ? styles.inputWrapperError : ''}`}>
                      <Lock className={styles.fieldIcon} size={16} />
                      <input type={showConfirmPassword ? 'text' : 'password'} name="confirm_password" className={styles.inputField}
                        placeholder="Re-enter password" value={formData.confirm_password}
                        onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
                        required {...secureInputProps} />
                      <button type="button" className={styles.eyeToggle} onClick={() => setShowConfirmPassword(!showConfirmPassword)} tabIndex={-1}>
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {formData.confirm_password && formData.password !== formData.confirm_password && (
                      <span className={styles.fieldError}>Passwords do not match</span>
                    )}
                  </div>
                </div>

              </div>
              <div className={styles.modalFooter}>
                <div className={styles.securityNote}>
                  <ShieldCheck size={14} style={{ color: 'var(--primary-gold)' }} />
                  <span>Employee can log in immediately after creation</span>
                </div>
                <div className={styles.footerButtons}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" className={styles.submitBtn} disabled={submitting || (formData.confirm_password && formData.password !== formData.confirm_password)}>
                    <UserPlus size={16} /><span>{submitting ? 'Creating...' : 'Create Employee'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EMPLOYEE MODAL */}
      {isEditModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsEditModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-gold)', flexShrink: 0 }}>
                  <Edit size={20} />
                </div>
                <div>
                  <div className={styles.modalTagPill}><ShieldCheck size={12} /><span>Edit Employee</span></div>
                  <h3 className={styles.modalTitle}>Update Employee Details</h3>
                  <p className={styles.modalSubtitle}>Modify contact info, designation, or access status.</p>
                </div>
              </div>
              <button className={styles.closeBtn} onClick={() => setIsEditModalOpen(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleUpdateEmployee} autoComplete="off">
              <div className={styles.modalBodyScroll}>
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>First Name</label>
                    <div className={styles.inputWrapper}>
                      <User className={styles.fieldIcon} size={16} />
                      <input type="text" name="first_name" className={styles.inputField} value={editFormData.first_name}
                        onChange={(e) => setEditFormData({...editFormData, first_name: e.target.value})} required autoComplete="off" />
                    </div>
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Last Name</label>
                    <div className={styles.inputWrapper}>
                      <User className={styles.fieldIcon} size={16} />
                      <input type="text" name="last_name" className={styles.inputField} value={editFormData.last_name}
                        onChange={(e) => setEditFormData({...editFormData, last_name: e.target.value})} autoComplete="off" />
                    </div>
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Email</label>
                    <div className={styles.inputWrapper}>
                      <Mail className={styles.fieldIcon} size={16} />
                      <input type="email" name="email" className={styles.inputField} value={editFormData.email}
                        onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} required autoComplete="off" />
                    </div>
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Phone</label>
                    <div className={styles.inputWrapper}>
                      <Phone className={styles.fieldIcon} size={16} />
                      <input type="tel" name="phone_number" className={styles.inputField} value={editFormData.phone_number}
                        onChange={(e) => setEditFormData({...editFormData, phone_number: e.target.value})} autoComplete="off" />
                    </div>
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>City</label>
                    <div className={styles.inputWrapper}>
                      <MapPin className={styles.fieldIcon} size={16} />
                      <input type="text" name="city" className={styles.inputField} value={editFormData.city}
                        onChange={(e) => setEditFormData({...editFormData, city: e.target.value})} autoComplete="off" />
                    </div>
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Role</label>
                    <div className={styles.selectWrapper}>
                      <Briefcase className={styles.fieldIcon} size={16} />
                      <select name="role" className={styles.selectField} value={editFormData.role}
                        onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}>
                        <option value="valuer">Approved Valuer</option>
                        <option value="field_inspector">Field Inspector</option>
                        <option value="engineer">Chartered Engineer</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Account Status</label>
                    <div className={styles.selectWrapper}>
                      <CheckCircle2 className={styles.fieldIcon} size={16} />
                      <select name="status" className={styles.selectField} value={editFormData.status}
                        onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Reset Password <span className={styles.labelHint}>(optional)</span></label>
                    <div className={styles.inputWrapper}>
                      <Lock className={styles.fieldIcon} size={16} />
                      <input type={showEditPassword ? 'text' : 'password'} name="password" className={styles.inputField}
                        placeholder="Leave blank to keep current" value={editFormData.password}
                        onChange={(e) => setEditFormData({...editFormData, password: e.target.value})}
                        {...secureInputProps} />
                      <button type="button" className={styles.eyeToggle} onClick={() => setShowEditPassword(!showEditPassword)} tabIndex={-1}>
                        {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <div className={styles.securityNote}>
                  <ShieldCheck size={14} style={{ color: 'var(--primary-gold)' }} />
                  <span>Changes apply instantly</span>
                </div>
                <div className={styles.footerButtons}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                  <button type="submit" className={styles.submitBtn} disabled={submitting}>
                    <span>{submitting ? 'Saving...' : 'Save Changes'}</span>
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
