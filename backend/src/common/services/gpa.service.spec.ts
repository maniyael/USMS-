import { GpaService } from './gpa.service';
import { GradeStatus } from '../../modules/grades/entities/grade.entity';
import { AttendanceStatus } from '../../modules/attendance/entities/attendance.entity';

const repo = () => ({ find: jest.fn(), createQueryBuilder: jest.fn() });

function mockRepo(pairs: { find?: () => unknown; getRawOne?: () => unknown }) {
  const r = repo();
  if (pairs.find) (r.find as jest.Mock).mockImplementation(pairs.find);
  if (pairs.getRawOne) {
    r.createQueryBuilder.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: pairs.getRawOne as jest.Mock,
    });
  }
  return r;
}

function makeGrade({
  score,
  weight,
  maximumScore,
  status,
  courseId,
}: {
  score: string;
  weight: string;
  maximumScore: string;
  status: GradeStatus;
  courseId: number;
}) {
  return {
    id: 1,
    studentId: 1,
    status,
    score,
    assessment: { courseId, weight, maximumScore },
  } as never;
}

function makeEnrollment(courseId: number, credits: number) {
  return {
    id: courseId,
    studentId: 1,
    courseId,
    academicYear: '2026/2027',
    semester: 1,
    course: { id: courseId, code: `CS${courseId}`, name: `Course ${courseId}`, credits },
  } as never;
}

describe('GpaService.computeStudentSummary', () => {
  it('computes weighted scores, letter grades, and GPA for validated grades', async () => {
    // Course 1: midterm 85/100 weight 40% + final 90/100 weight 60% -> weighted final = 88
    //   -> A (4.0), 3 credits. Course 2: score 55 -> C (2.0), 4 credits.
    const enrollmentRepo = mockRepo({ find: () => [
      makeEnrollment(1, 3),
      makeEnrollment(2, 4),
    ] });
    const gradeRepo = mockRepo({ find: () => [
      makeGrade({ score: '85', weight: '40', maximumScore: '100', status: GradeStatus.VALIDATED, courseId: 1 }),
      makeGrade({ score: '90', weight: '60', maximumScore: '100', status: GradeStatus.VALIDATED, courseId: 1 }),
      makeGrade({ score: '55', weight: '100', maximumScore: '100', status: GradeStatus.VALIDATED, courseId: 2 }),
    ] });
    const attendanceRepo = mockRepo({
      getRawOne: () => ({
        total: '4',
        attended: '3',
      }),
    });
    const feeRepo = mockRepo({
      find: () => [{ id: 1, studentId: 1, amount: '1000' }, { id: 2, studentId: 1, amount: '1500' }],
    });
    const paymentRepo = mockRepo({
      find: () => [{ id: 1, studentId: 1, status: 'active', amount: '2000' }],
    });

    const service = new GpaService(
      gradeRepo as never,
      enrollmentRepo as never,
      attendanceRepo as never,
      feeRepo as never,
      paymentRepo as never,
    );

    const summary = await service.computeStudentSummary(1);

    expect(summary.courses).toHaveLength(2);
    const course1 = summary.courses.find((c) => c.courseId === 1)!;
    expect(course1.weightedScore).toBe(88);
    expect(course1.letter).toBe('A');
    expect(course1.points).toBe(4.0);
    expect(course1.passed).toBe(true);

    const course2 = summary.courses.find((c) => c.courseId === 2)!;
    expect(course2.letter).toBe('C');
    expect(course2.points).toBe(2.0);

    // weighted GPA = (4*3 + 2*4)/7 = (12+8)/7 = 2.85714 -> 2.86
    expect(summary.cumulativeGpa).toBeCloseTo(2.86, 2);
    expect(summary.creditsAttempted).toBe(7);
    expect(summary.creditsEarned).toBe(7);

    expect(summary.attendancePercentage).toBe(75);
    expect(summary.classesHeld).toBe(4);
    expect(summary.classesAttended).toBe(3);

    expect(summary.totalFees).toBe(2500);
    expect(summary.totalPaid).toBe(2000);
    expect(summary.outstandingBalance).toBe(500);
  });

  it('marks unvalidated grades as pending and excludes from GPA', async () => {
    const enrollmentRepo = mockRepo({ find: () => [makeEnrollment(1, 3)] });
    const gradeRepo = mockRepo({
      find: () => [
        makeGrade({ score: '80', weight: '100', maximumScore: '100', status: GradeStatus.DRAFT, courseId: 1 }),
      ],
    });
    const attendanceRepo = mockRepo({ getRawOne: () => ({ total: '0', attended: '0' }) });
    const feeRepo = mockRepo({ find: () => [] });
    const paymentRepo = mockRepo({ find: () => [] });

    const service = new GpaService(
      gradeRepo as never,
      enrollmentRepo as never,
      attendanceRepo as never,
      feeRepo as never,
      paymentRepo as never,
    );

    const summary = await service.computeStudentSummary(1);
    expect(summary.courses[0].gradeStatus).toBe('pending');
    expect(summary.cumulativeGpa).toBe(0);
    expect(summary.attendancePercentage).toBeNull();
  });
});