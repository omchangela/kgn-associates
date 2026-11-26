'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import Footer from '@/components/footer/Footer';
import styles from '../reports/AdminReports.module.css';
import {
  Send,
  Users,
  FileText,
  Upload,
  Trash2,
  RefreshCw,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Download,
  Building2,
  Phone,
  MapPin,
} from 'lucide-react';
import { ArchitecturalGridSvg } from '@/components/common/SvgDecorations';

export default function AdminAllotmentsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState({ text: '', type: '' });

  const [form, setForm] = useState({
    employee_id: '',
    case_id: '',
    applicant_name: '',
    contact_number: '',
    bank_name: '',
    branch_name: '',
    property_address: '',
    notes: '',
  });
  const [pdfFile, setPdfFile] = useState(null);

  const showNotification = (text, type = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification({ text: '', type: '' }), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, assignRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/assignments'),
      ]);
      const usersData = await usersRes.json();
      const assignData = await assignRes.json();

      if (usersData?.users) {
        setEmployees(
          usersData.users.filter((u) => (u.role || 'valuer') !== 'admin' && u.status !== 'inactive')
        );
      }
      if (assignData?.assignments) {
        setAssignments(assignData.assignments);
      }
    } catch (err) {
      console.error('Failed to load allotment data:', err);
      showNotification('Failed to load data from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getSelectedEmployeeName = () => {
    const empObj = employees.find((u) => (u.id || u._id) === form.employee_id);
    return empObj
      ? `${empObj.first_name || ''} ${empObj.last_name || ''}`.trim() || empObj.username
      : '';
  };

  const buildAutoCasePdf = (empName) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    // Blue & White header (matching KGN PDF theme)
    doc.setFillColor(21, 101, 192);
    doc.rect(0, 0, 210, 14, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('KGN Groups — Case Allotment & Inspection Order', 14, 9.2);

    doc.setTextColor(13, 71, 161);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 196, 22, { align: 'right' });

    autoTable(doc, {
      startY: 26,
      margin: { left: 14, right: 14 },
      tableWidth: 182,
      head: [['CASE ALLOTMENT DETAILS', 'INFORMATION']],
      body: [
        ['Case ID / Loan App ID', form.case_id || 'N/A'],
        ['Assigned Employee / Valuer', empName || 'N/A'],
        ['Applicant Name', form.applicant_name || 'N/A'],
        ['Contact Number', form.contact_number || 'N/A'],
        ['Bank / Institution Name', form.bank_name || 'N/A'],
        ['Branch Name', form.branch_name || 'N/A'],
        ['Property Address', form.property_address || 'N/A'],
        ['Admin Instructions / Notes', form.notes || 'Please inspect the property and submit the valuation report.'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [21, 101, 192], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      styles: { fontSize: 8.5, cellPadding: 3, textColor: [15, 23, 42], lineColor: [187, 222, 251] },
      columnStyles: { 0: { cellWidth: 62, fontStyle: 'bold', fillColor: [227, 242, 253] }, 1: { cellWidth: 120 } },
    });

    const blob = doc.output('blob');
    const safeCase = (form.case_id || form.applicant_name || 'case').replace(/[^a-zA-Z0-9_-]/g, '_');
    return new File([blob], `${safeCase}_allotment.pdf`, { type: 'application/pdf' });
  };

  const handleOpenValuationForm = () => {
    const empName = getSelectedEmployeeName();
    const params = new URLSearchParams({
      admin: '1',
      ...(form.case_id ? { case_id: form.case_id } : {}),
      ...(form.applicant_name ? { applicant: form.applicant_name } : {}),
      ...(form.contact_number ? { contact: form.contact_number } : {}),
      ...(form.bank_name ? { bank: form.bank_name } : {}),
      ...(form.branch_name ? { branch: form.branch_name } : {}),
      ...(form.property_address ? { address: form.property_address } : {}),
      ...(empName ? { engineer: empName } : {}),
    });
    router.push(`/property-values?${params.toString()}`);
  };

  const handlePreviewAutoPdf = () => {
    const empName = getSelectedEmployeeName();
    const file = buildAutoCasePdf(empName);
    setPdfFile(file);
    const url = URL.createObjectURL(file);
    window.open(url, '_blank');
    showNotification('Auto-generated Case PDF attached!', 'success');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.employee_id) {
      showNotification('Please select an employee.', 'error');
      return;
    }

    const empName = getSelectedEmployeeName();

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('employee_id', form.employee_id);
      fd.append('employee_name', empName);
      fd.append('case_id', form.case_id);
      fd.append('applicant_name', form.applicant_name);
      fd.append('contact_number', form.contact_number);
      fd.append('bank_name', form.bank_name);
      fd.append('branch_name', form.branch_name);
      fd.append('property_address', form.property_address);
      fd.append('notes', form.notes);
      // Use uploaded PDF or auto-generate one from the form fields
      const finalPdf = pdfFile || buildAutoCasePdf(empName);
      fd.append('pdf', finalPdf);

      const res = await fetch('/api/assignments', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to allot case');

      showNotification(`Case allotted to ${empName || 'employee'} successfully!`, 'success');
      setForm({
        employee_id: '',
        case_id: '',
        applicant_name: '',
        contact_number: '',
        bank_name: '',
        branch_name: '',
        property_address: '',
        notes: '',
      });
      setPdfFile(null);
      fetchData();
    } catch (err) {
      showNotification(err.message || 'Failed to allot case', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this allotted case?')) return;
    try {
      const res = await fetch(`/api/assignments?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed');
      setAssignments((prev) => prev.filter((a) => a.id !== id));
      showNotification('Allotment removed.', 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const openPdf = (a) => {
    if (!a.pdf_url) return;
    const win = window.open();
    if (win) {
      win.document.write(
        `<iframe src="${a.pdf_url}" style="border:0;width:100%;height:100vh;" title="${a.pdf_name || 'Case PDF'}"></iframe>`
      );
    }
  };

  return (
    <div className={styles.layoutWrapper}>
      <ArchitecturalGridSvg />
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={styles.rightSide}>
        <AdminHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} title="Allot Cases to Employees" />

        <div className={styles.mainScrollArea}>
          <div className={styles.contentPadding}>
            <div className={styles.pageHeader}>
              <div className={styles.headerLeft}>
                <div className={styles.badgeRow}>
                  <span className={styles.portalBadge}>
                    <ShieldCheck size={14} /> Work Distribution
                  </span>
                  <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                    &bull; Assign New Cases &amp; Attach Case PDFs
                  </span>
                </div>
                <h1 className={styles.pageTitle}>Allot New Case to Employee</h1>
                <p className={styles.pageSubtitle}>
                  Assign valuation work to a valuer or engineer with supporting PDF documents. It will appear immediately in their Gmail Inbox.
                </p>
              </div>

              <div className={styles.headerActions}>
                <button
                  onClick={fetchData}
                  disabled={loading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '9px 16px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    cursor: loading ? 'wait' : 'pointer',
                  }}
                >
                  <RefreshCw size={16} className={loading ? 'spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {notification.text && (
              <div
                style={{
                  padding: '12px 18px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  background: notification.type === 'error' ? '#fef2f2' : '#f0fdf4',
                  color: notification.type === 'error' ? '#b91c1c' : '#15803d',
                  border: `1px solid ${notification.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
                }}
              >
                {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
                <span>{notification.text}</span>
              </div>
            )}

            {/* ── Allotment Form Card ── */}
            <form
              onSubmit={handleSubmit}
              style={{
                background: '#ffffff',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                padding: '24px',
                marginBottom: '28px',
                boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
              }}
            >
              <h2 style={{ margin: '0 0 18px 0', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={18} style={{ color: '#b8860b' }} />
                <span>Assign Case Details</span>
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Select Employee / Valuer *
                  </label>
                  <select
                    required
                    value={form.employee_id}
                    onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: '#ffffff', color: '#0f172a' }}
                  >
                    <option value="" style={{ color: '#0f172a', background: '#ffffff' }}>-- Choose Employee --</option>
                    {employees.map((emp) => {
                      const eid = emp.id || emp._id;
                      const name = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.username;
                      return (
                        <option key={eid} value={eid} style={{ color: '#0f172a', background: '#ffffff' }}>
                          {name} {emp.city ? `(${emp.city})` : ''} — {emp.email}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Case ID / Loan Application ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. C1EEFH6C000518"
                    value={form.case_id}
                    onChange={(e) => setForm({ ...form, case_id: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: '#ffffff', color: '#0f172a' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Applicant Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter borrower / applicant name"
                    value={form.applicant_name}
                    onChange={(e) => setForm({ ...form, applicant_name: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: '#ffffff', color: '#0f172a' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    placeholder="Enter applicant mobile"
                    value={form.contact_number}
                    onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: '#ffffff', color: '#0f172a' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Bank / Institution Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Vistaar Finance / SBI"
                    value={form.bank_name}
                    onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: '#ffffff', color: '#0f172a' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Branch Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Anantapur / Kadapa"
                    value={form.branch_name}
                    onChange={(e) => setForm({ ...form, branch_name: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: '#ffffff', color: '#0f172a' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Property Address
                  </label>
                  <input
                    type="text"
                    placeholder="Full property address / survey no. / locality"
                    value={form.property_address}
                    onChange={(e) => setForm({ ...form, property_address: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: '#ffffff', color: '#0f172a' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Attach Case PDF (Optional)
                  </label>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px dashed #b8860b',
                      background: 'rgba(184,134,11,0.05)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      color: '#78530c',
                      fontWeight: 600,
                    }}
                  >
                    <Upload size={16} />
                    <span>{pdfFile ? pdfFile.name : 'Choose PDF file to attach...'}</span>
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Instructions / Notes for Employee
                  </label>
                  <input
                    type="text"
                    placeholder="Urgent inspection, collect docs, etc."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: '#ffffff', color: '#0f172a' }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handlePreviewAutoPdf}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#0f172a',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                  }}
                >
                  <FileText size={15} style={{ color: '#0b57d0' }} />
                  <span>Auto-Generate PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenValuationForm}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: '1px solid #2563eb',
                    background: 'rgba(37,99,235,0.08)',
                    color: '#1d4ed8',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                  }}
                >
                  <ExternalLink size={15} />
                  <span>Create Valuation Form (Admin)</span>
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '11px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #c2954a, #9a6f25)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    cursor: submitting ? 'wait' : 'pointer',
                  }}
                >
                  <Send size={16} />
                  <span>{submitting ? 'Allotting Case...' : 'Allot Case & Send PDF'}</span>
                </button>
              </div>
            </form>

            {/* ── Allotted Cases List ── */}
            <div className={styles.tableCard}>
              <div className={styles.tableResponsive}>
                <table className={styles.reportsTable}>
                  <thead>
                    <tr>
                      <th>Case ID</th>
                      <th>Assigned Employee</th>
                      <th>Applicant &amp; Bank</th>
                      <th>Property Address</th>
                      <th>Attached PDF</th>
                      <th>Date</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                          Loading allotted cases...
                        </td>
                      </tr>
                    ) : assignments.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                          No cases allotted yet. Use the form above to assign work to an employee.
                        </td>
                      </tr>
                    ) : (
                      assignments.map((a) => (
                        <tr key={a.id}>
                          <td>
                            <span className={styles.reportIdBadge}>
                              <FileText size={12} />
                              {a.case_id || a.id.slice(-6)}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Users size={14} style={{ color: '#b8860b' }} />
                              <span>{a.employee_name || a.employee_id}</span>
                            </div>
                          </td>
                          <td>
                            <div className={styles.customerCell}>
                              <span className={styles.customerName}>{a.applicant_name || '—'}</span>
                              <span className={styles.bankName}>
                                <Building2 size={12} />
                                {a.bank_name || '—'} {a.branch_name ? `(${a.branch_name})` : ''}
                              </span>
                              {a.contact_number && (
                                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <Phone size={11} /> {a.contact_number}
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ maxWidth: '240px', fontSize: '0.82rem', color: '#475569' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'flex-start', gap: '4px' }}>
                              <MapPin size={13} style={{ flexShrink: 0, marginTop: '2px', color: '#94a3b8' }} />
                              <span>{a.property_address || '—'}</span>
                            </span>
                          </td>
                          <td>
                            {a.pdf_url ? (
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  onClick={() => openPdf(a)}
                                  className={styles.pdfBtn}
                                  title="Preview attached PDF"
                                >
                                  <ExternalLink size={12} />
                                  <span>View PDF</span>
                                </button>
                                <a
                                  href={a.pdf_url}
                                  download={a.pdf_name || 'case_document.pdf'}
                                  className={styles.secondaryBtn}
                                  style={{ padding: '5px 9px', fontSize: '0.75rem', textDecoration: 'none' }}
                                >
                                  <Download size={12} />
                                </a>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>No PDF</span>
                            )}
                          </td>
                          <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            {a.created_at ? new Date(a.created_at).toLocaleDateString('en-IN') : 'Recent'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleDelete(a.id)}
                              className={styles.rejectBtn}
                              title="Remove allotment"
                            >
                              <Trash2 size={13} />
                              <span>Remove</span>
                            </button>
                          </td>
                        </tr>
                      ))
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

