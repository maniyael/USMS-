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
import type { Curriculum, Course, Level, Program } from '../types';

type Section = 'courses' | 'curricula';

export default function Courses() {
  const { can } = useAuth();
  const [section, setSection] = useState<Section>('courses');
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [curricula, setCurricula] = useState<Curriculum[] | null>(null);
  const [courseOpen, setCourseOpen] = useState(false);
  const [curricOpen, setCurricOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [courseForm, setCourseForm] = useState({ code: '', name: '', credits: '3', description: '' });
  const [curricForm, setCurricForm] = useState({ programId: '', levelId: '', academicYear: '', semester: '1' });
  const [curricCourses, setCurricCourses] = useState<{ courseId: string; isRequired: boolean; prerequisiteCourseId: string }[]>([]);

  const loadCourses = useCallback(() => {
    http.get<Course[]>('/courses').then(setCourses).catch(() => setCourses([]));
  }, []);

  const loadCurricula = useCallback(() => {
    http.get<Curriculum[]>('/courses/curricula/list').then(setCurricula).catch(() => setCurricula([]));
  }, []);

  useEffect(() => {
    loadCourses();
    loadCurricula();
    http.get<Program[]>('/academics/programs').then(setPrograms).catch(() => {});
    http.get<Level[]>('/academics/levels').then(setLevels).catch(() => {});
  }, [loadCourses, loadCurricula]);

  async function createCourse(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await http.post('/courses', {
        ...courseForm,
        credits: Number(courseForm.credits),
        description: courseForm.description || undefined,
      });
      setCourseOpen(false);
      setCourseForm({ code: '', name: '', credits: '3', description: '' });
      loadCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create course');
    }
  }

  async function createCurriculum(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const contains = curricCourses.map((c) => ({
        courseId: Number(c.courseId),
        isRequired: c.isRequired,
        prerequisiteCourseId: c.prerequisiteCourseId ? Number(c.prerequisiteCourseId) : undefined,
      }));
      await http.post('/courses/curricula', {
        programId: Number(curricForm.programId),
        levelId: Number(curricForm.levelId),
        academicYear: curricForm.academicYear,
        semester: Number(curricForm.semester),
        courses: contains,
      });
      setCurricOpen(false);
      setCurricCourses([]);
      loadCurricula();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create curriculum');
    }
  }

  const years = ['2023/2024', '2024/2025', '2025/2026', '2026/2027', '2027/2028'];

  return (
    <div className="stack">
      <nav className="tabs">
        <button type="button" className={`tab ${section === 'courses' ? 'active' : ''}`} onClick={() => setSection('courses')}>
          Courses
        </button>
        <button type="button" className={`tab ${section === 'curricula' ? 'active' : ''}`} onClick={() => setSection('curricula')}>
          Curricula
        </button>
      </nav>

      {section === 'courses' && (
        <Card
          title={`Courses (${courses?.length ?? 0})`}
          actions={can('course.create') ? <Button onClick={() => setCourseOpen(true)}>Create course</Button> : undefined}
        >
          <FormError text={error} />
          {!courses ? (
            <Loading />
          ) : (
            <Table columns={['Code', 'Name', 'Credits']}>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td>{c.code}</td>
                  <td>{c.name}</td>
                  <td>{c.credits}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      {section === 'curricula' && (
        <Card
          title={`Curricula (${curricula?.length ?? 0})`}
          actions={can('curriculum.create') ? <Button onClick={() => setCurricOpen(true)}>Add curriculum</Button> : undefined}
        >
          <FormError text={error} />
          {!curricula ? (
            <Loading />
          ) : (
            <Table columns={['Program', 'Level', 'Year', 'Semester', 'Courses']}>
              {curricula.map((cu) => (
                <tr key={cu.id}>
                  <td>{cu.program?.name}</td>
                  <td>{cu.level?.name}</td>
                  <td>{cu.academicYear}</td>
                  <td>{cu.semester}</td>
                  <td>{cu.courses.length}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      <Modal title="Create course" open={courseOpen} onClose={() => setCourseOpen(false)}>
        <form onSubmit={createCourse} className="form-grid">
          <Field label="Code" required>
            <Input value={courseForm.code} onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value.toUpperCase() })} required />
          </Field>
          <Field label="Name" required>
            <Input value={courseForm.name} onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })} required />
          </Field>
          <Field label="Credits" required>
            <Input type="number" min={1} max={10} value={courseForm.credits} onChange={(e) => setCourseForm({ ...courseForm, credits: e.target.value })} required />
          </Field>
          <Field label="Description">
            <Input value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} />
          </Field>
          <div className="form-actions">
            <Button type="submit">Create</Button>
            <Button type="button" className="btn-ghost" onClick={() => setCourseOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      <Modal title="Add curriculum" open={curricOpen} onClose={() => setCurricOpen(false)}>
        <form onSubmit={createCurriculum} className="form-grid">
          <Field label="Program" required>
            <Select value={curricForm.programId} onChange={(e) => setCurricForm({ ...curricForm, programId: e.target.value })} required>
              <option value="">Select program...</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Level" required>
            <Select value={curricForm.levelId} onChange={(e) => setCurricForm({ ...curricForm, levelId: e.target.value })} required>
              <option value="">Select level...</option>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Academic year" required>
            <Select value={curricForm.academicYear} onChange={(e) => setCurricForm({ ...curricForm, academicYear: e.target.value })} required>
              <option value="">Select year...</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
          </Field>
          <Field label="Semester" required>
            <Input type="number" min={1} max={2} value={curricForm.semester} onChange={(e) => setCurricForm({ ...curricForm, semester: e.target.value })} required />
          </Field>
          <div className="container-block">
            <span className="field-label">Courses in program</span>
            {curricCourses.map((c, i) => (
              <div key={i} className="row gap">
                <Select value={c.courseId} onChange={(e) => setCurricCourses((arr) => arr.map((x, j) => (j === i ? { ...x, courseId: e.target.value } : x)))}>
                  <option value="">Select course...</option>
                  {courses?.map((co) => (
                    <option key={co.id} value={co.id}>{co.code} - {co.name}</option>
                  ))}
                </Select>
                <label className="inline-check">
                  <input type="checkbox" checked={c.isRequired} onChange={(e) => setCurricCourses((arr) => arr.map((x, j) => (j === i ? { ...x, isRequired: e.target.checked } : x)))} />
                  Required
                </label>
                <Button type="button" className="btn-sm btn-ghost" onClick={() => setCurricCourses((arr) => arr.filter((_, j) => j !== i))}>
                  &times;
                </Button>
              </div>
            ))}
            <Button type="button" className="btn-sm" onClick={() => setCurricCourses((arr) => [...arr, { courseId: '', isRequired: true, prerequisiteCourseId: '' }])}>
              + Add course
            </Button>
          </div>
          <div className="form-actions">
            <Button type="submit">Create</Button>
            <Button type="button" className="btn-ghost" onClick={() => setCurricOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}