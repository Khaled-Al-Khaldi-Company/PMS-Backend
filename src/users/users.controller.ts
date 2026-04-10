import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('roles')
  findAllRoles() {
    return this.usersService.findAllRoles();
  }

  @Get('permissions')
  findAllPermissions() {
    return this.usersService.findAllPermissions();
  }

  @Patch('roles/:id/permissions')
  updateRolePermissions(@Param('id') roleId: string, @Body() body: { permissionNames: string[] }) {
    return this.usersService.updateRolePermissions(roleId, body.permissionNames);
  }

  @Post()
  createUser(@Body() data: any) {
    return this.usersService.createUser(data);
  }

  @Patch(':id')
  updateUser(@Param('id') id: string, @Body() data: any) {
    return this.usersService.updateUser(id, data);
  }
}
