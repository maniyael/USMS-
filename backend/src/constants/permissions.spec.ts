import { ALL_PERMISSIONS } from './permissions';

describe('permissions catalog', () => {
  it('contains no duplicates', () => {
    expect(new Set(ALL_PERMISSIONS).size).toBe(ALL_PERMISSIONS.length);
  });

  it('uses dotted namespace naming', () => {
    for (const p of ALL_PERMISSIONS) {
      expect(p).toMatch(/^[a-z]+(\.[a-z_]+)+$/);
    }
  });

  it('covers the core operational areas', () => {
    expect(ALL_PERMISSIONS).toEqual(
      expect.arrayContaining([
        'student.create',
        'student.view',
        'course.create',
        'curriculum.create',
        'enrollment.manage',
        'enrollment.view',
        'attendance.manage',
        'attendance.view',
        'grade.enter',
        'grade.submit',
        'grade.validate',
        'grade.correct',
        'grade.view',
        'timetable.manage',
        'timetable.view',
        'fees.manage',
        'payment.record',
        'payment.reverse',
        'finance.view',
        'document.generate',
        'announcement.view',
        'announcement.manage',
        'report.view',
      ]),
    );
  });

  it('produces at least 50 permissions', () => {
    expect(ALL_PERMISSIONS.length).toBeGreaterThanOrEqual(50);
  });
});