import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { http } from '../api';
import { useAuth } from '../auth';
import {
  BarChart,
  Card,
  Donut,
  EmptyState,
  formatPercent,
  greeting,
  Loading,
  money,
  ProgressMini,
  StatCard,
  dateOnly,
} from '../components/ui';
import { Icon } from '../components/icons';
import type {
  AdminSummary,
  Announcement,
  AttendanceRecord,
  CourseAssignment,
  Enrollment,
  Fee,
  GradeRecord,
  Payment,
  ReportsSummary,
  TimetableEntry,
} from '../types';

/* ------------------------------------------------------------------ helpers */
function HeroChip({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="hero-chip">
      <div>
        <div className="hc-label">{label}</div>
        <div className="hc-value">{value}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ student */
function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const sid = user?.linkedStudentId ?? 0;
  const [enrollments, setEnrollments] = useState<Enrollment[] | null>(null);
  const [grades, setGrades] = useState<GradeRecord[] | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [balance, setBalance] = useState<{ balance: string; totalPaid: string; totalCharged: string } | null>(null);
  const [pendingEvals, setPendingEvals] = useState<number>(0);

  useEffect(() => {
    if (!sid) return;
    http.get<Enrollment[]>(`/enrollment/my`).then(setEnrollments).catch(() => setEnrollments([]));
    http.get<GradeRecord[]>(`/grades/student/${sid}`).then(setGrades).catch(() => setGrades([]));
    http.get<AttendanceRecord[]>(`/attendance/student/${sid}`).then(setAttendance).catch(() => setAttendance([]));
    http.get<Announcement[]>(`/notifications/student/${sid}?programId=&levelId=&cohortId=`).then(setAnnouncements).catch(() => setAnnouncements([]));
    http
      .get<{ balance: string; totalPaid: string; totalCharged: string }>(`/finance/balance/student/${sid}`)
      .then(setBalance)
      .catch(() => setBalance(null));
    http.get<{ items: unknown[] }>('/evaluations/eligible').then((r) => setPendingEvals(r.items?.length ?? 0)).catch(() => setPendingEvals(0));
  }, [sid]);

  const validated = grades?.filter((g) => g.status === 'validated') ?? [];
  const totalWeight = validated.reduce((sum, g) => sum + (parseFloat(g.assessment?.weight ?? '') || 0), 0);
  const totalScore =
    validated.reduce((sum, g) => sum + (parseFloat(g.score ?? '') || 0) * (parseFloat(g.assessment?.weight ?? '') || 0), 0) /
    Math.max(totalWeight, 1);

  const present = attendance.filter((a) => a.status === 'present').length;
  const late = attendance.filter((a) => a.status === 'late').length;
  const absent = attendance.filter((a) => a.status === 'absent').length;
  const total = Math.max(present + late + absent, 1);
  const attPct = ((present + late) / total) * 100;

  const firstName = user?.username ?? 'Student';
  const lastName = '';

  return (
    <div className="stack">
      <section className="hero">
        <div className="hero-greeting">{greeting()},</div>
        <h2 className="hero-title" style={{ textTransform: 'capitalize' }}>{firstName} {lastName}</h2>
        <div className="hero-sub">
          Welcome to your academic dashboard. Track your courses, grades, attendance and fees — all in one place.
        </div>
        <div className="hero-seal">
          <Icon name="graduationCap" />
        </div>
        <div className="hero-row">
          <HeroChip label="Enrolled courses" value={enrollments?.length ?? '—'} />
          <HeroChip label="Weighted score" value={validated.length ? `${totalScore.toFixed(1)}%` : '—'} />
          <HeroChip label="Fees outstanding" value={balance ? money(balance.balance) : '—'} />
          <HeroChip label="Pending evaluations" value={pendingEvals} />
        </div>
      </section>

      <div className="grid-4 auto">
        <StatCard
          label="Weighted score"
          value={validated.length ? `${totalScore.toFixed(1)}%` : '—'}
          sub={`${validated.length} validated grades`}
          variant="academic"
          icon="grades"
        />
        <StatCard
          label="Attendance rate"
          value={attendance.length ? `${attPct.toFixed(1)}%` : '—'}
          sub={`${present} present · ${late} late · ${absent} absent`}
          variant="progress"
          icon="attendance"
        />
        <StatCard
          label="Fees outstanding"
          value={balance ? money(balance.balance) : '—'}
          sub={balance ? `Paid ${money(balance.totalPaid)} of ${money(balance.totalCharged)}` : undefined}
          variant="financial"
          icon="finance"
        />
        <StatCard
          label="Announcements"
          value={announcements.length}
          sub="Latest updates for you"
          variant="activity"
          icon="announcements"
        />
      </div>

      <div className="split-card">
        <Card title="My courses" icon="book">
          {!enrollments ? (
            <Loading />
          ) : enrollments.length === 0 ? (
            <EmptyState icon="enrollment" title="Not enrolled yet" body="Enrolled courses will appear here once registration is complete." />
          ) : (
            <div className="grid-2">
              {enrollments.map((en) => (
                <div key={en.id} className="card sub">
                  <div className="row-between">
                    <b style={{ fontSize: 15 }}>{en.course?.code}</b>
                    <span className="badge badge-active">{en.enrollmentStatus}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14 }}>{en.course?.name}</div>
                  <div className="muted small">
                    {en.course?.credits} credits{en.attemptNumber > 1 ? ` · retake #${en.attemptNumber}` : ''} · {en.semester ? `Semester ${en.semester}` : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 14 }}>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => navigate('/timetable')}>
              <Icon name="arrowRight" /> View timetable
            </button>
          </div>
        </Card>

        <Card title="Academic progress" icon="assessment">
          <div className="stack" style={{ gap: 18 }}>
            <Donut
              segments={
                enrollmentSegments(validated.length, enrollments?.length ?? 0)
              }
              size={132}
              thickness={14}
              centerLabel={`${validated.length}`}
              centerSub="validated"
            />
            <ProgressMini
              label="Attendance"
              value={attPct}
              display={`${attPct.toFixed(1)}%`}
              tone="green"
            />
            <ProgressMini
              label="Fees settled"
              value={
                balance && Number(balance.totalCharged) > 0
                  ? (Number(balance.totalPaid) / Number(balance.totalCharged)) * 100
                  : 0
              }
              display={
                balance && Number(balance.totalCharged) > 0
                  ? `${((Number(balance.totalPaid) / Number(balance.totalCharged)) * 100).toFixed(0)}%`
                  : '—'
              }
              tone="gold"
            />
            {pendingEvals > 0 && (
              <button type="button" className="btn btn-gold btn-sm" onClick={() => navigate('/evaluations')}>
                <Icon name="evaluation" /> Complete {pendingEvals} evaluation{pendingEvals === 1 ? '' : 's'}
              </button>
            )}
          </div>
        </Card>
      </div>

      <Card title="Announcements" icon="announcements">
        {announcements.length === 0 ? (
          <EmptyState icon="inbox" title="No announcements" body="New university announcements will appear here." />
        ) : (
          announcements.slice(0, 4).map((a) => (
            <div key={a.id} className="announcement">
              <div className="row-between">
                <b>{a.title}</b>
                <span className="muted small">{dateOnly(a.publishedAt)}</span>
              </div>
              <p>{a.body}</p>
            </div>
          ))
        )}
      </Card>

      <div className="row gap">
        <button type="button" className="btn" onClick={() => navigate('/students/me')}>
          <Icon name="profile" /> My full profile
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => navigate('/finance')}>
          <Icon name="finance" /> Fees & payments
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => navigate('/grades')}>
          <Icon name="grades" /> Grades
        </button>
      </div>
    </div>
  );
}

function enrollmentSegments(validated: number, total: number) {
  const done = total > 0 ? validated : 0;
  const left = Math.max(total - done, 0);
  return [
    { label: 'Validated', value: done, color: 'var(--royal)' },
    { label: 'In progress', value: left, color: 'var(--warmgrey)' },
  ];
}

/* ------------------------------------------------------------------ admin */
function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminSummary | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    http.get<ReportsSummary>('/reports/summary').then((summary) => setStats({
      totalStudents: summary.totalStudents,
      totalStaff: summary.totalStaff,
      totalCourses: summary.totalCourses,
      activeEnrollments: summary.activeEnrollments,
      validatedGrades: summary.validatedGrades,
      attendanceRate: summary.attendance.rate ?? 0,
      feesOutstanding: summary.fees.outstanding ?? 0,
      recentPayments: [],
    })).catch(() => {});
    http.get<Payment[]>('/finance/payments').then(setPayments).catch(() => setPayments([]));
    http.get<Fee[]>('/finance/fees').then(setFees).catch(() => setFees([]));
    http.get<Announcement[]>(`/notifications/announcements?active=true`).then(setAnnouncements).catch(() => setAnnouncements([]));
  }, []);

  const byMonth = useMemo(() => {
    const buckets: { label: string; value: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ label: d.toLocaleDateString(undefined, { month: 'short' }), value: 0 });
    }
    const idxOf = (dateStr: string) => {
      const d = new Date(dateStr);
      return (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth());
    };
    for (const p of payments) {
      if (p.status !== 'active') continue;
      const idx = 5 - idxOf(p.paymentDate);
      if (idx >= 0 && idx < 6) buckets[idx].value += Number(p.amount);
    }
    return buckets;
  }, [payments]);

  const charged = useMemo(() => fees.reduce((s, f) => s + Number(f.amount), 0), [fees]);
  const collected = useMemo(
    () =>
      payments
        .filter((p) => p.status === 'active')
        .reduce((s, p) => s + Number(p.amount), 0),
    [payments],
  );
  const recent = useMemo(
    () =>
      payments
        .filter((p) => p.status === 'active')
        .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
        .slice(0, 8),
    [payments],
  );

  const attRate = stats?.attendanceRate ?? 0;

  if (!stats) return <Loading text="Loading admin dashboard…" />;

  return (
    <div className="stack">
      <section className="hero">
        <div className="hero-greeting">{greeting()}</div>
        <h2 className="hero-title">University Operations Console</h2>
        <div className="hero-sub">
          A complete command view of students, academic operations, finance and institutional activity.
        </div>
        <div className="hero-seal">
          <Icon name="shield" />
        </div>
        <div className="hero-row">
          <HeroChip label="Students" value={stats.totalStudents} />
          <HeroChip label="Staff" value={stats.totalStaff} />
          <HeroChip label="Courses" value={stats.totalCourses} />
          <HeroChip label="Outstanding fees" value={money(stats.feesOutstanding)} />
        </div>
      </section>

      <div className="grid-4 auto">
        <StatCard label="Students" icon="students" value={stats.totalStudents} sub={`${stats.activeEnrollments} active enrollments`} variant="academic" />
        <StatCard label="Staff & lecturers" icon="staff" value={stats.totalStaff} sub="Across faculties" variant="activity" />
        <StatCard label="Fees outstanding" icon="finance" value={money(stats.feesOutstanding)} sub={`${charged > 0 ? ((collected / charged) * 100).toFixed(1) : 0}% collected`} variant="financial" />
        <StatCard
          label="Attendance rate"
          icon="attendance"
          value={formatPercent(attRate)}
          sub={`${stats.validatedGrades} validated grades`}
          variant={attRate < 0.6 ? 'alert' : 'progress'}
        />
      </div>

      <div className="split-card">
        <Card title="Fee collection — last 6 months" icon="finance">
          {payments.length === 0 ? (
            <EmptyState icon="finance" title="No payments yet" body="Recorded payments will be charted here automatically." />
          ) : (
            <BarChart data={byMonth} />
          )}
        </Card>

        <Card title="Collection summary" icon="dollar">
          <div className="stack" style={{ gap: 18 }}>
            <ProgressMini label="Collected vs billed" value={charged > 0 ? (collected / charged) * 100 : 0} display={charged > 0 ? `${((collected / charged) * 100).toFixed(1)}%` : '—'} tone="gold" />
            <div className="kv-grid">
              <div className="kv-item"><span>Total billed</span><b>{money(charged)}</b></div>
              <div className="kv-item"><span>Collected</span><b>{money(collected)}</b></div>
              <div className="kv-item"><span>Outstanding</span><b>{money(Math.max(charged - collected, 0))}</b></div>
            </div>
          </div>
        </Card>
      </div>

      <div className="split-card">
        <Card title="Recent payments" icon="dollar" actions={
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => navigate('/finance')}>Open finance</button>
        }>
          {recent.length === 0 ? (
            <EmptyState icon="inbox" title="No recent payments" />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Student</th><th>Amount</th><th>Method</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {recent.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <b>{p.student ? `${p.student.studentId}` : `#${p.studentId}`}</b>
                        <span className="muted small"> {p.student ? `${p.student.lastName} ${p.student.firstName}` : ''}</span>
                      </td>
                      <td>{money(p.amount)}</td>
                      <td><span className="badge badge-gold">{p.paymentMethod.replace(/_/g, ' ')}</span></td>
                      <td>{dateOnly(p.paymentDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Announcements" icon="announcements">
          {announcements.length === 0 ? (
            <EmptyState icon="inbox" title="No announcements" />
          ) : (
            announcements.slice(0, 4).map((a) => (
              <div key={a.id} className="announcement">
                <div className="row-between">
                  <b>{a.title}</b>
                  <span className="muted small">{dateOnly(a.publishedAt)}</span>
                </div>
                <p>{a.body}</p>
              </div>
            ))
          )}
          <div style={{ marginTop: 12 }}>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => navigate('/announcements')}>
              <Icon name="announcements" /> Manage announcements
            </button>
          </div>
        </Card>
      </div>

      <div className="row gap">
        <button type="button" className="btn" onClick={() => navigate('/students')}>
          <Icon name="students" /> Manage students
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => navigate('/grades')}>
          <Icon name="grades" /> Grades & validation
        </button>
        <button type="button" className="btn btn-gold" onClick={() => navigate('/evaluations')}>
          <Icon name="evaluation" /> Evaluations
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ lecturer */
function LecturerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const staffId = user?.linkedStaffId ?? 0;
  const [assignments, setAssignments] = useState<CourseAssignment[] | null>(null);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [attendance, setAttendance] = useState<{ present: number; late: number; absent: number }>({ present: 0, late: 0, absent: 0 });

  useEffect(() => {
    if (!staffId) return;
    http.get<CourseAssignment[]>(`/staff/assignments/list?staffId=${staffId}`).then(setAssignments).catch(() => setAssignments([]));
    http.get<TimetableEntry[]>(`/timetable`).then((all) => setTimetable(all.filter((t) => t.lecturerId === staffId))).catch(() => setTimetable([]));
  }, [staffId]);

  useEffect(() => {
    if (!assignments) return;
    Promise.all(
      assignments.map((a) => http.get<{ present: number; late: number; absent: number }>(`/attendance/course/${a.courseId}/stats`).catch(() => null)),
    ).then((results) => {
      setAttendance({
        present: results.reduce((s, r) => s + (r?.present ?? 0), 0),
        late: results.reduce((s, r) => s + (r?.late ?? 0), 0),
        absent: results.reduce((s, r) => s + (r?.absent ?? 0), 0),
      });
    });
  }, [assignments]);

  const todayIdx = (new Date().getDay() + 6) % 7;
  const todaysClasses = timetable.filter((t) => t.dayOfWeek === todayIdx);
  const total = attendance.present + attendance.late + attendance.absent;

  return (
    <div className="stack">
      <section className="hero">
        <div className="hero-greeting">{greeting()}</div>
        <h2 className="hero-title">Lecturer Workspace</h2>
        <div className="hero-sub">
          Manage the courses you teach — attendance, assessments and student grades.
        </div>
        <div className="hero-seal">
          <Icon name="book" />
        </div>
        <div className="hero-row">
          <HeroChip label="Courses" value={assignments?.length ?? '—'} />
          <HeroChip label="Classes today" value={todaysClasses.length} />
          <HeroChip label="Attendance recorded" value={total || '—'} />
        </div>
      </section>

      <div className="grid-4 auto">
        <StatCard label="Courses assigned" icon="course" value={assignments?.length ?? '—'} sub="This semester" variant="academic" />
        <StatCard label="Attendance sessions tracked" icon="attendance" value={total || '—'} sub={`${attendance.present} present · ${attendance.late} late · ${attendance.absent} absent`} variant="progress" />
        <StatCard label="Sessions today" icon="timetable" value={todaysClasses.length} sub={todaysClasses[0] ? todaysClasses[0].course?.name : 'No sessions scheduled'} variant="activity" />
        <StatCard label="Take attendance" icon="attendance" value={<button type="button" className="btn btn-sm btn-gold" onClick={() => navigate('/attendance')}>Go</button>} sub="Mark and review attendance" variant="action" />
      </div>

      <div className="split-card">
        <Card title="My courses" icon="book">
          {!assignments ? (
            <Loading />
          ) : assignments.length === 0 ? (
            <EmptyState icon="course" title="No course assignments" body="Courses assigned to you will appear here." />
          ) : (
            <div className="grid-2">
              {assignments.map((a) => (
                <div key={a.id} className="card sub">
                  <div className="row-between">
                    <b style={{ fontSize: 15 }}>{a.course?.code}</b>
                    <span className="badge badge-active">{a.academicYear} S{a.semester}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-serif)' }}>{a.course?.name}</div>
                  <div className="muted small">{a.course?.credits} credits</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Today's schedule" icon="timetable">
          {todaysClasses.length === 0 ? (
            <EmptyState icon="calendar" title="No classes today" body="Enjoy your day — or plan ahead for your next session." />
          ) : (
            todaysClasses.map((t) => (
              <div key={t.id} className="announcement">
                <div className="row-between">
                  <b>{t.course?.code} — {t.course?.name}</b>
                  <span className="badge badge-gold">{t.startTime}–{t.endTime}</span>
                </div>
                <p className="small">
                  {t.classType} · {t.location ?? 'Venue TBA'}
                </p>
              </div>
            ))
          )}
          <div style={{ marginTop: 12 }}>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => navigate('/timetable')}>
              <Icon name="timetable" /> Full timetable
            </button>
          </div>
        </Card>
      </div>

      <div className="row gap">
        <button type="button" className="btn" onClick={() => navigate('/attendance')}>
          <Icon name="attendance" /> Mark attendance
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => navigate('/grades')}>
          <Icon name="grades" /> Enter grades
        </button>
        <button type="button" className="btn btn-gold" onClick={() => navigate('/evaluations')}>
          <Icon name="evaluation" /> My evaluations
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ finance */
function FinanceDashboard() {
  const navigate = useNavigate();
  const [fees, setFees] = useState<Fee[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [refunds, setRefunds] = useState<{ status: string }[]>([]);

  useEffect(() => {
    http.get<Fee[]>('/finance/fees').then(setFees).catch(() => setFees([]));
    http.get<Payment[]>('/finance/payments').then(setPayments).catch(() => setPayments([]));
    http.get('/finance/refunds').then((r) => setRefunds((r as { refunds?: { status: string }[] })?.refunds ?? [])).catch(() => setRefunds([]));
  }, []);

  const charged = fees.reduce((s, f) => s + Number(f.amount), 0);
  const collected = payments.filter((p) => p.status === 'active').reduce((s, p) => s + Number(p.amount), 0);
  const outstanding = Math.max(charged - collected, 0);
  const pendingRefunds = refunds.filter((r) => ['requested', 'under_review', 'approved'].includes(r.status)).length;
  const byMonth = useMemo(() => {
    const now = new Date();
    const buckets: { label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ label: d.toLocaleDateString(undefined, { month: 'short' }), value: 0 });
    }
    for (const p of payments) {
      if (p.status !== 'active') continue;
      const d = new Date(p.paymentDate);
      const idx = 5 - ((d.getFullYear() - now.getFullYear()) * 12 + d.getMonth() - now.getMonth());
      if (idx >= 0 && idx < 6) buckets[idx].value += Number(p.amount);
    }
    return buckets;
  }, [payments]);

  return (
    <div className="stack">
      <section className="hero">
        <div className="hero-greeting">Finance Office</div>
        <h2 className="hero-title">Fees, Payments & Refunds</h2>
        <div className="hero-sub">
          Institutional fee management with full auditability of payments, receipts and refunds.
        </div>
        <div className="hero-seal">
          <Icon name="finance" />
        </div>
        <div className="hero-row">
          <HeroChip label="Total billed" value={money(charged)} />
          <HeroChip label="Collected" value={money(collected)} />
          <HeroChip label="Outstanding" value={money(outstanding)} />
          <HeroChip label="Refunds pending" value={pendingRefunds} />
        </div>
      </section>

      <div className="grid-4 auto">
        <StatCard label="Total billed" icon="finance" value={money(charged)} sub={`${fees.length} fee lines`} variant="academic" />
        <StatCard label="Collected" icon="dollar" value={money(collected)} sub={`${payments.filter((p) => p.status === 'active').length} payments`} variant="financial" />
        <StatCard label="Outstanding" icon="alertCircle" value={money(outstanding)} sub="Across all students" variant={outstanding > 0 ? 'alert' : 'progress'} />
        <StatCard label="Refunds pending" icon="refund" value={pendingRefunds} sub="Awaiting review / processing" variant={pendingRefunds > 0 ? 'activity' : 'activity'} />
      </div>

      <div className="split-card">
        <Card title="Collections — last 6 months" icon="finance">
          {payments.length === 0 ? (
            <EmptyState icon="finance" title="No payments yet" />
          ) : (
            <BarChart data={byMonth} />
          )}
        </Card>

        <Card title="Collection summary" icon="dollar">
          <div className="stack" style={{ gap: 18 }}>
            <ProgressMini label="Collection rate" value={charged > 0 ? (collected / charged) * 100 : 0} display={charged > 0 ? `${((collected / charged) * 100).toFixed(1)}%` : '—'} tone="gold" />
            <div className="kv-grid">
              <div className="kv-item"><span>Collected vs billed</span><b>{charged > 0 ? `${((collected / charged) * 100).toFixed(1)}%` : '—'}</b></div>
              <div className="kv-item"><span>Payments</span><b>{payments.length + ' recorded'}</b></div>
              <div className="kv-item"><span>Refunds</span><b>{refunds.length + ' total'}</b></div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-sm" onClick={() => navigate('/finance')}>
                <Icon name="finance" /> Open finance desk
              </button>
              <button type="button" className="btn btn-sm btn-gold" onClick={() => navigate('/finance')}>
                <Icon name="refund" /> Refunds
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ root */
export default function Dashboard() {
  const { isRole } = useAuth();
  if (isRole('student')) return <StudentDashboard />;
  if (isRole('lecturer')) return <LecturerDashboard />;
  if (isRole('finance_officer')) return <FinanceDashboard />;
  return <AdminDashboard />;
}