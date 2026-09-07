import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { http } from '../api';
import { useAuth } from '../auth';
import {
  Button,
  Card,
  Field,
  FormError,
  Input,
  Loading,
  Modal,
  Select,
  Table,
} from '../components/ui';
import type { Department, Staff } from '../types';

const POSITIONS = ['lecturer', 'registrar', 'finance', 'administrative', 'department_head'];

export default function StaffPage() {
  const { can } = useAuth();
  const [rows, setRows] = useState<Staff[] | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    departmentId: '',
    position: 'lecturer',
    phone: '',
    qualifications: '',
    isLecturer: 'true',
  });

  const load = useCallback(() => {
    http.get<Staff[]>('/staff').then(setRows).catch(() => setRows([]));
  }, []);

  useEffect(() => {
    load();
    http.get<Department[]>('/academics/departments').then(setDepartments).catch(() => {});
  }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await http.post('/staff', {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        departmentId: Number(form.departmentId),
        position: form.position,
        phone: form.phone || undefined,
        qualifications: form.qualifications || undefined,
        isLecturer: form.isLecturer === 'true',
      });
      setOpen(false);
      setForm({ ...form, firstName: '', lastName: '', email: '', phone: '', qualifications: '' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create staff');
    }
  }

  return (
    <div className="stack">
      <Card
        title={`Staff (${rows?.length ?? 0})`}
        actions={can('staff.create') ? <Button onClick={() => setOpen(true)}>Create staff</Button> : undefined}
      >
        <FormError text={error} />
        {!rows ? (
          <Loading />
        ) : (
          <Table columns={['Staff No', 'Name', 'Email', 'Department', 'Position', 'Lecturer']}>
            {rows.map((s) => (
              <tr key={s.id}>
                <td>{s.staffId}</td>
                <td>{s.lastName}, {s.firstName}</td>
                <td>{s.email}</td>
                <td>{s.department?.name}</td>
                <td>{s.position}</td>
                <td>{s.isLecturer ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal title="Create staff" open={open} onClose={() => setOpen(false)}>
        <form onSubmit={create} className="form-grid">
          <Field label="First name" required>
            <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
          </Field>
          <Field label="Last name" required>
            <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
          </Field>
          <Field label="Email" required>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </Field>
          <Field label="Department" required>
            <Select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} required>
              <option value="">Select department...</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Position" required>
            <Select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
              {POSITIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </Select>
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Qualifications">
            <Input value={form.qualifications} onChange={(e) => setForm({ ...form, qualifications: e.target.value })} />
          </Field>
          <Field label="Is lecturer?">
            <Select value={form.isLecturer} onChange={(e) => setForm({ ...form, isLecturer: e.target.value })}>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </Select>
          </Field>
          <div className="form-actions">
            <Button type="submit">Create</Button>
            <Button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}