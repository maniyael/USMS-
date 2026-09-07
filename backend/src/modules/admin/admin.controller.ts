import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CreateRoleDto } from './dto/create-role.dto';
import { AuditService } from '../../common/services/audit.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly auditService: AuditService,
  ) {}

  @Get('permissions')
  @Permissions('permission.manage', 'role.manage')
  listPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Get('roles')
  @Permissions('role.manage', 'user.view')
  listRoles() {
    return this.rolesService.findAll();
  }

  @Post('roles')
  @Permissions('role.manage')
  async createRole(@Body() dto: CreateRoleDto, @CurrentUser() user: { userId: number }) {
    const role = await this.rolesService.create(dto);
    await this.auditService.log({
      action: 'role.created',
      entity: 'Role',
      entityId: role.id,
      userId: user.userId,
      details: { name: role.name },
    });
    return role;
  }

  @Patch('roles/:id')
  @Permissions('role.manage')
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateRoleDto,
    @CurrentUser() user: { userId: number },
  ) {
    const role = await this.rolesService.update(id, dto);
    await this.auditService.log({
      action: 'role.updated',
      entity: 'Role',
      entityId: id,
      userId: user.userId,
      details: { name: role.name },
    });
    return role;
  }

  @Delete('roles/:id')
  @Permissions('role.manage')
  async deleteRole(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { userId: number }) {
    await this.rolesService.remove(id);
    await this.auditService.log({
      action: 'role.deleted',
      entity: 'Role',
      entityId: id,
      userId: user.userId,
    });
    return { message: 'Role deleted' };
  }
}