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
import type { AcademicYear, Department, Program } from '../types';

type Section = 'faculties' | 'departments' | 'programs' | 'levels' | 'cohorts' | 'years';

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'faculties', label: 'Faculties' },
  { key: 'departments', label: 'Departments' },
  { key: 'programs', label: 'Programs' },
  { key: 'levels', label: 'Levels' },
  { key: 'cohorts', label: 'Cohorts' },
  { key: 'years', label: 'Academic Years' },
];

interface GenericEntity {
  id: number;
  code?: string;
  name?: string;
  departmentId?: number;
  department?: Department;
  totalYears?: number;
  totalSemesters?: number;
  sortOrder?: number;
  programId?: number;
  program?: Program;
  startYear?: string;
  endYear?: string;
  startDate?: string;
  endDate?: string;
  startYearName?: string;
  endYearName?: string;
}

export default function Academics() {
  const { can } = useAuth();
  const [section, setSection] = useState<Section>('faculties');
  const [rows, setRows] = useState<GenericEntity[] | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setRows(null);
    try {
      const map: Record<Section, string> = {
        faculties: '/academics/faculties',
        departments: '/academics/departments',
        programs: '/academics/programs',
        levels: '/academics/levels',
        cohorts: '/academics/cohorts',
        years: '/academics/academic-years',
      };
      const data = await http.get<GenericEntity[]>(map[section]);
      setRows(data);
      setError(null);
    } catch (e) {
      setRows([]);
      setError(e instanceof Error ? e.message : 'Failed to load');
    }
  }, [section]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    http.get<Department[]>('/academics/departments').then(setDepartments).catch(() => {});
    http.get<Program[]>('/academics/programs').then(setPrograms).catch(() => {});
    http.get<AcademicYear[]>('/academics/academic-years').then(setYears).catch(() => {});
  }, []);

  const canCreate = can('academic.create') || can('curriculum.create');

  async function create(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const body: Record<string, unknown> = { ...form };
    for (const [k, v] of Object.entries(body)) {
      if (v === '') delete body[k];
      else if (['departmentId', 'programId', 'sortOrder', 'totalYears', 'totalSemesters'].includes(k)) {
        body[k] = Number(v);
      }
    }
    try {
      const path: Record<Section, string> = {
        faculties: '/academics/faculties',
        departments: '/academics/departments',
        programs: '/academics/programs',
        levels: '/academics/levels',
        cohorts: '/academics/cohorts',
        years: '/academics/academic-years',
      };
      await http.post(path[section], body);
      setOpen(false);
      setForm({});
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create');
    }
  }

  function nameOf(row: GenericEntity): string {
    if (section === 'years') return row.startYearName ?? row.name ?? '—';
    return row.name ?? '—';
  }

  function renderColumns(): string[] {
    switch (section) {
      case 'faculties':
        return ['Code', 'Name'];
      case 'departments':
        return ['Code', 'Name'];
      case 'programs':
        return ['Code', 'Name', 'Duration', 'Department'];
      case 'levels':
        return ['Name', 'Order'];
      case 'cohorts':
        return ['Code', 'Program', 'Window'];
      case 'years':
        return ['Name', 'Start', 'End'];
      default:
        return ['Name'];
    }
  }

  function renderRow(row: GenericEntity) {
    switch (section) {
      case 'programs':
        return (
          <>
            <td>{row.code}</td>
            <td>{row.name}</td>
            <td>{row.totalYears}y / {row.totalSemesters}s</td>
            <td>{row.department?.name}</td>
          </>
        );
      case 'levels':
        return (
          <>
            <td>{row.name}</td>
            <td>{row.sortOrder}</td>
          </>
        );
      case 'cohorts':
        return (
          <>
            <td>{row.code}</td>
            <td>{row.program?.name}</td>
            <td>{row.startYear} → {row.endYear}</td>
          </>
        );
      case 'years':
        return (
          <>
            <td>{nameOf(row)}</td>
            <td>{row.startDate}</td>
            <td>{row.endDate}</td>
          </>
        );
      default:
        return (
          <>
            <td>{row.code}</td>
            <td>{row.name}</td>
          </>
        );
    }
  }

  return (
    <div className="stack">
      <nav className="tabs">
        {SECTIONS.map((s) => (
          <button key={s.key} type="button" className={`tab ${section === s.key ? 'active' : ''}`} onClick={() => setSection(s.key)}>
            {s.label}
          </button>
        ))}
      </nav>
      <Card
        title={SECTIONS.find((s) => s.key === section)?.label}
        actions={canCreate ? <Button onClick={() => setOpen(true)}>Create</Button> : undefined}
      >
        <FormError text={error} />
        {!rows ? (
          <Loading />
        ) : (
          <Table columns={renderColumns()}>
            {rows.map((r) => (
              <tr key={r.id}>{renderRow(r)}</tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal
        title={`Create ${SECTIONS.find((s) => s.key === section)?.label ?? ''}`}
        open={open}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={create} className="form-grid">
          {section !== 'levels' && section !== 'years' && (
            <Field label="Code" required>
              <Input value={form.code ?? ''} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            </Field>
          )}
          <Field label="Name" required>
            <Input value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          {section === 'programs' && (
            <>
              <Field label="Department" required>
                <Select value={form.departmentId ?? ''} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} required>
                  <option value="">Select department...</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Total years">
                <Input type="number" min={1} value={form.totalYears ?? ''} onChange={(e) => setForm({ ...form, totalYears: e.target.value })} />
              </Field>
              <Field label="Total semesters">
                <Input type="number" min={1} value={form.totalSemesters ?? ''} onChange={(e) => setForm({ ...form, totalSemesters: e.target.value })} />
              </Field>
            </>
          )}
          {section === 'levels' && (
            <Field label="Sort order">
              <Input type="number" value={form.sortOrder ?? ''} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
            </Field>
          )}
          {section === 'cohorts' && (
            <>
              <Field label="Program" required>
                <Select value={form.programId ?? ''} onChange={(e) => setForm({ ...form, programId: e.target.value })} required>
                  <option value="">Select program...</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Start year">
                <Select value={form.startYear ?? ''} onChange={(e) => setForm({ ...form, startYear: e.target.value })}>
                  <option value="">Select...</option>
                  {years.map((y) => (
                    <option key={y.id} value={y.name}>{y.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="End year">
                <Select value={form.endYear ?? ''} onChange={(e) => setForm({ ...form, endYear: e.target.value })}>
                  <option value="">Select...</option>
                  {years.map((y) => (
                    <option key={y.id} value={y.name}>{y.name}</option>
                  ))}
                </Select>
              </Field>
            </>
          )}
          {section === 'years' && (
            <>
              <Field label="Start date" required>
                <Input type="date" value={form.startDate ?? ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
              </Field>
              <Field label="End date" required>
                <Input type="date" value={form.endDate ?? ''} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
              </Field>
            </>
          )}
          <div className="form-actions">
            <Button type="submit">Create</Button>
            <Button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}