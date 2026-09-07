import { useEffect, useState } from 'react';
import { http } from '../api';
import { Card, formatPercent, Loading, money, StatCard, Table } from '../components/ui';

interface SummaryReport {
  totalStudents: number;
  totalStaff: number;
  totalCourses: number;
  activeEnrollments: number;
  validatedGrades: number;
  attendance: { present: number; late: number; absent: number; rate: number | null };
  fees: { charged: number; paid: number; outstanding: number; collectedRate: number | null };
}

interface ProgramCount {
  programId: number;
  programName: string;
  count: number;
}

interface GradeDist {
  grade: string;
  count: number;
}

export default function Reports() {
  const [summary, setSummary] = useState<SummaryReport | null>(null);
  const [programs, setPrograms] = useState<ProgramCount[]>([]);
  const [grades, setGrades] = useState<GradeDist[]>([]);

  useEffect(() => {
    http.get<SummaryReport>('/reports/summary').then(setSummary).catch(() => setSummary(null));
    http.get<ProgramCount[]>('/reports/enrollment-by-program').then(setPrograms).catch(() => setPrograms([]));
    http.get<GradeDist[]>('/reports/grade-distribution').then(setGrades).catch(() => setGrades([]));
  }, []);

  if (!summary) return <Loading text="Building reports..." />;

  return (
    <div className="stack">
      <div className="grid-3 auto">
        <StatCard label="Students" value={summary.totalStudents} />
        <StatCard label="Staff" value={summary.totalStaff} />
        <StatCard label="Active courses" value={summary.totalCourses} />
        <StatCard label="Active enrollments" value={summary.activeEnrollments} />
        <StatCard label="Validated grades" value={summary.validatedGrades} />
        <StatCard
          label="Attendance rate"
          value={formatPercent(summary.attendance.rate)}
          sub={`${summary.attendance.present} present, ${summary.attendance.late} late, ${summary.attendance.absent} absent`}
        />
        <StatCard label="Fees charged" value={money(summary.fees.charged)} />
        <StatCard label="Fees collected" value={money(summary.fees.paid)} sub={`${formatPercent(summary.fees.collectedRate)} collected`} />
        <StatCard label="Fees outstanding" value={money(summary.fees.outstanding)} />
      </div>
      <Card title="Students by program">
        <Table columns={['Program', 'Students']}>
          {programs.map((p) => (
            <tr key={p.programId}>
              <td>{p.programName}</td>
              <td>{p.count}</td>
            </tr>
          ))}
        </Table>
      </Card>
      <Card title="Grade distribution">
        <Table columns={['Grade', 'Count']}>
          {grades.map((g) => (
            <tr key={g.grade}>
              <td>{g.grade}</td>
              <td>{g.count}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}