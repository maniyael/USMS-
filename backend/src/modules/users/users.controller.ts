import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuditService } from '../../common/services/audit.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  @Permissions('user.create')
  async create(@Body() dto: CreateUserDto, @CurrentUser() user: { userId: number }) {
    const created = await this.usersService.create(dto);
    await this.auditService.log({
      action: 'user.created',
      entity: 'User',
      entityId: created.id,
      userId: user.userId,
      details: { username: created.username },
    });
    return { id: created.id, username: created.username };
  }

  @Get()
  @Permissions('user.view')
  async findAll(@CurrentUser() user: { userId: number }) {
    return this.usersService.findRecentlyCreated(new Date(0)).then((users) =>
      users.map((u) => ({
        id: u.id,
        username: u.username,
        roleId: u.roleId,
        role: u.role?.name,
        status: u.status,
        mustChangePassword: u.mustChangePassword,
        linkedStudentId: u.linkedStudentId,
        linkedStaffId: u.linkedStaffId,
        lastLoginAt: u.lastLoginAt,
      })),
    );
  }

  @Get(':id')
  @Permissions('user.view')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findById(id);
    return user;
  }

  @Patch(':id')
  @Permissions('user.update')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: { userId: number },
  ) {
    const updated = await this.usersService.update(id, dto);
    await this.auditService.log({
      action: 'user.updated',
      entity: 'User',
      entityId: id,
      userId: user.userId,
      details: { ...dto } as Record<string, unknown>,
    });
    return updated;
  }
}