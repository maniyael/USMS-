import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
  ) {}

  findAll(): Promise<Role[]> {
    return this.roleRepo.find({ relations: { permissions: true } });
  }

  async findOne(id: number): Promise<Role> {
    const role = await this.roleRepo.findOne({ where: { id }, relations: { permissions: true } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async create(dto: CreateRoleDto): Promise<Role> {
    const role = this.roleRepo.create({ name: dto.name, description: dto.description });
    if (dto.permissionIds?.length) {
      role.permissions = await this.permissionRepo.findBy({ id: In(dto.permissionIds) });
    }
    return this.roleRepo.save(role);
  }

  async update(id: number, dto: CreateRoleDto): Promise<Role> {
    const role = await this.findOne(id);
    if (dto.name !== undefined) {
      role.name = dto.name;
    }
    if (dto.description !== undefined) {
      role.description = dto.description;
    }
    if (dto.permissionIds) {
      role.permissions = await this.permissionRepo.findBy({ id: In(dto.permissionIds) });
    }
    return this.roleRepo.save(role);
  }

  async remove(id: number): Promise<void> {
    const role = await this.findOne(id);
    if (role.name === 'super_administrator') {
      throw new NotFoundException('The Super Administrator role cannot be deleted');
    }
    await this.roleRepo.delete(id);
  }

  findAllPermissions(): Promise<Permission[]> {
    return this.permissionRepo.find({ order: { name: 'ASC' } });
  }
}