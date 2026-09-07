import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { http } from '../api';
import { useAuth } from '../auth';
import {
  Button,
  Card,
  EmptyState,
  Field,
  FormError,
  Modal,
  PageHeader,
  Select,
  Table,
  dateOnly,
  useToast,
} from '../components/ui';
import { Icon, type IconName } from '../components/icons';
import type { DocumentRecord, StudentListResponse, StudentRow } from '../types';

const DOC_TYPES: Array<{ value: string; label: string; icon: IconName }> = [
  { value: 'student_card', label: 'Student card', icon: 'clipboard' },
  { value: 'enrollment_certificate', label: 'Enrollment certificate', icon: 'enrollment' },
  { value: 'academic_transcript', label: 'Academic transcript', icon: 'grades' },
  { value: 'semester_result_sheet', label: 'Semester result sheet', icon: 'assessment' },
  { value: 'annual_result_sheet', label: 'Annual result sheet', icon: 'assessment' },
  { value: 'payment_receipt', label: 'Payment receipt', icon: 'finance' },
  { value: 'other', label: 'Other', icon: 'documents' },
];

export default function Documents() {
  const { can, isRole, user } = useAuth();
  const { notify } = useToast();
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [genOpen, setGenOpen] = useState(false);
  const [genForm, setGenForm] = useState({ studentId: '', documentType: 'student_card' });
  const [busy, setBusy] = useState(false);

  const isStudent = isRole('student');
  const studentId = user?.linkedStudentId ?? undefined;

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (isStudent && studentId) params.set('studentId', String(studentId));
    else if (filter) params.set('studentId', filter);
    http
      .get<DocumentRecord[]>(`/documents?${params.toString()}`)
      .then(setDocs)
      .catch((e) => setError(e.message));
  }, [filter, isStudent, studentId]);

  useEffect(() => {
    load();
    if (can('document.generate')) {
      http
        .get<StudentListResponse>('/students?limit=300')
        .then((r) => setStudents(r.items))
        .catch(() => {});
    }
  }, [load, can]);

  async function generate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const doc = await http.post<DocumentRecord>('/documents/generate', {
        studentId: Number(genForm.studentId),
        documentType: genForm.documentType,
      });
      setGenOpen(false);
      notify('success', 'Document generated', `${doc.documentNumber} created`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setBusy(false);
    }
  }

  const docTypeMeta = (t: string) =>
    DOC_TYPES.find((d) => d.value === t) ?? { label: t, icon: 'documents' as IconName };

  return (
    <div className="stack">
      <PageHeader
        title="Documents & Records"
        sub="Official academic and administrative documents issued to students."
        actions={
          can('document.generate') ? (
            <Button className="btn-gold" onClick={() => setGenOpen(true)}>
              <Icon name="plus" /> Generate document
            </Button>
          ) : undefined
        }
      />

      <FormError text={error} />

      {!isStudent && (
        <Card icon="filter" title="Filter">
          <div className="toolbar">
            <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">All students</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.studentId} — {s.lastName}, {s.firstName}
                </option>
              ))}
            </Select>
          </div>
        </Card>
      )}

      <Card title="Issued documents" icon="documents">
        {docs.length === 0 ? (
          <EmptyState
            icon="documents"
            title="No documents yet"
            body={isStudent ? 'Official documents will appear here once issued by the Registrar.' : 'Generate an official document for a student.'}
            action={can('document.generate') ? (
              <Button onClick={() => setGenOpen(true)}>
                <Icon name="plus" /> Generate document
              </Button>
            ) : undefined}
          />
        ) : (
          <div className="grid-4 auto">
            {docs.map((d) => {
              const meta = docTypeMeta(d.documentType);
              return (
                <div key={d.id} className="stat-card">
                  <div className="stat-accent a-ivory">
                    <Icon name={meta.icon} />
                  </div>
                  <div className="stat-label">{meta.label}</div>
                  <div className="stat-value" style={{ fontSize: 16 }}>
                    {d.documentNumber}
                  </div>
                  <div className="stat-sub">
                    {d.student
                      ? `${(d.student as { studentId?: string }).studentId ?? ''} · ${(d.student as { lastName?: string }).lastName ?? ''} ${(d.student as { firstName?: string }).firstName ?? ''}`
                      : `Student #${d.studentId}`}
                  </div>
                  <div className="stat-sub">Issued {dateOnly(d.generatedAt)}</div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {docs.length > 0 && (
        <Card title="Detailed list" icon="clipboard">
          <Table
            columns={['Document', 'Number', 'Student', 'Issued', 'Type']}
            empty="No documents"
          >
            {docs.map((d) => {
              const meta = docTypeMeta(d.documentType);
              return (
                <tr key={d.id}>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <Icon name={meta.icon} style={{ width: 16, height: 16, color: 'var(--royal)' }} />
                      <b>{meta.label}</b>
                    </span>
                  </td>
                  <td className="t-mono">{d.documentNumber}</td>
                  <td>
                    {(d.student as { studentId?: string } | undefined)?.studentId ?? `#${d.studentId}`}
                  </td>
                  <td>{dateOnly(d.generatedAt)}</td>
                  <td><span className="badge badge-gold">{d.documentType.replace(/_/g, ' ')}</span></td>
                </tr>
              );
            })}
          </Table>
        </Card>
      )}

      <Modal title="Generate official document" open={genOpen} onClose={() => setGenOpen(false)}>
        <form onSubmit={generate} className="stack">
          <FormError text={error} />
          <Field label="Student" required>
            <Select
              value={genForm.studentId}
              onChange={(e) => setGenForm({ ...genForm, studentId: e.target.value })}
              required
            >
              <option value="">Select student…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.studentId} — {s.lastName}, {s.firstName} ({s.program?.name ?? ''})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Document type" required>
            <Select
              value={genForm.documentType}
              onChange={(e) => setGenForm({ ...genForm, documentType: e.target.value })}
            >
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
          </Field>
          <div className="form-actions" style={{ gridColumn: 'auto' }}>
            <Button type="submit" className="btn-gold" disabled={busy}>
              {busy ? 'Generating…' : 'Generate'}
            </Button>
            <Button type="button" className="btn-ghost" onClick={() => setGenOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}