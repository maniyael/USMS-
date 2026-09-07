import { registerAs } from '@nestjs/config';

export default registerAs('security', () => ({
  jwtSecret: process.env.JWT_SECRET ?? 'usms-super-secret-change-in-production-please',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  uploadDir: process.env.UPLOAD_DIR ?? 'uploads',
  generatedDocsDir: process.env.GENERATED_DOCS_DIR ?? 'generated-docs',
}));
