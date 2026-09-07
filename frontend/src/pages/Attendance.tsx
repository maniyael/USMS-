import { useCallback, useEffect, useState } from 'react';
import { http } from '../api';
import { useAuth } from '../auth';
import {
  Alert,
  Button,
  Card,
  FormError,
  Input,
  Loading,
  Select,
  Table,
  formatPercent,
} from '../components/ui';
import type { AttendanceRecord, Course, Enrollment } from '../types';

interface AttendanceEntry {
  studentId: number;
  studentName: string;
  status: string;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function Attendance() {
  const { can } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState('');
  const [date, setDate] = useState(todayIso());
  const [entries, setEntries] = useState<AttendanceEntry[] | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[] | null>(null);
  const [stats, setStats] = useState<{ total: number; present: number; late: number; absent: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadDay = useCallback(async () => {
    if (!courseId) return;
    setEntries(null);
    setError(null);
    try {
      const existing = await http
        .get<AttendanceRecord[]>(`/attendance/course/${courseId}/date/${date}`)
        .catch(() => [] as AttendanceRecord[]);
      const roster = await http.get<Enrollment[]>(`/enrollment?courseId=${courseId}`);
      const mapped = roster
        .filter((r) => r.enrollmentStatus !== 'completed')
        .map((r) => {
          const prior = existing.find((x) => x.studentId === r.studentId);
          const s = r.student as { studentId: string; firstName: string; lastName: string } | undefined;
          return {
            studentId: r.studentId,
            studentName: s ? `${s.studentId} - ${s.lastName}, ${s.firstName}` : `Student #${r.studentId}`,
            status: prior?.status ?? 'present',
          };
        });
      setEntries(mapped);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load roster');
    }
  }, [courseId, date]);

  const loadAll = useCallback(async () => {
    if (!courseId) return;
    http.get<AttendanceRecord[]>(`/attendance/course/${courseId}`).then(setRecords).catch(() => setRecords([]));
    http
      .get<{ total: number; present: number; late: number; absent: number }>(`/attendance/course/${courseId}/stats`)
      .then(setStats)
      .catch(() => setStats(null));
  }, [courseId]);

  useEffect(() => {
    http.get<Course[]>('/courses').then(setCourses).catch(() => {});
  }, []);

  useEffect(() => {
    loadDay();
    loadAll();
  }, [loadDay, loadAll]);

  function setStatus(studentId: number, status: string) {
    setEntries((arr) => arr?.map((e) => (e.studentId === studentId ? { ...e, status } : e)) ?? null);
  }

  async function save() {
    if (!courseId || !entries) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      await http.post('/attendance', {
        courseId: Number(courseId),
        date,
        entries: entries.map((e) => ({ studentId: e.studentId, status: e.status })),
      });
      setOk('Attendance saved');
      loadDay();
      loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save attendance');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <Card title="Mark attendance">
        <div className="toolbar">
          <Select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">Select course...</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
            ))}
          </Select>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        {ok && <Alert kind="success">{ok}</Alert>}
        <FormError text={error} />
        {stats && (
          <div className="toolbar stats-line">
            <span className="badge badge-present">present {stats.present}</span>
            <span className="badge badge-late">late {stats.late}</span>
            <span className="badge badge-absent">absent {stats.absent}</span>
            <b>Rate: {formatPercent(stats.total ? (stats.present + stats.late) / stats.total : 0)}</b>
          </div>
        )}
      </Card>

      {courseId && (
        <Card
          title={`Roster for ${date}`}
          actions={
            can('attendance.manage') ? (
              <Button onClick={save} disabled={busy || !entries}>
                {busy ? 'Saving...' : 'Save attendance'}
              </Button>
            ) : undefined
          }
        >
          {!entries ? (
            <Loading />
          ) : entries.length === 0 ? (
            <p className="muted">No enrolled students for this course.</p>
          ) : (
            <Table columns={['Student', 'Status']}>
              {entries.map((e) => (
                <tr key={e.studentId}>
                  <td>{e.studentName}</td>
                  <td>
                    <div className="seg-control">
                      {['present', 'late', 'absent'].map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={`seg ${e.status === s ? 'active' : ''}`}
                          onClick={() => can('attendance.manage') && setStatus(e.studentId, s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      {courseId && (
        <Card title={`History (${records?.length ?? 0})`}>
          {!records ? (
            <Loading />
          ) : (
            <Table columns={['Date', 'Student', 'Status', 'Remarks']}>
              {records.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.date).toLocaleDateString()}</td>
                  <td>{r.student ? `${r.student.lastName}, ${r.student.firstName}` : `Student #${r.studentId}`}</td>
                  <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                  <td>{r.remarks ?? '—'}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}
    </div>
  );
}