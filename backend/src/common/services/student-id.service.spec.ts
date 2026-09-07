import { StudentIdService } from './student-id.service';

function makeService(rows: { studentId: string }[] = []): {
  service: StudentIdService;
  setRows: (r: { studentId: string }[]) => void;
} {
  let current = rows;
  const studentRepo = {
    createQueryBuilder: () => ({
      select: () => ({
        where: () => ({
          getRawMany: async () => current,
        }),
      }),
    }),
  } as never;
  const cohortRepo = {} as never;
  const dataSource = {} as never;
  return {
    service: new StudentIdService(studentRepo, cohortRepo, dataSource),
    setRows: (r) => {
      current = r;
    },
  };
}

describe('StudentIdService', () => {
  describe('buildCohortCode', () => {
    it('combines two-digit year suffixes', () => {
      const { service } = makeService();
      expect(service.buildCohortCode(2026, 2029)).toBe('2629');
      expect(service.buildCohortCode(2023, 2024)).toBe('2324');
    });
  });

  describe('buildStudentId', () => {
    it('pads number to 3 digits', () => {
      const { service } = makeService();
      expect(service.buildStudentId('2629', 1)).toBe('2629i001');
      expect(service.buildStudentId('2629', 42)).toBe('2629i042');
      expect(service.buildStudentId('2629', 999)).toBe('2629i999');
    });
  });

  describe('parseStudentIdParts', () => {
    it('parses a well-formed id', () => {
      const { service } = makeService();
      expect(service.parseStudentIdParts('2529i017')).toEqual({
        startYear2: '25',
        endYear2: '29',
        number: 17,
      });
    });

    it('rejects malformed ids', () => {
      const { service } = makeService();
      expect(service.parseStudentIdParts('not-an-id')).toBeNull();
      expect(service.parseStudentIdParts('2529x001')).toBeNull();
      expect(service.parseStudentIdParts('2529i12')).toBeNull();
      expect(service.parseStudentIdParts('2529')).toBeNull();
    });
  });

  describe('buildInstitutionalEmail', () => {
    it('builds and normalizes email', () => {
      const { service } = makeService();
      expect(service.buildInstitutionalEmail('Alice', 'Smith', '2629', 'university.edu')).toBe(
        'alicesmith2629@university.edu',
      );
    });

    it('strips accents and punctuation', () => {
      const { service } = makeService();
      expect(service.buildInstitutionalEmail('Élodie', "O'Brien", '2529', 'uni.ac.ug')).toBe(
        'elodieobrien2529@uni.ac.ug',
      );
    });

    it('collapses repeated dots', () => {
      const { service } = makeService();
      expect(service.buildInstitutionalEmail('Ann..M', 'X', '2324', 'uni.edu')).toBe(
        'ann.mx2324@uni.edu',
      );
    });
  });

  describe('nextStudentNumber', () => {
    it('returns the smallest free number when ids exist', async () => {
      const { service } = makeService([
        { studentId: '2629i001' },
        { studentId: '2629i003' },
        { studentId: '2629i005' },
      ]);
      await expect(service.nextStudentNumber(1, '2629', 999)).resolves.toBe(2);
    });

    it('returns 1 when none exist', async () => {
      const { service } = makeService([]);
      await expect(service.nextStudentNumber(1, '2629', 999)).resolves.toBe(1);
    });

    it('fills gaps and ignores other cohorts', async () => {
      const { service } = makeService([
        { studentId: '2428i007' },
        { studentId: '2629i001' },
        { studentId: '2629i002' },
      ]);
      await expect(service.nextStudentNumber(1, '2629', 999)).resolves.toBe(3);
    });

    it('throws when the pool is exhausted', async () => {
      const { service } = makeService([{ studentId: '2629i001' }]);
      await expect(service.nextStudentNumber(1, '2629', 1)).rejects.toThrow(
        /No available student numbers/,
      );
    });
  });

  describe('generateStudentId', () => {
    it('produces id + cohort code', async () => {
      const { service } = makeService([]);
      await expect(service.generateStudentId(1, 2026, 2029, 999)).resolves.toEqual({
        studentId: '2629i001',
        cohortCode: '2629',
      });
    });
  });
});