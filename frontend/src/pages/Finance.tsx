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
} from '../components/ui';
import type { Fee, Payment, StudentListResponse, StudentRow } from '../types';

export default function Finance() {
  const { can } = useAuth();
  const [fees, setFees] = useState<Fee[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [feeOpen, setFeeOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  const years = ['2023/2024', '2024/2025', '2025/2026', '2026/2027', '2027/2028'];
  const [feeForm, setFeeForm] = useState({ studentId: '', academicYear: years[4], semester: '1', description: '', amount: '' });
  const [payForm, setPayForm] = useState({ feeId: '', paymentMethod: 'cash', amount: '' });

  const load = useCallback(() => {
    const q = filter ? `?studentId=${filter}` : '';
    http.get<Fee[]>(`/finance/fees${q}`).then(setFees).catch((e) => setError(e.message));
    http.get<Payment[]>(`/finance/payments${q}`).then(setPayments).catch(() => {});
  }, [filter]);

  useEffect(() => {
    load();
    http.get<StudentListResponse>('/students?limit=200').then((r) => setStudents(r.items)).catch(() => {});
  }, [load]);

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
    try {
      const res = await http.post<{ payment: Payment; receipt: { receiptNumber: string } }>('/finance/payments', {
        feeId: Number(payForm.feeId),
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
    const note = prompt('Reason for reversal (required):');
    if (!note) return;
    setError(null);
    try {
      await http.post(`/finance/payments/${id}/reverse`, { note });
      setOk('Payment reversed');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reversal failed');
    }
  }

  const studentName = (sid: number) => {
    const s = students.find((x) => x.id === sid);
    return s ? `${s.studentId} — ${s.lastName}, ${s.firstName}` : `Student #${sid}`;
  };

  return (
    <div className="stack">
      {ok && <Alert kind="success">{ok}</Alert>}
      <Card
        title="Fees"
        actions={
          can('fees.manage') ? (
            <div className="row gap">
              <Button onClick={() => setFeeOpen(true)}>Add fee</Button>
            </div>
          ) : undefined
        }
      >
        <div className="toolbar">
          <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All students</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.studentId}</option>
            ))}
          </Select>
        </div>
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

      <Card
        title="Payments"
        actions={
          can('payment.record') ? (
            <Button onClick={() => setPayOpen(true)}>Record payment</Button>
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
                <span className={`badge ${p.reversedAt ? 'badge-reversed' : 'badge-active'}`}>
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