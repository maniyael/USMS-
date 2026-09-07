import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentDocument, DocumentType } from './entities/student-document.entity';
import { Student } from '../students/entities/student.entity';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(StudentDocument)
    private readonly docRepo: Repository<StudentDocument>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {}

  async generate(studentId: number, documentType: DocumentType, generatedBy: number) {
    const student = await this.studentRepo.findOne({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const docNumber = this.generateDocumentNumber(documentType, student.id);

    const existing = await this.docRepo.findOneBy({ documentNumber: docNumber });
    if (existing) {
      return existing;
    }

    const doc = this.docRepo.create({
      studentId,
      documentType,
      documentNumber: docNumber,
      generatedById: generatedBy,
      generatedAt: new Date(),
    });
    return this.docRepo.save(doc);
  }

  async list(filters: { studentId?: number; documentType?: DocumentType }) {
    const qb = this.docRepo
      .createQueryBuilder('doc')
      .leftJoinAndSelect('doc.student', 'student')
      .orderBy('doc.createdAt', 'DESC');
    if (filters.studentId !== undefined) {
      qb.andWhere('doc.student_id = :studentId', { studentId: filters.studentId });
    }
    if (filters.documentType) {
      qb.andWhere('doc.documentType = :documentType', { documentType: filters.documentType });
    }
    return qb.getMany();
  }

  async findOne(id: number) {
    const doc = await this.docRepo.findOne({ where: { id }, relations: { student: true } });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    return doc;
  }

  private generateDocumentNumber(type: DocumentType, studentId: number): string {
    const prefix = type.replace(/_/g, '').substring(0, 3).toUpperCase();
    const d = new Date();
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(
      d.getDate(),
    ).padStart(2, '0')}`;
    return `${prefix}-${ymd}-${String(studentId).padStart(5, '0')}`;
  }
}