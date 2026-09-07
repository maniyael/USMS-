import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { http } from '../api';
import { useAuth } from '../auth';
import { Card, formatPercent, Loading, money, StatCard, dateOnly } from '../components/ui';
import type { Announcement, DashboardStats, Enrollment, GradeRecord } from '../types';

function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const sid = user?.linkedStudentId ?? 0;
  const [enrollments, setEnrollments] = useState<Enrollment[] | null>(null);
  const [grades, setGrades] = useState<GradeRecord[] | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [balance, setBalance] = useState<{ outstandingBalance: number } | null>(null);

  useEffect(() => {
    if (!sid) return;
    http.get<Enrollment[]>(`/enrollment/my`).then(setEnrollments).catch(() => setEnrollments([]));
    http.get<GradeRecord[]>(`/grades/student/${sid}`).then(setGrades).catch(() => setGrades([]));
    http
      .get<Announcement[]>(`/notifications/student/${sid}?programId=&levelId=&cohortId=`)
      .then(setAnnouncements)
      .catch(() => setAnnouncements([]));
    http
      .get<{ outstandingBalance: number }>(`/finance/balance/student/${sid}`)
      .then(setBalance)
      .catch(() => setBalance(null));
  }, [sid]);

  const validated = grades?.filter((g) => g.status === 'validated') ?? [];
  const totalWeight = validated.reduce((sum, g) => sum + (parseFloat(g.assessment?.weight ?? '') || 0), 0);
  const totalScore =
    validated.reduce((sum, g) => sum + (parseFloat(g.score ?? '') || 0) * (parseFloat(g.assessment?.weight ?? '') || 0), 0) /
    Math.max(totalWeight, 1);

  return (
    <div className="stack">
      <Card title={`My Courses (${enrollments?.length ?? 0})`}>
        {!enrollments ? (
          <Loading />
        ) : enrollments.length === 0 ? (
          <p className="muted">You are not enrolled in any courses yet.</p>
        ) : (
          <div className="grid-2">
            {enrollments.map((en) => (
              <div key={en.id} className="card sub">
                <div className="row-between">
                  <b>{en.course?.code}</b>
                  <span className="badge">{en.enrollmentStatus}</span>
                </div>
                <div>{en.course?.name}</div>
                <div className="muted">
                  {en.course?.credits} credits
                  {en.attemptNumber > 1 && ` - retake #${en.attemptNumber}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <div className="grid-3 auto">
        <StatCard label="Weighted score" value={validated.length ? `${totalScore.toFixed(1)}%` : '—'} sub={`${validated.length} validated grades`} />
        <StatCard label="Fees outstanding" value={balance ? money(balance.outstandingBalance) : '—'} />
        <StatCard label="Announcements" value={announcements.length} />
      </div>
      <Card title="Announcements">
        {announcements.length === 0 ? (
          <p className="muted">No announcements.</p>
        ) : (
          <div className="stack">
            {announcements.map((a) => (
              <div key={a.id} className="announcement">
                <div className="row-between">
                  <b>{a.title}</b>
                  <span className="muted small">{dateOnly(a.publishedAt)}</span>
                </div>
                <p>{a.body}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
      <ButtonRow
        onClick={() => navigate('/students/me')}
        label="View my full profile & grades & fees"
      />
    </div>
  );
}

function ButtonRow({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" className="btn" onClick={onClick}>
      {label}
    </button>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  useEffect(() => {
    http.get<DashboardStats>('/students/dashboard-stats').then(setStats).catch(() => setStats(null));
  }, []);
  if (!stats) return <Loading text="Loading dashboard..." />;
  return (
    <div className="stack">
      <div className="grid-3 auto">
        <StatCard label="Students" value={stats.totalStudents} />
        <StatCard label="Staff" value={stats.totalStaff} />
        <StatCard label="Courses" value={stats.totalCourses} />
        <StatCard label="Active enrollments" value={stats.activeEnrollments} />
        <StatCard label="Fees outstanding" value={money(stats.feeBalance)} />
        <StatCard label="Attendance rate" value={formatPercent(stats.attendanceRate)} />
      </div>
      <Card title="Recent payments">
        {stats.recentPayments.length === 0 ? (
          <p className="muted">No recent payments.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentPayments.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.studentNumber} - {p.name}
                  </td>
                  <td>{money(p.amount)}</td>
                  <td>{dateOnly(p.paymentDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

export default function Dashboard() {
  const { isRole } = useAuth();
  return isRole('student') ? <StudentDashboard /> : <AdminDashboard />;
}