import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { http } from '../api';
import { useAuth } from '../auth';
import {
  Button,
  Card,
  Donut,
  EmptyState,
  Field,
  FormError,
  Loading,
  Modal,
  Select,
  Table,
  Tabs,
  dateOnly,
  useToast,
} from '../components/ui';
import { Icon } from '../components/icons';
import type {
  EvaluationCriterion,
  EvaluationPeriod,
  EvaluationResult,
  EvaluationSubmission,
  EvaluationTarget,
} from '../types';

/* ------------------------------------------------------------------ shared */
function Stars({ value, onChange, size = 17 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <div className={`rating-row ${onChange ? '' : 'rating-readonly'}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          disabled={!onChange}
          className={`rating-star ${n <= Math.round(value) ? 'active' : ''}`}
          onClick={() => onChange?.(n)}
          aria-label={`${n} of 5`}
        >
          <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" stroke="none">
            <path d="m12 3 2.7 5.8 6.3.8-4.6 4.3 1.2 6.1L12 17.5 6.4 20l1.2-6.1L3 9.6l6.3-.8z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

function PeriodLabel({ p }: { p: { name: string; academicYear?: string; semester?: number } }) {
  return (
    <span>
      {p.name}
      {p.academicYear ? ` (${p.academicYear} · S${p.semester ?? ''})` : ''}
    </span>
  );
}

/* ------------------------------------------------------------------ student */
function StudentEvals() {
  const { notify } = useToast();
  const [criteria, setCriteria] = useState<EvaluationCriterion[]>([]);
  const [eligible, setEligible] = useState<EvaluationTarget[]>([]);
  const [mine, setMine] = useState<EvaluationSubmission[]>([]);
  const [period, setPeriod] = useState<{ id: number; name: string } | null>(null);
  const [tab, setTab] = useState<'pending' | 'history'>('pending');
  const [openFor, setOpenFor] = useState<EvaluationTarget | null>(null);
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    http.get<EvaluationCriterion[]>('/evaluations/criteria').then(setCriteria).catch(() => setCriteria([]));
    http
      .get<{ period: { id: number; name: string } | null; items: EvaluationTarget[] }>('/evaluations/eligible')
      .then((r) => {
        setPeriod(r.period);
        setEligible(r.items ?? []);
      })
      .catch(() => setEligible([]));
    http.get<EvaluationSubmission[]>('/evaluations/mine').then(setMine).catch(() => setMine([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openSubmit = (t: EvaluationTarget) => {
    setOpenFor(t);
    setRatings({});
    setFeedback('');
    setError(null);
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!openFor || !period) return;
    const missing = criteria.filter((c) => !ratings[c.id]);
    if (missing.length) {
      setError('Please rate every criterion before submitting.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await http.post('/evaluations/submit', {
        periodId: period.id,
        courseId: openFor.courseId,
        lecturerId: openFor.lecturerId,
        responses: ratings,
        writtenFeedback: feedback.trim() || undefined,
      });
      notify('success', 'Evaluation submitted', 'Thank you — your feedback is confidential.');
      setOpenFor(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setBusy(false);
    }
  }

  const pending = eligible.filter((t) => !t.alreadyEvaluated);

  return (
    <div className="stack">
      <Card
        icon="evaluation"
        title={period ? `Open period: ${period.name}` : 'Student evaluations'}
      >
        {!period ? (
          <div className="alert alert-info">
            No evaluation period is currently open. Your lecturers will invite you when the period begins.
          </div>
        ) : (
          <p className="muted">
            Each course you are enrolled in may be evaluated once per lecturer. Responses are strictly confidential
            and aggregated anonymously.
          </p>
        )}
      </Card>

      <Tabs
        tabs={[
          { key: 'pending', label: `Pending (${pending.length})`, icon: 'clipboard' },
          { key: 'history', label: 'My submissions', icon: 'check' },
        ]}
        active={tab}
        onChange={(k) => setTab(k as 'pending' | 'history')}
      />

      {tab === 'pending' && (
        <Card title="Courses to evaluate" icon="clipboard">
          {period && pending.length === 0 ? (
            <EmptyState icon="checkCircle" title="All caught up" body="You have evaluated every course you are eligible for in the current period." />
          ) : !period ? (
            <EmptyState icon="calendar" title="No open period" body="Your pending evaluations will appear here once a period opens." />
          ) : (
            <div className="grid-2">
              {eligible.map((t) => (
                <div key={`${t.courseId}-${t.lecturerId}`} className="card sub">
                  <div className="row-between">
                    <b>{t.courseCode} — {t.courseName}</b>
                    {t.alreadyEvaluated ? <span className="badge badge-active">Evaluated</span> : <span className="badge badge-gold">Pending</span>}
                  </div>
                  <div className="muted small">Lecturer: {t.lecturerName || '—'}</div>
                  {!t.alreadyEvaluated && (
                    <div style={{ marginTop: 10 }}>
                      <Button className="btn-sm" onClick={() => openSubmit(t)}>
                        <Icon name="evaluation" /> Evaluate
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'history' && (
        <Card title="My submitted evaluations" icon="check">
          {mine.length === 0 ? (
            <EmptyState icon="inbox" title="No submissions yet" body="Evaluations you submit will be recorded here." />
          ) : (
            <Table columns={['Course', 'Period', 'Overall', 'Feedback', 'Submitted']} empty="No submissions">
              {mine.map((m) => (
                <tr key={m.id}>
                  <td><b>{m.course?.code} — {m.course?.name}</b></td>
                  <td>{m.period ? <PeriodLabel p={m.period} /> : `#${m.periodId}`}</td>
                  <td><Stars value={m.overallRating} /></td>
                  <td className="muted small">{m.writtenFeedback ?? '—'}</td>
                  <td>{dateOnly(m.submittedAt)}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      <Modal title={`Evaluate — ${openFor?.courseCode ?? ''}`} open={!!openFor} onClose={() => setOpenFor(null)} width={620}>
        {openFor && (
          <form onSubmit={submit} className="stack">
            <div>
              <b style={{ fontSize: 17 }}>{openFor.courseName}</b>
              <div className="muted small">Lecturer: {openFor.lecturerName || '—'}</div>
            </div>
            <div className="eval-locked-note">
              <Icon name="shield" />
              Your responses are anonymous and locked immediately after submission.
            </div>
            <FormError text={error} />
            <div className="alert alert-warning" id="eval-criteria-help">
              Rate each aspect from 1 (strongly disagree) to 5 (strongly agree).
            </div>
            {criteria.map((c, i) => (
              <div key={c.id} className="criterion-row">
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div className="criterion-name">{i + 1}. {c.name}</div>
                  {c.description && <div className="criterion-desc">{c.description}</div>}
                </div>
                <Stars value={ratings[c.id] ?? 0} onChange={(v) => setRatings((r) => ({ ...r, [c.id]: v }))} />
              </div>
            ))}
            <Field label="Written feedback (optional)" hint="Comments are shared with lecturers; never your identity.">
              <textarea
                className="input"
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="What worked well? What could be improved?"
              />
            </Field>
            <div className="form-actions" style={{ gridColumn: 'auto' }}>
              <Button type="submit" className="btn-gold" disabled={busy}>
                {busy ? 'Submitting…' : 'Submit evaluation'}
              </Button>
              <Button type="button" className="btn-ghost" onClick={() => setOpenFor(null)}>Cancel</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ lecturer */
function LecturerEvals() {
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    http
      .get<EvaluationResult[]>('/evaluations/results/lecturer')
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading text="Loading your evaluation results…" />;

  return (
    <div className="stack">
      <Card icon="evaluation" title="Your course evaluations">
        <p className="muted">
          Results are aggregated across all responding students. Individual students are never identified.
        </p>
      </Card>

      {results.length === 0 ? (
        <Card title="Evaluation results">
          <EmptyState icon="evaluation" title="No evaluations available" body="Once students complete evaluations for your courses, anonymised results will appear here." />
        </Card>
      ) : (
        results.map((r) => (
          <Card key={r.courseId} title={`${r.courseCode} — ${r.courseName}`} icon="book">
            <div className="row gap" style={{ flexWrap: 'wrap', marginBottom: 14 }}>
              <div className="eval-card" style={{ padding: 14 }}>
                <div className="eval-score num">{r.overallRating.toFixed(2)}</div>
                <div className="stat-label">Overall (of 5)</div>
              </div>
              <div className="eval-card" style={{ padding: 14 }}>
                <div className="stat-value num">{r.responseCount}</div>
                <div className="stat-label">Responses</div>
              </div>
              <Donut
                segments={[
                  { label: 'Score', value: r.overallRating, color: 'var(--gold)' },
                  { label: 'Remaining', value: 5 - r.overallRating, color: 'var(--warmgrey)' },
                ]}
                size={110}
                thickness={13}
                centerLabel={r.overallRating.toFixed(1)}
                centerSub="/ 5"
              />
            </div>
            <div className="stack" style={{ gap: 8 }}>
              {r.perCriterion.map((c) => (
                <div key={c.criterionId} className="criterion-row" style={{ padding: '8px 0' }}>
                  <div className="criterion-name">{c.name}</div>
                  <div className="row gap">
                    <span className="pct-label num">{c.mean.toFixed(2)}</span>
                    <Stars value={c.mean} size={15} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ admin */
function AdminEvals() {
  const { can } = useAuth();
  const { notify } = useToast();
  const [tab, setTab] = useState<'periods' | 'criteria' | 'results'>('periods');
  const [criteria, setCriteria] = useState<EvaluationCriterion[]>([]);
  const [periods, setPeriods] = useState<EvaluationPeriod[]>([]);
  const [results, setResults] = useState<unknown[]>([]);
  const [critOpen, setCritOpen] = useState(false);
  const [perOpen, setPerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [critForm, setCritForm] = useState({ name: '', description: '' });
  const [perForm, setPerForm] = useState({ name: '', academicYear: '2025/2026', semester: '1', startsAt: '', endsAt: '' });

  const load = useCallback(() => {
    http.get<EvaluationCriterion[]>('/evaluations/criteria').then(setCriteria).catch(() => setCriteria([]));
    http.get<EvaluationPeriod[]>('/evaluations/periods').then(setPeriods).catch(() => setPeriods([]));
    http.get('/evaluations/results/overview').then((r) => setResults((r as { items: unknown[] }).items ?? [])).catch(() => setResults([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const canConfig = can('evaluation.config');

  async function createCriterion(e: FormEvent) {
    e.preventDefault();
    try {
      await http.post('/evaluations/criteria', critForm);
      setCritOpen(false);
      setCritForm({ name: '', description: '' });
      notify('success', 'Criterion added');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create criterion');
    }
  }

  async function toggleCriterion(c: EvaluationCriterion) {
    try {
      await http.put(`/evaluations/criteria/${c.id}`, { active: !c.active });
      notify('success', c.active ? 'Criterion disabled' : 'Criterion enabled');
      load();
    } catch {
      /* ignore */
    }
  }

  async function createPeriod(e: FormEvent) {
    e.preventDefault();
    try {
      await http.post('/evaluations/periods', {
        ...perForm,
        semester: Number(perForm.semester),
        startsAt: new Date(perForm.startsAt).toISOString(),
        endsAt: new Date(perForm.endsAt).toISOString(),
      });
      setPerOpen(false);
      notify('success', 'Evaluation period created');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create period');
    }
  }

  async function togglePeriod(p: EvaluationPeriod) {
    try {
      await http.put(`/evaluations/periods/${p.id}`, { isOpen: !p.isOpen });
      notify('success', p.isOpen ? 'Period closed' : 'Period opened');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  }

  const resultsTyped = results as EvaluationResult[];

  return (
    <div className="stack">
      <Card icon="evaluation" title="Evaluation administration">
        <p className="muted">
          Configure evaluation criteria, manage open periods and review aggregated results across the institution.
        </p>
      </Card>

      <FormError text={error} />

      <Tabs
        tabs={[
          { key: 'periods', label: 'Periods', icon: 'calendar' },
          { key: 'criteria', label: 'Criteria', icon: 'assessment' },
          { key: 'results', label: 'Results & analysis', icon: 'reports' },
        ]}
        active={tab}
        onChange={(k) => setTab(k as 'periods' | 'criteria' | 'results')}
      />

      {tab === 'periods' && (
        <Card
          title="Evaluation periods"
          icon="calendar"
          actions={canConfig ? (
            <Button className="btn-gold" onClick={() => setPerOpen(true)}>
              <Icon name="plus" /> New period
            </Button>
          ) : undefined}
        >
          <Table columns={['Period', 'Academic year', 'Semester', 'Window', 'Status', '']} empty="No periods defined">
            {periods.map((p) => (
              <tr key={p.id}>
                <td><b>{p.name}</b></td>
                <td>{p.academicYear}</td>
                <td>{p.semester}</td>
                <td className="muted small">{dateOnly(p.startsAt)} — {dateOnly(p.endsAt)}</td>
                <td>
                  <span className={`badge ${p.isOpen ? 'badge-active' : 'badge-inactive'}`}>
                    {p.isOpen ? 'Open' : 'Closed'}
                  </span>
                </td>
                <td className="t-actions">
                  {canConfig && (
                    <Button className="btn-sm btn-ghost" onClick={() => togglePeriod(p)}>
                      {p.isOpen ? 'Close' : 'Open'}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      {tab === 'criteria' && (
        <Card
          title="Evaluation criteria"
          icon="assessment"
          actions={canConfig ? (
            <Button className="btn-gold" onClick={() => setCritOpen(true)}>
              <Icon name="plus" /> Add criterion
            </Button>
          ) : undefined}
        >
          {criteria.length === 0 ? (
            <EmptyState icon="assessment" title="No criteria" body="Define the aspects students will rate." />
          ) : (
            criteria.map((c, i) => (
              <div key={c.id} className="criterion-row" style={{ padding: '14px 0' }}>
                <div style={{ flex: 1 }}>
                  <div className="criterion-name">{i + 1}. {c.name}</div>
                  {c.description && <div className="criterion-desc">{c.description}</div>}
                </div>
                <span className={`badge ${c.active ? 'badge-active' : 'badge-inactive'}`}>
                  {c.active ? 'Active' : 'Inactive'}
                </span>
                {canConfig && (
                  <Button className="btn-sm btn-ghost" onClick={() => toggleCriterion(c)}>
                    {c.active ? 'Disable' : 'Enable'}
                  </Button>
                )}
              </div>
            ))
          )}
        </Card>
      )}

      {tab === 'results' && (
        <Card title="Aggregated results" icon="reports">
          {resultsTyped.length === 0 ? (
            <EmptyState icon="reports" title="No results yet" body="Aggregated evaluation results will appear once students have responded." />
          ) : (
            <Table columns={['Course', 'Responses', 'Overall', 'Top criterion']} empty="No results">
              {resultsTyped.map((r) => (
                <tr key={r.courseId}>
                  <td><b>{r.courseCode} — {r.courseName}</b></td>
                  <td>{r.responseCount}</td>
                  <td><Stars value={r.overallRating} size={15} /></td>
                  <td>{[...r.perCriterion].sort((a, b) => b.mean - a.mean)[0]?.name ?? '—'}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      <Modal title="Add evaluation criterion" open={critOpen} onClose={() => setCritOpen(false)}>
        <form onSubmit={createCriterion} className="stack">
          <FormError text={error} />
          <Field label="Name" required hint="e.g. Knowledge of subject matter">
            <input className="input" value={critForm.name} onChange={(e) => setCritForm({ ...critForm, name: e.target.value })} required />
          </Field>
          <Field label="Description">
            <textarea className="input" rows={2} value={critForm.description} onChange={(e) => setCritForm({ ...critForm, description: e.target.value })} />
          </Field>
          <div className="form-actions" style={{ gridColumn: 'auto' }}>
            <Button type="submit" className="btn-gold">Add</Button>
            <Button type="button" className="btn-ghost" onClick={() => setCritOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      <Modal title="Create evaluation period" open={perOpen} onClose={() => setPerOpen(false)}>
        <form onSubmit={createPeriod} className="form-grid">
          <FormError text={error} />
          <Field label="Period name" required>
            <input className="input" value={perForm.name} onChange={(e) => setPerForm({ ...perForm, name: e.target.value })} placeholder="e.g. Semester 1 2025" required />
          </Field>
          <Field label="Academic year" required>
            <Select value={perForm.academicYear} onChange={(e) => setPerForm({ ...perForm, academicYear: e.target.value })}>
              {['2023/2024', '2024/2025', '2025/2026', '2026/2027', '2027/2028'].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
          </Field>
          <Field label="Semester" required>
            <Select value={perForm.semester} onChange={(e) => setPerForm({ ...perForm, semester: e.target.value })}>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
            </Select>
          </Field>
          <Field label="Starts" required>
            <input type="date" className="input" value={perForm.startsAt} onChange={(e) => setPerForm({ ...perForm, startsAt: e.target.value })} required />
          </Field>
          <Field label="Ends" required>
            <input type="date" className="input" value={perForm.endsAt} onChange={(e) => setPerForm({ ...perForm, endsAt: e.target.value })} required />
          </Field>
          <div className="form-actions">
            <Button type="submit" className="btn-gold">Create period</Button>
            <Button type="button" className="btn-ghost" onClick={() => setPerOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ root */
export default function Evaluations() {
  const { can, isRole } = useAuth();
  const canConfig = can('evaluation.config') || can('evaluation.analyze');
  if (canConfig) return <AdminEvals />;
  if (isRole('lecturer') || can('evaluation.result')) return <LecturerEvals />;
  return <StudentEvals />;
}