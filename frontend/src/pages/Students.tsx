import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
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
import type {
  AcademicYear,
  Cohort,
  Department,
  Faculty,
  Level,
  Program,
  StudentListResponse,
  StudentRow,
} from '../types';

export function StudentLookup({ studentId, onStudent }: { studentId?: number; onStudent?: (id: number) => void }) {
  const [rows, setRows] = useState<StudentRow[]>([]);
  useEffect(() => {
    http.get<StudentListResponse>('/students?limit=200').then((r) => setRows(r.items)).catch(() => setRows([]));
  }, [studentId]);
  return (
    <Select
      value={studentId ?? ''}
      onChange={(e) => onStudent?.(Number(e.target.value))}
    >
      <option value="">Select student...</option>
      {rows.map((s) => (
        <option key={s.id} value={s.id}>
          {s.studentId} - {s.lastName}, {s.firstName}
        </option>
      ))}
    </Select>
  );
}

export default function Students() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<StudentListResponse | null>(null);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'male',
    phone: '',
    address: '',
    facultyId: '',
    departmentId: '',
    programId: '',
    levelId: '',
    cohortId: '',
    academicYear: '',
    semester: '1',
  });
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);

  const load = useCallback(async () => {
    http.get<StudentListResponse>(`/students?search=${encodeURIComponent(search)}&limit=100`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    http.get<Faculty[]>('/academics/faculties').then(setFaculties).catch(() => {});
    http.get<Department[]>('/academics/departments').then(setDepartments).catch(() => {});
    http.get<Program[]>('/academics/programs').then(setPrograms).catch(() => {});
    http.get<Level[]>('/academics/levels').then(setLevels).catch(() => {});
    http.get<Cohort[]>('/academics/cohorts').then(setCohorts).catch(() => {});
    http.get<AcademicYear[]>('/academics/academic-years').then(setYears).catch(() => {});
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await http.post('/students', {
        ...form,
        facultyId: Number(form.facultyId),
        departmentId: Number(form.departmentId),
        programId: Number(form.programId),
        levelId: Number(form.levelId),
        cohortId: Number(form.cohortId),
        semester: form.academicYear ? Number(form.semester) : undefined,
        academicYear: form.academicYear || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
      });
      setCreateOpen(false);
      setForm({ ...form, firstName: '', lastName: '', phone: '', address: '' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create student');
    }
  }

  const progOptions = programs.filter((p) => !form.departmentId || p.departmentId === Number(form.departmentId));
  const cohortOptions = cohorts.filter((c) => !form.programId || c.programId === Number(form.programId));

  return (
    <div className="stack">
      <Card
        title="Students"
        actions={
          can('student.create') ? (
            <Button onClick={() => setCreateOpen(true)}>Create student</Button>
          ) : undefined
        }
      >
        <div className="toolbar">
          <Input
            placeholder="Search by name or student number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <FormError text={error} />
        {!data ? (
          <Loading />
        ) : (
          <Table columns={['Student Number', 'Name', 'Program', 'Level', 'Status', '']}>
            {data.items.map((s) => (
              <tr key={s.id}>
                <td>{s.studentId}</td>
                <td>
                  {s.lastName}, {s.firstName}
                </td>
                <td>{s.program?.name}</td>
                <td>{s.level?.name}</td>
                <td>
                  <span className={`badge badge-${s.academicStatus}`}>{s.academicStatus}</span>
                </td>
                <td>
                  <Button className="btn-sm btn-ghost" onClick={() => navigate(`/students/${s.id}`)}>
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal title="Create student" open={createOpen} onClose={() => setCreateOpen(false)}>
        <form onSubmit={onSubmit} className="form-grid">
          <Field label="First name" required>
            <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
          </Field>
          <Field label="Last name" required>
            <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
          </Field>
          <Field label="Date of birth" required>
            <Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} required />
          </Field>
          <Field label="Gender" required>
            <Select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Address">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <Field label="Faculty" required>
            <Select value={form.facultyId} onChange={(e) => setForm({ ...form, facultyId: e.target.value, departmentId: '', programId: '' })}>
              <option value="">Select faculty...</option>
              {faculties.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Department" required>
            <Select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value, programId: '' })}>
              <option value="">Select department...</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Program" required>
            <Select value={form.programId} onChange={(e) => setForm({ ...form, programId: e.target.value, cohortId: '' })}>
              <option value="">Select program...</option>
              {progOptions.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Level" required>
            <Select value={form.levelId} onChange={(e) => setForm({ ...form, levelId: e.target.value })}>
              <option value="">Select level...</option>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Cohort" required>
            <Select value={form.cohortId} onChange={(e) => setForm({ ...form, cohortId: e.target.value })}>
              <option value="">Select cohort...</option>
              {cohortOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.code}</option>
              ))}
            </Select>
          </Field>
          <Field label="Academic year">
            <Select value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })}>
              <option value="">Select year...</option>
              {years.map((y) => (
                <option key={y.id} value={y.name}>{y.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Semester">
            <Input type="number" min={1} max={2} value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} />
          </Field>
          <div className="form-actions">
            <Button type="submit">Create</Button>
            <Button type="button" className="btn-ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}