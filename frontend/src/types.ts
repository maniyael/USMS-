export interface LoginResponse {
  accessToken: string;
  mustChangePassword: boolean;
  user: UserInfo;
}

export interface UserInfo {
  id: number;
  username: string;
  roleId: number;
  roleName: string;
  status: string;
  mustChangePassword: boolean;
  linkedStudentId: number | null;
  linkedStaffId: number | null;
  permissions: string[];
}

export interface NamedEntity {
  id: number;
  code: string;
  name: string;
}

export interface Faculty extends NamedEntity {}
export interface Department extends NamedEntity {}
export interface Program extends NamedEntity {
  departmentId?: number;
  facultyId?: number;
  totalYears?: number;
  totalSemesters?: number;
}
export interface Level {
  id: number;
  name: string;
  sortOrder: number;
}
export interface Cohort {
  id: number;
  code: string;
  programId: number;
  startYear: number | string;
  endYear: number | string;
}
export interface AcademicYear {
  id: number;
  name: string;
  startYear: number | string;
  endYear: number | string;
}

export interface Course {
  id: number;
  code: string;
  name: string;
  credits: number;
  description?: string;
  departmentId?: number;
}

export interface CurriculumCourse {
  id: number;
  courseId: number;
  course?: Course;
  isRequired: boolean;
  prerequisiteCourseId: number | null;
  prerequisite?: Course;
}

export interface Curriculum {
  id: number;
  programId: number;
  program?: Program;
  levelId: number;
  level?: Level;
  academicYear: string;
  semester: number;
  courses: CurriculumCourse[];
}

export interface Staff {
  id: number;
  staffId: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  departmentId: number;
  department?: Department;
  isLecturer: boolean;
  user?: { username: string };
}

export interface Enrollment {
  id: number;
  studentId: number;
  student?: { id: number; studentId: string; firstName: string; lastName: string };
  courseId: number;
  course?: Course;
  attemptNumber: number;
  parentEnrollmentId: number | null;
  enrollmentStatus: string;
  academicYear: string;
  semester: number;
  createdAt: string;
  grade?: string | null;
}

export interface AttendanceRecord {
  id: number;
  courseId: number;
  course?: Course;
  date: string;
  studentId: number;
  student?: { firstName: string; lastName: string; studentId: string };
  status: 'present' | 'late' | 'absent';
  remarks?: string;
  recordedById?: number;
}

export interface Assessment {
  id: number;
  courseId: number;
  course?: Course;
  name: string;
  type: string;
  maximumScore: string;
  weight: string;
  date?: string;
  academicYear?: string;
  semester?: number;
}

export interface GradeRecord {
  id: number;
  enrollmentId: number;
  assessmentId: number;
  assessment?: Assessment;
  score: string | null;
  grade: string | null;
  status: 'draft' | 'submitted' | 'validated' | 'corrected';
  validatedBy: number | null;
  validatedAt: string | null;
}

export interface GradeHistoryEntry {
  id: number;
  gradeId: number;
  previousScore: number | null;
  previousGrade: string | null;
  newScore: number | null;
  newGrade: string | null;
  reason: string;
  changedBy: number;
  changedAt: string;
}

export interface TimetableEntry {
  id: number;
  courseId: number;
  course?: Course;
  classType: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location?: string;
  lecturerId: number | null;
  lecturer?: Staff;
  academicYear: string;
  semester: number;
  startDate: string;
  endDate?: string;
  status?: string;
}

export interface Fee {
  id: number;
  studentId: number;
  academicYear: string;
  semester: number;
  description: string;
  amount: number | string;
  feeType?: string;
  student?: { studentId: string; firstName: string; lastName: string };
  createdAt: string;
}

export interface Payment {
  id: number;
  studentId: number;
  feeId: number;
  amount: number | string;
  paymentMethod: string;
  paymentReference: string;
  paymentDate: string;
  reversedAt: string | null;
  reversalNote?: string | null;
  status: string;
  student?: { studentId: string; firstName: string; lastName: string } | null;
  fee?: Fee;
}

export interface StatementLine {
  type: 'fee' | 'payment' | 'reversal';
  date: string;
  amount: number | string;
  ref: string;
  description: string;
}

export interface Announcement {
  id: number;
  title: string;
  body: string;
  targetType: string;
  targetId: number | null;
  publishedAt: string;
  expiresAt: string | null;
}

export interface AdminSummary {
  totalStudents: number;
  totalStaff: number;
  totalCourses: number;
  activeEnrollments: number;
  validatedGrades: number;
  attendanceRate: number;
  feesOutstanding: number;
  recentPayments: Array<{
    id: number;
    studentNumber: string;
    name: string;
    amount: number;
    paymentDate: string;
  }>;
}

export interface ReportsSummary {
  totalStudents: number;
  totalStaff: number;
  totalCourses: number;
  activeEnrollments: number;
  validatedGrades: number;
  attendance: { present: number; late: number; absent: number; rate: number | null };
  fees: { charged: number; paid: number; outstanding: number; collectedRate: number | null };
}

export interface StudentRow {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  gender: string;
  academicStatus: string;
  program?: { name: string };
  level?: { name: string };
  user?: { username: string };
  enrollmentDate?: string;
}

export interface StudentListResponse {
  items: StudentRow[];
  total: number;
  page: number;
  limit: number;
}

export interface StudentDetail {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  academicStatus: string;
  phone?: string;
  address?: string;
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

export interface DocumentRecord {
  id: number;
  documentNumber: string;
  documentType: string;
  studentId: number;
  generatedAt?: string;
  filePath?: string;
}