import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth';
import { http } from '../api';
import {
  Card,
  dateOnly,
  formatPercent,
  Loading,
  money,
  StatCard,
  Table,
  dateTime,
} from '../components/ui';
import type {
  AttendanceRecord,
  DocumentRecord,
  Enrollment,
  Fee,
  GradeRecord,
  Payment,
  StatementLine,
  StudentDetail,
} from '../types';

interface StudentProfileResponse {
  student: StudentPayload;
  summary: StudentDetail['summary'];
}

interface StudentPayload extends Omit<StudentDetail, 'dateOfBirth' | 'academicStatus'> {
  dateOfBirth?: string;
  academicStatus?: string;
  faculty?: { id: number; name: string };
  department?: { id: number; name: string };
  program?: { id: number; name: string };
  level?: { id: number; name: string };
  cohort?: { id: number; code: string };
  user?: { id: number; username: string };
  summary?: {
    semesterGpa?: number | null;
    cumulativeGpa?: number | null;
    attendancePercentage?: number | null;
    creditsEarned?: number;
  };
}

const TABS = ['Profile', 'Courses', 'Grades', 'Attendance', 'Fees', 'Documents'] as const;
type Tab = (typeof TABS)[number];

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isRole, user } = useAuth();
  const isMe = id === 'me';
  const selfMode = isMe || isRole('student');
  const sid = isMe ? (user?.linkedStudentId ?? 0) : Number(id);

  const [tab, setTab] = useState<Tab>('Profile');
  const [student, setStudent] = useState<StudentPayload | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [balance, setBalance] = useState<{ balance: string } | null>(null);
  const [statement, setStatement] = useState<StatementLine[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);

  useEffect(() => {
    if (!sid) return;
    http
      .get<StudentProfileResponse>(`/students/${sid}`)
      .then((r) => setStudent({ ...r.student, summary: r.summary }))
      .catch(() => setStudent(null));
    const enPath = selfMode ? '/enrollment/my' : `/enrollment?studentId=${sid}`;
    http.get<Enrollment[]>(enPath).then(setEnrollments).catch(() => setEnrollments([]));
    http.get<GradeRecord[]>(`/grades/student/${sid}`).then(setGrades).catch(() => setGrades([]));
    http.get<AttendanceRecord[]>(`/attendance/student/${sid}`).then(setAttendance).catch(() => setAttendance([]));
    http.get<Fee[]>(`/finance/fees?studentId=${sid}`).then(setFees).catch(() => setFees([]));
    http.get<Payment[]>(`/finance/payments?studentId=${sid}`).then(setPayments).catch(() => setPayments([]));
    http.get<{ balance: string }>(`/finance/balance/student/${sid}`).then(setBalance).catch(() => setBalance(null));
    http.get<StatementLine[]>(`/finance/statement/student/${sid}`).then(setStatement).catch(() => setStatement([]));
    http.get<DocumentRecord[]>(`/documents?studentId=${sid}`).then(setDocuments).catch(() => setDocuments([]));
  }, [sid, selfMode]);

  if (!sid) return <Loading />;

  return (
    <div className="stack">
      <div className="row-between">
        <div>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => navigate(-1)}>
            &larr; Back
          </button>
          <h2>
            {student ? `${student.lastName}, ${student.firstName}` : 'Student'} — {student?.studentId ?? ''}
          </h2>
          {student && (
            <p className="muted">
              {student.program?.name} · {student.level?.name} · {student.cohort?.code}
            </p>
          )}
        </div>
        <span className={`badge badge-${student?.academicStatus ?? 'active'}`}>
          {student?.academicStatus ?? 'loading'}
        </span>
      </div>

      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t} type="button" className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </nav>

      {tab === 'Profile' && (
        <div className="stack">
          <div className="grid-3 auto">
            <StatCard label="GPA" value={student?.summary?.cumulativeGpa?.toFixed(2) ?? '—'} />
            <StatCard
              label="Attendance"
              value={
                student?.summary?.attendancePercentage != null
                  ? formatPercent(student.summary.attendancePercentage / 100)
                  : '—'
              }
            />
            <StatCard label="Fees outstanding" value={balance ? money(balance.balance) : '—'} />
          </div>
          <Card title="Personal details">
            <div className="kv-grid">
              <div><span>Student number</span><b>{student?.studentId}</b></div>
              <div><span>Name</span><b>{student ? `${student.firstName} ${student.lastName}` : ''}</b></div>
              <div><span>Gender</span><b>{student?.gender}</b></div>
              <div><span>Date of birth</span><b>{dateOnly(student?.dateOfBirth ?? null)}</b></div>
              <div><span>Phone</span><b>{student?.phone ?? '—'}</b></div>
              <div><span>Address</span><b>{student?.address ?? '—'}</b></div>
              <div><span>Faculty</span><b>{student?.faculty?.name}</b></div>
              <div><span>Department</span><b>{student?.department?.name}</b></div>
              <div><span>Login username</span><b>{student?.user?.username ?? '—'}</b></div>
            </div>
          </Card>
        </div>
      )}

      {tab === 'Courses' && (
        <Card title={`Enrollments (${enrollments.length})`}>
          <Table columns={['Course', 'Code', 'Credits', 'Status', 'Attempt', 'Enrolled']}>
            {enrollments.map((en) => (
              <tr key={en.id}>
                <td>{en.course?.name}</td>
                <td>{en.course?.code}</td>
                <td>{en.course?.credits}</td>
                <td><span className="badge badge-active">{en.enrollmentStatus}</span></td>
                <td>{en.attemptNumber}</td>
                <td>{dateOnly(en.createdAt)}</td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      {tab === 'Grades' && (
        <Card title={`Grades (${grades.length})`}>
          <Table columns={['Course', 'Assessment', 'Score', 'Grade', 'Status', 'Validated']}>
            {grades.map((g) => (
              <tr key={g.id}>
                <td>{g.assessment?.course?.code ?? '—'}</td>
                <td>{g.assessment?.name ?? '—'}</td>
                <td>{g.score !== null ? `${g.score} / ${g.assessment?.maximumScore ?? '—'}` : '—'}</td>
                <td>{g.grade ?? '—'}</td>
                <td><span className={`badge badge-${g.status}`}>{g.status}</span></td>
                <td>{dateTime(g.validatedAt ?? null)}</td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      {tab === 'Attendance' && (
        <Card title={`Attendance records (${attendance.length})`}>
          <Table columns={['Date', 'Course', 'Status', 'Remarks']}>
            {attendance.map((a) => (
              <tr key={a.id}>
                <td>{dateOnly(a.date)}</td>
                <td>{a.course?.code ?? a.courseId}</td>
                <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                <td>{a.remarks ?? '—'}</td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      {tab === 'Fees' && (
        <div className="stack">
          <div className="grid-3 auto">
            <StatCard label="Outstanding balance" value={balance ? money(balance.balance) : '—'} />
            <StatCard label="Total fees" value={money(fees.reduce((s, f) => s + Number(f.amount), 0))} />
            <StatCard label="Payments" value={payments.length} />
          </div>
          <Card title={`Fees (${fees.length})`}>
            <Table columns={['Year', 'Semester', 'Description', 'Amount']}>
              {fees.map((f) => (
                <tr key={f.id}>
                  <td>{f.academicYear}</td>
                  <td>{f.semester}</td>
                  <td>{f.description}</td>
                  <td>{money(f.amount)}</td>
                </tr>
              ))}
            </Table>
          </Card>
          <Card title={`Payments (${payments.length})`}>
            <Table columns={['Reference', 'Amount', 'Method', 'Date', 'Status']}>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>{p.paymentReference}</td>
                  <td>{money(p.amount)}</td>
                  <td>{p.paymentMethod}</td>
                  <td>{dateOnly(p.paymentDate)}</td>
                  <td>
                    <span className={`badge ${p.reversedAt ? 'badge-reversed' : 'badge-active'}`}>
                      {p.reversedAt ? 'reversed' : 'active'}
                    </span>
                  </td>
                </tr>
              ))}
            </Table>
          </Card>
          <Card title="Statement">
            <Table columns={['Date', 'Type', 'Reference', 'Description', 'Amount']}>
              {statement.map((l, i) => (
                <tr key={i}>
                  <td>{dateOnly(l.date)}</td>
                  <td>{l.type}</td>
                  <td>{l.ref}</td>
                  <td>{l.description}</td>
                  <td>{money(l.amount)}</td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>
      )}

      {tab === 'Documents' && (
        <Card title={`Documents (${documents.length})`}>
          {documents.length === 0 ? (
            <p className="muted">No documents generated.</p>
          ) : (
            <Table columns={['Number', 'Type', 'Issued']}>
              {documents.map((d) => (
                <tr key={d.id}>
                  <td>{d.documentNumber}</td>
                  <td>{d.documentType}</td>
                  <td>{dateTime(d.generatedAt ?? null)}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}
    </div>
  );
}