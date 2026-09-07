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
  Textarea,
  dateTime,
} from '../components/ui';
import type { Announcement, Cohort, Level, Program } from '../types';

export default function Announcements() {
  const { user, can } = useAuth();
  const isManager = can('announcement.manage');
  const [rows, setRows] = useState<Announcement[] | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [form, setForm] = useState({
    title: '',
    body: '',
    targetType: 'all',
    programId: '',
    levelId: '',
    cohortId: '',
  });

  const load = useCallback(() => {
    if (user?.linkedStudentId && !isManager) {
      http
        .get<Announcement[]>(`/notifications/student/${user.linkedStudentId}`)
        .then(setRows)
        .catch(() => setRows([]));
      return;
    }
    http.get<Announcement[]>('/notifications/announcements').then(setRows).catch(() => setRows([]));
  }, [user?.linkedStudentId, isManager]);

  useEffect(() => {
    load();
    if (isManager) {
      http.get<Program[]>('/academics/programs').then(setPrograms).catch(() => {});
      http.get<Level[]>('/academics/levels').then(setLevels).catch(() => {});
      http.get<Cohort[]>('/academics/cohorts').then(setCohorts).catch(() => {});
    }
  }, [load, isManager]);

  async function create(e: FormEvent) {
    e.preventDefault();
    setError(null);
    let targetId: number | undefined;
    if (form.targetType === 'program') targetId = Number(form.programId) || undefined;
    else if (form.targetType === 'level') targetId = Number(form.levelId) || undefined;
    else if (form.targetType === 'cohort') targetId = Number(form.cohortId) || undefined;
    try {
      await http.post('/notifications/announcements', {
        title: form.title,
        body: form.body,
        targetType: form.targetType,
        targetId,
      });
      setOpen(false);
      setForm({ title: '', body: '', targetType: 'all', programId: '', levelId: '', cohortId: '' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish announcement');
    }
  }

  const isTargeted = form.targetType !== 'all';

  return (
    <div className="stack">
      <Card
        title={`Announcements (${rows?.length ?? 0})`}
        actions={can('announcement.manage') ? <Button onClick={() => setOpen(true)}>Publish</Button> : undefined}
      >
        <FormError text={error} />
        {!rows ? (
          <Loading />
        ) : (
          <Table columns={['Title', 'Audience', 'Published']}>
            {rows.map((a) => (
              <tr key={a.id}>
                <td>{a.title}</td>
                <td>
                  {a.targetType === 'all' ? (
                    'All'
                  ) : (
                    <span className="badge">
                      {a.programId ? `P${a.programId} ` : ''}{a.levelId ? `L${a.levelId} ` : ''}{a.cohortId ? `C${a.cohortId}` : ''}
                    </span>
                  )}
                </td>
                <td>{dateTime(a.publishedAt)}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal title="Publish announcement" open={open} onClose={() => setOpen(false)}>
        <form onSubmit={create} className="form-grid">
          <Field label="Title" required>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </Field>
          <Field label="Body" required>
            <Textarea rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
          </Field>
          <Field label="Audience">
            <Select value={form.targetType} onChange={(e) => setForm({ ...form, targetType: e.target.value })}>
              <option value="all">Everyone</option>
              <option value="program">Specific program</option>
              <option value="level">Specific level</option>
              <option value="cohort">Specific cohort</option>
            </Select>
          </Field>
          {isTargeted && form.targetType === 'program' && (
            <Field label="Program">
              <Select value={form.programId} onChange={(e) => setForm({ ...form, programId: e.target.value })}>
                <option value="">All programs</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </Field>
          )}
          {isTargeted && form.targetType === 'level' && (
            <Field label="Level">
              <Select value={form.levelId} onChange={(e) => setForm({ ...form, levelId: e.target.value })}>
                <option value="">All levels</option>
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </Select>
            </Field>
          )}
          {isTargeted && form.targetType === 'cohort' && (
            <Field label="Cohort">
              <Select value={form.cohortId} onChange={(e) => setForm({ ...form, cohortId: e.target.value })}>
                <option value="">All cohorts</option>
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id}>{c.code}</option>
                ))}
              </Select>
            </Field>
          )}
          <div className="form-actions">
            <Button type="submit">Publish</Button>
            <Button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}