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
  Loading,
  Modal,
  Select,
  Table,
} from '../components/ui';
import type { Course, Enrollment, StudentListResponse, StudentRow } from '../types';

interface EnrollmentRow extends Omit<Enrollment, 'student'> {
  student?: { id?: number; studentId: string; firstName: string; lastName: string };
}

export default function EnrollmentPage() {
  const { can } = useAuth();
  const [rows, setRows] = useState<EnrollmentRow[] | null>(null);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [retakeOpen, setRetakeOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filters, setFilters] = useState({ studentId: '', courseId: '', academicYear: '', semester: '' });
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [retakeForm, setRetakeForm] = useState({ studentId: '', courseId: '', academicYear: '', semester: '1' });
  const [bulkForm, setBulkForm] = useState({ academicYear: '', semester: '1' });

  const years = ['2023/2024', '2024/2025', '2025/2026', '2026/2027', '2027/2028'];

  const load = useCallback(async () => {
    const q = new URLSearchParams();
    if (filters.studentId) q.set('studentId', filters.studentId);
    if (filters.courseId) q.set('courseId', filters.courseId);
    if (filters.academicYear) q.set('academicYear', filters.academicYear);
    if (filters.semester) q.set('semester', filters.semester);
    http.get<EnrollmentRow[]>(`/enrollment?${q.toString()}`).then(setRows).catch((e) => setError(e.message));
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    http.get<StudentListResponse>('/students?limit=200').then((r) => setStudents(r.items)).catch(() => {});
    http.get<Course[]>('/courses').then(setCourses).catch(() => {});
  }, []);

  async function bulkEnroll(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    try {
      const res = await http.post<{ created: number; skipped: number }>('/enrollment', {
        studentIds: selectedStudents,
        courseIds: selectedCourses,
        academicYear: bulkForm.academicYear,
        semester: Number(bulkForm.semester),
      });
      setOk(`Created ${res.created} enrollment(s), skipped ${res.skipped}`);
      setEnrollOpen(false);
      setSelectedStudents([]);
      setSelectedCourses([]);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enrollment failed');
    }
  }

  async function createRetake(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    try {
      const res = await http.post<{ message: string; enrollmentId: number }>('/enrollment/retake', {
        studentId: Number(retakeForm.studentId),
        courseId: Number(retakeForm.courseId),
        academicYear: retakeForm.academicYear,
        semester: Number(retakeForm.semester),
      });
      setOk(res.message);
      setRetakeOpen(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Retake failed');
    }
  }

  function toggleStudent(id: number) {
    setSelectedStudents((arr) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]));
  }
  function toggleCourse(id: number) {
    setSelectedCourses((arr) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]));
  }

  return (
    <div className="stack">
      {ok && <Alert kind="success">{ok}</Alert>}
      <Card
        title={`Enrollments (${rows?.length ?? 0})`}
        actions={
          can('enrollment.manage') ? (
            <div className="row gap">
              <Button onClick={() => setEnrollOpen(true)}>Enroll students</Button>
              <Button className="btn-ghost" onClick={() => setRetakeOpen(true)}>Retake</Button>
            </div>
          ) : undefined
        }
      >
        <div className="toolbar">
          <Select value={filters.studentId} onChange={(e) => setFilters({ ...filters, studentId: e.target.value })}>
            <option value="">All students</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.studentId}</option>
            ))}
          </Select>
          <Select value={filters.courseId} onChange={(e) => setFilters({ ...filters, courseId: e.target.value })}>
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.code}</option>
            ))}
          </Select>
          <Select value={filters.semester} onChange={(e) => setFilters({ ...filters, semester: e.target.value })}>
            <option value="">Any semester</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
          </Select>
        </div>
        <FormError text={error} />
        {!rows ? (
          <Loading />
        ) : (
          <Table columns={['Student', 'Course', 'Attempt', 'Status', 'Enrolled']}>
            {rows.map((en) => (
              <tr key={en.id}>
                <td>{en.student ? `${en.student.studentId} - ${en.student.lastName}, ${en.student.firstName}` : `Student #${en.studentId}`}</td>
                <td>{en.course ? `${en.course.code} - ${en.course.name}` : `Course #${en.courseId}`}</td>
                <td>{en.attemptNumber}</td>
                <td><span className={`badge badge-${en.enrollmentStatus === 'completed' ? 'completed' : 'active'}`}>{en.enrollmentStatus}</span></td>
                <td>{new Date(en.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal title="Enroll students" open={enrollOpen} onClose={() => setEnrollOpen(false)}>
        <form onSubmit={bulkEnroll} className="stack">
          <div className="row gap">
            <Field label="Academic year" required>
              <Select value={bulkForm.academicYear} onChange={(e) => setBulkForm({ ...bulkForm, academicYear: e.target.value })} required>
                <option value="">Select year...</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
            </Field>
            <Field label="Semester" required>
              <Input type="number" min={1} max={2} value={bulkForm.semester} onChange={(e) => setBulkForm({ ...bulkForm, semester: e.target.value })} required />
            </Field>
          </div>
          <div className="check-grid">
            {students.map((s) => (
              <label key={s.id} className="inline-check">
                <input type="checkbox" checked={selectedStudents.includes(s.id)} onChange={() => toggleStudent(s.id)} />
                {s.studentId} - {s.lastName}, {s.firstName}
              </label>
            ))}
          </div>
          <div className="check-grid">
            {courses.map((c) => (
              <label key={c.id} className="inline-check">
                <input type="checkbox" checked={selectedCourses.includes(c.id)} onChange={() => toggleCourse(c.id)} />
                {c.code} - {c.name}
              </label>
            ))}
          </div>
          <div className="form-actions">
            <Button type="submit" disabled={selectedStudents.length === 0 || selectedCourses.length === 0}>
              Enroll {selectedStudents.length} student(s) in {selectedCourses.length} course(s)
            </Button>
            <Button type="button" className="btn-ghost" onClick={() => setEnrollOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      <Modal title="Create retake" open={retakeOpen} onClose={() => setRetakeOpen(false)}>
        <form onSubmit={createRetake} className="form-grid">
          <Field label="Student" required>
            <Select value={retakeForm.studentId} onChange={(e) => setRetakeForm({ ...retakeForm, studentId: e.target.value })} required>
              <option value="">Select student...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.studentId}</option>
              ))}
            </Select>
          </Field>
          <Field label="Course" required>
            <Select value={retakeForm.courseId} onChange={(e) => setRetakeForm({ ...retakeForm, courseId: e.target.value })} required>
              <option value="">Select course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.code}</option>
              ))}
            </Select>
          </Field>
          <Field label="Academic year" required>
            <Select value={retakeForm.academicYear} onChange={(e) => setRetakeForm({ ...retakeForm, academicYear: e.target.value })} required>
              <option value="">Select year...</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
          </Field>
          <Field label="Semester" required>
            <Input type="number" min={1} max={2} value={retakeForm.semester} onChange={(e) => setRetakeForm({ ...retakeForm, semester: e.target.value })} required />
          </Field>
          <div className="form-actions">
            <Button type="submit">Create retake</Button>
            <Button type="button" className="btn-ghost" onClick={() => setRetakeOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}