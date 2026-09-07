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
} from '../components/ui';
import type { Assessment, Course } from '../types';

const ASSESSMENT_TYPES = ['assignment', 'quiz', 'test', 'midterm', 'final_examination', 'practical', 'project'];

interface GradeEntry {
  id: number;
  studentId: number;
  student?: { studentId: string; firstName: string; lastName: string };
  score: string | null;
  grade: string | null;
  status: string;
}

interface EntriesResponse {
  assessment: Assessment;
  grades: GradeEntry[];
  enrolled: Array<{ studentId: number; student?: { studentId: string; firstName: string; lastName: string } }>;
}

export default function Grades() {
  const { can, user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState('');
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selected, setSelected] = useState<EntriesResponse | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<number, string>>({});
  const [form, setForm] = useState({ name: '', type: 'assignment', maximumScore: '100', weight: '10' });

  const loadAssessments = useCallback(() => {
    if (!courseId) {
      setAssessments([]);
      return;
    }
    http.get<Assessment[]>(`/grades/assessments?courseId=${courseId}`).then(setAssessments).catch((e) => setError(e.message));
  }, [courseId]);

  useEffect(() => {
    http.get<Course[]>('/courses').then(setCourses).catch(() => {});
  }, []);

  useEffect(() => {
    loadAssessments();
  }, [loadAssessments]);

  useEffect(() => {
    if (!selected) return;
    const next: Record<number, string> = {};
    for (const g of selected.grades) next[g.studentId] = g.score ?? '';
    setScores(next);
  }, [selected?.assessment?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadEntries(assessmentId: number) {
    setError(null);
    try {
      const res = await http.get<EntriesResponse>(`/grades/assessments/${assessmentId}/entries`);
      setSelected(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load entries');
    }
  }

  async function createAssessment(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await http.post('/grades/assessments', {
        courseId: Number(courseId),
        name: form.name,
        type: form.type,
        maximumScore: parseFloat(form.maximumScore),
        weight: parseFloat(form.weight),
      });
      setCreateOpen(false);
      setForm({ name: '', type: 'assignment', maximumScore: '100', weight: '10' });
      loadAssessments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create assessment');
    }
  }

  async function saveScores(mode: 'draft' | 'submit') {
    if (!selected || !scores) return;
    setError(null);
    setOk(null);
    const entries = selected.enrolled
      .map((en) => ({
        studentId: en.studentId,
        score: scores[en.studentId],
      }))
      .filter((x) => x.score !== undefined && x.score !== '');
    try {
      const res = await http.post<{ coverage?: number; message?: string }>(
        `/grades/assessments/${selected.assessment.id}/${mode}`,
        { entries },
      );
      setOk(mode === 'submit' ? `Submitted with coverage ${res.coverage}%` : 'Draft saved');
      await loadEntries(selected.assessment.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : `Failed to ${mode}`);
    }
  }

  async function validate() {
    if (!selected) return;
    setError(null);
    setOk(null);
    try {
      await http.post(`/grades/assessments/${selected.assessment.id}/validate`, {});
      setOk('Assessment validated');
      await loadEntries(selected.assessment.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Validation failed');
    }
  }

  async function correct(gradeId: number, newScore: string) {
    if (!confirm(`Correct grade to ${newScore}? This is recorded in history.`)) return;
    setError(null);
    setOk(null);
    try {
      await http.post(`/grades/grade/${gradeId}/correct`, { newScore: parseFloat(newScore) });
      setOk('Grade corrected');
      await loadEntries(selected!.assessment.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Correction failed');
    }
  }

  const canEnter = can('grade.enter');
  const canSubmit = can('grade.submit');
  const canValidate = can('grade.validate') && user?.roleName !== 'student';
  const canCorrect = can('grade.correct');

  return (
    <div className="stack">
      {ok && <Alert kind="success">{ok}</Alert>}
      <Card title="Select course & assessment">
        <div className="toolbar">
          <Select value={courseId} onChange={(e) => { setCourseId(e.target.value); setSelected(null); }}>
            <option value="">Select course...</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
            ))}
          </Select>
          <Select value={selected?.assessment?.id ?? ''} onChange={(e) => { if (e.target.value) loadEntries(Number(e.target.value)); }}>
            <option value="">Select assessment...</option>
            {assessments.map((a) => (
              <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
            ))}
          </Select>
          {can('assessment.manage') && courseId && (
            <Button onClick={() => setCreateOpen(true)}>New assessment</Button>
          )}
        </div>
        <FormError text={error} />
      </Card>

      {selected && (
        <Card
          title={`${selected.assessment.name} — ${selected.assessment.course?.name ?? ''} (max ${selected.assessment.maximumScore}, weight ${selected.assessment.weight})`}
          actions={
            <div className="row gap">
              {canEnter && <Button className="btn-ghost" onClick={() => saveScores('draft')}>Save draft</Button>}
              {canSubmit && <Button onClick={() => saveScores('submit')}>Submit scores</Button>}
              {canValidate && <Button className="btn-ghost" onClick={validate}>Validate</Button>}
            </div>
          }
        >
          <Table columns={['Student', 'Score', 'Grade', 'Status', 'Actions']}>
            {selected.enrolled.map((en) => {
              const g = selected.grades.find((x) => x.studentId === en.studentId);
              const isLocked = (g?.status === 'validated' || g?.status === 'corrected') && !canCorrect;
              return (
                <tr key={en.studentId}>
                  <td>{en.student ? `${en.student.studentId} - ${en.student.lastName}, ${en.student.firstName}` : `Student #${en.studentId}`}</td>
                  <td>
                    {isLocked ? (
                      g?.score ?? '—'
                    ) : (
                      <Input
                        type="number"
                        min={0}
                        max={parseFloat(selected.assessment.maximumScore) || 100}
                        value={scores[en.studentId] ?? ''}
                        onChange={(e) => setScores({ ...scores, [en.studentId]: e.target.value })}
                        placeholder="—"
                        style={{ width: '110px' }}
                      />
                    )}
                  </td>
                  <td>{g?.grade ?? '—'}</td>
                  <td><span className={`badge badge-${g?.status ?? 'none'}`}>{g?.status ?? 'not entered'}</span></td>
                  <td>
                    {g && canCorrect && (
                      <Button
                        className="btn-sm btn-ghost"
                        onClick={() => {
                          const val = prompt('New score:', scores[en.studentId] ?? '');
                          if (val !== null) correct(g.id, val);
                        }}
                      >
                        Correct
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </Table>
        </Card>
      )}

      <Modal title="Create assessment" open={createOpen} onClose={() => setCreateOpen(false)}>
        <form onSubmit={createAssessment} className="form-grid">
          <Field label="Name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Type" required>
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {ASSESSMENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="Maximum score" required>
            <Input type="number" min={1} value={form.maximumScore} onChange={(e) => setForm({ ...form, maximumScore: e.target.value })} required />
          </Field>
          <Field label="Weight (%)" required>
            <Input type="number" min={0} step="0.01" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} required />
          </Field>
          <div className="form-actions">
            <Button type="submit">Create</Button>
            <Button type="button" className="btn-ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}