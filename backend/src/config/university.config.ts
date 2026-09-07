import { registerAs } from '@nestjs/config';

export default registerAs('university', () => ({
  name: process.env.UNIVERSITY_NAME ?? 'Example University',
  domain: process.env.UNIVERSITY_DOMAIN ?? 'university.edu',
  initialPassword: process.env.USMS_INITIAL_PASSWORD ?? 'changeme2026@',
  emailInitialPassword: process.env.EMAIL_INITIAL_PASSWORD ?? 'changeme2026@',
  studentNumberRange: parseInt(process.env.STUDENT_NUMBER_RANGE ?? '300', 10),
}));
