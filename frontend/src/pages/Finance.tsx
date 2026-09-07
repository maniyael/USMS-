import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { http } from '../api';
import { useAuth } from '../auth';
import {
  Alert,
  Button,
  Card,
  Field,
  FormError,
  Input,
  Modal,
  Select,
  Table,
  dateOnly,
  money,
  useToast,
} from '../components/ui';
import { Icon } from '../components/icons';
import type { Fee, Payment, Refund, StudentListResponse, StudentRow } from '../types';

type Filter = '' | 'requested' | 'under_review' | 'approved' | 'rejected' | 'processed' | 'cancelled';

const REFUND_STATUS_META: Record<string, { label: string; badge: string }> = {
  requested: { label: 'Requested', badge: 'badge-gold' },
  under_review: { label: 'Under review', badge: 'badge-under_review' },
  approved: { label: 'Approved', badge: 'badge-approved' },
  rejected: { label: 'Rejected', badge: 'badge-rejected' },
  processed: { label: 'Processed', badge: 'badge-processed' },
  cancelled: { label: 'Cancelled', badge: 'badge-cancelled' },
};

export default function Finance() {
  const { can, user } = useAuth();
  const { notify } = useToast();
  const isStudent = user?.roleName === 'student';
  const [fees, setFees] = useState<Fee[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [feeOpen, setFeeOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('');

  const years = ['2023/2024', '2024/2025', '2025/2026', '2026/2027', '2027/2028'];
  const [feeForm, setFeeForm] = useState({ studentId: '', academicYear: years[4], semester: '1', description: '', amount: '' });
  const [payForm, setPayForm] = useState({ feeId: '', paymentMethod: 'cash', amount: '' });
  const [refForm, setRefForm] = useState({ paymentId: '', amount: '', reason: '' });
  const [noteModal, setNoteModal] = useState<{ refund: Refund; action: 'under_review' | 'approved' | 'rejected' | 'process' | 'cancel' } | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    const q = filter ? `?status=${filter}` : '';
    const studentQ = isStudent ? `?studentId=${user?.linkedStudentId ?? ''}` : filter ? `?status=${filter}` : '';
    http.get<Fee[]>(`/finance/fees${studentQ || (filter ? '' : '')}`).then(setFees).catch((e) => setError(e.message));
    http.get<Payment[]>(`/finance/payments${studentQ}`).then(setPayments).catch(() => {});
    http
      .get<{ refunds: Refund[]; counts: Record<string, number> }>(`/finance/refunds${q}`)
      .then((r) => {
        setRefunds(r.refunds ?? []);
        setCounts(r.counts ?? {});
      })
      .catch(() => {});
  }, [filter, isStudent, user?.linkedStudentId]);

  useEffect(() => {
    load();
    if (!isStudent) {
      http.get<StudentListResponse>('/students?limit=200').then((r) => setStudents(r.items)).catch(() => {});
    }
  }, [load, isStudent]);

  async function createFee(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await http.post('/finance/fees', {
        studentId: Number(feeForm.studentId),
        academicYear: feeForm.academicYear,
        semester: Number(feeForm.semester),
        description: feeForm.description,
        amount: parseFloat(feeForm.amount),
      });
      setFeeOpen(false);
      setFeeForm({ ...feeForm, description: '', amount: '' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create fee');
    }
  }

  async function recordPayment(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    const fee = fees.find((f) => f.id === Number(payForm.feeId));
    if (!fee) {
      setError('Select a fee first');
      return;
    }
    try {
      const res = await http.post<{ payment: Payment; receipt: { receiptNumber: string } }>('/finance/payments', {
        studentId: fee.studentId,
        feeId: fee.id,
        amount: parseFloat(payForm.amount),
        paymentMethod: payForm.paymentMethod,
      });
      setOk(`Payment recorded — receipt ${res.receipt.receiptNumber}`);
      setPayOpen(false);
      setPayForm({ feeId: '', paymentMethod: 'cash', amount: '' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    }
  }

  async function reverse(id: number) {
    setError(null);
    setOk(null);
    const noteText = prompt('Reason for reversal (required):');
    if (!noteText) return;
    try {
      await http.post(`/finance/payments/${id}/reverse`, { note: noteText });
      setOk('Payment reversed');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reversal failed');
    }
  }

  async function requestRefund(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await http.post('/finance/refunds', {
        paymentId: Number(refForm.paymentId),
        reason: refForm.reason,
        amount: refForm.amount ? parseFloat(refForm.amount) : undefined,
      });
      notify('success', 'Refund requested', 'Finance has been notified and will review your request.');
      setRefundOpen(false);
      setRefForm({ paymentId: '', amount: '', reason: '' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  }

  async function runNoteAction() {
    if (!noteModal) return;
    const { refund, action } = noteModal;
    setError(null);
    setBusy(true);
    try {
      if (action === 'process') {
        await http.post(`/finance/refunds/${refund.id}/process`, { note });
        notify('success', 'Refund processed', `${refund.refundReference} has been settled.`);
      } else if (action === 'cancel') {
        await http.post(`/finance/refunds/${refund.id}/cancel`, { note });
        notify('success', 'Refund cancelled', `${refund.refundReference} was withdrawn.`);
      } else {
        await http.post(`/finance/refunds/${refund.id}/review`, { decision: action, note });
        notify('success', 'Refund updated', `${refund.refundReference} is now "${action}".`);
      }
      setNoteModal(null);
      setNote('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  }

  const studentName = (sid: number) => {
    const s = students.find((x) => x.id === sid);
    return s ? `${s.studentId} — ${s.lastName}, ${s.firstName}` : `Student #${sid}`;
  };

  const refundActions = (r: Refund) => {
    if (!can('refund.manage')) return null;
    if (r.status === 'requested' || r.status === 'under_review') {
      return (
        <div className="row gap" style={{ flexWrap: 'wrap' }}>
          {r.status === 'requested' && (
            <Button className="btn-sm" onClick={() => { setNoteModal({ refund: r, action: 'under_review' }); setNote(''); }}>
              Review
            </Button>
          )}
          <Button className="btn-sm btn-gold" onClick={() => { setNoteModal({ refund: r, action: 'approved' }); setNote(''); }}>
            Approve
          </Button>
          <Button className="btn-sm btn-danger" onClick={() => { setNoteModal({ refund: r, action: 'rejected' }); setNote(''); }}>
            Reject
          </Button>
          <Button className="btn-sm btn-ghost" onClick={() => { setNoteModal({ refund: r, action: 'cancel' }); setNote(''); }}>
            Cancel
          </Button>
        </div>
      );
    }
    if (r.status === 'approved') {
      return (
        <div className="row gap">
          <Button className="btn-sm btn-gold" onClick={() => { setNoteModal({ refund: r, action: 'process' }); setNote(''); }}>
            Process refund
          </Button>
          <Button className="btn-sm btn-ghost" onClick={() => { setNoteModal({ refund: r, action: 'cancel' }); setNote(''); }}>
            Cancel
          </Button>
        </div>
      );
    }
    return null;
  };

  const statusChips: Array<{ key: Filter; label: string }> = [
    { key: 'requested', label: 'Requested' },
    { key: 'under_review', label: 'Under review' },
    { key: 'approved', label: 'Approved' },
    { key: 'processed', label: 'Processed' },
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="stack">
      {ok && <Alert kind="success">{ok}</Alert>}
      <Card title="Fees" icon="finance"
        actions={
          can('fees.manage') ? (
            <Button onClick={() => setFeeOpen(true)}><Icon name="plus" /> Add fee</Button>
          ) : undefined
        }
      >
        <FormError text={error} />
        <Table columns={['Student', 'Year', 'Sem', 'Description', 'Amount']}>
          {fees.map((f) => (
            <tr key={f.id}>
              <td>{studentName(f.studentId)}</td>
              <td>{f.academicYear}</td>
              <td>{f.semester}</td>
              <td>{f.description}</td>
              <td>{money(f.amount)}</td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card title="Payments" icon="finance"
        actions={
          can('payment.record') ? (
            <Button onClick={() => setPayOpen(true)}><Icon name="plus" /> Record payment</Button>
          ) : undefined
        }
      >
        <Table columns={['Student', 'Reference', 'Amount', 'Method', 'Date', 'Status', '']}>
          {payments.map((p) => (
            <tr key={p.id}>
              <td>{studentName(p.studentId)}</td>
              <td>{p.paymentReference}</td>
              <td>{money(p.amount)}</td>
              <td>{p.paymentMethod}</td>
              <td>{dateOnly(p.paymentDate)}</td>
              <td>
                <span className={`badge ${p.reversedAt ? 'badge-danger' : 'badge-active'}`}>
                  {p.reversedAt ? 'reversed' : 'active'}
                </span>
              </td>
              <td>
                {can('payment.reverse') && !p.reversedAt && (
                  <Button className="btn-sm btn-ghost" onClick={() => reverse(p.id)}>Reverse</Button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card
        title="Refunds"
        icon="refund"
        actions={
          can('refund.request') && !isStudent ? (
            <Button className="btn-gold" onClick={() => { setRefForm({ paymentId: '', amount: '', reason: '' }); setRefundOpen(true); }}>
              <Icon name="plus" /> Request refund
            </Button>
          ) : isStudent ? (
            <Button className="btn-gold" onClick={() => { setRefForm({ paymentId: '', amount: '', reason: '' }); setRefundOpen(true); }}>
              <Icon name="plus" /> Request refund
            </Button>
          ) : undefined
        }
      >
        <div className="chip-row">
          {statusChips.map((s) => (
            <button key={s.key} type="button"
              className={`chip ${filter === s.key ? 'active' : ''}`}
              onClick={() => setFilter(filter === s.key ? '' : s.key)}>
              {s.label} <span className="chip-count">{counts[s.key] ?? 0}</span>
            </button>
          ))}
        </div>
        {refunds.length === 0 ? (
          <p className="muted">No refund records {filter ? 'for this status' : 'yet'}.</p>
        ) : (
          <Table columns={['Reference', 'Student', 'Amount', 'Reason', 'Requested', 'Status', 'Processed', '']}>
            {refunds.map((r) => {
              const meta = REFUND_STATUS_META[r.status] ?? { label: r.status, badge: 'badge-neutral' };
              return (
                <tr key={r.id}>
                  <td><b>{r.refundReference}</b></td>
                  <td>{r.student ? `${r.student.studentId} — ${r.student.firstName} ${r.student.lastName}` : studentName(r.studentId)}</td>
                  <td>{money(r.amount)}</td>
                  <td className="muted small">{r.reason}</td>
                  <td>{dateOnly(r.requestedAt)}</td>
                  <td><span className={`badge ${meta.badge}`}>{meta.label}</span></td>
                  <td>{r.processedAt ? dateOnly(r.processedAt) : '—'}</td>
                  <td className="t-actions">{refundActions(r)}</td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>

      {/* Request refund (students: own active payments; staff: any) */}
      <Modal title="Request a refund" open={refundOpen} onClose={() => setRefundOpen(false)} width={620}>
        <form onSubmit={requestRefund} className="form-grid">
          <FormError text={error} />
          <Field label="Payment" required hint="Only active (unreversed) payments are refundable.">
            <Select value={refForm.paymentId} onChange={(e) => setRefForm({ ...refForm, paymentId: e.target.value })} required>
              <option value="">Select payment…</option>
              {payments.filter((p) => !p.reversedAt).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.paymentReference} — {money(p.amount)} ({dateOnly(p.paymentDate)})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Amount (optional)" hint="Defaults to the full payment.">
            <Input type="number" min={0.01} step="0.01" value={refForm.amount} onChange={(e) => setRefForm({ ...refForm, amount: e.target.value })} />
          </Field>
          <Field label="Reason" required hint="Briefly explain why the refund is needed.">
            <textarea className="input" rows={3} value={refForm.reason} onChange={(e) => setRefForm({ ...refForm, reason: e.target.value })} required placeholder="e.g. Overpayment after course withdrawal" />
          </Field>
          <div className="form-actions">
            <Button type="submit" className="btn-gold" disabled={busy}>{busy ? 'Submitting…' : 'Submit request'}</Button>
            <Button type="button" className="btn-ghost" onClick={() => setRefundOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      {/* Review / process / cancel with note */}
      <Modal
        title={noteModal ? `${noteModal.action === 'process' ? 'Process' : noteModal.action === 'cancel' ? 'Cancel' : 'Update'} refund ${noteModal.refund.refundReference}` : ''}
        open={!!noteModal}
        onClose={() => setNoteModal(null)}
        width={560}
      >
        <div className="stack">
          <FormError text={error} />
          <div className="alert alert-info">
            <b>Amount {money(noteModal?.refund.amount ?? 0)}</b> — {noteModal?.refund.reason}
          </div>
          <Field label={noteModal?.action === 'rejected' ? 'Rejection reason (required)' : 'Note (optional)'}>
            <textarea className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Internal note" />
          </Field>
          <div className="form-actions" style={{ gridColumn: 'auto' }}>
            <Button className={noteModal?.action === 'rejected' ? 'btn-danger' : 'btn-gold'} disabled={busy} onClick={runNoteAction}>
              {busy ? 'Saving…' : `Confirm ${noteModal?.action === 'process' ? 'process' : noteModal?.action === 'cancel' ? 'cancellation' : noteModal?.action}`}
            </Button>
            <Button type="button" className="btn-ghost" onClick={() => setNoteModal(null)}>Close</Button>
          </div>
        </div>
      </Modal>

      <Modal title="Add fee" open={feeOpen} onClose={() => setFeeOpen(false)}>
        <form onSubmit={createFee} className="form-grid">
          <Field label="Student" required>
            <Select value={feeForm.studentId} onChange={(e) => setFeeForm({ ...feeForm, studentId: e.target.value })} required>
              <option value="">Select student...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.studentId} - {s.lastName}, {s.firstName}</option>
              ))}
            </Select>
          </Field>
          <Field label="Academic year" required>
            <Select value={feeForm.academicYear} onChange={(e) => setFeeForm({ ...feeForm, academicYear: e.target.value })} required>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
          </Field>
          <Field label="Semester" required>
            <Input type="number" min={1} max={2} value={feeForm.semester} onChange={(e) => setFeeForm({ ...feeForm, semester: e.target.value })} required />
          </Field>
          <Field label="Description" required>
            <Input value={feeForm.description} onChange={(e) => setFeeForm({ ...feeForm, description: e.target.value })} required />
          </Field>
          <Field label="Amount ($)" required>
            <Input type="number" min={1} step="0.01" value={feeForm.amount} onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })} required />
          </Field>
          <div className="form-actions">
            <Button type="submit">Create fee</Button>
            <Button type="button" className="btn-ghost" onClick={() => setFeeOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      <Modal title="Record payment" open={payOpen} onClose={() => setPayOpen(false)}>
        <form onSubmit={recordPayment} className="form-grid">
          <Field label="Fee" required>
            <Select value={payForm.feeId} onChange={(e) => setPayForm({ ...payForm, feeId: e.target.value })} required>
              <option value="">Select fee...</option>
              {fees.map((f) => (
                <option key={f.id} value={f.id}>{studentName(f.studentId)} — {f.description} ({money(f.amount)})</option>
              ))}
            </Select>
          </Field>
          <Field label="Method" required>
            <Select value={payForm.paymentMethod} onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank transfer</option>
              <option value="mobile_money">Mobile money</option>
              <option value="card">Card</option>
            </Select>
          </Field>
          <Field label="Amount ($)" required>
            <Input type="number" min={0.01} step="0.01" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} required />
          </Field>
          <p className="muted small">Amount must equal the fee's outstanding balance.</p>
          <div className="form-actions">
            <Button type="submit">Record payment</Button>
            <Button type="button" className="btn-ghost" onClick={() => setPayOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}