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
  DAY_NAMES,
} from '../components/ui';
import type { Course, Staff, TimetableEntry } from '../types';

const CLASS_TYPES = ['lecture', 'tutorial', 'practical', 'exam'];

export default function Timetable() {
  const { can } = useAuth();
  const [rows, setRows] = useState<TimetableEntry[] | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [form, setForm] = useState({
    courseId: '',
    classType: 'lecture',
    dayOfWeek: '1',
    startTime: '09:00',
    endTime: '11:00',
    location: '',
    lecturerId: '',
    academicYear: '2026/2027',
    semester: '1',
    startDate: '2026-09-14',
  });

  const years = ['2023/2024', '2024/2025', '2025/2026', '2026/2027', '2027/2028'];

  const load = useCallback(() => {
    http.get<TimetableEntry[]>('/timetable').then(setRows).catch(() => setRows([]));
  }, []);

  useEffect(() => {
    load();
    http.get<Course[]>('/courses').then(setCourses).catch(() => {});
    http.get<Staff[]>('/staff').then(setStaff).catch(() => {});
  }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await http.post('/timetable', {
        courseId: Number(form.courseId),
        classType: form.classType,
        dayOfWeek: Number(form.dayOfWeek),
        startTime: form.startTime,
        endTime: form.endTime,
        location: form.location || undefined,
        lecturerId: form.lecturerId ? Number(form.lecturerId) : undefined,
        academicYear: form.academicYear,
        semester: Number(form.semester),
        startDate: form.startDate,
      });
      setOpen(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create timetable entry');
    }
  }

  async function remove(id: number) {
    if (!confirm('Delete this timetable entry?')) return;
    try {
      await http.del(`/timetable/${id}`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  return (
    <div className="stack">
      <Card
        title={`Timetable (${rows?.length ?? 0})`}
        actions={can('timetable.manage') ? <Button onClick={() => setOpen(true)}>Add entry</Button> : undefined}
      >
        <FormError text={error} />
        {!rows ? (
          <Loading />
        ) : (
          <Table columns={['Day', 'Time', 'Course', 'Type', 'Location', 'Lecturer', 'Semester', '']}>
            {rows.map((t) => (
              <tr key={t.id}>
                <td>{DAY_NAMES[t.dayOfWeek - 1] ?? t.dayOfWeek}</td>
                <td>{t.startTime} - {t.endTime}</td>
                <td>{t.course?.code} - {t.course?.name}</td>
                <td>{t.classType}</td>
                <td>{t.location ?? '—'}</td>
                <td>{t.lecturer ? `${t.lecturer.firstName} ${t.lecturer.lastName}` : '—'}</td>
                <td>{t.academicYear} S{t.semester}</td>
                <td>
                  {can('timetable.manage') && (
                    <Button className="btn-sm btn-ghost" onClick={() => remove(t.id)}>Delete</Button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal title="Add timetable entry" open={open} onClose={() => setOpen(false)}>
        <form onSubmit={create} className="form-grid">
          <Field label="Course" required>
            <Select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} required>
              <option value="">Select course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Class type" required>
            <Select value={form.classType} onChange={(e) => setForm({ ...form, classType: e.target.value })}>
              {CLASS_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="Day" required>
            <Select value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}>
              {DAY_NAMES.map((d, i) => (
                <option key={i + 1} value={i + 1}>{d}</option>
              ))}
            </Select>
          </Field>
          <Field label="Start time" required>
            <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
          </Field>
          <Field label="End time" required>
            <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
          </Field>
          <Field label="Location">
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Room A" />
          </Field>
          <Field label="Lecturer">
            <Select value={form.lecturerId} onChange={(e) => setForm({ ...form, lecturerId: e.target.value })}>
              <option value="">Unassigned</option>
              {staff.filter((s) => s.isLecturer).map((s) => (
                <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
              ))}
            </Select>
          </Field>
          <Field label="Academic year" required>
            <Select value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} required>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
          </Field>
          <Field label="Semester" required>
            <Input type="number" min={1} max={2} value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} required />
          </Field>
          <Field label="Start date" required>
            <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
          </Field>
          <div className="form-actions">
            <Button type="submit">Add entry</Button>
            <Button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}